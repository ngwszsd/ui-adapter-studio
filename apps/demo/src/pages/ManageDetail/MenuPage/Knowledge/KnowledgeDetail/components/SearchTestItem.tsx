import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { type VirtualItem } from '@tanstack/react-virtual';
import { Card, CardContent, EnhancedTooltip, Progress } from '@teamhelper/ui';
import { SquarePen } from 'lucide-react';
import {
  KB_SCORE_THEME,
  SEARCH_SCORE_TYPE_MAP,
} from '@/constants/knowledgeBase.ts';
import { kbFormatScoreFn } from '@/pages/ManageDetail/MenuPage/Knowledge/knowledgeBaseUtils.ts';
import { ReactMarkdown } from '@/components/common/ReactMarkdown/index.tsx';
import {
  KnowledgeBaseIcon,
  type IKnowledgeBaseIconProps,
} from '@/components/knowledgeBase/KnowledgeBaseIcon/index.tsx';
import { cn } from '@/lib/utils.ts';
import { getFileIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon/utils.ts';
import {
  type IKnowledgeBasesSearchDtoResult,
  type IKnowledgeDatasetsDto,
} from '../server.ts';
import { type InsertDatasetDialogProps } from '../../KnowledgeDatasetDetail/components/InsertDatasetDialog.tsx';

interface SearchTestItemContentProps {
  item: IKnowledgeBasesSearchDtoResult;
  onOpenInsertDataset: (params: InsertDatasetDialogProps) => void;
}

const SearchTestItemContent = memo(
  ({ item, onOpenInsertDataset }: SearchTestItemContentProps) => {
    const { t } = useTranslation('knowledge');
    const scoreInfo = kbFormatScoreFn(item?.score || []);
    const primaryScore = scoreInfo?.primaryScore;
    const primaryScoreInfo =
      SEARCH_SCORE_TYPE_MAP?.[
        primaryScore?.type as keyof typeof SEARCH_SCORE_TYPE_MAP
      ] || {};

    const secondaryScore = scoreInfo?.secondaryScore;

    let q = item?.q;
    if (item?.data_type === 2) {
      if (q) {
        q = `![](${q})`;
      }
    }

    return (
      <Card className="group">
        <CardContent className="p-3.5 rounded-[8px] bg-background space-y-3">
          {primaryScore || secondaryScore ? (
            <div className="flex items-center gap-3 text-xs">
              {primaryScore ? (
                <EnhancedTooltip
                  title={primaryScoreInfo?.desc}
                  overlayClassName="max-w-[280px]"
                >
                  <div className="text-primary flex items-center border border-primary rounded-[6px] py-1 px-2">
                    <div>#{primaryScore?.index + 1}</div>
                    <div className="px-1.5">|</div>
                    <div>
                      {primaryScoreInfo?.label}
                      {primaryScoreInfo?.showScore
                        ? ` ${primaryScore?.value?.toFixed(4)}`
                        : ''}
                    </div>
                  </div>
                </EnhancedTooltip>
              ) : null}

              {Array.isArray(secondaryScore) && secondaryScore.length ? (
                <div className="flex items-center gap-3">
                  {secondaryScore.map((item02, index02) => {
                    const secondaryScoreInfo =
                      SEARCH_SCORE_TYPE_MAP?.[
                        item02?.type as keyof typeof SEARCH_SCORE_TYPE_MAP
                      ] || {};
                    const scoreThemeInfo = KB_SCORE_THEME?.[index02];
                    const colorScheme = scoreThemeInfo?.colorScheme;
                    const textColor = scoreThemeInfo?.color;
                    const borderColor = scoreThemeInfo?.borderColor;

                    return (
                      <EnhancedTooltip
                        key={item02?.type}
                        title={secondaryScoreInfo?.desc}
                        overlayClassName="max-w-[280px]"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs">
                            <div
                              className={cn(
                                'flex items-center border rounded-[6px] px-2',
                              )}
                              style={{
                                color: textColor || 'var(--foreground)',
                                borderColor: borderColor || 'var(--foreground)',
                              }}
                            >
                              <div>#{item02?.index + 1}</div>
                            </div>

                            <div className="text-muted-foreground flex items-center gap-1">
                              {secondaryScoreInfo?.label}:
                              {item02?.value?.toFixed(4)}
                            </div>
                          </div>

                          {secondaryScoreInfo?.showScore ? (
                            <Progress
                              value={item02?.value * 100}
                              className="h-[3px] bg-[#E5E5E5]"
                              indicatorClassName={cn(colorScheme)}
                            />
                          ) : null}
                        </div>
                      </EnhancedTooltip>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <ReactMarkdown>{q || ''}</ReactMarkdown>
            <ReactMarkdown>{item?.a || ''}</ReactMarkdown>
          </div>

          <div className="flex items-center gap-3 relative">
            <EnhancedTooltip
              title={t('searchTest.result.quoteLength')}
              overlayClassName="max-w-[280px]"
            >
              <div className="flex items-center gap-1 text-xs text-foreground">
                <KnowledgeBaseIcon type="t" />

                <div>{item?.tokens ?? 0}</div>
              </div>
            </EnhancedTooltip>

            <EnhancedTooltip
              title={t('searchTest.result.viewSource')}
              overlayClassName="max-w-[280px]"
            >
              <div
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  const file_url = item?.file_url || '';
                  if (!file_url) return;

                  window.open(file_url, '_blank');
                }}
              >
                <KnowledgeBaseIcon
                  type={
                    getFileIcon(
                      item?.source_name,
                    ) as IKnowledgeBaseIconProps['type']
                  }
                />

                <div className="text-xs text-foreground truncate font-medium">
                  {item?.source_name || '-'}
                </div>
              </div>
            </EnhancedTooltip>

            {item?.chunk_id ? (
              <SquarePen
                className={cn(
                  'w-h-4 h-4 text-muted-foreground cursor-pointer hover:text-primary/70 absolute right-0 bottom-0',
                  'hidden group-hover:flex',
                )}
                onClick={() => {
                  onOpenInsertDataset({
                    chunk_id: item?.chunk_id,
                    title: item?.source_name || '-',
                    datasetId: item?.dataset_id || null,
                    datasetType:
                      item?.data_type as IKnowledgeDatasetsDto['data_type'],
                  });
                }}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  },
  (prev, next) => prev.item === next.item,
);

interface SearchTestItemProps {
  item: IKnowledgeBasesSearchDtoResult;
  virtualItem: VirtualItem;
  measureElement: (node: Element | null) => void;
  onOpenInsertDataset: (params: InsertDatasetDialogProps) => void;
}

const SearchTestItem = ({
  item,
  virtualItem,
  measureElement,
  onOpenInsertDataset,
}: SearchTestItemProps) => {
  return (
    <div
      key={virtualItem.key}
      data-index={virtualItem.index}
      ref={measureElement}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${virtualItem.start}px)`,
      }}
      className="pb-2"
    >
      <SearchTestItemContent
        item={item}
        onOpenInsertDataset={onOpenInsertDataset}
      />
    </div>
  );
};

export default SearchTestItem;
