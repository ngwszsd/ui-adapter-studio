import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';
import { CirclePlus, PackageOpen } from 'lucide-react';
import { openCreateKBFolderDialog } from './CreateFolderDialog.tsx';
import { openRenameDialog } from './RenameDialog.tsx';
import {
  Badge,
  EnhancedBreadcrumb,
  EnhancedTooltip,
  type Crumb,
} from '@teamhelper/ui';
import {
  EnhancedButton as Button,
  Dropdown,
  Empty,
  EnhancedInput as Input,
  openModalError,
  Switch,
  type ColumnType,
} from '@teamhelper/ui';
import { ProTable } from '@/components/ProTable.tsx';
import { cn } from '@/lib/utils.ts';
import {
  useDebounceFn,
  useRafInterval,
  useRequest,
  useUpdateEffect,
} from 'ahooks';
import { isEqual } from 'es-toolkit';
import {
  deleteKnowledgeDatasetsApi,
  getKnowledgeBasesDatasetPathApi,
  knowledgeBasesDatasetStatusApi,
  knowledgeDatasetsApi,
  moveKnowledgeDatasetsApi,
  type IDeleteKnowledgeDatasetsParams,
  type IKnowledgeDatasetsDto,
  type IKnowledgeDatasetsParams,
} from '../server.ts';
import {
  KnowledgeBaseIcon,
  type IKnowledgeBaseIconProps,
} from '@/components/knowledgeBase/KnowledgeBaseIcon';
import { getFileIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon/utils';
import {
  DATASET_STATUS,
  DATASET_STATUS_CLASS_NAME,
  HANDLING_METHOD,
  ICON_TYPE,
  PROCESSING_MODE,
} from '@/constants/knowledgeBase.ts';
import { openMoveDialog } from '../../components/MoveDialog.tsx';
import { DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE } from '@/constants';
import { openTrainingStatusDialog } from './TrainingStatusDialog.tsx';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useKnowledgeDetailStore } from '../knowledgeDetailStore.ts';
import { format } from 'date-fns';
import { useResponsiveBreadcrumb } from '@/hooks/useResponsiveBreadcrumb.ts';
import type { PaginationDataDto } from '@/types/pagination.ts';

export interface IDatasetsSectionRef {
  refreshKnowledgeDatasetsList: () => void;
}

export interface IDatasetsSectionProps {
  ref?: Ref<IDatasetsSectionRef>;
}

