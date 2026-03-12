import React, { useEffect } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Modal,
  EnhancedButton as Button,
  EnhancedInput as Input,
  EnhancedAvatar as Avatar,
  type TreeNode,
  Tree,
  Checkbox,
  List,
  message,
} from '@teamhelper/ui';
import { addGroupUserApi, getUserListByGroupApi } from '../server';
import {
  fetchGroupedUsersApi,
  type GroupedUsersDto,
} from '@/pages/ManageDetail/server';

type Member = {
  user_id: number;
  user_name: string;
  group_id: number;
  group_name: string;
};

type AddGroupMembersDialogProps = {
  groupId: number | null;
  getUserList?: () => void;
  project_id: number;
};

// 构造树数据 - 使用 group_id-user_id 作为唯一key，避免同一用户在多个组中导致key重复
function buildTreeData(data: GroupedUsersDto[], keyword: string): TreeNode[] {
  if (!data || data.length === 0) {
    return [];
  }

  const kw = keyword.trim().toLowerCase();

  return (
    data
      .map((d) => {
        // 确保 users 数组存在
        const users = d.users || [];

        const children = users
          .filter((m) => {
            // 如果没有搜索关键词，显示所有用户
            // 如果有搜索关键词，搜索用户名或账号
            if (!kw) return true;
            return (
              m.user_name.toLowerCase().includes(kw) ||
              m.account?.toLowerCase().includes(kw)
            );
          })
          .map((m) => ({
            key: `${d.group_id}-${m.user_id}`, // 使用组合key确保唯一性
            title: (
              <div className="flex items-center gap-2">
                <Avatar initialOnly size="large">
                  {m.user_name}
                </Avatar>

                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-foreground truncate">
                    {m.user_name}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {m.account}
                  </div>
                </div>
              </div>
            ),
          }));

        return {
          key: `group-${d.group_id}`,
          title: d.group_name,
          children,
        } as TreeNode;
      })
      // 如果没有搜索关键词，显示所有组（包括空组）
      // 如果有搜索关键词，只显示有匹配用户的组
      .filter((g) => !kw || (g.children && g.children.length > 0))
  );
}

