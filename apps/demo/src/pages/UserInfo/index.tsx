import { ChevronLeft, Eye, EyeOff, Camera } from 'lucide-react';
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  message,
  type EnhancedSelectOption,
  EnhancedAvatar,
} from '@teamhelper/ui';
import { cn, maskPhone } from '@/lib/utils';
import { useNavigate } from 'react-router';
import { LS_KEYS } from '@/constants';
import { type UserTeamListDto, switchTeamsApi } from '@/common/server';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store';
import { openModifyNameModal } from '@/pages/UserInfo/components/modifyNameModal.tsx';
import { editUserInfoApi } from './server';
import ThUpload from '@/components/common/ThUpload';

type TeamInfo = {
  team_id?: number;
  dataList: EnhancedSelectOption<number, UserTeamListDto>[];
};
export default function UserInfo() {
  const { t } = useTranslation('userInfo');
  const { userInfo, fetchUserInfo, userTeamList } = useAuthStore();
  const { name, avatar, enterprise_flag, mobile, user_id, team_id } =
    userInfo || {};

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
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModifyName = async () => {
    await openModifyNameModal();
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
  return (
    <div className="bg-background w-full">
      <div
        className="flex items-center gap-1 text-muted-foreground pl-5 pt-[25px] pb-10  cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="w-4 h-4" />
        <div className="text-sm font-normal">{t('goBack')}</div>
      </div>
      <div className="p-15 pt-0 pb-[32px]">
        <div className="flex items-center gap-[29px]">
          <div className="relative w-[92px] h-[92px]">
            <ThUpload
              type="avatar"
              accept=".jpg,.jpeg,.png"
              multiple={false}
              showUploadList={false}
              crop
              maxSizeMB={5}
              onChange={() => setUploading(true)}
              onError={() => setUploading(false)}
              onUploaded={async (fileKey) => {
                try {
                  await editUserInfoApi({
                    avatar: fileKey,
                    name: name || '',
                  });
                  await fetchUserInfo();
                  message.success(t('userInfo.avatarUpdateSuccess'));
                } catch (error) {
                  console.error(t('userInfo.avatarUpdateError'), error);
                  message.error(t('userInfo.avatarUpdateError'));
                } finally {
                  setUploading(false);
                }
              }}
            >
              <div className="w-[92px] h-[92px] relative cursor-pointer group">
                {avatar ? (
                  <img
                    className="w-full h-full rounded-full object-cover"
                    src={avatar}
                    alt={name}
                  />
                ) : (
                  <EnhancedAvatar
                    initialOnly
                    className="w-full h-full rounded-full"
                  >
                    {name}
                  </EnhancedAvatar>
                )}
                <div
                  className={cn(
                    `absolute bottom-0 right-0 w-7 h-7 bg-card rounded-full flex items-center justify-center hover:bg-card/90 transition-colors`,
                    uploading ? 'opacity-50 cursor-not-allowed' : '',
                  )}
                >
                  <Camera className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </ThUpload>
          </div>
          <div>
            <div className="flex items-center gap-[10px] pb-[16px]">
              <div className="font-bold text-[22px]">{name}</div>
              <Badge className="text-primary bg-[rgba(25,75,251,0.06)] hover:bg-[rgba(25,75,251,0.06)]/80">
                {enterprise_flag
                  ? t('userInfo.versionCompany')
                  : t('userInfo.versionPerson')}
              </Badge>
            </div>
            <div className="flex items-center gap-5">
              <div className="font-medium text-sm text-muted-foreground">
                {t('userInfo.myCo')}:
              </div>
              <div className="w-[217px]">
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
          </div>
        </div>
      </div>
      {/*list*/}
      <div className="p-15">
        {/*---------名称-----------*/}
        <div className="shadow-[0px_4px_6px_0px_rgba(0,0,0,0.02)] rounded-[18px] bg-card w-full  px-[24px]">
          <div className="py-6 flex justify-between items-center text-sm font-medium">
            <div> {t('userInfo.name')}</div>
            <div className="gap-[14px] flex items-center text-muted-foreground">
              <div>{name}</div>
              <div
                className="text-primary cursor-pointer"
                onClick={handleModifyName}
              >
                {t('userInfo.edit')}
              </div>
            </div>
          </div>
          <Separator />
          {/*---------手机号-----------*/}
          <div className="py-6 flex justify-between items-center text-sm font-medium">
            <div> {t('userInfo.mobile')}</div>
            <div className="gap-[14px] flex items-center text-muted-foreground">
              <div>{!mobileOpen ? maskPhone(mobile) : mobile}</div>
              <div
                className=" cursor-pointer"
                onClick={() => setMobileOpen((prevState) => !prevState)}
              >
                {!mobileOpen ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
          <Separator />
          {/*---------密码-----------*/}
          <div className="py-6 flex justify-between items-center text-sm font-medium">
            <div> {t('userInfo.pwd')}</div>
            <div className="gap-[14px] flex items-center text-muted-foreground">
              <div>********</div>
              <div
                className="hidden cursor-pointer"
                onClick={() => setPwdOpen((prevState) => !prevState)}
              >
                {!pwdOpen ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div
                className="text-primary cursor-pointer"
                onClick={() => navigate('/forgot-password?type=edit')}
              >
                {t('userInfo.edit')}
              </div>
            </div>
          </div>
          <Separator />
          {/*---------uid-----------*/}
          <div className="py-6 flex justify-between items-center text-sm font-medium">
            <div className="">UID</div>
            <div className="text-muted-foreground">{user_id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
