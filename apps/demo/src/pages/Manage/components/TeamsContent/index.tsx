import { Crown, CreditCard, CircleDollarSign, Check } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  openTipsModal,
  type EnhancedSelectOption,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@teamhelper/ui';
import MemberIcon from '@/assets/img/member.svg?react';
import ProjectIcon from '@/assets/img/project.svg?react';
import { TeamMemberTable } from './TeamMemberTable';
import UpgradeEnterpriseDialog from './UpgradeEnterpriseDialog';
import NiceModal from '@ebay/nice-modal-react';
import { useTranslation } from 'react-i18next';
import vipImage from '@/assets/img/vip.png';
import { useTheme } from '@/context/themeContext';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { switchTeamsApi, type UserTeamListDto } from '@/common/server';
import { LS_KEYS } from '@/constants';
import { getUpgradeEnterprisePendingInfoApi } from '../../server';
type TeamInfo = {
  team_id?: number;
  dataList: EnhancedSelectOption<number, UserTeamListDto>[];
};
export const TeamsContent = () => {
  const { t } = useTranslation('manage');
  const { userInfo, userTeamList, fetchUserTeamList, fetchUserInfo } =
    useAuthStore();
  const { enterprise_flag, team_id } = userInfo ?? {};
  const { theme } = useTheme();

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

  useEffect(() => {
    fetchUserTeamList();
  }, [fetchUserTeamList]);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const myTeamInfo = useMemo(() => {
    return userTeamList.find((v) => v.team_id === team_id);
  }, [userTeamList, team_id]);

  const currentTeamInfo = useMemo(() => {
    return teamInfo.dataList?.find((v) => v.value === teamInfo.team_id);
  }, [JSON.stringify(teamInfo)]);

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

  const queryApplyStatusFn = async () => {
    const pendingInfo = await getUpgradeEnterprisePendingInfoApi(
      team_id || null,
    );
    const apply_status = pendingInfo?.apply_status;
    if (!pendingInfo?.phone_number) return false;

    let tipContent = null;
    switch (apply_status) {
      case 1:
        tipContent = (
          <>
            <div className="text-[20px] font-medium mt-[22px] mb-2 text-foreground">
              {t('update.applied.title')}
            </div>

            <ul className="text-sm text-muted-foreground space-y-2 text-center">
              <li>{t('update.applied.desc.1')}</li>
              <li>{t('update.applied.desc.2')}</li>
            </ul>
          </>
        );
        break;
      case 2:
        tipContent = (
          <>
            <div className="text-[20px] font-medium mt-[22px] mb-2 text-foreground">
              {t('update.applied.approved')}
            </div>
          </>
        );
        break;
      case 3:
        tipContent = (
          <>
            <div className="text-[20px] font-medium mt-[22px] mb-2 text-foreground">
              {t('update.applied.rejected')}
            </div>
          </>
        );
        break;
    }

    if (tipContent) {
      openTipsModal(
        <div className="flex justify-center flex-col items-center">
          <div className="flex justify-center items-center w-12 h-12 rounded-full bg-main-green-foreground">
            <Check color="#fff" className="w-9 h-9" />
          </div>

          {tipContent}

          <ul className="my-6 bg-background p-4 space-y-2 w-full rounded-[8px]">
            <li className="text-sm flex">
              <div className="text-muted-foreground w-25 shrink-0">
                {t('update.applied.companyName')}
              </div>
              <div className="break-all text-foreground">
                {pendingInfo?.company_name || '-'}
              </div>
            </li>

            <li className="text-sm flex">
              <div className="text-muted-foreground w-25 shrink-0">
                {t('update.applied.phone')}
              </div>
              <div className="break-all text-foreground">
                {pendingInfo?.phone_number || '-'}
              </div>
            </li>
          </ul>

          <div className="text-sm text-muted-foreground">
            {t('update.applied.contact')}
          </div>
        </div>,
        {
          isShowHeader: false,
          cancelText: null,
          className: 'min-w-[394px] w-[394px]',
          footerBtnPosition: 'block',
          classNames: {
            body: 'pb-0',
          },
          onOk(e) {
            e?.stopPropagation?.();
            fetchUserInfo();
          },
          maskClosable: false,
        },
      );
    }

    return true;
  };

  // 处理升级企业版按钮点击
  const handleUpgradeEnterprise = async () => {
    const bool = await queryApplyStatusFn();
    if (bool) return;

    try {
      const result = await NiceModal.show(UpgradeEnterpriseDialog);
      if (result) {
        await openTipsModal(
          <div className="flex justify-center flex-col items-center">
            <div className="flex justify-center items-center w-12 h-12 rounded-full bg-main-green-foreground">
              <Check color="#fff" className="w-9 h-9" />
            </div>
            <div className="mt-[22px] mb-[8px] text-[16px] font-medium">
              {t('update.submit.success')}
            </div>
            <div className="font-normal text-sm text-muted-foreground text-center">
              {t('update.submit.success.des')}
            </div>
          </div>,
          {
            isShowHeader: false,
            cancelText: null,
            className: 'min-w-[313px] w-[313px]',
            footerBtnPosition: 'block',
          },
        );
      }
      console.log('企业版升级信息:', result);
      // if (result) handleTestTipsModal();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="shrink-0 px-5 pt-8 flex items-center justify-between mb-6">
        <div className="font-bold text-xl">{t('TeamManagement')}</div>
        <div className="flex items-center gap-2">
          {!enterprise_flag && (
            <Button
              onClick={handleUpgradeEnterprise}
              className="flex items-center gap-2"
            >
              <Crown className="h-4 w-4" />
              {t('enterprise.update')}
            </Button>
          )}
          {enterprise_flag && (
            <Button className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('package.dosage')}
            </Button>
          )}
          {!enterprise_flag && (
            <Button className="flex items-center gap-2" variant="outline">
              <CircleDollarSign className="h-4 w-4" />
              {t('package.fee')}
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 h-full overflow-y-auto flex flex-col">
        <div className="px-5 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="w-full">
              <Card
                className={cn('relative', {
                  'bg-[linear-gradient(99deg,#FFFFFF_0%,#F3F5FF_100%)]':
                    theme === 'light' && enterprise_flag,
                })}
              >
                <div
                  className={cn(
                    'absolute right-0 top-[10px]',
                    enterprise_flag ? '' : 'hidden',
                  )}
                >
                  <img src={vipImage} alt="" />
                </div>
                <CardHeader className="font-medium text-lg  mb-[24px] space-y-[18px]">
                  <div className="flex gap-2">
                    <div>
                      <span>
                        {enterprise_flag
                          ? t('manage.co.version')
                          : t('manage.person.version')}
                      </span>
                      <span
                        className={cn(
                          'px-2 font-normal text-xs text-muted-foreground',
                          enterprise_flag ? 'hidden' : '',
                        )}
                      >
                        {t('version.free')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-sm ">
                      {t('manage.my.team')}：
                    </div>
                    <div className="w-66">
                      <Select
                        value={teamInfo.team_id}
                        onValueChange={(value) => {
                          changeTeam(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {teamInfo.dataList.map((item) => (
                            <SelectItem value={item.value} key={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-[24px]">
                    <div className="w-[200px]  bg-background flex gap-3 p-[15px] rounded-sm">
                      <div className="w-[54px] h-[54px]  font-bold shrink-0">
                        <ProjectIcon />
                      </div>
                      <div className="text-muted-foreground flex-1 flex flex-col gap-[12px]">
                        <div className="font-normal text-xs">
                          {t('manage.project.total')}
                        </div>
                        <div className="flex gap-[4px]">
                          <div className="font-medium text-[22px] text-foreground flex items-end leading-[1]">
                            {currentTeamInfo?.total_projects}
                          </div>
                          <div className="font-normal text-xs flex items-end ">
                            {t('manage.piece')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-[200px]  bg-background flex gap-3 p-[15px] rounded-sm">
                      <div className="w-[54px] h-[54px]  font-bold shrink-0">
                        <MemberIcon />
                      </div>
                      <div className="text-muted-foreground flex-1 flex flex-col gap-[12px]">
                        <div className="font-normal text-xs">
                          {t('manage.team.person')}
                        </div>
                        <div className="flex gap-[4px]">
                          <div className="font-medium text-[22px] text-foreground  flex items-end leading-[1]">
                            {currentTeamInfo?.member_count}
                          </div>
                          <div className="font-normal text-xs flex items-end ">
                            {t('manage.piece')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 团队成员表格 */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 min-h-[600px]">
          <TeamMemberTable myTeamInfo={myTeamInfo} />
        </div>
      </div>
    </div>
  );
};
