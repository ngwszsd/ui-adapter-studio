import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  DirectoryTree,
  Dropdown,
  EnhancedButton,
  message,
  openModalError,
  type TreeNode,
  type TreeSelectInfo,
  Empty,
} from '@teamhelper/ui';
import { cn } from '@/lib/utils.ts';
import { openCreateCollectionModal } from './CreateCollectionDialog.tsx';
import { MoreHorizontal } from 'lucide-react';
import {
  type ApiGroupDto,
  type ApiGroupListDto,
  delApiGroup,
  delApi,
  addApi,
  getApiDetail,
} from '../server';
import { nanoid } from 'nanoid';

import i18n from '@/i18n';
import { useApiGroups, useFetchApiGroups } from '../store';
import { useTranslation } from 'react-i18next';
import {
  createNewRequest,
  type ApiRequest,
  useApi,
} from '../context/ApiContext';
import {
  bodyParamListToJson,
  METHOD_COLORS,
  METHOD_MAP_REVERSE,
  BODY_MODE_MAP_REVERSE,
} from '../utils';
export interface IApiDirectoryTreeProps {
  isShowMoreActions?: boolean;
  project_id: number;
  searchTerm?: string;
}

export type ApiNode = TreeNode &
  Partial<ApiGroupDto> &
  Partial<ApiGroupListDto> & { method?: 1 | 2 | 3 | 4 | 5; isLeaf?: boolean };

