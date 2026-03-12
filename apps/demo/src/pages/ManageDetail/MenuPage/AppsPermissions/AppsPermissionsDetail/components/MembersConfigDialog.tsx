import React from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils.ts';
import {
  EnhancedButton as Button,
  Checkbox,
  EnhancedRadioGroup,
  EnhancedInput as Input,
  Modal,
  Tree,
  EnhancedAvatar as Avatar,
  List,
  type TreeNode,
  message,
  Spinner,
} from '@teamhelper/ui';
import {
  fetchGroupedUsersApi,
  type GroupedUsersDto,
} from '@/pages/ManageDetail/server';
import {
  userAvailableImportApi,
  type UserImportParams,
  userNotAvailableImportApi,
} from '../../server';

type Member = {
  user_id: number;
  user_name: string;
  account: string;
  group_id: number;
  group_name: string;
};

type MembersConfigDialogProps = {
  initialMode: 'available' | 'not_available';
  fetchUsersList: () => void;
  project_id: number;
  app_id: number;
};

// 构造树数据 - 使用 group_id-user_id 作为唯一key，避免同一用户在多个组中导致key重复
function buildTreeData(data: GroupedUsersDto[], keyword: string): TreeNode[] {
  const kw = keyword.trim().toLowerCase();
  return data
    .map((d) => {
      const children = d.users
        .filter((m) => {
          if (!kw) return true;
          return m.user_name.toLowerCase().includes(kw);
          // m.user_name.toLowerCase().includes(kw) ||
          // m.account?.toLowerCase().includes(kw)
        })
        .map((m) => ({
          key: `${d.group_id}-${m.user_id}`, // 使用组合key确保唯一性
          title: (
            <div className="flex items-center gap-2">
              <Avatar initialOnly className="w-7 h-7">
                {m?.user_name}
              </Avatar>

              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {m?.user_name}
                </div>
              </div>
            </div>
          ),
        }));
      return {
        key: `group-${d.group_id}`,
        title: (
          <div className="flex items-center gap-2">
            <Avatar initialOnly className="w-7 h-7">
              {d.group_name}
            </Avatar>

            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground truncate">
                {d.group_name}
              </div>
            </div>
          </div>
        ),
        children,
      } as TreeNode;
    })
    .filter((g) => g.children && g.children.length > 0);
}

