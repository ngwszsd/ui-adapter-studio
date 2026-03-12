import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils.ts';
import {
  Empty,
  EnhancedButton,
  EnhancedSpinner,
  EnhancedTooltip,
} from '@teamhelper/ui';
import {
  KnowledgeBaseIcon,
  type IKnowledgeBaseIconProps,
} from '@/components/knowledgeBase/KnowledgeBaseIcon';
import { useKnowledgeTextDatasetStore } from '../knowledgeTextDatasetStore';
import { useRequest } from 'ahooks';
import { knowledgeDatasetChunksPreviewApi } from '../server';
import { ReactMarkdown } from '@/components/common/ReactMarkdown';
import { useSearchParams } from 'react-router';
import { getFileIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon/utils';

interface StepThreePreviewProps {
  isShow: boolean;
  handleNext: () => void;
}

const StepThreePreview: React.FC<StepThreePreviewProps> = ({
  isShow = true,
  handleNext,
}) => {
  const { fileRows, datasetParams } = useKnowledgeTextDatasetStore();
  const { t } = useTranslation('knowledge');
  const [fileObjectKey, setFileObjectKey] = useState<string>('');
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const knowledgeBaseId = useMemo(() => {
    const id = searchParams?.get?.('knowledgeBaseId');
    return Number(id) || null;
  }, [searchParams]);

  const {
    data: chunksPreviewInfo,
    mutate,
    loading: reqLoading,
    cancel: chunksPreviewCancel,
  } = useRequest(
    () => {
      return knowledgeDatasetChunksPreviewApi(knowledgeBaseId, {
        ...datasetParams?.config,
        file_object_key: fileObjectKey,
      });
    },
    {
      manual: false,
      ready: Boolean(
        isShow && fileObjectKey && datasetParams?.config && searchParams,
      ),
      refreshDeps: [fileObjectKey, datasetParams?.config, isShow, searchParams],
    },
  );

  useEffect(() => {
    if (reqLoading) {
      setIsLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [reqLoading]);

  const chunks = useMemo(() => {
    return chunksPreviewInfo?.chunks || [];
  }, [chunksPreviewInfo?.chunks]);

  useEffect(() => {
    if (!isShow) {
      setFileObjectKey('');
      mutate(undefined);
      chunksPreviewCancel();
    }
  }, [isShow, mutate, chunksPreviewCancel]);

  return (
    <div className={cn('h-full flex flex-col', isShow ? 'flex' : 'hidden')}>
      <div className="border border-border flex rounded-[8px] flex-1 min-h-0">
        <div className="border-r border-border w-[500px] flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-base font-medium">
              {t('textDataset.preview.list')}
            </div>
          </div>

          <div className="py-5 flex flex-col gap-2 overflow-y-auto">
            {fileRows?.map?.((item) => {
              const fileName = item?.file?.name;
              const fileObject_Key = item?.file_object_key || '';
              const iconType = getFileIcon(
                fileName,
              ) as IKnowledgeBaseIconProps['type'];
              return (
                <div
                  key={item?.id}
                  className={cn(
                    'min-h-[45px] mx-5 p-3',
                    'flex items-center gap-1',
                    'transition-colors',
                    'bg-background rounded-[8px]',
                    fileObjectKey === fileObject_Key && 'bg-primary/10',
                    isLoading ? 'cursor-not-allowed' : 'cursor-pointer',
                  )}
                  onClick={() => {
                    if (isLoading) return;
                    if (fileObjectKey === fileObject_Key) return;
                    setFileObjectKey(fileObject_Key);
                  }}
                >
                  <KnowledgeBaseIcon type={iconType} />

                  <EnhancedTooltip
                    title={fileName}
                    className="min-w-0"
                    triggerClassName="text-sm truncate"
                    overlayClassName="max-w-90"
                  >
                    {fileName}
                  </EnhancedTooltip>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="text-base font-medium">
              {t('textDataset.preview.chunk')}
            </div>

            <div className="text-sm text-muted-foreground">
              {t('textDataset.preview.totalChunks', {
                total: chunksPreviewInfo?.total || 0,
              })}
            </div>
          </div>

          <EnhancedSpinner
            spinning={isLoading}
            wrapperClassName="flex-1 min-h-0"
            childrenClassName="flex flex-col h-full"
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {!Array.isArray(chunks) || !chunks?.length ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_OPEN}
                  description={t('textDataset.preview.clickToPreview')}
                />
              ) : null}
              {Array.isArray(chunks) && chunks?.length ? (
                <div className={cn('px-5 py-3', 'space-y-3')}>
                  {chunks.map((item, index) => {
                    const q = item?.q || '';
                    const a = item?.a || '';
                    if (!q && !a) return null;

                    return (
                      <div
                        key={index}
                        className={cn(
                          'pb-3',
                          index % 2 === 0
                            ? 'bg-primary/6 hover:bg-primary/10'
                            : 'bg-foreground/6 hover:bg-foreground/8',
                          'border border-transparent hover:border-primary',
                        )}
                      >
                        <ReactMarkdown>{q}</ReactMarkdown>

                        <ReactMarkdown>{a}</ReactMarkdown>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </EnhancedSpinner>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <EnhancedButton
          type="primary"
          disabled={isLoading}
          onClick={() => {
            handleNext?.();
          }}
        >
          {t('textDataset.next.simple')}
        </EnhancedButton>
      </div>
    </div>
  );
};

export default StepThreePreview;
