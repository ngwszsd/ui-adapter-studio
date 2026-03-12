import React, { useMemo, useState } from 'react';
import {
  Button,
  EnhancedButton,
  EnhancedInput as Input,
  Badge,
  EnhancedAvatar,
  openTipsModal,
  Card,
  CardHeader,
  CardContent,
  type ColumnType,
  EnhancedTable as Table,
  EnhancedPagination as Pagination,
  message,
  openModalWarning,
} from '@teamhelper/ui';
import copy from 'copy-to-clipboard';
import { LS_KEYS } from '@/constants';
import { UserRoundPlus, LogOut } from 'lucide-react';
import { openInviteDesignerModal } from './InviteDesignerModal.tsx';
import { useTranslation } from 'react-i18next';
import { useThrottleEffect } from 'ahooks';
import { format } from 'date-fns';
import {
  getSourceByUserApi,
  fetchMemberListApi,
  type MemberInformation,
  deleteTeamerApi,
  leaveTeamApi,
} from '@/pages/Manage/server';
import { formatPhoneNumber } from '@/lib/utils.ts';
import { useAuthStore } from '@/store';
import type { UserTeamListDto } from '@/common/server';
import { INVITE_KEY } from '@/constants';

export const TeamMemberTable: React.FC<{
  myTeamInfo?: UserTeamListDto;
}> = ({ myTeamInfo }) => {
  const { userInfo, fetchUserInfo, fetchUserTeamList } = useAuthStore();
  const { enterprise_flag } = userInfo ?? {};
  const [searchQuery, setSearchQuery] = useState('');
  const [pageLoading, setPageLoading] = useState(false);
  const { t, i18n } = useTranslation('manage');
  const [pageInfo, setPageInfo] = React.useState({
    pageSize: 10,
    current: 0,
  });
  const [total, setTotal] = React.useState<number>(0);
  const [dataSource, setDataSource] = React.useState<MemberInformation[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const { admin_flag, team_id } = myTeamInfo ?? {};
  // 处理邀请设计师
  const handleInviteDesigner = async () => {
    try {
      const result = await openInviteDesignerModal({
        onInvite: async (inviteCode) => {
          const url = new URL(window.location.href);
          url.searchParams.set(INVITE_KEY, inviteCode);
          copy(url.toString());
          message.success(t('copy.invite.url.success'));
        },
      });

      if (result) {
        console.log('invite designer success');
        // 可以在这里刷新成员列表或显示成功提示
      }
    } catch (error) {
      console.error('invite designer failed:', error);
    }
  };

  async function getMemberList() {
    try {
      setPageLoading(true);
      const res = await fetchMemberListApi({
        page: pageInfo.current, // Convert to 0-based index
        size: pageInfo.pageSize,
        keyword: searchQuery,
      });
      setDataSource(res.data.content);
      setTotal(res.data.total_elements);
    } catch (e) {
    } finally {
      setPageLoading(false);
    }
  }

  useThrottleEffect(
    () => {
      getMemberList();
    },
    [pageInfo.pageSize, pageInfo.current, searchQuery],
    { wait: 700 },
  );

  const handleLogoutMember = async () => {
    await openTipsModal(
      <div className="gap-2 flex items-center">
        <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center overflow-hidden text-muted text-[22px] font-medium">
          !
        </div>
        <div className="font-[16px] text-muted-foreground">
          {t('tips.leave.desc')}
        </div>
      </div>,
      {
        title: t('tips.leave.team'),
        okText: t('tips.ok'),
        cancelText: t('tips.cancel'),
        onOkBeforeFunction: async () => {
          const res = await leaveTeamApi(team_id as number);
          message.success(t('toast.leave.success'));
          // 存储 Token 和过期时间
          const { token, expire_time } = res.data;
          localStorage.setItem(LS_KEYS.TOKEN, token);
          fetchUserInfo();
          fetchUserTeamList();
          return !!res.data;
        },
        type: 'danger',
      },
    );
  };

  const getRoleBadgeVariant = (role: number) => {
    switch (role) {
      case 1:
        return 'text-primary bg-[rgba(25,75,251,0.06)] hover:bg-[rgba(25,75,251,0.06)]/80';
      case 2:
        return 'text-[rgba(108,25,251,1)] bg-[rgba(251,241,255,1)] hover:bg-[rgba(251,241,255,1)/80';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: number) => {
    switch (status) {
      case 1:
        return 'text-primary bg-[rgba(25,75,251,0.06)] hover:bg-[rgba(25,75,251,0.06)]/80 border-none';
      case 2:
        return 'text-main-green-foreground bg-main-green hover:bg-[rgba(251,241,255,1)/80 border-none';
      default:
        return 'outline';
    }
  };

  const getRoleText = (role: number) => {
    switch (role) {
      case 1:
        return t('roles.admin');
      case 2:
        return t('roles.designer');
      default:
        return role;
    }
  };

  const getSourceData = async (row: MemberInformation) => {
    const res = await getSourceByUserApi({
      team_id: team_id as number,
      member_id: row.user_id,
    });
    return res.data;
  };
  async function deleteMember(row: MemberInformation) {
    if (row.role === 1) {
      await openModalWarning({
        title: t('operate.del.tips'),
        description: <div>{t('operate.del.reason')}</div>,
        options: {
          footerBtnPosition: 'block',
          cancelText: null,
          okText: t('operate.del.okText'),
        },
      });
      return;
    }
    try {
      setDeleteLoadingId(row.user_id);
      const data = await getSourceData(row);
      await openTipsModal(
        <div className="">
          <div className="font-normal text-sm text-muted-foreground mb-4">
            {t('delete.designer.des')}
          </div>
          <div className="rounded-md border border-muted bg-background p-3 mb-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <EnhancedAvatar initialOnly src={row?.avatar_url}>
                  {row?.account_name}
                </EnhancedAvatar>
                <div className="text-sm text-foreground">
                  <div className="text-sm font-medium leading-[21px] mb-[2px]">
                    {row.account_name}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground leading-[18px]">
                    {getRoleText(row.role)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="font-normal text-sm mb-3">
            {t('delete.designer.move')}：
          </div>
          <div className="text-xs font-normal text-muted-foreground flex gap-3 flex-col py-[6px] border-l-2  border-border pl-[20px]">
            <div className="relative before:content-[''] before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[3px] before:bg-muted-foreground before:rounded-full">
              {t('projects.files')}（
              {i18n.language === 'zh'
                ? `${data?.project_resource_count}个项目`
                : `${data?.project_resource_count} items`}
              ）
            </div>
            <div className="relative before:content-[''] before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[3px] before:bg-muted-foreground before:rounded-full">
              {t('projects.appsDraft')}（
              {i18n.language === 'zh'
                ? `${data?.application_draft_count}份`
                : `${data?.application_draft_count} copies`}
              ）
            </div>
            <div className="relative before:content-[''] before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[3px] before:bg-muted-foreground before:rounded-full">
              {t('projects.api.count')}（{`${data?.api_count}`}）
            </div>
            <div className="relative before:content-[''] before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[3px] before:bg-muted-foreground before:rounded-full">
              {t('projects.mcp.count')}（{`${data?.mcp_count}`}）
            </div>
            <div className="relative before:content-[''] before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[3px] before:bg-muted-foreground before:rounded-full">
              {t('projects.know.count')}（{`${data?.knowledge_base_count}`}）
            </div>
            <div className="relative before:content-[''] before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[3px] before:bg-muted-foreground before:rounded-full">
              {t('projects.flow.count')}（{`${data?.workflow_count}`}）
            </div>
          </div>
          <div className="hidden gap-2 flex items-center bg-[#FFF6ED]  p-[6px] mt-4 rounded-[6px]">
            <div className="w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center overflow-hidden text-muted">
              !
            </div>
            <div className="text-main-yellow leading-5 text-xs font-normal">
              {t('tips.leave.desc')}
            </div>
          </div>
        </div>,
        {
          title: t('tips.leave.title'),
          okText: t('tips.delete.ok'),
          cancelText: t('tips.cancel'),
          onOkBeforeFunction: async () => {
            const statusData = await deleteTeamerApi({
              team_id: team_id as number,
              member_ids: [row.user_id],
            });
            message.success(t('toast.delete.success'));
            getMemberList();
            return !!statusData.data;
          },
          type: 'danger',
        },
      );
    } catch (e) {
    } finally {
      setDeleteLoadingId(null);
    }
  }
  const columns: ColumnType<MemberInformation>[] = [
    {
      title: t('table.columns.name'),
      dataIndex: 'account_name',
      key: 'account_name',
      ellipsis: true,
      render: (_, record) => {
        return (
          <div className="flex items-center space-x-3">
            <EnhancedAvatar
              initialOnly
              className="shrink-0"
              src={record?.avatar_url}
            >
              {record.account_name}
            </EnhancedAvatar>
            <div>
              <div className="font-medium">{record.account_name}</div>
              <div className="text-sm text-muted-foreground">
                {formatPhoneNumber(record.phone_number)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: t('table.columns.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role) =>
        role ? (
          <Badge className={getRoleBadgeVariant(role)}>
            {getRoleText(role)}
          </Badge>
        ) : null,
    },
    {
      title: t('table.columns.joinDate'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => {
        return date ? format(new Date(date), 'yyyy-MM-dd') : null;
      },
    },
    {
      title: t('table.columns.actions'),
      key: 'actions',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          {
            <div className="space-x-2 flex items-center">
              <EnhancedButton
                type="text"
                loading={deleteLoadingId === record.user_id}
                className="text-destructive hover:text-destructive/80 hover:bg-[unset] font-medium text-sm h-auto p-0"
                onClick={() => deleteMember?.(record)}
              >
                {t('projects.dropdown.delete')}
              </EnhancedButton>
            </div>
          }
        </div>
      ),
    },
  ];

  const columnsMemo = useMemo(() => {
    if (!admin_flag) return columns.filter((c) => c.key !== 'actions');
    return columns;
  }, [columns, admin_flag]);

  return (
    <Card className="h-full flex flex-col overflow-hidden ">
      <CardHeader className="space-y-0 pb-[16px] flex justify-between items-start flex-row gap-2">
        <div>
          <div className="text-lg font-semibold">{t('team.header.title')}</div>
          <div
            style={enterprise_flag ? { display: 'none' } : {}}
            className="font-normal text-xs text-muted-foreground mt-1"
          >
            {t('team.header.desc')}
          </div>
        </div>
        <div className="flex items-center space-x-2 align-top">
          {admin_flag && (
            <Button onClick={handleInviteDesigner} size="sm">
              <UserRoundPlus className="h-4 w-4" />
              {t('team.inviteDesigner')}
            </Button>
          )}

          {!admin_flag && (
            <Button
              onClick={handleLogoutMember}
              size="sm"
              variant="destructive"
            >
              <LogOut className="h-4 w-4" />
              {t('team.leaveTeam')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardHeader className="py-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input.Search
                placeholder={t('search.members.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent
        aria-description={'table区域'}
        className="py-3 flex-1 min-h-0  flex flex-col"
      >
        {/* 成员表格 */}
        <>
          <Table
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedRowKeys,
              onChange: (rowKeys) => setSelectedRowKeys(rowKeys),
            }}
            columns={columnsMemo}
            dataSource={dataSource}
            rowKey="user_id"
            className=""
            loading={pageLoading}
          />
          <div className="mt-4 flex justify-between items-center">
            <Pagination
              current={pageInfo.current}
              pageSize={pageInfo.pageSize}
              total={total}
              startFromZero={true}
              onChange={(page, size) => {
                setPageInfo({
                  current: page,
                  pageSize: size,
                });
              }}
            />
          </div>
        </>
      </CardContent>
    </Card>
  );
};
