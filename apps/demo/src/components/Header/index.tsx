import React, { useEffect, useState } from 'react';
import {
  MessageCircleMore,
  Globe,
  Moon,
  ChevronRight,
  X,
  User,
} from 'lucide-react';
import { logoutApi } from './server.ts';
import { useTheme } from '@/context/themeContext.tsx';
import { useTranslation } from 'react-i18next';
import logoIcon from '@/assets/img/logo@2x.webp';
import logoIconDark from '@/assets/img/dark-logo.png';
import {
  Popover,
  Empty,
  PopoverContent,
  PopoverTrigger,
  EnhancedPopover,
  Badge,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
  message,
  type EnhancedSelectOption,
  EnhancedSelect,
  EnhancedAvatar,
} from '@teamhelper/ui';
import { cn } from '@/lib/utils.ts';
import { useNavigate } from 'react-router';
import { LS_KEYS } from '@/constants';
import { useAuthStore } from '@/store';
import { switchTeamsApi, type UserTeamListDto } from '@/common/server.ts';
type TeamInfo = {
  team_id?: number;
  dataList: EnhancedSelectOption<number, UserTeamListDto>[];
};
const Header = () => {
  const { t, i18n } = useTranslation('components');
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [msg] = useState([]);

  const [messagePopOpen, setMessagePopOpen] = useState(false);

  const [userInfoPopOpen, setUserInfoPopOpen] = useState(false);
  const { logout, userInfo, userTeamList } = useAuthStore();
  const { team_id } = userInfo ?? {};

  const [teamInfo, setTeamInfo] = useState<TeamInfo>({
    team_id: undefined,
    dataList: [],
  });

  useEffect(() => {
    setTeamInfo({
      team_id: team_id,
      dataList: userTeamList.map((team) => ({
        value: team.team_id,
        label: team.team_name,
        ...team,
      })),
    });
  }, [team_id, userTeamList]);
  // 语言切换函数
  const toggleLanguage = (l: 'zh' | 'en') => {
    i18n.changeLanguage(l);
    localStorage.setItem(LS_KEYS.LANGUAGE, l);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      logout();
      navigate('/login');
    } catch (error) {
      // 错误提示已经在 request.ts 拦截器中处理了
    }
  };
  const changeTeam = async (team_id: number) => {
    try {
      const res = await switchTeamsApi(team_id);
      // 存储 Token 和过期时间
      const { token, expire_time } = res.data;
      localStorage.setItem(LS_KEYS.TOKEN, token);
      setTimeout(() => {
        window.location.reload();
      }, 0);
    } catch (e) {}
  };
  const Items = () => {
    return (
      <div className="flex justify-between gap-[14px] px-[16px] relative">
        {/*时间*/}
        <div className="absolute right-[16px] top-[24px] font-normal text-xs text-muted-foreground">
          2小时前
        </div>
        <div className="w-[46px] h-[46px] bg-[rgba(255,252,233,1)] rounded-full"></div>
        <div className="flex-1">
          <div className="space-x-1 mb-[2px] flex items-center">
            <div className="font-medium text-base text-muted-foreground ">
              张三
            </div>
            <div className="bg-[rgba(239,251,241,1)] rounded-[72px] flex justify-center items-center p-[10px] py-[1px] text-[rgba(65,162,82,1)] font-normal text-xs">
              已加入
            </div>
          </div>
          <div className={'font-normal text-sm text-muted-foreground mb-3'}>
            邀请您加入阿里巴巴集团
          </div>
          <div className="flex justify-start items-center gap-3">
            <div className="cursor-pointer text-sm font-normal flex justify-center items-center min-w-[85px] h-8 bg-[rgba(226,251,232,1)] hover:bg-[rgba(226,251,232,1)]/85 text-[rgba(65,162,82,1)] shadow-sm rounded-[8px]">
              {t('button.accept')}
            </div>
            <div className="cursor-pointer text-sm flex justify-center items-center min-w-[85px] h-8 border-[rgba(246,81,96,1)] text-[rgba(246,81,96,1)] shadow-sm rounded-[8px] border">
              {t('button.reject')}
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <header>
      <div className="flex justify-between items-center h-[48px] px-5">
        <div className="flex items-center">
          <img
            src={theme === 'light' ? logoIcon : logoIconDark}
            alt="logo"
            className="h-7"
            draggable={false}
          />
        </div>

        <div className="flex items-center gap-3">
          {/*消息*/}
          <Popover open={messagePopOpen} onOpenChange={setMessagePopOpen}>
            <PopoverTrigger asChild>
              <div className="cursor-pointer bg-background w-[32px] h-[32px] rounded-full flex items-center justify-center">
                <MessageCircleMore className="w-4 h-4 " />
              </div>
            </PopoverTrigger>
            <PopoverContent align="end" side="bottom" className="w-80 p-0">
              <div className="flex flex-col">
                <div className="flex items-center justify-between py-[14px] px-[16px] border-border border-b">
                  <div className="font-bold text-base text-foreground">
                    {t('notifications.title')}
                  </div>
                  <div onClick={() => setMessagePopOpen(false)}>
                    <X className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </div>
                </div>
                {/*Items*/}
                <div className="max-h-100 py-6 overflow-y-auto flex flex-col gap-6">
                  {msg.length > 0 ? (
                    msg.map((item, index) => <Items key={index} />)
                  ) : (
                    <Empty />
                  )}
                </div>
                <div className="cursor-pointer flex items-center justify-center py-[10px] font-normal text-sm text-muted-foreground border-t border-border">
                  {t('notifications.viewAll')}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/*语言切换*/}
          <EnhancedPopover
            content={
              <div className="flex flex-col gap-3 ">
                <div
                  className={cn(
                    'cursor-pointer text-sm font-normal',
                    i18n.language === 'zh' ? 'text-primary' : '',
                  )}
                  onClick={() => toggleLanguage('zh')}
                >
                  简体中文
                </div>
                <div
                  className={cn(
                    'cursor-pointer text-sm font-normal',
                    i18n.language === 'en' ? 'text-primary' : '',
                  )}
                  onClick={() => toggleLanguage('en')}
                >
                  English
                </div>
              </div>
            }
          >
            <div className="cursor-pointer bg-background w-[32px] h-[32px] rounded-full flex items-center justify-center">
              <Globe className="w-4 h-4 " />
            </div>
          </EnhancedPopover>

          {/*主题*/}
          <EnhancedPopover
            content={
              <div className="flex flex-col gap-3 ">
                <div
                  className={cn(
                    'cursor-pointer text-sm font-normal',
                    theme === 'light' ? 'text-primary' : '',
                  )}
                  onClick={() => setTheme('light')}
                >
                  {t('theme.light')}
                </div>
                <div
                  className={cn(
                    'cursor-pointer text-sm font-normal',
                    theme === 'dark' ? 'text-primary' : '',
                  )}
                  onClick={() => setTheme('dark')}
                >
                  {t('theme.dark')}
                </div>
              </div>
            }
          >
            <div className="cursor-pointer bg-background w-[32px] h-[32px] rounded-full flex items-center justify-center">
              <Moon className="w-4 h-4 " />
            </div>
          </EnhancedPopover>
          {/*个人信息*/}
          <EnhancedPopover
            open={userInfoPopOpen}
            onOpenChange={(v) => setUserInfoPopOpen(v)}
            content={
              <div className="w-50">
                <div className="flex ">
                  <EnhancedAvatar
                    className="w-12 h-12 rounded-full"
                    src={userInfo?.avatar}
                    initialOnly
                  >
                    {userInfo?.name}
                  </EnhancedAvatar>
                  <div className="pl-[14px]">
                    <div className="font-bold text-[16px] pb-[5px]">
                      {userInfo?.name}
                    </div>
                    <Badge className="text-primary bg-[rgba(25,75,251,0.06)] hover:bg-[rgba(25,75,251,0.06)]/80">
                      {userInfo?.enterprise_flag
                        ? t('userInfo.versionCompany')
                        : t('userInfo.versionPerson')}
                    </Badge>
                  </div>
                </div>
                <Separator className="mt-4 mb-4" />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onClick={() => {
                      navigate('/user-info');
                      setUserInfoPopOpen(false);
                    }}
                  >
                    {t('userInfo.editBtn')}
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="flex-1"
                    variant="destructive"
                  >
                    {t('userInfo.logout')}
                  </Button>
                </div>
              </div>
            }
          >
            <div className="cursor-pointer px-[6px] bg-background max-w-50 h-[32px] rounded-full flex justify-between items-center gap-[10px]">
              <EnhancedAvatar
                className="w-6 h-6 shrink-0 rounded-full"
                src={userInfo?.avatar}
                initialOnly
              >
                {userInfo?.name}
              </EnhancedAvatar>
              <div className="w-16 h-[24px] font-medium text-sm flex items-center">
                <span className="truncate block w-full text-center">
                  {userInfo?.name}
                </span>
              </div>
              <div>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 cursor-pointer transition-transform',
                    userInfoPopOpen ? 'rotate-90' : '',
                  )}
                />
              </div>
            </div>
          </EnhancedPopover>
        </div>
      </div>
    </header>
  );
};
export default Header;
export { Header };
