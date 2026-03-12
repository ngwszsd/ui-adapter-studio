import React, { useEffect, useMemo, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MoreHorizontal,
  CirclePlus,
  Move,
  Trash2,
  SquarePen,
} from 'lucide-react';
import { openCreateKnowledgeDialog } from './components/CreateKnowledgeDialog';
import {
  openCreateFolderDialog,
  type CreateFolderDialogProps,
} from './components/CreateFolderDialog';
import { openMoveDialog } from './components/MoveDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dropdown,
  Empty,
  EnhancedAvatar,
  EnhancedBreadcrumb,
  EnhancedButton,
  EnhancedInput,
  EnhancedTooltip,
  openModalError,
  EnhancedPopover as Popover,
  type Crumb,
} from '@teamhelper/ui';
import { KnowledgeSkeleton } from './Skeleton';
import { openEditKnowledgeDialog } from '@/pages/ManageDetail/MenuPage/Knowledge/KnowledgeDetail/components/EditKnowledgeDialog';
import { useRequest } from 'ahooks';
import {
  deleteKnowledgeBasesApi,
  getKnowledgeBasesPathApi,
  knowledgeBasesApi,
  moveKnowledgeBasesApi,
  queryKnowledgeBasesApi,
  type IKnowledgeBasesDto,
} from './server';
import { KnowledgeBaseIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon';
import { useNavigate, useSearchParams } from 'react-router';
import { format } from 'date-fns';
import { HorizontalCollapse } from '@/components/knowledgeBase/HorizontalCollapse';
import { useResponsiveBreadcrumb } from '@/hooks/useResponsiveBreadcrumb';

/**
 * 知识库列表
 * @returns
 */
export const Knowledge: React.FC = memo(() => {
  const navigate = useNavigate();
  const { t } = useTranslation('knowledge');
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const breadcrumbConfig = useResponsiveBreadcrumb([
    { width: 960, maxItems: 2, itemsAfter: 1, itemsBefore: 0 },
    { width: 1100, maxItems: 3, itemsAfter: 1, itemsBefore: 1 },
    { width: Infinity, maxItems: 4, itemsAfter: 2, itemsBefore: 1 },
  ]);

  const knowledgeBasesParentId = useMemo(() => {
    const parentId = searchParams?.get?.('parentId');
    return Number(parentId) || null;
  }, [searchParams]);

  const {
    loading: knowledgeLoading,
    data: knowledgeList,
    refresh,
    run,
  } = useRequest(
    (keyword) => {
      return knowledgeBasesApi({
        keyword: String(keyword || '').trim(),
        parent_id: knowledgeBasesParentId,
      });
    },
    {
      debounceWait: 666,
      manual: false,
      refreshDeps: [knowledgeBasesParentId],
    },
  );

  useEffect(() => {
    if (knowledgeLoading) {
      setIsLoading(true);
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, [knowledgeLoading]);

  const { data: knowledgeBasesInfo, refresh: knowledgeBasesInfoRefresh } =
    useRequest(
      () => {
        return queryKnowledgeBasesApi(knowledgeBasesParentId);
      },
      {
        manual: false,
        ready: Boolean(knowledgeBasesParentId),
        refreshDeps: [knowledgeBasesParentId],
      },
    );

  const { data: knowledgeBasesPaths, refresh: knowledgeBasesPathsRefresh } =
    useRequest(
      () => {
        return getKnowledgeBasesPathApi({
          knowledge_id: knowledgeBasesParentId,
        });
      },
      {
        manual: false,
        ready: Boolean(knowledgeBasesParentId),
        refreshDeps: [knowledgeBasesParentId],
      },
    );

  const pageFlag = useMemo(() => {
    return knowledgeBasesParentId && knowledgeBasesInfo?.type === 2
      ? 'folder'
      : 'list';
  }, [knowledgeBasesInfo, knowledgeBasesParentId]);

  const onMoveClick = async (info: Partial<IKnowledgeBasesDto>) => {
    openMoveDialog({
      source: pageFlag,
      moveResourceId: info?.id ?? undefined,
      onOk: async (selectedKeys) => {
        const target_id = Number(selectedKeys?.[0]) || -1;
        const result = await moveKnowledgeBasesApi({
          source_knowledge_base_id: info?.id || null,
          target_knowledge_base_id: target_id,
        });
        if (result) {
          knowledgeBasesPathsRefresh();
          refresh();
        }
        return result;
      },
    });
  };

  const onEditClick = async (
    params: Partial<CreateFolderDialogProps>,
    actionType: 'refresh' | 'KBRefresh' = 'refresh',
  ) => {
    const result = await openCreateFolderDialog(params);
    if (!result) return;

    switch (actionType) {
      case 'refresh':
        refresh();
        return;
      case 'KBRefresh':
        knowledgeBasesInfoRefresh();
        knowledgeBasesPathsRefresh();
        return;
    }
  };

  const onDeleteClick = async (knowledge_base_id: number | null) => {
    const result = await deleteKnowledgeBasesApi(knowledge_base_id);
    return result;
  };

  const renderIcon = (type: IKnowledgeBasesDto['type']) => {
    if (type === 2) {
      return (
        <EnhancedAvatar
          icon={<KnowledgeBaseIcon type="folder" className="w-full h-full" />}
          shape="square"
          className="w-full h-full shrink-0 bg-transparent -mt-1"
        />
      );
    }

    return (
      <EnhancedAvatar
        icon={
          <KnowledgeBaseIcon
            type="default_knowledgeBase"
            className="w-full h-full"
          />
        }
        shape="square"
        className="w-full h-full shrink-0 bg-transparent"
      />
    );
  };

  const breadcrumbItems = useMemo(() => {
    const items = [{ key: 0, label: t('top.rootDir') }] as Crumb[];
    if (!Array.isArray(knowledgeBasesPaths) || !knowledgeBasesPaths.length)
      return items;

    knowledgeBasesPaths.forEach((item) => {
      items.push({
        key: item?.id,
        label: item?.name || '-',
      });
    });

    return items;
  }, [knowledgeBasesPaths]);

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 h-full flex flex-col bg-background">
        {/* 顶部标题与搜索、新建 */}
        <div className="shrink-0 p-5 pb-0">
          <div className="flex items-center justify-between mb-5">
            {pageFlag === 'folder' ? (
              <div className="text-xl font-bold">
                <EnhancedBreadcrumb
                  items={breadcrumbItems}
                  separator="/"
                  className="text-base [&>ol]:flex-nowrap"
                  onClick={(crumb) => {
                    if (crumb?.key === knowledgeBasesParentId) return;

                    setIsLoading(true);
                    setSearchParams((prev: URLSearchParams) => {
                      prev.set('parentId', String(crumb?.key || ''));
                      return prev;
                    });
                  }}
                  contentClassName="max-w-30"
                  maxItems={breadcrumbConfig.maxItems}
                  itemsBefore={breadcrumbConfig.itemsBefore}
                  itemsAfter={breadcrumbConfig.itemsAfter}
                  lastItemClickable={breadcrumbItems?.length === 1}
                />
              </div>
            ) : (
              <div className="text-xl font-bold">{t('menu.knowledgeBase')}</div>
            )}

            <div className="flex items-center gap-4">
              <EnhancedInput.Search
                placeholder={t('search.placeholder')}
                onChange={(e) => {
                  run(e?.target?.value || '');
                }}
                inputClassName="bg-card w-60"
              />

              <Popover
                placement="bottomRight"
                content={
                  <div className="py-2">
                    <div
                      className="flex items-center gap-3.5 cursor-pointer hover:bg-background px-4 py-2 transition-colors"
                      onClick={() => {
                        openCreateKnowledgeDialog({
                          formValues: {
                            parent_id: knowledgeBasesParentId,
                          },
                        }).then((result) => {
                          if (result) {
                            refresh();
                          }
                        });
                      }}
                    >
                      <EnhancedAvatar
                        icon={
                          <KnowledgeBaseIcon
                            type="default_knowledgeBase"
                            className="w-full h-full"
                          />
                        }
                        shape="square"
                        className="w-[42px] h-[42px] bg-transparent"
                      />

                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {t('create.general')}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t('create.general.desc')}
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3.5 cursor-pointer hover:bg-background px-4 py-2 transition-colors"
                      onClick={() => {
                        onEditClick({
                          actionType: 'create',
                          formValues: {
                            parent_id: knowledgeBasesParentId,
                          },
                        });
                      }}
                    >
                      <EnhancedAvatar
                        icon={
                          <KnowledgeBaseIcon
                            type="folder"
                            className="w-full h-full"
                          />
                        }
                        shape="square"
                        className="w-[42px] h-[42px] bg-transparent"
                      />

                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {t('create.folder')}
                        </div>
                      </div>
                    </div>
                  </div>
                }
                overlayClassName="min-w-[184px]"
                popoverContentClassName="p-0"
              >
                <EnhancedButton type="primary">
                  <CirclePlus />
                  {t('create.button')}
                </EnhancedButton>
              </Popover>
            </div>
          </div>
        </div>

        {/* 内容网格 */}
        <div className="flex-1 overflow-y-auto p-5 pt-0">
          {isLoading ? (
            <KnowledgeSkeleton />
          ) : Array.isArray(knowledgeList) && knowledgeList.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {knowledgeList.map((item) => {
                let description = item?.description;
                if (!description) {
                  switch (item?.type) {
                    case 2:
                      description = t('detail.info.folderDesc');
                      break;
                    default:
                      description = t('detail.info.desc');
                  }
                }
                return (
                  <Card
                    key={item?.id}
                    className="rounded-[18px] border hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
                    onClick={() => {
                      if (item.type === 2) {
                        if (item?.id === knowledgeBasesParentId) return;

                        setIsLoading(true);
                        setSearchParams((prev: URLSearchParams) => {
                          prev.set('parentId', String(item?.id ?? ''));
                          return prev;
                        });
                      } else {
                        navigate(
                          `knowledge-base/detail?knowledgeBaseId=${item?.id}`,
                        );
                      }
                    }}
                  >
                    <CardHeader className="p-6 pb-3.5 flex-row justify-between space-y-0">
                      <div className="flex flex-1 min-w-0">
                        <div className="w-[54px] h-[54px] shrink-0">
                          {item?.avatar ? (
                            <EnhancedAvatar
                              shape="square"
                              className="bg-transparent w-full h-full"
                              src={item?.avatar}
                            />
                          ) : (
                            renderIcon(item?.type)
                          )}
                        </div>

                        <div className="flex-1 ml-3.5 space-y-1 min-w-0">
                          <EnhancedTooltip
                            title={item?.name}
                            overlayClassName="max-w-[280px]"
                            placement="top"
                          >
                            <CardTitle className="text-base font-bold text-foreground truncate">
                              {item?.name || '-'}
                            </CardTitle>
                          </EnhancedTooltip>

                          <EnhancedTooltip
                            title={description}
                            overlayClassName="max-w-[280px]"
                            placement="bottom"
                          >
                            <CardDescription className="text-xs text-muted-foreground truncate">
                              {description}
                            </CardDescription>
                          </EnhancedTooltip>
                        </div>
                      </div>

                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'edit',
                              label: t('action.edit'),
                            },
                            {
                              key: 'move',
                              label: t('action.move'),
                            },
                            {
                              key: 'delete',
                              label: t('action.delete'),
                              danger: true,
                            },
                          ],
                          onClick({ key }) {
                            if (key === 'edit') {
                              if (item?.type === 2) {
                                onEditClick({
                                  actionType: 'edit',
                                  formValues: { ...item },
                                });
                              } else {
                                openEditKnowledgeDialog({
                                  formValues: { ...item },
                                }).then((result) => {
                                  if (result) {
                                    refresh();
                                  }
                                });
                              }
                              return;
                            }

                            if (key === 'move') {
                              onMoveClick(item);
                            }

                            if (key === 'delete') {
                              openModalError({
                                title: t('dialog.delete.title'),
                                content: t('dialog.delete.content'),
                                onOk() {
                                  onDeleteClick(item?.id).then((result) => {
                                    if (result) {
                                      refresh();
                                    }
                                  });
                                },
                              });
                            }
                          },
                        }}
                        placement="bottomRight"
                        overlayClassName="min-w-24"
                        cursorPointer
                      >
                        <EnhancedButton className="rounded-full w-8 h-[18px] flex items-center justify-center bg-muted hover:bg-muted-foreground/10">
                          <MoreHorizontal className="h-4 w-4" />
                        </EnhancedButton>
                      </Dropdown>
                    </CardHeader>

                    <CardContent className="px-6 py-3.5 flex items-center gap-1.5">
                      <EnhancedAvatar
                        size="26"
                        initialOnly
                        src={item?.user_icon}
                      >
                        {item?.created_by}
                      </EnhancedAvatar>

                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <div>{item.created_by}</div>
                        <div>{t('action.created')}</div>
                      </div>
                    </CardContent>

                    {/* 底部信息：左工作空间，右创建时间 */}
                    <CardFooter className="py-3.5 px-0 mx-6 text-xs text-muted-foreground border-t border-border">
                      <div className="flex w-full justify-between">
                        <div className="flex-1 truncate">
                          {item?.embedding_model_name}
                        </div>
                        <div className="flex-1 text-right">
                          {format(new Date(item?.created_date), 'yyyy-MM-dd')}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_OPEN}
              title={t('empty.title')}
              description={t('empty.desc')}
            />
          )}
        </div>
      </div>

      {/* 右侧详情面板 */}
      <HorizontalCollapse
        isOpen={pageFlag === 'folder'}
        className="bg-card border-l border-under-line"
        width={280}
      >
        <div className="h-full p-5 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            {knowledgeBasesInfo?.avatar ? (
              <EnhancedAvatar
                shape="square"
                className="w-5 h-5 shrink-0 bg-transparent"
                src={knowledgeBasesInfo?.avatar}
              />
            ) : (
              <KnowledgeBaseIcon
                type="folder"
                className="w-[18px] h-[18px] shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="text-sm font-medium text-foreground truncate">
                  {knowledgeBasesInfo?.name || '-'}
                </div>

                <SquarePen
                  className="w-3 h-3.w-3 text-primary cursor-pointer hover:text-primary/70 shrink-0"
                  onClick={() => {
                    onEditClick(
                      {
                        actionType: 'edit',
                        formValues: { ...knowledgeBasesInfo },
                      },
                      'KBRefresh',
                    );
                  }}
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground wrap-break-word">
            {knowledgeBasesInfo?.description || t('detail.info.noDesc')}
          </div>

          <div className="my-5 border-t border-border" />

          <div className="text-sm font-medium text-foreground mb-4">
            {t('folder.operation')}
          </div>

          <div className="space-y-4">
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:font-medium"
              onClick={() => {
                onMoveClick(knowledgeBasesInfo || {});
              }}
            >
              <Move className="w-3! h-3!" />
              <span>{t('action.move')}</span>
            </div>

            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-destructive hover:font-medium"
              onClick={() => {
                openModalError({
                  title: t('dialog.delete.title'),
                  content: t('dialog.delete.folder.content'),
                  onOk() {
                    onDeleteClick(knowledgeBasesParentId).then((result) => {
                      if (result) {
                        const pathInfo = knowledgeBasesPaths?.find?.(
                          (item) => item?.id === knowledgeBasesParentId,
                        );
                        const parentId = pathInfo?.parent_id;
                        if (parentId === knowledgeBasesParentId) return;

                        setSearchParams(
                          (prev: URLSearchParams) => {
                            prev.set('parentId', String(parentId || ''));
                            return prev;
                          },
                          { replace: true },
                        );
                      }
                    });
                  },
                });
              }}
            >
              <Trash2 className="w-3! h-3!" />
              <span>{t('folder.delete')}</span>
            </div>
          </div>
        </div>
      </HorizontalCollapse>
    </div>
  );
});
