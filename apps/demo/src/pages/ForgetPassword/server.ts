import { httpRequest } from '@/utils/request.ts';

export interface ForgetPwdParams {
  /**
   * 验证码，用户收到的验证码（由 send-code 接口发送）
   */
  code: string;
  /**
   * 新密码，用户设置的新密码，需遵循密码复杂度要求
   */
  new_password: string;
  /**
   * 手机号，接收验证码的目标地址，如手机号
   */
  target: string;
}

export interface SendVerificationCodeParams {
  /**
   * 目标，接收验证码的目标地址，如手机号或邮箱
   */
  target: string;
  /**
   * 类型，验证码用途类型，如 login、register、reset_password 等
   */
  type: string;
}

// 忘记密码
export const forgetPwdWithoutAuthApi = (data: ForgetPwdParams) => {
  return httpRequest.post<boolean>({
    url: '/reset/password',
    data,
    isAuth: false,
  });
};
//modify-password
export const modifyPwdApi = (data: ForgetPwdParams) => {
  return httpRequest.post<boolean>({
    url: '/modify/user/password',
    data,
  });
};
// 发送验证码接口
export const sendVerificationCodeApi = (data: SendVerificationCodeParams) => {
  return httpRequest.post<boolean>({
    url: '/send-verification-code',
    data,
  });
};