const DatasetsSection: React.FC<IDatasetsSectionProps> = ({ ref }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation('knowledge');
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const routerLocation = useLocation();
  const { knowledgeBasesInfo, pollingStopped } = useKnowledgeDetailStore();
  const breadcrumbConfig = useResponsiveBreadcrumb([
    { width: 1030, maxItems: 2, itemsAfter: 1, itemsBefore: 0 },
    { width: 1180, maxItems: 3, itemsAfter: 1, itemsBefore: 1 },
    { width: Infinity, maxItems: 4, itemsAfter: 2, itemsBefore: 1 },
  ]);

  const knowledgeBaseId = useMemo(() => {
    const id = searchParams?.get?.('knowledgeBaseId');
    return Number(id) || null;
  }, [searchParams]);

  const knowledgeDatasetParentId = useMemo(() => {
    const id = searchParams?.get?.('parentId');
    return Number(id) || null;
  }, [searchParams]);

  useEffect(() => {
    setSelectedRowKeys([]);
  }, [knowledgeBaseId, knowledgeDatasetParentId]);

  const [knowledgeDatasets, setKnowledgeDatasets] =
    useState<PaginationDataDto<IKnowledgeDatasetsDto>>();

  const {
    loading,
    refresh: knowledgeDatasetsRefresh,
    run: knowledgeDatasetsRun,
    params: requestParams,
  } = useRequest(
    (params: IKnowledgeDatasetsParams) => {
      return knowledgeDatasetsApi(knowledgeBaseId, {
        keyword: String(params?.keyword || '').trim(),
        parent_id: knowledgeDatasetParentId,
        page: params?.page ?? DEFAULT_PAGE_NUM,
        size: params?.size || DEFAULT_PAGE_SIZE,
      });
    },
    {
      manual: false,
      onSuccess: (data) => {
        if (!isEqual(data, knowledgeDatasets)) {
          setKnowledgeDatasets(data);
        }
      },
    },
  );

  useUpdateEffect(() => {
    const currentParams = requestParams?.[0] || {};
    knowledgeDatasetsRun({
      ...currentParams,
      page: DEFAULT_PAGE_NUM,
    });
  }, [knowledgeDatasetParentId]);

  const { run: runSearch } = useDebounceFn(
    (keyword: string) => {
      setSelectedRowKeys([]);
      knowledgeDatasetsRun({
        keyword,
      });
    },
    {
      wait: 666,
    },
  );

  const { data: knowledgeBasesDatasetPaths } = useRequest(
    () => {
      return getKnowledgeBasesDatasetPathApi({
        folder_id: knowledgeDatasetParentId,
      });
    },
    {
      manual: false,
      ready: Boolean(knowledgeDatasetParentId),
      refreshDeps: [knowledgeDatasetParentId],
    },
  );

  const breadcrumbItems = useMemo(() => {
    const items = [{ key: 0, label: t('top.rootDir') }] as Crumb[];
    if (
      !Array.isArray(knowledgeBasesDatasetPaths) ||
      !knowledgeBasesDatasetPaths.length
    )
      return items;

    knowledgeBasesDatasetPaths.forEach((item) => {
      items.push({
        key: item?.id,
        label: item?.name || '-',
      });
    });

    return items;
  }, [knowledgeBasesDatasetPaths]);

  const onDeleteClick = async (params: IDeleteKnowledgeDatasetsParams) => {
    const result = await deleteKnowledgeDatasetsApi(params);
    if (!result) return;

    setSelectedRowKeys([]);

    const currentData = knowledgeDatasets?.content || [];
    const currentPage = knowledgeDatasets?.number ?? DEFAULT_PAGE_NUM;
    const deletedIds = params?.dataset_ids?.split?.(',') || [];

    const isCurrentPageEmpty =
      currentData.length > 0 &&
      currentData.every((item) => deletedIds.includes(String(item.id)));

    if (currentPage > 0 && isCurrentPageEmpty) {
      const currentReqParams = requestParams?.[0] || {};
      knowledgeDatasetsRun({
        ...currentReqParams,
        page: currentPage - 1,
      });
    } else {
      knowledgeDatasetsRefresh();
    }
  };

  const columns = useMemo<ColumnType<IKnowledgeDatasetsDto>[]>(() => {
    return [
      {
        title: t('dataset.col.name'),
        dataIndex: 'name',
        key: 'name',
        width: 300,
        render: (_, record) => {
          const typeValue = ICON_TYPE[record?.data_type ?? 0];

          let iconType = typeValue as IKnowledgeBaseIconProps['type'];
          if (typeValue === 'text') {
            iconType = getFileIcon(
              record?.name,
            ) as IKnowledgeBaseIconProps['type'];
          }

          return (
            <div className="flex items-center gap-1 cursor-pointer">
              {iconType ? (
                <KnowledgeBaseIcon type={iconType} className="w-4 h-4" />
              ) : null}

              <EnhancedTooltip
                title={record?.name || '-'}
                overlayClassName="max-w-[280px]"
                className="flex-1 min-w-0"
              >
                <div className="truncate">{record?.name || '-'}</div>
              </EnhancedTooltip>
            </div>
          );
        },
      },
      {
        title: t('dataset.col.mode'),
        dataIndex: 'data_type',
        key: 'data_type',
        width: 160,
        render: (_, record) => {
          if (!record?.data_type) return '-';

          const mode =
            record?.data_type === 2 || record?.processing_mode === 3
              ? 'image'
              : 'file';
          return PROCESSING_MODE[mode];
        },
      },
      {
        title: t('dataset.col.size'),
        dataIndex: 'chunk_count',
        key: 'chunk_count',
        width: 160,
        render: (_, record) => {
          if (!record?.data_type) return '-';

          return (
            <div className="flex items-center gap-3 flex-wrap">
              {record?.data_type === 1 ? (
                <div>{HANDLING_METHOD[record?.processing_mode ?? 'th']}</div>
              ) : null}

              <div>{record?.chunk_count ?? 0}</div>
            </div>
          );
        },
      },
      {
        title: t('dataset.col.time'),
        dataIndex: 'create_time',
        key: 'create_time',
        width: i18n.language === 'zh' ? 178 : 188,
        render: (_, record) => {
          const c = format(new Date(record?.create_time), 'yyyy-MM-dd HH:mm');
          const u = format(new Date(record?.update_time), 'yyyy-MM-dd HH:mm');
          return (
            <div>
              <div>{c}</div>
              <div>{u}</div>
            </div>
          );
        },
      },
      {
        title: t('dataset.col.status'),
        dataIndex: 'status',
        key: 'status',
        width: i18n.language === 'zh' ? 140 : 182,
        render: (_, record) => {
          const trainingCount = record?.training_amount ?? 0;
          const s = record?.status || 0;
          return (
            <EnhancedTooltip title={t('dataset.col.status.tooltip')}>
              <Badge
                className={cn(
                  'px-3 min-h-[26px] rounded-full flex items-center justify-center w-fit border-0 cursor-pointer',
                  DATASET_STATUS_CLASS_NAME[s ?? 'th'],
                )}
                variant="outline"
                onClick={async (e) => {
                  e.stopPropagation();

                  const result = await openTrainingStatusDialog({
                    datasetInfo: record,
                  });

                  if (result?.isRetry) {
                    knowledgeDatasetsRefresh();
                  }
                }}
              >
                <div
                  className={cn(
                    'flex items-center flex-wrap text-xs',
                    i18n.language !== 'zh' && 'gap-1',
                  )}
                >
                  {s === 1 ? <div>{trainingCount ?? 0}</div> : null}

                  <div>
                    {s === 1 ? t('dataset.status.unit') : null}
                    {DATASET_STATUS[s ?? 'th']}
                  </div>
                </div>
              </Badge>
            </EnhancedTooltip>
          );
        },
      },
      {
        title: t('dataset.col.enable'),
        dataIndex: 'activated',
        key: 'activated',
        width: i18n.language === 'zh' ? 116 : 92,
        render: (_, record) => {
          return (
            <Switch
              defaultChecked={Boolean(record?.activated)}
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={() => {
                knowledgeBasesDatasetStatusApi({
                  dataset_id: record?.id,
                });
              }}
            />
          );
        },
      },
      {
        title: t('dataset.col.action'),
        key: 'actions',
        width: i18n.language === 'zh' ? 150 : 180,
        fixed: 'right',
        render: (_, record) => (
          <div
            className="flex items-center gap-3 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="link"
              className="px-0"
              onClick={async (e) => {
                e.stopPropagation();
                openMoveDialog({
                  source: 'datasets',
                  knowledgeBaseId,
                  moveResourceId: record?.id ?? undefined,
                  onOk: async (selectedKeys) => {
                    const parent_id = String(selectedKeys?.[0] || '');
                    const result = await moveKnowledgeDatasetsApi({
                      dataset_id: record?.id,
                      parent_id,
                    });
                    if (result) {
                      setSelectedRowKeys([]);
                      knowledgeDatasetsRefresh();
                    }
                    return result;
                  },
                });
              }}
            >
              {t('dataset.action.move')}
            </Button>

            <Button
              type="link"
              className="px-0"
              onClick={(e) => {
                e.stopPropagation();
                openRenameDialog({
                  formValues: {
                    ...record,
                    name: record?.name || '',
                  },
                }).then((result) => {
                  if (!result) return;

                  knowledgeDatasetsRefresh();
                });
              }}
            >
              {t('dataset.action.rename')}
            </Button>

            <Button
              className={cn(
                'border-0 shadow-none text-destructive bg-transparent',
                'hover:text-destructive/70 hover:bg-transparent',
                'px-0',
              )}
              onClick={async (e) => {
                e.stopPropagation();
                openModalError({
                  title: t('dataset.action.delete'),
                  content: t('dataset.delete.confirm'),
                  onOk() {
                    onDeleteClick({
                      dataset_ids: String(record?.id || ''),
                    });
                  },
                });
              }}
            >
              {t('dataset.action.delete')}
            </Button>
          </div>
        ),
      },
    ];
  }, [knowledgeDatasets]);

  useImperativeHandle(ref, () => {
    return {
      refreshKnowledgeDatasetsList() {
        knowledgeDatasetsRefresh();
      },
    };
  }, [ref]);

  const shouldPoll = useMemo(() => {
    if (loading) return false;
    if (pollingStopped) return false;
    const list = knowledgeDatasets?.content || [];
    if (!Array.isArray(list) || !list.length) return false;

    return list.some((item) => {
      return !item?.status || item?.status === 1;
    });
  }, [knowledgeDatasets, pollingStopped, loading]);

  useRafInterval(
    () => {
      knowledgeDatasetsRefresh();
    },
    shouldPoll ? 1000 * 6 : undefined,
  );

  return (
    <div className="p-5 flex-1 min-w-0 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-5">
          {!knowledgeDatasetParentId ? (
            <div className="text-sm text-foreground font-medium">
              {t('dataset.header.file')}(
              {knowledgeDatasets?.total_elements || 0})
            </div>
          ) : (
            <EnhancedBreadcrumb
              items={breadcrumbItems}
              onClick={(crumb) => {
                if (crumb?.key === knowledgeDatasetParentId) return;

                setSearchParams((prev: URLSearchParams) => {
                  prev.set('parentId', String(crumb?.key || ''));
                  return prev;
                });
                setSelectedRowKeys([]);
              }}
              separator="/"
              className="[&>ol]:flex-nowrap"
              contentClassName="max-w-30"
              maxItems={breadcrumbConfig.maxItems}
              itemsBefore={breadcrumbConfig.itemsBefore}
              itemsAfter={breadcrumbConfig.itemsAfter}
              lastItemClickable={breadcrumbItems?.length === 1}
            />
          )}

          {Array.isArray(selectedRowKeys) && selectedRowKeys.length ? (
            <Button
              size="small"
              onClick={async () => {
                const len = selectedRowKeys?.length || 0;

                openModalError({
                  title: t('dialog.delete.title'),
                  content: t('dataset.delete.batchConfirm', { count: len }),
                  onOk() {
                    onDeleteClick({
                      dataset_ids: selectedRowKeys?.join(','),
                    });
                  },
                });
              }}
            >
              {t('dataset.action.batchDelete')}
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <Input.Search
            placeholder={t('dataset.search.placeholder')}
            onChange={(e) => {
              runSearch(String(e?.target?.value || ''));
            }}
            inputClassName="w-60"
          />

          <Dropdown
            menu={{
              items: [
                {
                  key: 'folder',
                  label: (
                    <div className="flex items-center gap-1">
                      <KnowledgeBaseIcon type="folder" className="w-4 h-4" />

                      <div className="text-sm text-foreground">
                        {t('dataset.create.folder')}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'text',
                  label: (
                    <div className="flex items-center gap-1">
                      <KnowledgeBaseIcon type="file" className="w-4 h-4" />

                      <div className="text-sm text-foreground">
                        {t('dataset.create.text')}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'image',
                  label: (
                    <div className="flex items-center gap-1">
                      <KnowledgeBaseIcon type="kbImage" className="w-4 h-4" />

                      <div className="text-sm text-foreground">
                        {t('dataset.create.image')}
                      </div>
                    </div>
                  ),
                },
              ],
              onClick({ key }) {
                switch (key) {
                  case 'folder':
                    openCreateKBFolderDialog({
                      formValues: {
                        knowledge_base_id: knowledgeBaseId,
                        parent_id: knowledgeDatasetParentId,
                      },
                      refresh: knowledgeDatasetsRefresh,
                    });
                    break;
                  case 'text':
                    const text_pathname = routerLocation?.pathname?.replace?.(
                      '/detail',
                      '/text-dataset',
                    );

                    if (text_pathname) {
                      navigate(
                        `${text_pathname}?knowledgeBaseId=${knowledgeBaseId}&parentId=${knowledgeDatasetParentId || ''}`,
                      );
                    }
                    break;
                  case 'image':
                    const img_pathname = routerLocation?.pathname?.replace?.(
                      '/detail',
                      '/image-dataset',
                    );

                    if (img_pathname) {
                      navigate(
                        `${img_pathname}?knowledgeBaseId=${knowledgeBaseId}&parentId=${knowledgeDatasetParentId || ''}`,
                      );
                    }
                    break;
                }
              },
            }}
            cursorPointer
            placement="bottomRight"
            overlayClassName="min-w-20"
          >
            <Button type="primary">
              <CirclePlus className="h-6 w-6" />
              {t('dataset.create.button')}
            </Button>
          </Dropdown>
        </div>
      </div>

      <ProTable
        className="flex-1 min-h-0"
        columns={columns}
        dataSource={knowledgeDatasets?.content || []}
        rowKey="id"
        pagination={{
          current: knowledgeDatasets?.number || DEFAULT_PAGE_NUM,
          pageSize: knowledgeDatasets?.size || DEFAULT_PAGE_SIZE,
          total: knowledgeDatasets?.total_elements || 0,
        }}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange(selectedKeys) {
            setSelectedRowKeys(selectedKeys);
          },
          getCheckboxProps() {
            return {
              onClick: (e) => e?.stopPropagation?.(),
            };
          },
        }}
        onChange={(pagination, _filters, sorter, extra) => {
          setSelectedRowKeys([]);
          const currentParams = requestParams?.[0] || {};
          knowledgeDatasetsRun({
            ...currentParams,
            page: pagination?.current,
            size: pagination?.pageSize,
          });
        }}
        locale={{
          emptyText: (
            <Empty
              image={
                <div className="flex items-center justify-center w-12 h-12 mb-2 bg-[#EFEFEF] rounded-xl">
                  <PackageOpen className="w-6 h-6 text-foreground" />
                </div>
              }
              title={t('dataset.empty.title')}
              description={t('dataset.empty.desc')}
              classNames={{
                root: 'py-12',
              }}
            />
          ),
        }}
        loading={loading}
        onRow={(record) => {
          return {
            className: 'cursor-pointer',
            onClick() {
              if (record?.data_type === 0) {
                if (knowledgeDatasetParentId === record?.id) return;

                setSearchParams((prev: URLSearchParams) => {
                  prev.set('parentId', String(record?.id || ''));
                  return prev;
                });
                setSelectedRowKeys([]);
              } else {
                const pathname = routerLocation?.pathname?.replace?.(
                  '/detail',
                  '/dataset-detail',
                );

                if (pathname) {
                  navigate(
                    `${pathname}?knowledgeBaseId=${knowledgeBaseId}&datasetId=${record?.id}&datasetType=${record?.data_type}&knowledgeBaseName=${encodeURIComponent(knowledgeBasesInfo?.name || '')}`,
                  );
                }
              }
            },
          };
        }}
      />
    </div>
  );
};

export default DatasetsSection;
