import { clsx } from '@teamhelper/ui';
import { useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router';
import { ManageProvider } from './context/ManageContext';
import { ProjectsContent } from './components/ProjectsContent';

import { TeamsContent } from './components/TeamsContent';
import { useTranslation } from 'react-i18next';
import { INVITE_KEY, LS_KEYS } from '@/constants';
import { getInviteInfoApi, handleInviteApi } from '@/pages/Manage/server.ts';
import {
  openTipsModal,
  EnhancedAvatar as Avatar,
  message,
} from '@teamhelper/ui';
import { format } from 'date-fns';
import { useAuthStore } from '@/store';
import ThProjectIcon from '@/assets/icon/th_project.svg?react';
import ThTeamIcon from '@/assets/icon/th_team.svg?react';

// 菜单项类型
type MenuType = 'projects' | 'teams';

// 内部组件：项目管理内容
const ManageContent = () => {
  const { t } = useTranslation('manage');
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 直接通过路径判断当前选中的菜单
  const activeMenu: MenuType = pathname.includes('manage-team')
    ? 'teams'
    : 'projects';

  const { fetchUserTeamList } = useAuthStore();

  // 辅助函数：清除 URL 中的邀请码
  const clearInviteParams = () => {
    const newParams = new URLSearchParams(searchParams);
    if (newParams.has(INVITE_KEY)) {
      newParams.delete(INVITE_KEY);
      setSearchParams(newParams, { replace: true });
    }
  };

  async function handleGetInviteCode(inviteCode: string) {
    const token = localStorage.getItem(LS_KEYS.TOKEN);
    if (!token) return;

    try {
      const res = await getInviteInfoApi(inviteCode);
      const data = res.data;

      if (data.in_team) {
        clearInviteParams(); // 已经在团队里，直接清除参数
        return;
      }

      await openTipsModal(
        <div className="flex items-start justify-between rounded-[6px] gap-4">
          <div className="flex items-start gap-2 min-w-0">
            <div className="shrink-0 mt-1">
              <Avatar initialOnly size="large" src={data.inviter_avatar}>
                {data.inviter_name}
              </Avatar>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {data.inviter_name}
              </div>
              <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap">
                {data.inviter_messages}
              </div>
            </div>
          </div>
          <div className="text-muted-foreground text-sm shrink-0 whitespace-nowrap">
            {data.invite_time
              ? format(new Date(data.invite_time), 'yyyy-MM-dd HH:mm:ss')
              : ''}
          </div>
        </div>,
        {
          title: t('team.invite.title'),
          okText: t('team.invite.ok'),
          cancelText: t('team.invite.cancel'),
          className: 'w-[780px]',
          classNames: {
            body: 'border-b',
          },
          onOkBeforeFunction: async () => {
            const statusData = await handleInviteApi(inviteCode, {
              approval_type: 1,
            });
            message.success(t('team.invite.success'));
            clearInviteParams(); // 成功后清除参数
            fetchUserTeamList();
            return !!statusData.data;
          },
        },
      );
    } catch (e) {
      console.error(e);
      clearInviteParams(); // 接口报错也要清除，防止死循环或一直残留
    }
  }

  // 仅处理邀请逻辑
  useEffect(() => {
    const inviteCode = searchParams.get(INVITE_KEY);
    if (inviteCode) handleGetInviteCode(inviteCode);
  }, [searchParams]);

  // 修改菜单切换：不再强行携带 search 参数
  const handleMenuChange = (menu: MenuType) => {
    if (menu === 'projects') {
      navigate('/manage-project');
    } else {
      navigate('/manage-team');
    }
  };

  return (
    <>
      {/* 左侧菜单 */}
      <div className="flex flex-col w-[260px] bg-card shrink-0 px-[20px] py-[20px] border-border border-r">
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => handleMenuChange('projects')}
            className={clsx(
              'w-full flex items-center px-4 font-medium py-4 text-sm rounded-[12px] transition-colors cursor-pointer gap-3',
              activeMenu === 'projects'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <ThProjectIcon className="shrink-0" />
            {t('ProjectManagement')}
          </button>
          <button
            onClick={() => handleMenuChange('teams')}
            className={clsx(
              'w-full flex items-center px-4 font-medium py-4 text-sm rounded-md transition-colors cursor-pointer gap-3',
              activeMenu === 'teams'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <ThTeamIcon className="shrink-0" />
            {t('TeamManagement')}
          </button>
        </nav>
      </div>

      {/* 主内容区域 */}
      <main className="flex-1">
        {activeMenu === 'projects' && <ProjectsContent />}
        {activeMenu === 'teams' && <TeamsContent />}
      </main>
    </>
  );
};

// 主组件
const Manage = () => {
  return (
    <ManageProvider>
      <ManageContent />
    </ManageProvider>
  );
};

export default Manage;
