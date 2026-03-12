import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  QrCode,
  UploadCloud,
  MoreHorizontal,
  CirclePlus,
  Users,
} from 'lucide-react';
import { snapdom } from '@zumer/snapdom';
import { openAddToGroupModal } from './AddToGroupDialog';
import { openImportUsersModal } from './ImportUsersDialog';
import { openCreateOfficialUserModal } from './CreateOfficialUserDialog';
import { openChangePasswordModal } from './ChangePasswordDialog';
import { EnhancedTooltip, openModalError, openTipsModal } from '@teamhelper/ui';
import { openAddGroupMemberModal } from './AddGroupMembersDialog';
import { ProTable } from '@/components/ProTable';
import { cn, downloadFile } from '@/lib/utils';
import GroupBadgesCell from './GroupBadgesCell';
import RevealPassword from '@/components/common/RevealPassword';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  Dropdown,
  message,
  type ColumnType,
} from '@teamhelper/ui';
import {
  EnhancedButton as Button,
  EnhancedInput as Input,
  EnhancedAvatar as Avatar,
} from '@teamhelper/ui';
import {
  getUserListByGroupApi,
  type UserGroupListDto,
  delUserApi,
  toggleUserStatusApi,
  queryUserPwdApi,
  createQrcodeApi,
  batchDownLoadQrcodeApi,
  moveoutUserGroupApi,
} from '../server';
import type { UseListDto } from '../server';
import { useDebounceEffect } from 'ahooks';
import { format } from 'date-fns';

