import LoginForm from './login-form';
import RegisterForm from './register-form';
import { useLogin, LoginProvider } from './login-context';
import type { LoginFormType } from './login-context';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import LoginBanner from '@/assets/img/login-bg.png';
import Logo from '@/assets/img/logo.png';
import { cn } from '@/lib/utils.ts';
import { INVITE_KEY } from '@/constants';
import RegisterSuccess from './register-success';
import { useValidateInviteCode } from '@/hooks/useValidateInviteCode';

const key = 'LOGIN_PAGE_TYPE';
const LoginContent = () => {
  const { validateInviteCode } = useValidateInviteCode();
  const { t, i18n } = useTranslation('login');
  const {
    formType,
    setFormType,
    fetchInviteInfo,
    setInviteInfo,
    setInviteCode,
  } = useLogin();
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteCode = useMemo(() => {
    return searchParams?.get?.(INVITE_KEY) || '';
  }, [searchParams]);

  const compForm = useMemo(() => {
    const forms: Record<string, React.ReactNode> = {
      register: <RegisterForm />,
      'register-success': <RegisterSuccess />,
    };
    return forms[formType!] || <LoginForm />;
  }, [formType]);

  // 当 formType 改变时，同步更新 URL
  useEffect(() => {
    const currentMode = searchParams.get(key);
    if (currentMode !== formType) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set(key, formType as string);
      setSearchParams(newParams, { replace: true });
    }
  }, [formType, searchParams, setSearchParams]);

  // 进入登录页清除所有localStorage
  useEffect(() => {
    localStorage.clear();
  }, []);

  useEffect(() => {
    if (inviteCode) {
      fetchInviteInfo(inviteCode);
    } else {
      setInviteInfo(null);
      setInviteCode('');
    }
  }, [inviteCode]);

  useEffect(() => {
    if (inviteCode && searchParams.get(key)) {
      validateInviteCode(inviteCode, () => {
        setInviteCode?.('');
      });
    }
  }, [inviteCode, searchParams.get(key)]);

  // 登陆页整体布局
  return (
    <div className="bg-card text-foreground h-full flex items-center justify-center min-w-[1280px] max-lg:min-w-0 overflow-auto">
      {/* 左侧banner区域 - 在大屏显示，小屏隐藏 */}
      <div className="w-[618px] h-full bg-primary max-lg:hidden flex flex-col">
        <div className="shrink-0 m-8.5 h-[46px]">
          <img src={Logo} alt="" className="h-full" />
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div>
            <img src={LoginBanner} className="w-full object-cover" />
            <div
              className={cn(
                'text-primary-foreground mb-4 mt-4 font-bold  text-center',
                i18n.language === 'zh' ? 'text-[40px]' : 'text-[32px]',
              )}
            >
              {t('loginTitle')}
            </div>
            <div
              className={cn(
                'm-auto  text-primary-foreground font-medium text-[14px] text-center',
                i18n.language === 'zh'
                  ? 'text-[14px] w-[70%]'
                  : 'text-[12px] w-[77%]',
              )}
            >
              {t('loginDes')}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧表单区域 - 始终显示，小屏时占据全宽 */}
      <div
        className={cn(
          'flex-1 h-full flex flex-col justify-between items-center max-lg:w-full max-lg:px-4',
          formType === 'register' &&
            'scale-90 gap-4 max-h-[800px]:scale-80 min-h-[1000px]:scale-100',
        )}
      >
        <div className="flex-1 flex justify-center items-center w-full">
          <div className="w-[384px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] rounded-[12px] border border-[#E5E5E5] p-8 max-lg:w-full max-lg:max-w-md">
            <div>{compForm}</div>
          </div>
        </div>
        <div className="pb-8 text-[#9CA3AF] text-sm">{t('copyright')}</div>
      </div>
    </div>
  );
};

const Login = () => {
  return (
    <LoginProvider>
      <LoginContent />
    </LoginProvider>
  );
};

export default Login;
