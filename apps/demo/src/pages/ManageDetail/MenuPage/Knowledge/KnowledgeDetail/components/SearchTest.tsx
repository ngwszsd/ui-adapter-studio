import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { openSearchConfigDialog } from './SearchConfigDialog.tsx';
import {
  Card,
  CardHeader,
  CardTitle,
  EnhancedButton,
  CardContent,
  EnhancedTextarea,
  message,
  Empty,
  EnhancedTooltip,
  openModalError,
  EnhancedSpinner,
} from '@teamhelper/ui';
import { Trash2 } from 'lucide-react';
import {
  deleteKnowledgeSearchHistoriesApi,
  knowledgeBasesSearchApi,
  knowledgeBasesSearchHistoriesApi,
  type IKnowledgeBasesSearchDto,
  type IKnowledgeBasesSearchHistoriesDto,
  type IKnowledgeBasesSearchHistoriesParams,
  type IKnowledgeBasesSearchParams,
} from '../server.ts';
import { useSearchParams } from 'react-router';
import { useKnowledgeDetailStore } from '../knowledgeDetailStore.ts';
import { SEARCH_MODE } from '@/constants/knowledgeBase.ts';
import { HelpPopover } from '@/components/common/HelpPopover/index.tsx';
import { formatTimeToChatTime } from '@/pages/ManageDetail/MenuPage/Knowledge/knowledgeBaseUtils.ts';
import { KnowledgeBaseIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon/index.tsx';
import { cn } from '@/lib/utils.ts';
import {
  openInsertDatasetDialog,
  type InsertDatasetDialogProps,
} from '../../KnowledgeDatasetDetail/components/InsertDatasetDialog.tsx';
import { useRequest } from 'ahooks';
import { DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE } from '@/constants/index.ts';
import SearchModeIcon from '@/assets/icon/search_mode.svg?react';
import SearchTestItem from './SearchTestItem.tsx';

export default function SearchTest() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('knowledge');
  const { kbSearchConfigParams } = useKnowledgeDetailStore();
  const searchTestKeywordsRef = useRef<string>('');
  const [searchTestResult, setSearchTestResult] = useState<
    Partial<IKnowledgeBasesSearchDto>
  >({});
  const [historyList, setHistoryList] = useState<
    IKnowledgeBasesSearchHistoriesDto[]
  >([]);
  const [chunksLoading, setChunksLoading] = useState(true);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchBtnLoading, setSearchBtnLoading] = useState(false);
  const historyParamsRef = useRef<IKnowledgeBasesSearchHistoriesParams>({});
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const knowledgeBaseId = useMemo(() => {
    const id = searchParams?.get?.('knowledgeBaseId');
    return Number(id) || null;
  }, [searchParams]);

  const resultList = useMemo(() => {
    return searchTestResult?.result || [];
  }, [searchTestResult]);

  const virtualizer = useVirtualizer({
    count: resultList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 20,
  });

  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [searchTestResult]);

  const onTestClick = async () => {
    if (searchBtnLoading || searchLoading) return;

    if (!searchTestKeywordsRef?.current) {
      message.error({
        content: t('searchTest.input.placeholder'),
        closeButton: true,
      });
      return;
    }

    setSearchLoading(true);
    setSearchBtnLoading(true);
    const params = {
      ...kbSearchConfigParams,
      text: searchTestKeywordsRef?.current,
    } as IKnowledgeBasesSearchParams;

    const result = await knowledgeBasesSearchApi(
      knowledgeBaseId,
      params,
    ).finally(() => {
      setTimeout(() => {
        setSearchLoading(false);
        setSearchBtnLoading(false);
      }, 1000);
    });

    const list = result?.result || [];
    if (!Array.isArray(list) || !list.length) {
      message.warning({
        content: t('searchTest.result.empty'),
        closeButton: true,
      });
    }

    setActiveHistoryId(null);
    setSearchTestResult(result || {});
    searchHistoriesRefresh();
  };

  const openInsertDatasetDialogFn = useCallback(
    async (params: Partial<InsertDatasetDialogProps>) => {
      const result = await openInsertDatasetDialog({
        ...params,
      } as InsertDatasetDialogProps);
      if (!result) return;
    },
    [],
  );

  const {
    refresh: searchHistoriesRefresh,
    run: searchHistoriesRun,
    loading: searchHistoriesLoading,
  } = useRequest(
    (values: IKnowledgeBasesSearchHistoriesParams) => {
      values = {
        ...historyParamsRef?.current,
        ...values,
      };

      const params = {
        page: values?.page || DEFAULT_PAGE_NUM,
        size: values?.size || DEFAULT_PAGE_SIZE,
      };

      historyParamsRef.current = params;
      return knowledgeBasesSearchHistoriesApi(knowledgeBaseId, params);
    },
    {
      manual: false,
      ready: Boolean(knowledgeBaseId),
      refreshDeps: [knowledgeBaseId],
      onSuccess(data) {
        const list = data?.content || [];
        const pageNum = historyParamsRef?.current?.page ?? DEFAULT_PAGE_NUM;
        const newHistoryList = pageNum <= 0 ? list : [...historyList, ...list];

        setHistoryList(newHistoryList);
        setHistoryTotal(data?.total_elements ?? 0);
      },
    },
  );

  useEffect(() => {
    if (searchHistoriesLoading) {
      setChunksLoading(true);
    } else {
      setTimeout(() => {
        setChunksLoading(false);
      }, 1000);
    }
  }, [searchHistoriesLoading]);

  const loadStatus = useMemo(() => {
    if (chunksLoading) return 'loading';

    if (historyList?.length && historyList?.length >= historyTotal) {
      return 'noMore';
    }

    return 'click';
  }, [chunksLoading, historyList, historyTotal]);

  const hasSimilarityMode = useMemo(() => {
    return (
      searchTestResult?.using_re_rank || searchTestResult?.search_mode === 1
    );
  }, [searchTestResult]);

  return (
    <div className="flex flex-1 min-w-0 p-5 pt-0">
      {/* 左侧 */}
      <div className="w-[320px] shrink-0 min-w-0 h-full border-r border-border pr-5 pt-5 flex flex-col">
        <Card className="p-3 border border-primary rounded-xl">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="flex items-center justify-between gap-10">
              <EnhancedButton
                size="small"
                type="primary"
                className="h-7 text-xs"
                onClick={() => {
                  openSearchConfigDialog();
                }}
              >
                <SearchModeIcon />
                {SEARCH_MODE?.[kbSearchConfigParams?.search_mode || ''] || '-'}
              </EnhancedButton>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 p-0">
            <EnhancedTextarea
              onChange={(e) => {
                searchTestKeywordsRef.current = String(e?.target?.value || '');
              }}
              className="h-[120px] text-xs shadow-none"
              placeholder={t('searchTest.input.placeholder')}
              maxLength={1000}
            />

            <div className="flex justify-end">
              <EnhancedButton
                type="primary"
                size="small"
                loading={searchBtnLoading}
                onClick={onTestClick}
                disabled={searchLoading}
              >
                {t('searchTest.button.test')}
              </EnhancedButton>
            </div>
          </CardContent>
        </Card>

        {/* 测试历史 */}
        <div className="pt-5 flex-1 min-h-0 flex flex-col">
          <div className="mb-3 flex items-center gap-1">
            <div className="text-sm font-medium">
              {t('searchTest.history.title')}
            </div>

            <HelpPopover content={t('searchTest.history.tooltip')} />
          </div>

          {Array.isArray(historyList) && historyList.length ? (
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
              {historyList.map((item) => {
                const request_obj = item?.request_obj;
                return (
                  <div
                    key={item?.id}
                    className={cn(
                      'bg-background hover:bg-primary/10 transition-colors rounded-[8px] px-3 flex items-center justify-between h-8 gap-1 group',
                      activeHistoryId === item?.id && 'bg-primary/10',
                      searchLoading ? 'cursor-not-allowed' : 'cursor-pointer',
                    )}
                    onClick={() => {
                      if (searchLoading) return;
                      if (activeHistoryId === item?.id) return;
                      setActiveHistoryId(item?.id);

                      setSearchLoading(true);
                      setSearchTestResult(item?.response_obj || {});
                      setTimeout(() => {
                        setSearchLoading(false);
                      }, 1000);
                    }}
                  >
                    <div className="text-xs text-muted-foreground truncate font-medium flex-1 flex gap-1">
                      <div>
                        {SEARCH_MODE?.[request_obj?.search_mode || ''] || '-'}
                      </div>

                      <div className="truncate">{request_obj?.text || '-'}</div>
                    </div>

                    <div className="flex items-center">
                      <div
                        className={cn(
                          'text-xs text-muted-foreground',
                          'block group-hover:hidden',
                        )}
                      >
                        {formatTimeToChatTime(item?.query_time)}
                      </div>

                      <EnhancedButton
                        size="small"
                        className={cn(
                          'border-0 shadow-none text-destructive bg-transparent',
                          'hover:text-destructive/70 hover:bg-transparent',
                          'p-0! h-auto',
                          'hidden',
                          !searchLoading && 'group-hover:flex',
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (searchLoading) return;

                          openModalError({
                            title: t('training.action.deleteTitle'),
                            content: t('searchTest.history.deleteConfirm'),
                            onOk: async () => {
                              const result =
                                await deleteKnowledgeSearchHistoriesApi(
                                  item?.id,
                                );
                              if (!result) return;

                              searchHistoriesRefresh();
                            },
                          });
                        }}
                      >
                        <Trash2 className="w-3! h-3!" />
                      </EnhancedButton>
                    </div>
                  </div>
                );
              })}

              <div className="py-4 text-center">
                {loadStatus === 'click' ? (
                  <div
                    className="text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground"
                    onClick={() => {
                      searchHistoriesRun({
                        page: Number(historyParamsRef?.current?.page) + 1,
                      });
                    }}
                  >
                    {t('common.loadMore')}
                  </div>
                ) : null}

                {loadStatus === 'loading' ? (
                  <div className="text-xs text-muted-foreground font-medium">
                    {t('common.loading')}
                  </div>
                ) : null}

                {loadStatus === 'noMore' ? (
                  <div className="text-xs text-muted-foreground font-medium">
                    {t('common.loadedAll')}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 右侧 */}
      <EnhancedSpinner
        spinning={searchLoading}
        wrapperClassName="flex-1 min-w-0 h-full"
        childrenClassName="flex flex-col h-full"
      >
        <div className="flex-1 min-w-0 h-full flex flex-col gap-4 p-5 pb-0 pr-0">
          {!Array.isArray(resultList) || !resultList.length ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_OPEN}
              description={t('searchTest.empty')}
            />
          ) : null}

          {Array.isArray(resultList) && resultList.length ? (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4">
                    <div className="text-xs font-medium text-foreground">
                      {t('searchTest.params.title')}
                    </div>

                    <div className="bg-primary/10 rounded-[8px] px-5 py-3 grid grid-cols-5 gap-2">
                      <div className="space-y-3">
                        <div className="text-xs font-medium text-foreground">
                          {t('searchTest.params.method')}
                        </div>

                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <SearchModeIcon className="text-primary" />
                          {SEARCH_MODE?.[
                            String(
                              searchTestResult?.search_mode,
                            ) as keyof typeof SEARCH_MODE
                          ] || '-'}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs font-medium text-foreground">
                          {t('searchTest.params.quote')}
                        </div>

                        <div className="text-xs font-medium text-muted-foreground">
                          {searchTestResult?.limit ?? 0}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs font-medium text-foreground">
                          {t('searchTest.params.minRel')}
                        </div>

                        <div className="text-xs font-medium text-muted-foreground">
                          {hasSimilarityMode
                            ? (searchTestResult?.similarity ?? 0)
                            : '不支持'}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs font-medium text-foreground">
                          {t('searchTest.params.rerank')}
                        </div>

                        <div className="text-xs font-medium text-muted-foreground">
                          <KnowledgeBaseIcon
                            type={
                              searchTestResult?.using_re_rank ? 'Check' : 'X'
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs font-medium text-foreground">
                          {t('searchTest.params.qopt')}
                        </div>

                        <div className="text-xs font-medium text-muted-foreground">
                          {searchTestResult?.extension_model || (
                            <KnowledgeBaseIcon
                              type={
                                searchTestResult?.using_extension
                                  ? 'Check'
                                  : 'X'
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-1 text-xs pb-4">
                  <div className="text-xs font-medium text-foreground">
                    {t('searchTest.result.title')}
                  </div>

                  <HelpPopover
                    content={
                      <ul>
                        <li>{t('searchTest.result.tooltip1')}</li>
                        <li>{t('searchTest.result.tooltip2')}</li>
                      </ul>
                    }
                    iconClassName="w-3.5 h-3.5"
                  />

                  <div className="text-muted-foreground">
                    ({searchTestResult?.duration ?? 0})<div></div>
                  </div>
                </div>

                <div ref={parentRef} className="flex-1 overflow-y-auto">
                  <div
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => (
                      <SearchTestItem
                        key={virtualItem.key}
                        virtualItem={virtualItem}
                        item={resultList[virtualItem.index]}
                        measureElement={virtualizer.measureElement}
                        onOpenInsertDataset={openInsertDatasetDialogFn}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </EnhancedSpinner>
    </div>
  );
}
