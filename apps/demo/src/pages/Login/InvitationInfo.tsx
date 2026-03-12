import { EnhancedAvatar } from '@teamhelper/ui';
import { useLogin } from './login-context';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export function InvitationInfo() {
  const { t } = useTranslation('login');
  const { inviteInfo } = useLogin();

  if (!inviteInfo?.team_name) return null;

  return (
    <div className="border-b border-b-border">
      <div className="flex items-center gap-2.5">
        <EnhancedAvatar
          initialOnly
          className="w-[54px] h-[54px] text-[20px] shrink-0"
          src={inviteInfo?.inviter_avatar}
        >
          {inviteInfo?.inviter_name}
        </EnhancedAvatar>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-base text-foreground truncate">
            {inviteInfo?.inviter_name || '-'}
          </div>
          <div className="text-foreground text-sm">
            {t('inviteInfo.inviteJoin')}
            <span className="text-primary ml-1 break-all">
              {inviteInfo?.team_name || '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="text-muted-foreground text-sm mt-4 mb-5 leading-relaxed">
        {t('inviteInfo.validUntil')}
        <span className="text-[#3b82f6]">
          {inviteInfo?.expired_time ? (
            <>
              【
              {format(
                new Date(inviteInfo?.expired_time),
                t('inviteInfo.dateFormat'),
              )}
              】
            </>
          ) : (
            '-'
          )}
        </span>
        {t('inviteInfo.pleaseComplete')}
      </div>
    </div>
  );
}