const MembersConfigDialog: React.FC<MembersConfigDialogProps> = ({
  initialMode,
  fetchUsersList,
  project_id,
  app_id,
}) => {
  const modal = useModal();
  const { t } = useTranslation('manageDetail');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mode, setMode] = React.useState<'all' | 'partial'>('all');
  const [search, setSearch] = React.useState('');
  const [selectedKeys, setSelectedKeys] = React.useState<number[]>([]);

  const [groupedUsers, setGroupedUsers] = React.useState<GroupedUsersDto[]>([]);
  const [loading, setLoading] = React.useState(false);

  // 获取分组用户数据
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetchGroupedUsersApi({ project_id });
        if (res?.data) {
          setGroupedUsers(res.data);
        }
      } catch (error) {
        console.error('获取用户列表失败');
      } finally {
        setLoading(false);
      }
    };
    if (project_id) fetchData();
  }, [project_id]);

  const treeData = React.useMemo(
    () => buildTreeData(groupedUsers, search),
    [groupedUsers, search],
  );

  // 用户ID到成员信息的映射（注意：同一user_id可能在多个组，这里只保留最后一个）
  const allMembersMap = React.useMemo(() => {
    const map = new Map<number, Member>();
    groupedUsers.forEach((g) =>
      g.users.forEach((m) => {
        // 如果同一用户在多个组，这里会被覆盖，但不影响业务逻辑（选中的是用户本身）
        map.set(m.user_id, {
          user_id: m.user_id,
          user_name: m.user_name,
          account: m.account,
          group_id: g.group_id,
          group_name: g.group_name,
        });
      }),
    );
    return map;
  }, [groupedUsers]);

  // 部门 -> 成员ID列表映射，便于级联选择
  const groupMembersMap = React.useMemo(() => {
    const map = new Map<number, number[]>();
    groupedUsers.forEach((g) => {
      map.set(
        g.group_id,
        g.users.map((m) => m.user_id),
      );
    });
    return map;
  }, [groupedUsers]);

  // 新增：所有成员ID列表，便于“全选”
  const allMemberIds = React.useMemo(
    () =>
      Array.from(
        new Set(groupedUsers.flatMap((g) => g.users.map((m) => m.user_id))),
      ),
    [groupedUsers],
  );

  // 解析树节点是否是部门节点
  const parseGroupKey = React.useCallback((key: React.Key) => {
    const s = String(key);
    if (s.startsWith('group-')) {
      const groupIdStr = s.slice('group-'.length);
      return parseInt(groupIdStr, 10);
    }
    return null;
  }, []);

  // 解析用户节点key，提取user_id (格式: "groupId-userId")
  const parseUserKey = React.useCallback((key: React.Key) => {
    const s = String(key);
    if (!s.startsWith('group-')) {
      const parts = s.split('-');
      if (parts.length === 2) {
        return parseInt(parts[1], 10);
      }
    }
    return null;
  }, []);

  // 部门checkbox的选中状态
  const getGroupCheckedState = React.useCallback(
    (groupId: number): boolean => {
      const ids = groupMembersMap.get(groupId) ?? [];
      const selectedCount = ids.filter((id) =>
        selectedKeys.includes(id),
      ).length;
      return selectedCount === ids.length;
    },
    [groupMembersMap, selectedKeys],
  );

  // 顶部“全选”的半选态/全选态
  const getGlobalCheckedState = React.useMemo((): boolean => {
    const selectedCount = allMemberIds.filter((id) =>
      selectedKeys.includes(id),
    ).length;
    return selectedCount === allMemberIds.length;
  }, [allMemberIds, selectedKeys]);

  const selectedMembers: Member[] = React.useMemo(
    () =>
      selectedKeys.map((k) => allMembersMap.get(k)).filter(Boolean) as Member[],
    [selectedKeys, allMembersMap],
  );

  // 将 selectedKeys (user_id[]) 转换为树节点的 key 格式 (group_id-user_id)
  // 一个 user_id 可能对应多个树节点（同一用户在多个组）
  const treeSelectedKeys = React.useMemo(() => {
    const keys: React.Key[] = [];
    groupedUsers.forEach((group) => {
      group.users.forEach((user) => {
        if (selectedKeys.includes(user.user_id)) {
          keys.push(`${group.group_id}-${user.user_id}`);
        }
      });
    });
    return keys;
  }, [groupedUsers, selectedKeys]);

  const handleClear = () => setSelectedKeys([]);

  const handleRemoveMember = (id: number) =>
    setSelectedKeys((prev) => prev.filter((k) => k !== id));

  // 阻止树节点点击触发选择，只允许复选框控制选择
  const handleSelect = () => {
    // 不做任何操作，阻止节点点击改变选择状态
  };

  const handleOk = async () => {
    if (selectedMembers.length === 0 && mode === 'partial') {
      message.warning(t('officialUsers.addMembers.selectWarning'));
      return;
    }
    const params: UserImportParams = {
      principal_type: mode === 'all' ? 2 : 1,
      app_id,
      user_ids_list: selectedMembers.map((v) => v.user_id),
    };
    try {
      setIsSubmitting(true);
      initialMode === 'not_available'
        ? await userNotAvailableImportApi(params)
        : await userAvailableImportApi(params);
      message.success(t('appsPermissions.membersDialog.addSuccess'));
      fetchUsersList();
      modal.resolve(true);
      modal.hide();
      modal.remove();
    } catch (e) {
      console.error('error', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    modal.resolve(false);
    modal.hide();
    modal.remove();
  };

  return (
    <Modal
      open={modal.visible}
      title={
        initialMode === 'not_available'
          ? t('appsPermissionsDetail.disabledMembers')
          : t('appsPermissionsDetail.availableMembers')
      }
      onOkBeforeFunction={async () => {
        return !isSubmitting;
      }}
      onOk={handleOk}
      onCancel={handleCancel}
      classNames={{
        content: 'w-[768px] max-w-none',
        body: 'py-0 flex flex-col',
      }}
    >
      {/* 顶部单选：全部用户 / 部分用户 */}
      <div className="mb-4">
        <EnhancedRadioGroup
          value={mode}
          onChange={(v) => {
            const next = v as 'all' | 'partial';
            setMode(next);
            if (next === 'all') setSelectedKeys([]);
          }}
          options={[
            {
              label: t('appsPermissions.membersDialog.radio.allUsers'),
              value: 'all',
            },
            {
              label: t('appsPermissions.membersDialog.radio.partialUsers'),
              value: 'partial',
            },
          ]}
        />
      </div>

      {/* 主体两列 */}
      {mode === 'partial' ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-foreground font-normal w-1/2">
              {t('appsPermissionsDetail.membersDialog.left.addUser')}
            </div>

            <div className="flex items-center justify-between w-1/2">
              <div className="text-sm text-foreground font-normal">
                {t('appsPermissions.membersDialog.selectedMembers', {
                  count: selectedMembers?.length ?? 0,
                })}
              </div>

              <Button
                type="link"
                danger
                className="hover:text-destructive/70 px-0"
                onClick={handleClear}
              >
                {t('officialUsers.addMembers.clear')}
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-[4px] flex flex-1 min-h-[50vh] h-full">
            {/* 左 */}
            <div className="w-1/2 py-4 flex flex-col flex-1">
              <Input.Search
                placeholder={t(
                  'appsPermissionsDetail.membersDialog.search.placeholder',
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4"
              />
              {loading ? (
                <Spinner className="pt-40" />
              ) : (
                <div className="flex-1 min-h-0 flex flex-col">
                  <label className="flex items-center gap-2 cursor-pointer p-4">
                    <Checkbox
                      checked={getGlobalCheckedState}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedKeys(allMemberIds);
                        } else {
                          setSelectedKeys([]);
                        }
                      }}
                    />
                    <span className="text-sm text-foreground">
                      {t(
                        'appsPermissionsDetail.membersDialog.actions.selectAll',
                      )}
                    </span>
                  </label>

                  <Tree
                    treeData={treeData}
                    selectionMode="multiple"
                    selectedKeys={treeSelectedKeys}
                    onSelect={handleSelect}
                    selectable
                    autoExpandRoot
                    toggleIconClassName="text-foreground cursor-pointer"
                    className="pl-1 pr-2 flex-1"
                    estimatedItemSize={36}
                    renderNodeContent={(node, state) => {
                      const groupId = parseGroupKey(state.key);
                      const isGroup = groupId !== null;

                      const userId = parseUserKey(state.key);
                      const isChecked = isGroup
                        ? getGroupCheckedState(groupId!)
                        : userId !== null && selectedKeys.includes(userId);

                      return (
                        <div
                          className={cn(
                            'truncate font-medium',
                            'flex items-center gap-3',
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const groupId = parseGroupKey(state.key);
                              const userId = parseUserKey(state.key);
                              // 部门级联选择/取消
                              if (groupId !== null) {
                                const ids = groupMembersMap.get(groupId) ?? [];
                                if (checked) {
                                  setSelectedKeys((prev) => {
                                    const set = new Set(prev);
                                    ids.forEach((id) => set.add(id));
                                    return Array.from(set);
                                  });
                                } else {
                                  setSelectedKeys((prev) =>
                                    prev.filter((k) => !ids.includes(k)),
                                  );
                                }
                                return;
                              }
                              // 单个成员选择/取消
                              if (userId !== null) {
                                if (checked) {
                                  setSelectedKeys((prev) =>
                                    prev.includes(userId)
                                      ? prev
                                      : [...prev, userId],
                                  );
                                } else {
                                  setSelectedKeys((prev) =>
                                    prev.filter((k) => k !== userId),
                                  );
                                }
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>{node?.title}</div>
                        </div>
                      );
                    }}
                    showToggleIcon
                    toggleIconPosition="right"
                    getTreeItemClassName={() => {
                      return 'h-[36px] rounded-[6px]';
                    }}
                  />
                </div>
              )}
            </div>

            {/* 右 */}
            <div className="space-y-2 w-1/2 py-4 border-l border-border overflow-y-auto flex-1">
              {selectedMembers?.length === 0 ? (
                <div className="text-muted-foreground text-xs mx-4">
                  {t('officialUsers.addMembers.noneSelected')}
                </div>
              ) : (
                <List
                  dataSource={selectedMembers}
                  itemKey={(m) => m.user_id}
                  estimatedItemSize={52}
                  className="flex-1"
                  itemGap={8}
                  containerHeight={360}
                  renderItem={(m) => (
                    <div className="flex items-center justify-between rounded-[6px] p-3 h-[58px] bg-background mx-4">
                      <div className="flex items-center gap-2">
                        <Avatar initialOnly size="large">
                          {m?.user_name}
                        </Avatar>

                        <div className="space-y-1">
                          <div className="text-sm font-medium text-foreground">
                            {m?.user_name}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {m?.account}
                          </div>
                        </div>
                      </div>

                      <X
                        className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => handleRemoveMember(m.user_id)}
                      />
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

const MembersConfigModal = NiceModal.create(MembersConfigDialog);

export const openMembersConfigModal = (
  options?: MembersConfigDialogProps,
): Promise<boolean> => {
  return NiceModal.show(MembersConfigModal, {
    ...options,
  });
};

export default MembersConfigModal;
