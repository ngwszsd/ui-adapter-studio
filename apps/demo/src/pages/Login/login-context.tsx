import React, { createContext, useContext, useState } from 'react';
import { getInviteInfoApi, type InviteInfoDto } from '@/pages/Manage/server';

export type LoginFormType = 'login' | 'register' | 'register-success';
type LoginFormValues = {
  formType: LoginFormType; // 当前表单类型：'login' | 'register'
  isLoginForm: boolean; // 是否为登录表单（布尔值，便于使用）
  switchToLogin: () => void; // 切换到登录表单的函数
  switchToRegister: () => void; // 切换到注册表单的函数
  switchToRegisterSuccess: () => void; // 切换到注册成功界面的函数
  toggleFormType: () => void; // 在登录/注册间切换的函数
  setFormType: (type: LoginFormType) => void;
  // 邀请相关状态和方法
  inviteInfo: InviteInfoDto | null;
  inviteCode: string;
  fetchInviteInfo: (code: string) => Promise<void>;
  setInviteInfo: (info: InviteInfoDto | null) => void;
  setInviteCode: (code: string) => void;
};
// 创建 Context 对象
const LoginContext = createContext<Partial<LoginFormValues>>({});

// Context Provider 组件
export const LoginProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [formType, setFormType] = useState<LoginFormType>(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('LOGIN_PAGE_TYPE') as LoginFormType;
    const validModes: LoginFormType[] = [
      'login',
      'register',
      'register-success',
    ];
    return validModes.includes(mode) ? mode : 'login';
  });

  // 邀请相关状态
  const [inviteInfo, setInviteInfo] = useState<InviteInfoDto | null>(null);
  const [inviteCode, setInviteCode] = useState<string>('');

  // 获取邀请信息
  const fetchInviteInfo = async (code: string) => {
    let result = {} as InviteInfoDto;
    try {
      const res = await getInviteInfoApi(code);
      result = res?.data || {};
    } catch (_e) { }

    setInviteInfo(result);
    setInviteCode(code || '');
  };

  // 切换到登录表单
  const switchToLogin = () => {
    setFormType('login');
  };

  // 切换到注册表单
  const switchToRegister = () => {
    setFormType('register');
  };

  // 切换到注册成功界面
  const switchToRegisterSuccess = () => {
    setFormType('register-success');
  };

  // 切换表单类型（在登录和注册间切换）
  const toggleFormType = () => {
    setFormType((prevType) => (prevType === 'login' ? 'register' : 'login'));
  };

  // Context 值
  const contextValue = {
    formType, // 当前表单类型：'login' | 'register'
    isLoginForm: formType === 'login', // 是否为登录表单（布尔值，便于使用）
    switchToLogin, // 切换到登录表单的函数
    switchToRegister, // 切换到注册表单的函数
    switchToRegisterSuccess, // 切换到注册成功界面的函数
    toggleFormType, // 在登录/注册间切换的函数
    setFormType,
    // 邀请相关
    inviteInfo,
    inviteCode,
    fetchInviteInfo,
    setInviteInfo,
    setInviteCode,
  };

  return (
    <LoginContext.Provider value={contextValue}>
      {children}
    </LoginContext.Provider>
  );
};

// 自定义 Hook，用于在组件中访问 Context
export const useLogin = () => {
  const context = useContext(LoginContext);
  if (!context) {
    throw new Error('useLogin 必须在 LoginProvider 内使用');
  }
  return context as LoginFormValues;
};

// 保留旧的 hook 名称以保持向后兼容（可选）
export const useLoginFormSwitch = useLogin;

export default LoginContext;