const AddGroupMembersDialog: React.FC<AddGroupMembersDialogProps> = ({
  groupId,
  getUserList,
  project_id,
}) => {
  const modal = useModal();
  const { t } = useTranslation('manageDetail');

  const [search, setSearch] = React.useState('');
  const [selectedKeys, setSelectedKeys] = React.useState<React.Key[]>([]);
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
        console.error('获取用户列表失败', error);
      } finally {
        setLoading(false);
      }
    };

    if (project_id) {
      fetchData();
    }
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

  // 部门checkbox的半选态/全选态
  const getGroupCheckedState = React.useCallback(
    (groupId: number): boolean => {
      const ids = groupMembersMap.get(groupId) ?? [];
      const selectedCount = ids.filter((id) =>
        selectedKeys.includes(id),
      ).length;
      if (selectedCount === 0) return false;
      return selectedCount === ids.length;
    },
    [groupMembersMap, selectedKeys],
  );

  const selectedMembers: Member[] = React.useMemo(
    () =>
      selectedKeys
        .map((k) => allMembersMap.get(Number(k)))
        .filter(Boolean) as Member[],
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
    setSelectedKeys((prev) => prev.filter((k) => Number(k) !== id));

  // 阻止树节点点击触发选择，只允许复选框控制选择
  const handleSelect = () => {
    // 不做任何操作，阻止节点点击改变选择状态
  };

  const handleOk = async () => {
    if (selectedMembers.length === 0) {
      message.warning(t('officialUsers.addMembers.selectWarning'));
      return;
    }
    try {
      setLoading(true);
      await addGroupUserApi({
        group_id: groupId,
        user_ids: selectedMembers.map((m) => m.user_id),
        project_id,
      });
      message.success(t('officialUsers.addMembers.addSuccess'));
      modal.resolve(true);
      modal.hide();
      modal.remove();
    } catch (error) {
      console.error('添加成员失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    modal.hide();
    modal.resolve(false);
    modal.remove();
  };

  // 获取全部人员
  const getCurrentGroupAllUser = async () => {
    try {
      setLoading(true);
      const res = await getUserListByGroupApi({
        group_id: groupId,
        keyword: search.trim(),
        page: 0, // API从0开始
        size: 9999,
        project_id,
      });
      if (res.data.content.length) {
        const initIds = res.data.content.map((i) => i.user_id);
        setSelectedKeys(initIds);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getCurrentGroupAllUser();
  }, []);

  return (
    <Modal
      open={modal.visible}
      title={t('officialUsers.addMembers.title')}
      onOkBeforeFunction={async () => {
        return !loading;
      }}
      onOk={handleOk}
      onCancel={handleCancel}
      classNames={{
        content: 'w-[768px] max-w-none',
        body: 'p-0 flex overflow-hidden',
      }}
    >
      {/* 左 */}
      <div className="w-1/2 py-0.5 px-5">
        <Input.Search
          placeholder={t('officialUsers.addMembers.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div>
          <div className="text-foreground font-medium text-sm mt-2.5 mb-1.5">
            {t('officialUsers.addMembers.allMembers')}
          </div>

          <Tree
            treeData={treeData}
            selectionMode="multiple"
            selectedKeys={treeSelectedKeys}
            onSelect={handleSelect}
            containerHeight={320}
            indent={0}
            selectable
            autoExpandRoot
            toggleIconClassName="text-foreground cursor-pointer"
            className="rounded-none border-0"
            estimatedItemSize={58}
            renderNodeContent={(node, state) => {
              if (!state?.isLeaf) {
                const groupId = parseGroupKey(state.key);
                const memberCount =
                  groupId !== null
                    ? (groupMembersMap.get(groupId)?.length ?? 0)
                    : 0;
                return (
                  <div className={cn('truncate font-medium')}>
                    {node?.title} ({memberCount})
                  </div>
                );
              }

              return (
                <span
                  className={cn(
                    'truncate',
                    state?.isLeaf ? 'font-normal' : 'font-medium',
                  )}
                >
                  {node?.title}
                </span>
              );
            }}
            renderRightExtra={(_, state) => {
              const groupId = parseGroupKey(state.key);
              const isGroup = groupId !== null;
              const userId = parseUserKey(state.key);
              const checkedValue = isGroup
                ? getGroupCheckedState(groupId!)
                : userId !== null && selectedKeys.includes(userId);
              if (!state?.isLeaf) return null;

              return (
                <Checkbox
                  checked={checkedValue as any}
                  onCheckedChange={(checked) => {
                    const groupId = parseGroupKey(state.key);
                    const userId = parseUserKey(state.key);
                    // 部门级联选择/取消
                    if (groupId !== null) {
                      const ids = groupMembersMap.get(groupId) ?? [];
                      if (checked) {
                        setSelectedKeys((prev) => {
                          const set = new Set(prev.map(Number));
                          ids.forEach((id) => set.add(id));
                          return Array.from(set);
                        });
                      } else {
                        setSelectedKeys((prev) =>
                          prev.filter((k) => !ids.includes(Number(k))),
                        );
                      }
                      return;
                    }
                    // 单个成员选择/取消
                    if (userId !== null) {
                      if (checked) {
                        setSelectedKeys((prev) =>
                          prev.includes(userId) ? prev : [...prev, userId],
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
              );
            }}
            showToggleIcon
            toggleIconPosition="right"
            getTreeItemClassName={(flat) => {
              if (!flat?.isLeaf) {
                return 'px-3 py-0 bg-background rounded-[6px] h-[45px] hover:bg-background mt-2';
              }

              return 'border-b border-border py-0 h-[58px] rounded-[6px]';
            }}
          />
        </div>
      </div>

      {/* 右 */}
      <div className="w-1/2 px-5 border-l border-border flex flex-col">
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground font-normal">
            {t('officialUsers.addMembers.selectedMembers', {
              count: selectedMembers?.length ?? 0,
            })}
          </div>

          <Button
            type="link"
            danger
            className="hover:no-underline hover:text-destructive/70 px-0"
            onClick={handleClear}
          >
            {t('officialUsers.addMembers.clear')}
          </Button>
        </div>

        {/* 替换为增强版 List */}
        <div className="space-y-2 overflow-y-auto flex-1">
          {selectedMembers?.length === 0 ? (
            <div className="text-muted-foreground text-xs">
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
                <div className="flex items-center justify-between rounded-[6px] p-3 h-[58px] bg-background">
                  <div className="flex items-center gap-2">
                    <Avatar initialOnly size="large">
                      {m.user_name}
                    </Avatar>

                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">
                        {m.user_name}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {m.group_name}
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
    </Modal>
  );
};

const AddGroupMemberModal = NiceModal.create(AddGroupMembersDialog);

export const openAddGroupMemberModal = (
  options?: AddGroupMembersDialogProps,
): Promise<boolean> => {
  return NiceModal.show(AddGroupMemberModal, {
    ...options,
  });
};

export default AddGroupMemberModal;