interface UserManagementTableProps {
  activeGroupId: number | null;
  groups: UserGroupListDto[];
  project_id: number;
  getGroupList: () => Promise<void>;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({
  activeGroupId,
  groups,
  project_id,
  getGroupList,
}) => {
  const { t } = useTranslation('manageDetail');
  const qrRef = useRef<HTMLDivElement>(null);
  // 组件内部状态
  const [users, setUsers] = useState<UseListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    current: 0,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [rows, setRows] = useState<UseListDto[]>([]);

  // 获取用户列表
  async function getUserList() {
    try {
      setLoading(true);
      const res = await getUserListByGroupApi({
        group_id: activeGroupId === -1 ? undefined : activeGroupId,
        keyword: search.trim(),
        page: pagination.current, // API从0开始
        size: pagination.pageSize,
        project_id,
      });

      if (res?.data) {
        setUsers(res.data.content);
        setPagination((prev) => ({
          ...prev,
          total: res.data.total_elements,
        }));
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  }
  // 当分组切换时，重置分页到第一页
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: 0,
    }));
    setSelectedRowKeys([]);
  }, [activeGroupId, search]);

  // 当分组、搜索或分页变化时，重新获取用户列表
  useDebounceEffect(
    () => {
      getUserList();
    },
    [pagination.current, pagination.pageSize, search, activeGroupId],
    { wait: 200 },
  );

  async function enableAccount(user_id: number) {
    try {
      await toggleUserStatusApi({ user_id, status: 1 });
      message.success(t('officialUsers.actions.enableSuccess'));
      getUserList();
    } catch (e) {}
  }
  const columns: ColumnType<UseListDto>[] = [
    {
      title: t('officialUsers.table.columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: t('officialUsers.table.columns.account'),
      dataIndex: 'account',
      key: 'account',
      width: 124,
      render: (text) => {
        return (
          <EnhancedTooltip title={text}>
            <div className="truncate break-all">{text}</div>
          </EnhancedTooltip>
        );
      },
    },
    {
      title: t('officialUsers.table.columns.group'),
      dataIndex: 'group_name',
      key: 'group_name',
      width: 200,
      render: (_, record, index) => {
        const rowGroups = record.groups;
        if (!rowGroups) return null;

        let colorInfo = '';
        if (record?.status === 2) {
          colorInfo = 'bg-background text-muted-foreground';
        } else {
          colorInfo =
            index % 2 === 0
              ? 'bg-green-50 text-green-700'
              : 'bg-primary/10 text-primary';
        }

        const groupNames = rowGroups.map((v) => v.group_name) || [];
        if (!Array.isArray(groupNames) || !groupNames.length) return null;

        return (
          <GroupBadgesCell groups={groupNames} badgeClasssName={colorInfo} />
        );
      },
    },
    {
      title: t('officialUsers.table.columns.password'),
      key: 'password',
      width: 122,
      render: (_, record) => {
        return (
          <RevealPassword
            onReveal={async () => {
              try {
                const res = await queryUserPwdApi({ id: record.user_id });
                return res.data || '';
              } catch (error) {
                console.error('查询密码失败:', error);
                return '';
              }
            }}
          />
        );
      },
    },
    {
      title: t('officialUsers.table.columns.status'),
      key: 'status',
      width: 90,
      render: (_, record) => {
        return (
          <Badge
            className={cn(
              'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
              record?.status === 1
                ? 'bg-green-50 text-green-700'
                : 'bg-destructive/10 text-destructive',
            )}
            variant="outline"
          >
            <div className="text-xs">
              {record.status === 1
                ? t('officialUsers.status.enabled')
                : t('officialUsers.status.disabled')}
            </div>
          </Badge>
        );
      },
    },
    {
      title: t('officialUsers.table.columns.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 167,
      render: (date) => {
        return format(new Date(date), 'yyyy-MM-dd HH:mm');
      },
    },
    {
      title: t('officialUsers.table.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 72,
      render: (_, record) => {
        const isEnabled = record.status === 1;
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'resetPwd',
                  label: t('officialUsers.actions.resetPassword'),
                },
                {
                  key: 'qr',
                  label: t('officialUsers.actions.loginQrcode'),
                },
                {
                  key: 'edit',
                  label: t('officialUsers.actions.edit'),
                },
                {
                  key: 'action',
                  label: isEnabled
                    ? t('officialUsers.actions.disable')
                    : t('officialUsers.actions.enable'),
                },
                {
                  key: 'move',
                  label: t('officialUsers.actions.move'),
                  disabled: activeGroupId == -1 || activeGroupId === 0,
                },
                {
                  key: 'delete',
                  label: t('officialUsers.actions.delete'),
                  danger: true,
                },
              ],
              async onClick({ key, domEvent }) {
                domEvent.stopPropagation();
                switch (key) {
                  case 'move':
                    openModalError({
                      title: t('officialUsers.actions.move.title'),
                      content: t('officialUsers.actions.move.tips'),
                      async onOkBeforeFunction() {
                        const statusData = await moveoutUserGroupApi({
                          user_ids: [record.user_id],
                          group_id: activeGroupId as number,
                          project_id: Number(project_id),
                        });
                        getGroupList();
                        getUserList();
                        message.success(
                          t('officialUsers.actions.move.success'),
                        );
                        return !!statusData.data;
                      },
                    });
                    return;
                  case 'resetPwd':
                    openChangePasswordModal({
                      user_id: record.user_id,
                      getUserList,
                    });
                    return;
                  case 'qr':
                    try {
                      const res = await createQrcodeApi({
                        user_id: record.user_id,
                      });
                      await openTipsModal(
                        <div
                          className="flex flex-col items-center gap-2"
                          ref={qrRef}
                        >
                          <div className=" rounded-[6px] border-2 border-border bg-card mx-auto">
                            <img src={res.data} alt="" className="w-[200px] " />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.name}(
                            {`${record.groups.map((v) => v.group_name).join('，')}` ||
                              t('officialUsers.groups.ungrouped')}
                            )
                          </div>
                        </div>,
                        {
                          title: t('officialUsers.qrcode.title'),
                          okText: t('officialUsers.actions.download'),
                          onOkBeforeFunction: async () => {
                            await snapdom.download(qrRef.current as any, {
                              scale: 5,
                              filename: `${record.name}-qrcode.png`,
                            });
                            return true;
                          },
                          classNames: {
                            content: 'min-w-auto max-w-full w-[474px]',
                          },
                        },
                      );
                    } catch (e) {
                      console.error(e);
                    }
                    return;
                  case 'edit':
                    openCreateOfficialUserModal({
                      groups,
                      userRow: record,
                      getUserList,
                      project_id: Number(project_id),
                      getGroupList,
                    });
                    return;
                  case 'action':
                    if (record.status === 2) {
                      enableAccount(record.user_id);
                    } else {
                      openModalError({
                        title: t('officialUsers.confirm.disable.title'),
                        content: t('officialUsers.confirm.disable.content'),
                        async onOkBeforeFunction() {
                          const statusData = await toggleUserStatusApi({
                            user_id: record.user_id,
                            status: 2,
                          });
                          getUserList();
                          message.success(
                            t('officialUsers.actions.disableSuccess'),
                          );
                          return !!statusData.data;
                        },
                      });
                    }
                    break;
                  case 'delete':
                    openModalError({
                      title: t('officialUsers.confirm.deleteUser.title'),
                      content: (
                        <div>
                          <div className="text-destructive">
                            {t('officialUsers.confirm.deleteUser.warning')}
                          </div>

                          <div className="h-[64px] rounded-[8px] bg-background flex items-center -ml-9 mt-[18px] px-3 gap-3">
                            <Avatar initialOnly size={40}>
                              {record.name}
                            </Avatar>

                            <div className="text-sm font-medium text-muted-foreground">
                              {record.name}
                            </div>
                          </div>
                        </div>
                      ),
                      async onOkBeforeFunction() {
                        const statusData = await delUserApi({
                          user_id: record.user_id,
                        });
                        getGroupList();
                        getUserList();
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
            <Button className="rounded-full w-8 h-[18px] flex items-center justify-center bg-muted hover:bg-muted-foreground/10">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  async function downloadLoginQrcode() {
    if (!Array.isArray(selectedRowKeys) || !selectedRowKeys.length) {
      return message.warning(t('officialUsers.toast.selectUsersFirst'));
    }
    try {
      const res = await batchDownLoadQrcodeApi({
        user_ids: selectedRowKeys as number[],
      });
      downloadFile(res.data, 'qrcodes.zip');
      setSelectedRowKeys([]);
    } catch (e) {
      console.log(e);
    }
  }
  return (
    <div className="flex-1 min-h-0 min-w-0">
      <Card className="h-full flex flex-col p-5">
        <CardHeader className="flex-row items-center gap-2.5 justify-between p-0 pb-5 flex-wrap space-y-0">
          <Input.Search
            placeholder={t('officialUsers.search.users.placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[228px]"
            inputClassName="shadow-none"
          />

          <div className="flex items-center flex-wrap space-x-4 gap-y-1">
            <Button onClick={downloadLoginQrcode}>
              <QrCode className="h-5 w-5 mr-1" />
              {t('officialUsers.actions.downloadLoginQrcode')}
            </Button>

            <Button
              onClick={async () => {
                if (
                  !Array.isArray(selectedRowKeys) ||
                  !selectedRowKeys.length
                ) {
                  return message.warning(
                    t('officialUsers.toast.selectUsersFirst'),
                  );
                }
                const bool = await openAddToGroupModal({
                  groups,
                  users: rows,
                  project_id,
                });
                if (bool) {
                  await getGroupList();
                  await getUserList();
                  setSelectedRowKeys([]);
                }
              }}
            >
              <Users className="h-4 w-4" />
              {t('officialUsers.actions.addToGroup')}
            </Button>

            {![-1, 0].includes(activeGroupId as number) ? (
              <Button
                type="primary"
                onClick={async () => {
                  const bool = await openAddGroupMemberModal({
                    groupId: activeGroupId,
                    getUserList,
                    project_id,
                  });
                  if (bool) {
                    await getGroupList();
                    await getUserList();
                    setSelectedRowKeys([]);
                  }
                }}
              >
                <Users className="h-4 w-4" />
                {t('officialUsers.actions.addGroupMembers')}
              </Button>
            ) : null}

            <Button
              type="primary"
              onClick={() =>
                openImportUsersModal({
                  activeGroupId: activeGroupId as number,
                  project_id: Number(project_id),
                  getUserList,
                  getGroupList,
                })
              }
            >
              <UploadCloud className="h-4 w-4" />
              {t('officialUsers.actions.importUsers')}
            </Button>

            <Button
              type="primary"
              onClick={() => {
                openCreateOfficialUserModal({
                  groups,
                  getUserList,
                  project_id: Number(project_id),
                  getGroupList,
                });
              }}
            >
              <CirclePlus className="h-4 w-4" />
              {t('officialUsers.actions.createUser')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 flex flex-col p-0">
          <ProTable
            loading={loading}
            columns={columns}
            dataSource={users}
            rowKey="user_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
            }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (rowKeys, selectedRows) => {
                setSelectedRowKeys(rowKeys);
                setRows(selectedRows);
              },
            }}
            onChange={(paginationConfig) => {
              if (paginationConfig) {
                setPagination({
                  current: paginationConfig.current,
                  pageSize: paginationConfig.pageSize,
                  total: pagination.total,
                });
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
