import { Button, message } from '@teamhelper/ui';
import React from 'react';
import { useLoginFormSwitch } from './login-context';
import { useTranslation } from 'react-i18next';
import SuccessIcon from '@/assets/img/register-success.png';
import { loginApi } from './server';
import { LS_KEYS } from '@/constants';
import { PasswordCrypto } from '@/lib/crypto';
import { useNavigate, useSearchParams } from 'react-router';
const RegisterSuccess = React.forwardRef<unknown>((_, ref) => {
  const { t } = useTranslation('login');
  const { switchToLogin } = useLoginFormSwitch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 离开界面时清除注册信息
  React.useEffect(() => {
    return () => {
      sessionStorage.removeItem(LS_KEYS.REGISTER_INFO);
    };
  }, []);

  const handleGoLogin = async () => {
    const registerInfoStr = sessionStorage.getItem(LS_KEYS.REGISTER_INFO);
    if (!registerInfoStr) {
      message.error(t('loginFailed'));
      return;
    }

    const registerInfo = JSON.parse(registerInfoStr);
    // 对密码进行加密
    const encryptedPassword = registerInfo?.password || '';
    const res = await loginApi({
      mobile: registerInfo?.mobile || '',
      password: encryptedPassword,
    });

    // 存储 Token 和过期时间
    const { token, expire_time } = res.data;
    localStorage.setItem(LS_KEYS.TOKEN, token);
    message.success(t('loginSuccess'));

    // 获取重定向地址
    const redirect = searchParams.get('redirect');
    // 跳转到重定向地址或首页
    navigate(redirect ? decodeURIComponent(redirect) : '/', {
      replace: true,
    });
  };

  const handleOtherLogin = () => {
    switchToLogin?.();
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <img src={SuccessIcon} className="mt-11" alt="register-success" />
      <div className="mt-3 text-[24px] leading-8 font-bold  text-center not-italic normal-case">
        {t('registerSuccess')}
      </div>
      <div className="mt-3 text-[14px] text-muted-foreground text-center">
        {t('registerSuccessDes')}
      </div>
      <Button onClick={handleGoLogin} className="w-full mt-17">
        {t('goLogin')}
      </Button>
      <div
        onClick={handleOtherLogin}
        className="text-[14px] text-primary text-center mt-4 leading-5"
      >
        {t('goLoginDes')}
      </div>
    </div>
  );
});

export default RegisterSuccess;
