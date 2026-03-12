import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { openModalWarning } from '@teamhelper/ui';
import { validateInviteCodeApi } from '@/pages/Login/server';
import { INVITE_KEY } from '@/constants';

export const useValidateInviteCode = () => {
  const { t } = useTranslation('login');
  const [searchParams, setSearchParams] = useSearchParams();

  const validateInviteCode = async (
    inviteCode: string,
    onClear?: () => void,
  ) => {
    return await validateInviteCodeApi(inviteCode, (info) => {
      if (!info?.code) return;

      openModalWarning({
        title:
          info?.code === 1003008
            ? t('inviteInfo.prompt')
            : t('inviteInfo.linkExpired'),
        description: info?.message,
        options: {
          footerBtnPosition: 'block',
          cancelText: null,
          okText: t('inviteInfo.backToLogin'),
          maskClosable: false,
        },
        onOk(e) {
          e?.stopPropagation();
          searchParams.delete(INVITE_KEY);
          setSearchParams(searchParams);
          onClear?.();
        },
      });
    });
  };

  return {
    validateInviteCode,
  };
};
