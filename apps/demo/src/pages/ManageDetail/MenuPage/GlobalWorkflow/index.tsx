import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { ImportJsonModal } from './importJson.tsx';
import { CircleAlert, Search } from 'lucide-react';
import { message, openModalWarning, openTipsModal } from '@teamhelper/ui';
import { OpenAddWorkFlow } from '@/pages/ManageDetail/MenuPage/GlobalWorkflow/addWorkFlow.tsx';
import { useTranslation } from 'react-i18next';
import { toast } from '@teamhelper/ui';
import {
  Button,
  EnhancedInput as Input,
  EnhancedSelect,
  EnhancedTable as Table,
  type ColumnType,
  List,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EnhancedPagination as Pagination,
  Badge,
  EnhancedButton,
  EnhancedAvatar,
} from '@teamhelper/ui';
import { cn } from '@/lib/utils.ts';
import GlobalWorkflowSkeleton from './Skeleton';
import { useNavigate, useParams } from 'react-router';
import { useManageDetailContext } from '@/pages/ManageDetail/context/ManageDetailContext.tsx';
import { useAuthStore } from '@/store';
import {
  deleteWorkflowsWorkspaceApi,
  exportWorkflowApi,
  getWorkflowsWorkspaceCopyApi,
  getWorkflowsWorkspaceEditStatusApi,
  getWorkflowsWorkspaceListApi,
  getWorkflowsWorkspaceReferencesApi,
  type IWorkflowsWorkspaceEditStatusVo,
  type IWorkflowsWorkspaceListParams,
  type IWorkflowsWorkspaceReferencesVo,
  type IWorkflowsWorkspaceVo,
} from './server';

type WorkflowStatus = IWorkflowsWorkspaceVo['status'];
type Workflow = IWorkflowsWorkspaceVo & {
  id: string;
  creator?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
};

const normalizeEditableState = (
  value: unknown,
): IWorkflowsWorkspaceVo['editable'] => {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  if (text === 'editing' || text.includes('编辑中')) {
    return 'editing';
  }
  return 'editable';
};

const normalizeReferences = (
  raw: unknown,
): IWorkflowsWorkspaceReferencesVo[] => {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const data = raw as any;
  if (Array.isArray(data.content)) {
    return data.content;
  }
  if (Array.isArray(data.data)) {
    return data.data;
  }
  if (data.id) {
    return [data as IWorkflowsWorkspaceReferencesVo];
  }
  return [];
};

const normalizeWorkflow = (
  raw: IWorkflowsWorkspaceVo,
  index: number,
): Workflow => {
  const row = raw as IWorkflowsWorkspaceVo & {
    creator?: string;
    createdAt?: string;
    updatedAt?: string;
    version?: string;
  };

  const normalizedId = String(row.id || '').trim() || `workflow-${index}`;
  const normalizedCreatedBy =
    row.createdBy == null ? '' : String(row.createdBy).trim();
  const normalizedCreatedAt =
    String(row.createdAt || '').trim() || String(row.createdDate || '').trim();
  const normalizedUpdatedAt =
    String(row.updatedAt || '').trim() ||
    String(row.lastModifiedDate || '').trim();
  const normalizedVersion =
    String(row.version || '').trim() || String(row.dslVersion || '').trim();
  const normalizedIconUrl = String(row.iconUrl || '').trim();
  const normalizedEditable = normalizeEditableState(
    (row as { editable?: unknown }).editable,
  );

  return {
    ...row,
    id: normalizedId,
    creator: String(row.creator || '').trim() || normalizedCreatedBy,
    createdAt: normalizedCreatedAt,
    updatedAt: normalizedUpdatedAt,
    version: normalizedVersion,
    iconUrl: normalizedIconUrl || undefined,
    editable: normalizedEditable,
  };
};

