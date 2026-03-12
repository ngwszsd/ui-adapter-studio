import React, { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, CirclePlus } from 'lucide-react';
import { openCreateGroupModal } from './components/CreateGroupDialog';
import { openModalError } from '@teamhelper/ui';
import { cn } from '@/lib/utils';
import { Card, CardContent, Dropdown, List } from '@teamhelper/ui';
import { EnhancedButton as Button } from '@teamhelper/ui';
import { delUserGroupApi, getUserGroupListApi } from './server';
import { UserManagementTable } from './components/UserManagementTable';
import type { UserGroupListDto } from './server';
import { useParams } from 'react-router';
import { Resizable } from 're-resizable';
import { UserGroupSkeleton } from '@/pages/ManageDetail/MenuPage/OfficialUsers/Skeleton';

const OfficialUsers: React.FC = memo(() => {
  const { t } = useTranslation('manageDetail');
  const { project_id } = useParams<{ project_id: string }>();
  // 分组相关状态
  const [activeGroup, setActiveGroup] = useState<{
    group_id: number;
    group_name: string;
  }>({
    group_id: -1, // -1 表示全部成员
    group_name: t('officialUsers.groups.allMembers'),
  });
  const [groups, setGroups] = useState<UserGroupListDto[]>([]);
  const [totalMemberCount, setTotalMemberCount] = useState(0);

  const [loading, setLoading] = useState(false);
  // 获取分组列表
  async function getGroupList() {
    try {
      setLoading(true);
      const res = await getUserGroupListApi({
        project_id: Number(project_id),
      });
      if (res?.data) {
        setGroups(res.data.groups);

        // 计算总成员数
        const total = res.data.total_count;
        setTotalMemberCount(total);
      }
    } catch (error) {
      console.error('获取分组列表失败:', error);
    } finally {
      setLoading(false);
    }
  }

  // 初始化数据
  useEffect(() => {
    getGroupList();
  }, []);

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex h-full">
        {/* 左侧分组区 - 可调整大小 */}
        <Resizable
          defaultSize={{
            width: 326,
            height: '100%',
          }}
          minWidth={260}
          maxWidth={500}
          enable={{
            top: false,
            right: true,
            bottom: false,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
          handleStyles={{
            right: {
              width: '10px',
              right: '-5px',
            },
          }}
          handleClasses={{
            right:
              'relative z-50 cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:-translate-x-1/2 after:w-[1px] after:h-full after:bg-primary after:opacity-0 hover:after:opacity-100 active:after:opacity-100 after:transition-opacity',
          }}
          className="flex flex-col border-r border-border h-full shrink-0"
        >
          <div className="p-5 flex flex-col h-full bg-card">
            <div className="flex items-center justify-between pb-5">
              <div className="font-medium text-lg">
                {t('officialUsers.title')}
              </div>

              <div
                className="flex items-center gap-2 text-primary font-normal text-sm cursor-pointer"
                onClick={async () => {
                  await openCreateGroupModal({
                    project_id: Number(project_id),
                    getGroupList,
                  });
                }}
              >
                <CirclePlus className="h-4 w-4 text-primary" />
                {t('officialUsers.actions.createGroup')}
              </div>
            </div>

            <div className="flex flex-col min-h-0">
              {/* 全部成员 */}
              <div
                className={cn(
                  `flex items-center justify-between rounded-sm px-[14px] py-3 cursor-pointer min-h-[45px]`,
                  activeGroup?.group_id === -1
                    ? 'bg-muted font-medium'
                    : 'hover:bg-muted/50',
                )}
                onClick={() =>
                  setActiveGroup({
                    group_id: -1,
                    group_name: t('officialUsers.groups.allMembers'),
                  })
                }
              >
                <div className="text-sm">
                  {t('officialUsers.groups.allMembers')}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground">
                    {totalMemberCount}
                  </div>
                </div>
              </div>

              {/* 分组列表 */}
              {loading ? (
                <UserGroupSkeleton />
              ) : (
                <List
                  dataSource={groups}
                  className="flex-1"
                  renderItem={(item) => {
                    const active = item.group_id === activeGroup.group_id;
                    return (
                      <div
                        className={`flex items-center justify-between rounded-sm px-[14px] py-3 cursor-pointer min-h-[45px] ${
                          active ? 'bg-muted font-medium' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setActiveGroup(item)}
                      >
                        <div className="text-sm">{item.group_name}</div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-muted-foreground">
                            {item.member_count}
                          </div>

                          {item?.group_id !== 0 ? (
                            <Dropdown
                              menu={{
                                items: [
                                  {
                                    key: 'rename',
                                    label: t('officialUsers.groups.rename'),
                                  },
                                  {
                                    key: 'delete',
                                    label: t('officialUsers.groups.delete'),
                                    danger: true,
                                  },
                                ],
                                onClick({ key, domEvent }) {
                                  domEvent.stopPropagation();

                                  switch (key) {
                                    case 'rename':
                                      openCreateGroupModal({
                                        group_id: item.group_id,
                                        group_name: item.group_name,
                                        project_id: Number(project_id),
                                        getGroupList,
                                      });
                                      return;
                                    case 'delete':
                                      openModalError({
                                        title: t(
                                          'officialUsers.confirm.deleteGroup.title',
                                        ),
                                        content: t(
                                          'officialUsers.confirm.deleteGroup.content',
                                        ),
                                        onOkBeforeFunction: async () => {
                                          const statusData =
                                            await delUserGroupApi({
                                              group_id: item.group_id,
                                            });
                                          getGroupList();
                                          return !!statusData.data;
                                        },
                                      });
                                      return;
                                  }
                                },
                              }}
                              placement="bottomRight"
                              cursorPointer
                            >
                              <Button type="text" size="small">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </Dropdown>
                          ) : null}
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </div>
          </div>
        </Resizable>

        {/* 右侧表格区 */}
        <UserManagementTable
          activeGroupId={activeGroup.group_id}
          groups={groups}
          project_id={Number(project_id)}
          getGroupList={getGroupList}
        />
      </div>
    </div>
  );
});

export default OfficialUsers;
export { OfficialUsers };
