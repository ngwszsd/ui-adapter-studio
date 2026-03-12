import React, { useEffect, useRef, useState } from 'react';
import { CirclePlus, MoreHorizontal } from 'lucide-react';
import { openAppTestCreateUserModal } from './components/CreateTestUserDialog.tsx';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader.tsx';
import { ProTable } from '@/components/ProTable.tsx';
import { cn, downloadFile } from '@/lib/utils';
import { QRCode as QrCodeComponent } from '@/components/QrCode';
import { EnhancedTooltip, openModalError, openTipsModal } from '@teamhelper/ui';
import { openChangePasswordModal } from './components/ResetPasswordDialog';
import RevealPassword from '@/components/common/RevealPassword';
import {
  Dropdown,
  message,
  EnhancedButton as Button,
  EnhancedInput as Input,
  Card,
  CardContent,
  Badge,
  type ColumnType,
  EnhancedAvatar as Avatar,
} from '@teamhelper/ui';
import {
  type AppTestUserListDto,
  getAppTestUserListApi,
  queryUserPwdApi,
  delUserApi,
  toggleUserStatusApi,
  createQrCodeApi,
} from '../server';
import { useDebounceEffect } from 'ahooks';
import { format } from 'date-fns';
import { useManageDetailContext } from '@/pages/ManageDetail/context/ManageDetailContext.tsx';

const AppTestUsers: React.FC = () => {
  const { pageParams } = useManageDetailContext();
  const { project_id } = pageParams as {
    project_id: number;
  };
  const qrRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const { t } = useTranslation('manageDetail');
  const [pagination, setPagination] = useState({
    current: 0,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AppTestUserListDto[]>([]);
  async function getUserList() {
    try {
      setLoading(true);
      const res = await getAppTestUserListApi({
        keyword: search.trim(),
        page: pagination.current, // API从0开始
        size: pagination.pageSize,
        project_id: project_id,
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
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: 0,
    }));
  }, [search]);
  // 当分组、搜索或分页变化时，重新获取用户列表
  useDebounceEffect(
    () => {
      getUserList();
    },
    [pagination.current, pagination.pageSize, search],
    { wait: 200 },
  );
  async function enableAccount(user_id: number) {
    try {
      await toggleUserStatusApi({ user_id, status: 1 });
      message.success(t('officialUsers.actions.enableSuccess'));
      getUserList();
    } catch (e) {}
  }
  const columns: ColumnType<AppTestUserListDto>[] = [
    {
      title: t('appTestUsers.table.columns.avatar'),
      key: 'avatar_url',
      width: 122,
      render: (_, record) => {
        if (record.avatar_url) {
          return (
            <img
              className="w-8 h-8 rounded-full"
              src={record.avatar_url}
              alt={record?.name}
            />
          );
        }
        return <Avatar initialOnly>{record?.name}</Avatar>;
      },
    },
    {
      title: t('appTestUsers.table.columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: 142,
      ellipsis: true,
    },
    {
      title: t('appTestUsers.table.columns.phone'),
      dataIndex: 'account',
      key: 'account',
      width: 144,
      render: (text) => {
        return (
          <EnhancedTooltip title={text}>
            <div className="truncate break-all">{text}</div>
          </EnhancedTooltip>
        );
      },
    },
    {
      title: t('appTestUsers.table.columns.password'),
      key: 'password',
      width: 166,
      render: (_, record) => {
        return (
          <RevealPassword
            onReveal={async () => {
              try {
                const res = await queryUserPwdApi({ id: record.user_id });
                return res.data || '';
              } catch (error) {
                console.error('查询密码失败:', error);
                return '********';
              }
            }}
          />
        );
      },
    },
    {
      title: t('appTestUsers.table.columns.createdAt'),
      dataIndex: 'added_at',
      key: 'added_at',
      width: 167,
      render: (date) => {
        return format(new Date(date), 'yyyy-MM-dd HH:mm');
      },
    },
    {
      title: t('appTestUsers.table.columns.status'),
      key: 'status',
      width: 90,
      render: (_, record) => {
        if (record?.account_status === null) return record?.account_status;
        return (
          <Badge
            className={cn(
              'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
              record?.account_status === 1
                ? 'bg-green-50 text-green-700'
                : 'bg-destructive/10 text-destructive',
            )}
            variant="outline"
          >
            <div className="text-xs">
              {record.account_status === 1
                ? t('officialUsers.status.enabled')
                : t('officialUsers.status.disabled')}
            </div>
          </Badge>
        );
      },
    },
    {
      title: t('appTestUsers.table.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 88,
      render: (_, record) => {
        const isEnabled = record.account_status === 1;
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
                  key: 'delete',
                  label: t('officialUsers.actions.delete'),
                  danger: true,
                },
              ],
              async onClick({ key, domEvent }) {
                domEvent.stopPropagation();
                switch (key) {
                  case 'resetPwd':
                    openChangePasswordModal({
                      user_id: record.user_id,
                      getUserList,
                    });
                    return;
                  case 'qr':
                    try {
                      const res = await createQrCodeApi({
                        user_id: record.user_id,
                      });
                      await openTipsModal(
                        <div
                          className="flex flex-col items-center gap-2"
                          ref={qrRef}
                        >
                          <div className=" rounded-[6px] border-2 border-border bg-card mx-auto">
                            {/*<QrCodeComponent logo={TestIcon} value={} />*/}
                            <img
                              src={res.data.qr_code_url}
                              alt=""
                              className="w-[200px] "
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('common.scan.code.login')}
                          </div>
                        </div>,
                        {
                          title: t('officialUsers.qrcode.title'),
                          okText: t('officialUsers.actions.download'),
                          onOkBeforeFunction: async () => {
                            // await snapdom.download(qrRef.current as any, {
                            //   scale: 5,
                            //   filename: `${record.name}-${t('common.login.qrcode')}.png`,
                            // });
                            downloadFile(
                              res.data.qr_code_url,
                              `${record.name}-${t('common.login.qrcode')}.png`,
                            );
                            return true;
                          },
                          classNames: {
                            content: 'min-w-auto max-w-full w-[474px]',
                          },
                        },
                      );
                    } catch (e) {}
                    return;
                  case 'edit':
                    openAppTestCreateUserModal({
                      userRow: record,
                      getUserList,
                      project_id: Number(project_id),
                    });
                    return;
                  case 'action':
                    if (record.account_status === 2) {
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
                        getUserList();
                        message.success(t('toast.delete.success'));
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

  return (
    <div className="h-full flex flex-col bg-background">
      <PageHeader
        title={t('appTestUsers.pageTitle')}
        subTitle={t('appTestUsers.pageSubTitle')}
        extra={
          <div className="flex items-center gap-3">
            <Input.Search
              placeholder={t('officialUsers.search.users.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-60"
            />

            <Button
              type="primary"
              onClick={() =>
                openAppTestCreateUserModal({
                  getUserList,
                  project_id: Number(project_id),
                })
              }
            >
              <CirclePlus className="h-6 w-6" />
              {t('appTestUsers.actions.createUser')}
            </Button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 px-[15px] pb-6">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col pt-6">
            <ProTable
              columns={columns}
              dataSource={users}
              loading={loading}
              rowKey="user_id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
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
    </div>
  );
};

export default AppTestUsers;
export { AppTestUsers };