export const GlobalWorkflow: React.FC = memo(() => {
  const { t } = useTranslation('manageDetail');
  const { project_id } = useParams<{ project_id: string }>();
  const { project } = useManageDetailContext();
  const { userInfo } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [total, setTotal] = useState<number>(0);

  const STATUS_OPTIONS: { label: string; value: string }[] = [
    {
      label: t('globalWorkflow.filters.status.all'),
      value: '',
    },
    {
      label: '未发布',
      value: 'draft',
    },
    {
      label: t('globalWorkflow.filters.status.published'),
      value: 'published',
    },
  ];
  const [status, setStatus] =
    React.useState<(typeof STATUS_OPTIONS)[number]['value']>('');
  const [person, setPerson] = React.useState<string>('all');
  const [query, setQuery] = React.useState<string>('');
  const [current, setCurrent] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [debouncedQuery, setDebouncedQuery] = React.useState<string>('');
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [exportingIds, setExportingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setCurrent(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const projectMembers = useMemo(
    () => (Array.isArray(project?.designers) ? project.designers : []),
    [project?.designers],
  );

  const projectMemberMap = useMemo(() => {
    const map = new Map<number, { name: string; avatar: string }>();
    projectMembers.forEach((member) => {
      const userId = Number(member?.user_id);
      if (!Number.isFinite(userId) || userId <= 0) return;
      map.set(userId, {
        name: String(member?.name || '').trim(),
        avatar: String(member?.avatar || '').trim(),
      });
    });
    return map;
  }, [projectMembers]);

  const personOptions = useMemo(() => {
    const options = projectMembers
      .map((member) => {
        const userId = Number(member?.user_id);
        if (!Number.isFinite(userId) || userId <= 0) return null;
        const name = String(member?.name || '').trim();
        return {
          value: String(userId),
          label: name || String(userId),
        };
      })
      .filter(
        (
          option,
        ): option is {
          value: string;
          label: string;
        } => option !== null,
      );

    if (
      person !== 'all' &&
      !options.some((option) => option.value === person)
    ) {
      options.push({ value: person, label: person });
    }

    return [
      {
        value: 'all',
        label: t('globalWorkflow.filters.person.all'),
      },
      ...options,
    ];
  }, [person, projectMembers, t]);

  const loadWorkflowList = useCallback(async () => {
    const projectId = Number(project_id);
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setWorkflows([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userId = Number(person);
      const result = await getWorkflowsWorkspaceListApi({
        projectId,
        pageNo: Math.max(0, current - 1),
        pageSize,
        status,
        userIds:
          person !== 'all' && Number.isFinite(userId) && userId > 0
            ? [userId]
            : undefined,
        keyword: debouncedQuery || undefined,
      } as IWorkflowsWorkspaceListParams);
      const list = Array.isArray(result?.content) ? result.content : [];
      setWorkflows(list.map((item, index) => normalizeWorkflow(item, index)));
      setTotal(
        Number((result as { totalElements?: number })?.totalElements) || 0,
      );
    } catch (error) {
      setWorkflows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [project_id, current, pageSize, status, person, debouncedQuery]);

  useEffect(() => {
    void loadWorkflowList();
  }, [loadWorkflowList]);

  const openJsonDialog = async () => {
    const bool = await ImportJsonModal();
    console.log(bool);
  };

  const openWorkflowEditor = (workflowId?: string) => {
    const query = workflowId
      ? `?workflowId=${encodeURIComponent(workflowId)}`
      : '';
    navigate(`global-workflow/edit${query}`);
  };

  const isEditingLockedByOther = useCallback(
    (status: IWorkflowsWorkspaceEditStatusVo) => {
      if (!status?.editing) return false;

      const editingById = Number(status.editingBy);
      const currentUserId = Number(userInfo?.user_id);
      if (
        Number.isFinite(editingById) &&
        editingById > 0 &&
        Number.isFinite(currentUserId) &&
        currentUserId > 0
      ) {
        return editingById !== currentUserId;
      }

      const editingByName = String(status.editingByName || '').trim();
      const currentUserName = String(userInfo?.name || '').trim();
      if (editingByName && currentUserName) {
        return editingByName !== currentUserName;
      }

      return true;
    },
    [userInfo?.name, userInfo?.user_id],
  );

  const handleEditClick = async (workflowId: string) => {
    try {
      const status = await getWorkflowsWorkspaceEditStatusApi(workflowId);
      if (isEditingLockedByOther(status)) {
        await openModalWarning({
          title: t('app.status.editing.des'),
          description: (
            <div>
              {t('app.user')}
              <span className="text-foreground font-medium mx-1">
                {status.editingByName || status.editingBy || '未知用户'}
              </span>
              {t('app.status.editing.tips')}
            </div>
          ),
          options: {
            footerBtnPosition: 'block',
            cancelText: null,
            okText: '我知道了',
            maskClosable: false,
          },
        });
        return;
      }
      openWorkflowEditor(workflowId);
    } catch (error) {
      console.error(error);
      openWorkflowEditor(workflowId);
    }
  };

  const handleOpenFlow = async () => {
    const numericProjectId = Number(project_id);
    const created = await OpenAddWorkFlow({
      projectId:
        Number.isFinite(numericProjectId) && numericProjectId > 0
          ? numericProjectId
          : undefined,
    });
    if (!created) return;
    toast.success(t('toast.create.success'));
    openWorkflowEditor(String(created.id));
  };

  const openReferenceList = async (row: Workflow) => {
    const referencesRaw = await getWorkflowsWorkspaceReferencesApi(
      row.id || null,
    );
    const references = normalizeReferences(referencesRaw);

    const AppList = () => {
      return (
        <List
          dataSource={references}
          estimatedItemSize={72}
          containerHeight={420}
          renderItem={(item) => {
            const ownerId = Number(item.createdBy || item.lastModifiedBy);
            const owner = Number.isFinite(ownerId)
              ? projectMemberMap.get(ownerId)
              : undefined;
            const ownerName = owner?.name || '-';

            return (
              <div className="flex items-center gap-3 py-4 border-b border-border">
                <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                  {item.iconUrl ? (
                    <img
                      src={item.iconUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-primary font-medium text-lg">
                      {String(item.name || '').slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-sm font-medium text-foreground">
                    {item.name || '-'}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span>v{item.dslVersion || '1.0.0'}</span>
                    <span>
                      {t('globalWorkflow.appList.owner', '负责人')}：{ownerName}
                    </span>
                  </div>
                </div>
              </div>
            );
          }}
        />
      );
    };

    await openTipsModal(<AppList />, {
      title: t('globalWorkflow.reference.list.title'),
      okText: t('globalWorkflow.reference.list.close'),
      cancelText: null,
      className: 'w-[488px]',
      onOkBeforeFunction: async () => true,
    });
  };

  const setCopying = useCallback((workflowId: string, busy: boolean) => {
    setCopyingIds((prev) => {
      const next = new Set(prev);
      if (busy) {
        next.add(workflowId);
      } else {
        next.delete(workflowId);
      }
      return next;
    });
  }, []);

  const setDeleting = useCallback((workflowId: string, busy: boolean) => {
    setDeletingIds((prev) => {
      const next = new Set(prev);
      if (busy) {
        next.add(workflowId);
      } else {
        next.delete(workflowId);
      }
      return next;
    });
  }, []);

  const setExporting = useCallback((workflowId: string, busy: boolean) => {
    setExportingIds((prev) => {
      const next = new Set(prev);
      if (busy) {
        next.add(workflowId);
      } else {
        next.delete(workflowId);
      }
      return next;
    });
  }, []);

  const isWorkflowLocked = useCallback((workflow: Workflow) => {
    return workflow.status === 'editing' || workflow.editable === 'editing';
  }, []);

  const handleCopyWorkflow = useCallback(
    async (workflow: Workflow) => {
      const workflowId = String(workflow?.id || '');
      if (!workflowId) return;
      if (copyingIds.has(workflowId) || deletingIds.has(workflowId)) return;

      setCopying(workflowId, true);
      try {
        const result = await getWorkflowsWorkspaceCopyApi(workflowId);
        if (result?.id) {
          await loadWorkflowList();
          return;
        }
        message.error(t('globalWorkflow.actions.copyFail', '复制失败'));
      } catch (error) {
        message.error(t('globalWorkflow.actions.copyFail', '复制失败'));
      } finally {
        setCopying(workflowId, false);
      }
    },
    [copyingIds, deletingIds, loadWorkflowList, setCopying, t],
  );

  const handleExportWorkflow = useCallback(
    async (workflow: Workflow) => {
      const workflowId = String(workflow?.id || '');
      if (!workflowId) return;
      if (
        copyingIds.has(workflowId) ||
        deletingIds.has(workflowId) ||
        exportingIds.has(workflowId)
      ) {
        return;
      }

      setExporting(workflowId, true);
      try {
        const exported = await exportWorkflowApi(workflowId);
        if (!exported) {
          message.error(t('globalWorkflow.actions.exportFail', '导出失败'));
        }
      } catch (error) {
        message.error(t('globalWorkflow.actions.exportFail', '导出失败'));
      } finally {
        setExporting(workflowId, false);
      }
    },
    [copyingIds, deletingIds, exportingIds, setExporting, t],
  );

  const handleDeleteWorkflow = useCallback(
    async (workflow: Workflow) => {
      const workflowId = String(workflow?.id || '');
      if (!workflowId) return;
      if (
        copyingIds.has(workflowId) ||
        deletingIds.has(workflowId) ||
        exportingIds.has(workflowId)
      ) {
        return;
      }
      if (workflow.referenced) {
        message.warning(
          t(
            'globalWorkflow.actions.deleteReferencedDenied',
            '该工作流已被引用，无法删除',
          ),
        );
        return;
      }
      if (isWorkflowLocked(workflow)) {
        message.warning(
          t(
            'globalWorkflow.actions.deleteEditingDenied',
            '该工作流正在编辑中，无法删除',
          ),
        );
        return;
      }

      const shouldFallbackPrevPage = workflows.length <= 1 && current > 1;
      await openTipsModal(
        <div className="gap-2 flex">
          <CircleAlert className="w-6 h-6 text-[rgba(255,125,0,1)]" />
          <div className="text-base text-muted-foreground flex-1">
            {t('globalWorkflow.actions.deleteFlowDes')}
          </div>
        </div>,
        {
          title: t('globalWorkflow.actions.deleteFlow'),
          okText: t('globalWorkflow.actions.confirmDelete'),
          onOkBeforeFunction: async () => {
            setDeleting(workflowId, true);
            try {
              const deleted = await deleteWorkflowsWorkspaceApi(workflowId);
              if (!deleted) {
                message.error(
                  t('globalWorkflow.actions.deleteFail', '删除失败'),
                );
              }
              return deleted;
            } finally {
              setDeleting(workflowId, false);
            }
          },
          type: 'danger',
        },
      ).then(async (result) => {
        if (result) {
          if (shouldFallbackPrevPage) {
            setCurrent((prev) => Math.max(1, prev - 1));
            return;
          }
          await loadWorkflowList();
        }
      });
    },
    [
      copyingIds,
      current,
      deletingIds,
      exportingIds,
      isWorkflowLocked,
      loadWorkflowList,
      setDeleting,
      t,
      workflows.length,
    ],
  );

  const columns: ColumnType<Workflow>[] = [
    {
      title: t('globalWorkflow.table.columns.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      width: 160,
      render: (value: string) => (
        <span className="font-medium text-foreground">{value}</span>
      ),
    },
    {
      title: t('globalWorkflow.table.columns.creator'),
      key: 'creator',
      width: 200,
      render: (_, record) => {
        const creatorId = Number(record.createdBy);
        const creator = Number.isFinite(creatorId)
          ? projectMemberMap.get(creatorId)
          : undefined;
        const creatorName =
          creator?.name ||
          String(record.creator || '').trim() ||
          (record.createdBy == null ? '-' : String(record.createdBy));

        return (
          <div className="flex items-center gap-2">
            <EnhancedAvatar src={creator?.avatar} initialOnly>
              {creatorName}
            </EnhancedAvatar>
            <span>{creatorName}</span>
          </div>
        );
      },
    },
    {
      title: t('globalWorkflow.table.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: t('globalWorkflow.table.columns.updatedAt'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
    },
    {
      title: t('globalWorkflow.table.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: WorkflowStatus) => {
        if (s === 'draft') {
          return <div className="text-xs font-medium text-primary">未发布</div>;
        }
        return (
          <div className="text-xs font-medium text-green-500">
            {t('globalWorkflow.filters.status.published')}
          </div>
        );
      },
    },
    {
      title: t('globalWorkflow.table.columns.referenced'),
      key: 'referenced',
      width: 200,
      render: (_, r) => {
        if (r.referenced) {
          return (
            <div className="flex items-center">
              <Badge
                className={cn(
                  'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
                  'bg-primary/10 text-primary',
                )}
                variant="outline"
              >
                <div className="text-xs">已引用</div>
              </Badge>

              <EnhancedButton
                type="link"
                onClick={() => {
                  void openReferenceList(r);
                }}
                size="small"
                className="text-xs"
              >
                查看引用列表
              </EnhancedButton>
            </div>
          );
        }

        return (
          <Badge
            className={cn(
              'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
              'bg-background text-muted-foreground',
            )}
            variant="outline"
          >
            <div className="text-xs">
              {t('globalWorkflow.table.noReferenced', '未引用')}
            </div>
          </Badge>
        );
      },
    },
    {
      title: t('globalWorkflow.table.columns.version'),
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (v) => (v ? `v${v}` : '-'),
    },
    {
      title: t('globalWorkflow.table.columns.editable'),
      dataIndex: 'editable',
      key: 'editable',
      width: 160,
      render: (val: Workflow['editable']) => {
        const isEditing = val === 'editing';
        if (!isEditing) {
          return (
            <Badge
              className={cn(
                'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
                'bg-green-50 text-green-500',
              )}
              variant="outline"
            >
              <div className="text-xs">可编辑</div>
            </Badge>
          );
        }

        return (
          <Badge
            className={cn(
              'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
              'bg-destructive/10 text-destructive',
            )}
            variant="outline"
          >
            <div className="text-xs">编辑中</div>
          </Badge>
        );
      },
    },
    {
      title: t('globalWorkflow.table.columns.actions'),
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, record) => {
        const isCopying = copyingIds.has(record.id);
        const isDeleting = deletingIds.has(record.id);
        const isExporting = exportingIds.has(record.id);
        const rowBusy = isCopying || isDeleting || isExporting;
        const deleteDisabled =
          rowBusy || record.referenced || isWorkflowLocked(record);

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="link"
              size="sm"
              className="px-0"
              disabled={rowBusy}
              onClick={() => {
                void handleEditClick(record.id);
              }}
            >
              {t('globalWorkflow.actions.edit')}
            </Button>
            <Button
              variant="link"
              size="sm"
              className="px-0"
              disabled={rowBusy}
              onClick={() => {
                void handleCopyWorkflow(record);
              }}
            >
              {isCopying
                ? t('globalWorkflow.actions.copying', '复制中...')
                : t('globalWorkflow.actions.copy')}
            </Button>
            <Button
              variant="link"
              size="sm"
              className="px-0"
              disabled={rowBusy}
              onClick={() => {
                void handleExportWorkflow(record);
              }}
            >
              {isExporting
                ? t('globalWorkflow.actions.exporting', '导出中...')
                : t('globalWorkflow.actions.export', '导出')}
            </Button>
            <Button
              variant="link"
              size="sm"
              className="px-0 text-destructive hover:text-destructive"
              disabled={deleteDisabled}
              onClick={() => {
                void handleDeleteWorkflow(record);
              }}
            >
              {isDeleting
                ? t('globalWorkflow.actions.deleting', '删除中...')
                : t('globalWorkflow.actions.delete')}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 顶部查询操作栏：固定 */}
      <div className="shrink-0 p-5 px-5">
        <div className="flex items-center justify-between gap-4">
          {/* 左侧筛选与搜索 */}
          <div className="flex items-center gap-3 flex-1">
            {/* 状态筛选 */}
            <EnhancedSelect
              value={status}
              options={STATUS_OPTIONS}
              onChange={(v) => {
                setStatus((v as string) || '');
                setCurrent(1);
              }}
              placeholder={t('globalWorkflow.filters.status.placeholder')}
              className="w-[140px]"
              inputClassName="bg-card"
              searchable={false}
              allowClear={false}
              showCheck={false}
              listHeight="auto"
            />

            {/* 人员筛选 */}
            <EnhancedSelect
              value={person}
              options={personOptions}
              onChange={(value) => {
                setPerson((value as string) || 'all');
                setCurrent(1);
              }}
              placeholder={t('globalWorkflow.filters.person.placeholder')}
              className="w-[140px]"
              inputClassName="bg-card"
              searchable={false}
              allowClear={false}
              showCheck={false}
              listHeight="auto"
            />

            {/* 搜索框 */}
            <div className="relative flex-1 max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索工作流..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={openJsonDialog}>
              {t('appManagement.importJson')}
            </Button>
            <Button onClick={handleOpenFlow}>{t('workflow.new')}</Button>
          </div>
        </div>
      </div>

      {/* 内容区域：表格 + 分页，仅内容滚动 */}
      <div className="flex-1 min-h-0 px-[20px] pb-6">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>{t('globalWorkflow.list.title')}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 flex flex-col">
            {loading ? (
              <GlobalWorkflowSkeleton />
            ) : (
              <>
                <Table
                  className="flex-1 h-full"
                  columns={columns}
                  dataSource={workflows}
                  rowKey="id"
                />
                <div className="mt-4 flex justify-between items-center">
                  <Pagination
                    current={current}
                    pageSize={pageSize}
                    total={total}
                    onChange={(page, size) => {
                      setCurrent(page);
                      setPageSize(size);
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
