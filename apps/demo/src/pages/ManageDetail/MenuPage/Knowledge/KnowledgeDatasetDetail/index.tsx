import React, { useEffect, useMemo, useRef, useState } from 'react';
import RightInfoSidebar from './components/RightInfoSidebar';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { IKnowledgeDatasetsDto } from '../KnowledgeDetail/server';
import {
  deleteKnowledgeDatasetsChunkApi,
  knowledgeDatasetsChunksApi,
  queryKBDatasetStatusApi,
  type IKnowledgeDatasetsChunksDtoList,
  type IKnowledgeDatasetsChunksParams,
} from './server';
import { DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE } from '@/constants';
import { ICON_TYPE } from '@/constants/knowledgeBase';
import { cn, formatFileSize } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import {
  KnowledgeBaseIcon,
  type IKnowledgeBaseIconProps,
} from '@/components/knowledgeBase/KnowledgeBaseIcon';
import { useKnowledgeDatasetDetailStore } from './knowledgeDatasetDetailStore';
import {
  Empty,
  EnhancedButton,
  EnhancedInput,
  EnhancedTooltip,
  openModalError,
} from '@teamhelper/ui';
import { CircleArrowDown, CirclePlus, LayoutList, Trash2 } from 'lucide-react';
import { ReactMarkdown } from '@/components/common/ReactMarkdown';
import { openAddImageDialog } from './components/AddImageDialog';
import { openInsertDatasetDialog } from './components/InsertDatasetDialog';
import { useTranslation } from 'react-i18next';
import Box3DIcon from '@/assets/icon/box_3d.svg?react';
import { useDebounceFn, useRequest } from 'ahooks';
import { getFileIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon/utils';

const KnowledgeDatasetDetail: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('knowledge');
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const { metaDataInfo } = useKnowledgeDatasetDetailStore();
  const chunksParamsRef = useRef<IKnowledgeDatasetsChunksParams>({});
  const [chunks, setChunks] = useState<IKnowledgeDatasetsChunksDtoList>([]);
  const [chunksLoading, setChunksLoading] = useState(true);
  const [chunkTotal, setChunkTotal] = useState(0);
  const [vectorSize, setVectorSize] = useState(0);

  const knowledgeBaseId = useMemo(() => {
    const id = searchParams?.get?.('knowledgeBaseId');
    return Number(id) || null;
  }, [searchParams]);

  const datasetType = useMemo(() => {
    const t = searchParams?.get?.('datasetType');
    return Number(t) as IKnowledgeDatasetsDto['data_type'];
  }, [searchParams]);

  const datasetId = useMemo(() => {
    const n = searchParams?.get?.('datasetId');
    return Number(n);
  }, [searchParams]);

  const knowledgeBaseName = useMemo(() => {
    const t = searchParams?.get?.('knowledgeBaseName');
    return decodeURIComponent(t || '');
  }, [searchParams]);

  const getKnowledgeDatasetsChunks = async (
    values?: IKnowledgeDatasetsChunksParams,
  ) => {
    values = {
      ...chunksParamsRef?.current,
      ...values,
    };

    const params = {
      keyword: String(values?.keyword || '').trim(),
      page: values?.page ?? DEFAULT_PAGE_NUM,
      size: values?.size || DEFAULT_PAGE_SIZE,
    };
    if (!chunksLoading) {
      setChunksLoading(true);
    }
    const result = await knowledgeDatasetsChunksApi(datasetId, params).finally(
      () => {
        setTimeout(() => {
          setChunksLoading(false);
        }, 1000);
      },
    );

    chunksParamsRef.current = params;
    const list = result?.data?.content || [];
    const newChunks = params?.page <= 0 ? list : [...chunks, ...list];
    setChunks(newChunks);
    setChunkTotal(result?.data?.total_elements ?? 0);
    setVectorSize(result?.vector_size ?? 0);
  };

  const { run: getKnowledgeDatasetsChunksRun } = useDebounceFn(
    (val: string) => {
      getKnowledgeDatasetsChunks({
        page: 0,
        keyword: val,
      });
    },
    {
      wait: 666,
    },
  );

  useEffect(() => {
    if (datasetId) {
      getKnowledgeDatasetsChunks();
    }
  }, [datasetId]);

  const openInsertDatasetDialogFn = async (chunk_id?: number | null) => {
    const result = await openInsertDatasetDialog({
      title: metaDataInfo?.name,
      datasetId,
      chunk_id,
      datasetType,
    });
    if (!result) return;

    getKnowledgeDatasetsChunks({
      page: 0,
    });
  };

  const loadStatus = useMemo(() => {
    if (chunksLoading) return 'loading';

    if (chunks?.length && chunks?.length >= chunkTotal) {
      return 'noMore';
    }

    return 'click';
  }, [chunksLoading, chunks, chunkTotal]);

  const iconType = useMemo(() => {
    const typeValue = ICON_TYPE[datasetType ?? 0];
    let type = typeValue as IKnowledgeBaseIconProps['type'];
    if (typeValue === 'text') {
      type = getFileIcon(metaDataInfo?.name) as IKnowledgeBaseIconProps['type'];
    }
    return type;
  }, [datasetType, metaDataInfo?.name]);

  const { data: datasetStatus } = useRequest(
    () => {
      return queryKBDatasetStatusApi(datasetId);
    },
    {
      manual: false,
      ready: Boolean(datasetId),
      refreshDeps: [datasetId],
    },
  );

  return (
    <div className="w-full h-full flex bg-card">
      <div className={cn('flex-1 min-w-0 h-full p-5 flex flex-col')}>
        <div className="border-b border-border space-y-3 pb-3">
          <PageHeader
            subTitle={knowledgeBaseName || t('common.back')}
            classNames={{
              box: 'p-0',
              subTitleBox: 'text-primary hover:text-primary/80',
            }}
          />

          <div className="flex items-center justify-between gap-1">
            <div className="flex gap-1 flex-1 min-w-0">
              {iconType ? <KnowledgeBaseIcon type={iconType} /> : null}

              <div className="text-sm font-medium text-foreground truncate">
                {metaDataInfo?.name || '-'}
              </div>
            </div>

            {datasetType === 1 ? (
              <div className="flex items-center gap-4">
                <EnhancedTooltip
                  title={
                    datasetStatus === 1
                      ? t('datasetDetail.trainingNotAllowModify')
                      : undefined
                  }
                >
                  <EnhancedButton
                    type="primary"
                    disabled={datasetStatus === 1}
                    onClick={() => {
                      const text_pathname = routerLocation?.pathname?.replace?.(
                        '/dataset-detail',
                        '/text-dataset',
                      );

                      if (text_pathname) {
                        navigate(
                          `${text_pathname}?knowledgeBaseId=${knowledgeBaseId}&source=adjust&datasetId=${datasetId}`,
                        );
                      }
                    }}
                  >
                    <Box3DIcon />
                    {t('datasetDetail.adjustParams')}
                  </EnhancedButton>
                </EnhancedTooltip>

                <EnhancedTooltip
                  title={
                    datasetStatus === 1
                      ? t('datasetDetail.trainingNotAllowModify')
                      : undefined
                  }
                >
                  <EnhancedButton
                    disabled={datasetStatus === 1}
                    onClick={() => {
                      openInsertDatasetDialogFn();
                    }}
                  >
                    <CircleArrowDown />
                    {t('datasetDetail.insert')}
                  </EnhancedButton>
                </EnhancedTooltip>
              </div>
            ) : null}

            {datasetType === 2 ? (
              <EnhancedTooltip
                title={
                  datasetStatus === 1
                    ? t('datasetDetail.trainingNotAllowModify')
                    : undefined
                }
              >
                <EnhancedButton
                  type="primary"
                  disabled={datasetStatus === 1}
                  onClick={async () => {
                    const result = await openAddImageDialog({
                      datasetId,
                    });
                    if (!result) return;

                    getKnowledgeDatasetsChunks({
                      page: 0,
                    });
                  }}
                >
                  <CirclePlus />
                  {t('datasetDetail.addImage')}
                </EnhancedButton>
              </EnhancedTooltip>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between py-3.5">
          <div className="text-xs text-foreground flex items-center gap-3">
            <div className="flex items-center gap-2">
              <LayoutList className="w-4 h-4" />
              <div className="text-xs text-foreground font-medium">
                {chunkTotal ?? 0} {t('datasetDetail.groupData')}
              </div>
            </div>

            <div className="text-xs text-foreground font-medium">
              {vectorSize ?? 0} {t('datasetDetail.groupIndex')}
            </div>
          </div>

          <EnhancedInput.Search
            placeholder={t('datasetDetail.searchPlaceholder')}
            onChange={(e) => {
              const val = String(e?.target?.value || '').trim();
              if (val === chunksParamsRef?.current?.keyword) return;

              getKnowledgeDatasetsChunksRun(val);
            }}
            className="w-fit"
            inputClassName="w-60"
          />
        </div>

        <div className="space-y-[7px] flex-1 overflow-y-auto">
          {!Array.isArray(chunks) || !chunks?.length ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_OPEN}
              description={t('datasetDetail.emptyData')}
              classNames={{
                root: 'p-5',
              }}
            />
          ) : null}

          {Array.isArray(chunks) && chunks.length ? (
            <>
              {chunks.map((item, index) => {
                const mode = item?.mode;
                const sizeVal = item?.size ?? 0;

                let q = '';
                let a = item?.answer || '';
                switch (mode) {
                  case 1:
                    q = item?.content || '';
                    a = '';
                    break;
                  case 2:
                    q = item?.question || '';
                    break;
                  case 3:
                    q = item?.image_preview_url || '';
                    if (q) {
                      q = `![](${q})`;
                    }
                    break;
                }

                return (
                  <div
                    key={item?.chunk_id}
                    className={cn(
                      'rounded-[8px] p-3.5 cursor-pointer gap-2 relative group',
                      index % 2 === 0
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'bg-background hover:bg-foreground/8',
                      'border border-transparent hover:border-primary',
                      'flex',
                      mode !== 3 && 'flex-col',
                    )}
                    onClick={() => {
                      openInsertDatasetDialogFn(item?.chunk_id);
                    }}
                  >
                    <ReactMarkdown isDisabled>{q || '-'}</ReactMarkdown>

                    {mode !== 3 && a ? (
                      <div className="border-b border-under-line mb-1"></div>
                    ) : null}

                    <ReactMarkdown isDisabled>{a}</ReactMarkdown>

                    <div
                      className={cn(
                        'items-center gap-2 text-xs font-medium bg-card absolute h-[22px] px-2 rounded-[6px]',
                        'hidden group-hover:flex cursor-text',
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-primary">#{index}</div>
                      <div className="text-muted-foreground">
                        ID:{item?.chunk_id ?? '-'}
                      </div>
                    </div>

                    <div
                      className={cn(
                        'absolute bottom-3.5 right-3.5 items-center gap-1',
                        'hidden group-hover:flex',
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EnhancedButton
                        size="small"
                        className={cn(
                          'text-xs',
                          'h-6 px-2! rounded-[6px] cursor-default',
                        )}
                      >
                        <KnowledgeBaseIcon
                          type="t"
                          className="fill-foreground"
                        />
                        <div>
                          {mode === 3 ? formatFileSize(sizeVal) : sizeVal}
                        </div>
                      </EnhancedButton>

                      <EnhancedButton
                        size="small"
                        className={cn(
                          'w-fit',
                          'hover:text-destructive hover:border-destructive',
                          'p-0! w-6! h-6! rounded-[6px]',
                        )}
                        onClick={() => {
                          openModalError({
                            title: t('action.delete'),
                            content: t('datasetDetail.deleteConfirm'),
                            onOk: async () => {
                              const result =
                                await deleteKnowledgeDatasetsChunkApi(
                                  item?.chunk_id ?? null,
                                );
                              if (!result) return;

                              getKnowledgeDatasetsChunks({
                                page: 0,
                              });
                            },
                          });
                        }}
                      >
                        <Trash2 className="w-3.5! h-3.5!" />
                      </EnhancedButton>
                    </div>
                  </div>
                );
              })}
            </>
          ) : null}

          {Array.isArray(chunks) && chunks.length ? (
            <div className="py-4 text-center">
              {loadStatus === 'click' ? (
                <div
                  className="text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground"
                  onClick={() => {
                    getKnowledgeDatasetsChunks({
                      page: Number(chunksParamsRef?.current?.page) + 1,
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
          ) : null}
        </div>
      </div>

      <RightInfoSidebar />
    </div>
  );
};

export default KnowledgeDatasetDetail;