const methodColorClass = METHOD_COLORS;
// 1=GET, 2=POST, 3=PUT, 4=DELETE
const httpMethod = METHOD_MAP_REVERSE;
export const ApiDirectoryTree: React.FC<IApiDirectoryTreeProps> = ({
  isShowMoreActions = true,
  project_id,
  searchTerm = '',
}) => {
  const { t } = useTranslation('manageDetail');
  const apiGroups = useApiGroups();
  const fetchApiGroups = useFetchApiGroups();

  // 管理展开状态
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  // 使用 ref 保存搜索前的展开状态，避免依赖循环
  const preSearchExpandedKeysRef = useRef<React.Key[]>([]);
  // 标记初始化状态，防止手动全部折叠后引发自动展开
  const hasInitializedRef = useRef(false);
  // 标记是否正在搜索
  const [isSearching, setIsSearching] = useState(false);

  // 搜索过滤函数
  const filterApisBySearch = useCallback(
    (apis: ApiGroupListDto[], searchTerm: string): ApiGroupListDto[] => {
      if (!searchTerm.trim()) return apis;

      const lowerSearchTerm = searchTerm.toLowerCase();
      return apis.filter((api) => {
        const nameMatch = api.name?.toLowerCase().includes(lowerSearchTerm);
        const urlMatch = api.url_template
          ?.toLowerCase()
          .includes(lowerSearchTerm);
        return nameMatch || urlMatch;
      });
    },
    [],
  );

  // 检查分组是否应该显示（分组名匹配或包含匹配的API）
  const shouldShowGroup = useCallback(
    (group: ApiGroupDto, searchTerm: string): boolean => {
      if (!searchTerm.trim()) return true;

      const lowerSearchTerm = searchTerm.toLowerCase();
      // 分组名匹配
      const groupNameMatch = group.group_name
        ?.toLowerCase()
        .includes(lowerSearchTerm);

      // 或者包含匹配的API
      const hasMatchingApis =
        group.list &&
        group.list.length > 0 &&
        filterApisBySearch(group.list, searchTerm).length > 0;

      return groupNameMatch || hasMatchingApis;
    },
    [filterApisBySearch],
  );

  const apiTreeData: ApiNode[] = useMemo(() => {
    const groupMap = new Map<number, ApiNode>();
    const roots: ApiNode[] = [];

    // 1. Create nodes for all groups and map them
    apiGroups.forEach((group: ApiGroupDto) => {
      // 检查分组是否应该显示
      if (!shouldShowGroup(group, searchTerm)) {
        return;
      }

      // 使用稳定的 key，基于 group_id 而不是 nanoid
      const node: ApiNode = {
        ...group,
        parent_id: group.parent_id,
        title: group.group_name,
        key: `group-${group.group_id}`,
        children: [],
      };

      // Add APIs as childrenApiNode (过滤后的)
      if (group.list && group.list.length > 0) {
        const filteredApis = filterApisBySearch(group.list, searchTerm);
        node.children = filteredApis.map((api: ApiGroupListDto) => ({
          ...api,
          // 使用稳定的 key，基于 api id 而不是 nanoid
          key: `api-${api.id}`,
          title: api.name,
          method: api.method,
          // Add parent_id from the parent group's group_id
          parent_id: group.group_id,
          isLeaf: true,
        }));
      }

      groupMap.set(group.group_id, node);
    });

    // 2. Build tree structure based on parent_id
    apiGroups.forEach((group: ApiGroupDto) => {
      const node = groupMap.get(group.group_id);
      if (!node) return;

      if (
        group.parent_id &&
        group.parent_id !== 0 &&
        groupMap.has(group.parent_id)
      ) {
        const parent = groupMap.get(group.parent_id);
        parent?.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [apiGroups, searchTerm, filterApisBySearch, shouldShowGroup]);

  // 当数据首次加载时，自动展开根节点
  // 切换项目时重置初始化状态
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [project_id]);

  const { state, dispatch, activeRequest } = useApi();

  // 构建 group_id -> parent_id 的映射，加速查找
  const groupParentMap = useMemo(() => {
    return new Map(apiGroups.map((g) => [g.group_id, g.parent_id]));
  }, [apiGroups]);

  // 当数据首次加载时，自动展开根节点
  useEffect(() => {
    if (
      apiTreeData.length > 0 &&
      expandedKeys.length === 0 &&
      !hasInitializedRef.current
    ) {
      const rootKeys = apiTreeData
        .map((node) => node.key)
        .filter(Boolean) as React.Key[];
      setExpandedKeys(rootKeys);
      hasInitializedRef.current = true;
    }
  }, [apiTreeData, expandedKeys.length]);

  // 处理搜索状态变化
  useEffect(() => {
    const hasSearchTerm = searchTerm.trim().length > 0;

    if (hasSearchTerm && !isSearching) {
      // 开始搜索：保存当前展开状态并展开所有节点
      preSearchExpandedKeysRef.current = expandedKeys;
      setIsSearching(true);

      // 展开所有匹配的节点
      const allGroupKeys: React.Key[] = [];
      const collectGroupKeys = (nodes: ApiNode[]) => {
        nodes.forEach((node) => {
          if (node.key && !node.key.toString().startsWith('api-')) {
            allGroupKeys.push(node.key);
          }
          if (node.children && node.children.length > 0) {
            collectGroupKeys(node.children);
          }
        });
      };

      collectGroupKeys(apiTreeData);
      setExpandedKeys(allGroupKeys);
    } else if (!hasSearchTerm && isSearching) {
      // 结束搜索：恢复之前的展开状态
      setIsSearching(false);
      setExpandedKeys(preSearchExpandedKeysRef.current);
    }
  }, [searchTerm, isSearching]); // 只依赖 searchTerm 和 isSearching

  // 单独处理搜索时的展开逻辑
  useEffect(() => {
    if (isSearching && apiTreeData.length > 0) {
      const allGroupKeys: React.Key[] = [];
      const collectGroupKeys = (nodes: ApiNode[]) => {
        nodes.forEach((node) => {
          if (node.key && !node.key.toString().startsWith('api-')) {
            allGroupKeys.push(node.key);
          }
          if (node.children && node.children.length > 0) {
            collectGroupKeys(node.children);
          }
        });
      };

      collectGroupKeys(apiTreeData);
      setExpandedKeys(allGroupKeys);
    }
  }, [apiTreeData, isSearching]);

  // 监听活跃请求变化，同步树的选中状态
  // 监听活跃请求变化，同步树的选中状态
  useEffect(() => {
    if (activeRequest?.status === 'existing') {
      const targetKey = `api-${activeRequest.id}`;
      if (!selectedKeys.includes(targetKey)) {
        setSelectedKeys([targetKey]);
      }

      // 自动展开父节点
      if (activeRequest.groupId) {
        setExpandedKeys((prev) => {
          const next = new Set(prev);
          let changed = false;
          let currId: number | undefined = activeRequest.groupId;

          // 向上回溯直到根节点 (parent_id 为 0 或 undefined)
          while (currId && currId !== 0) {
            const key = `group-${currId}`;
            if (!next.has(key)) {
              next.add(key);
              changed = true;
            }
            // 获取父节点 ID
            currId = groupParentMap.get(currId);
            // 防止数据异常导致的死循环 (虽然 Map 查找不太可能)
            if (!groupParentMap.has(currId as number) && currId !== 0) break;
          }
          return changed ? Array.from(next) : prev;
        });
      }
    } else if (!activeRequest) {
      setSelectedKeys([]);
    }
  }, [
    activeRequest?.id,
    activeRequest?.groupId,
    activeRequest?.status,
    groupParentMap,
  ]);

  useEffect(() => {
    fetchApiGroups(project_id);
  }, [project_id, fetchApiGroups]);
  const renderApiRow = useCallback(
    (
      node: ApiNode,
      renderState: {
        key: React.Key;
        level: number;
        expanded: boolean;
        isLeaf: boolean;
      },
    ) => {
      const api = node as ApiNode;
      const methodEl = api.method ? (
        <span
          className={`text-xs font-medium ${methodColorClass[httpMethod[api.method]]}`}
        >
          {httpMethod[api.method]}
        </span>
      ) : null;

      return (
        <div className="flex justify-between items-center w-full min-w-0">
          <div className="flex items-center gap-1 min-w-0 flex-1 mr-2">
            {methodEl}
            <span
              className={cn(
                'truncate font-medium text-foreground block',
                !renderState?.level ? 'text-sm' : 'text-xs',
              )}
            >
              {node.title}
            </span>
          </div>

          {isShowMoreActions ? (
            <Dropdown
              menu={{
                items: [
                  { key: 'request', label: t('apiService.tree.newRequest') },
                  { key: 'folder', label: t('apiService.tree.newFolder') },
                  { key: 'edit', label: t('apiService.tree.edit') },
                  { key: 'copy', label: t('apiService.tree.copy') },
                  {
                    key: 'delete',
                    label: t('apiService.tree.delete'),
                    danger: true,
                  },
                ].filter((item) => {
                  if (!renderState?.isLeaf) {
                    return !['copy'].includes(item?.key);
                  } else {
                    return !['request', 'folder'].includes(item?.key);
                  }
                }),
                async onClick({ key }) {
                  switch (key) {
                    case 'request':
                      const bool1 = await openCreateCollectionModal({
                        openType: 'request',
                        project_id,
                        node,
                      });
                      if (bool1.success) fetchApiGroups(project_id);
                      return;
                    case 'folder':
                      const bool2 = await openCreateCollectionModal({
                        openType: 'folder',
                        project_id,
                        node,
                      });
                      if (bool2.success) fetchApiGroups(project_id);
                      return;
                    case 'edit':
                      const res = await openCreateCollectionModal({
                        openType: renderState.isLeaf
                          ? 'editRequest'
                          : 'editFolder',
                        project_id,
                        node,
                      });
                      if (res && res.success) {
                        fetchApiGroups(project_id);
                        if (renderState.isLeaf) {
                          dispatch({
                            type: 'UPDATE_REQUEST',
                            payload: {
                              id: Number(node.id),
                              updates: {
                                name: res.name || '',
                              },
                            },
                          });
                        }
                      }
                      return;
                    case 'copy':
                      try {
                        const detailRes = await getApiDetail({
                          api_id: Number(node.id),
                        });
                        if (detailRes.data) {
                          const detail = detailRes.data;
                          const res = await addApi({
                            project_id,
                            name: `${detail.name}-${t('apiService.tree.copySuffix')}`,
                            group_id: Number(node?.parent_id),
                            method: detail.method,
                            url_template: detail.url_template,
                            body_mode: detail.body_mode,
                            header_list: detail.header_list || [],
                            param_list: detail.param_list || [],
                            body_param_list: detail.body_param_list || [],
                          });
                          const bool = !!res.data;
                          if (bool) fetchApiGroups(project_id);
                          message.success(
                            t('apiService.createCollection.saved'),
                          );
                        }
                      } catch (e) {
                        console.error(e);
                      }
                      return;
                    case 'delete':
                      await openModalError({
                        title: t('apiService.tree.deleteRequest'),
                        content: t('apiService.tree.deleteConfirm'),
                        async onOkBeforeFunction() {
                          const statusData = renderState.isLeaf
                            ? await delApi({
                                api_id: Number(node.id),
                              })
                            : await delApiGroup({
                                group_id: Number(node.group_id),
                              });
                          if (statusData.data) {
                            if (renderState.isLeaf) {
                              dispatch({
                                type: 'REMOVE_REQUEST',
                                payload: Number(node.id),
                              });
                            } else {
                              const getAllDescendantGroupIds = (
                                gid: number,
                              ): number[] => {
                                let gids = [gid];
                                apiGroups.forEach((g) => {
                                  if (g.parent_id === gid) {
                                    gids = [
                                      ...gids,
                                      ...getAllDescendantGroupIds(g.group_id),
                                    ];
                                  }
                                });
                                return gids;
                              };
                              const affectedGroupIds = getAllDescendantGroupIds(
                                Number(node.group_id),
                              );
                              const requestIdsToRemove = state.requests
                                .filter(
                                  (req) =>
                                    req.groupId &&
                                    affectedGroupIds.includes(req.groupId),
                                )
                                .map((req) => req.id);
                              if (requestIdsToRemove.length > 0) {
                                dispatch({
                                  type: 'REMOVE_MULTIPLE_REQUESTS',
                                  payload: requestIdsToRemove,
                                });
                              }
                            }
                            fetchApiGroups(project_id);
                            message.success(t('apiService.tree.deleteSuccess'));
                          }
                          return !!statusData.data;
                        },
                      });
                      return;
                  }
                },
              }}
              placement="bottomRight"
              overlayClassName="min-w-20"
            >
              <EnhancedButton
                className={cn(
                  'border-0 shadow-none text-foreground bg-transparent shrink-0',
                  'rounded-full w-8 h-[18px] hover:bg-muted-foreground/10',
                  'p-0!',
                )}
              >
                <MoreHorizontal />
              </EnhancedButton>
            </Dropdown>
          ) : null}
        </div>
      );
    },
    [project_id, fetchApiGroups, apiGroups, state, t],
  );
  // 处理展开/收起事件
  const handleExpandedKeysChange = useCallback((keys: React.Key[]) => {
    setExpandedKeys(keys);
  }, []);

  // 处理选择事件
  const handleSelect = useCallback(
    (keys: React.Key[], info: TreeSelectInfo) => {
      setSelectedKeys(keys);
      const node = info.node as ApiNode;
      // 如果是叶子节点且有 method，说明是 API
      if (node.isLeaf && node.method) {
        const requestId = node.id!;
        const existingRequest = state.requests.find(
          (req) => req.id === requestId,
        );

        if (existingRequest) {
          dispatch({
            type: 'SET_ACTIVE_REQUEST',
            payload: requestId,
          });
        } else {
          // 获取 API 详情并联动右侧
          getApiDetail({ api_id: requestId })
            .then((res) => {
              if (res.data) {
                const detail = res.data;
                const bodyTypeMap = BODY_MODE_MAP_REVERSE;

                const newRequest: ApiRequest = {
                  ...createNewRequest(),
                  id: Number(detail.id),
                  groupId: node.parent_id,
                  status: 'existing',
                  name: detail.name,
                  method: httpMethod[
                    detail.method as keyof typeof httpMethod
                  ] as ApiRequest['method'],
                  url: detail.url_template || '',
                  headers:
                    detail.header_list?.map((h) => ({
                      id: nanoid(),
                      key: h.code,
                      value: h.value,
                      enable: h.enable ?? true,
                    })) || [],
                  params:
                    detail.param_list?.map((p) => ({
                      id: nanoid(),
                      key: p.code,
                      value: p.value,
                      enable: p.enable ?? true,
                    })) || [],
                  body: {
                    ...createNewRequest().body,
                    type: bodyTypeMap[detail.body_mode] || 'none',
                    content:
                      detail.body_mode === 2
                        ? bodyParamListToJson(detail.body_param_list || [])
                        : '',
                    formData:
                      detail.body_mode !== 2
                        ? detail.body_param_list?.map((b) => ({
                            key: b.code,
                            value: b.value,
                            type: b.type || 'text',
                            enable: b.enable ?? true,
                          })) || []
                        : [],
                  },
                };
                dispatch({
                  type: 'ADD_REQUEST',
                  payload: newRequest,
                });
              }
            })
            .catch((err) => {
              console.error('获取 API 详情失败:', err);
              message.error(t('apiService.tree.fetchFailed'));
            });
        }
      }
    },
    [state.requests, dispatch],
  );

  // 同步 activeRequest 到树的选中状态
  useEffect(() => {
    if (state.activeRequestId) {
      // 检查 activeRequestId 是否对应树中的某个节点
      // 树节点 key 格式为 `api-${id}`
      const targetKey = `api-${state.activeRequestId}`;

      // 这里简单地设置选中 key。
      // 如果 activeRequestId 对应的是新创建的未保存请求（id 为大整数时间戳），在这里找不到对应的树节点，
      // Tree 组件会自动忽略不存在的 key，或者我们可以先检查一下。
      // 由于 apiTreeData 是递归结构，检查比较麻烦，直接设置 key 通常是安全的。
      setSelectedKeys([targetKey]);
    } else {
      setSelectedKeys([]);
    }
  }, [state.activeRequestId]);

  if (apiTreeData.length === 0) {
    return <Empty description={t('common.nodata')} />;
  }
  return (
    <DirectoryTree
      treeData={apiTreeData}
      selectionMode="single"
      expandAction="click"
      toggleIconPosition="left"
      showToggleIcon={true}
      renderNodeContent={renderApiRow}
      fileIcon={false}
      className="flex flex-col flex-1 min-h-0"
      containerHeight="100%"
      expandedKeys={expandedKeys}
      selectedKeys={selectedKeys}
      onExpandedKeysChange={handleExpandedKeysChange}
      onSelect={handleSelect}
    />
  );
};
