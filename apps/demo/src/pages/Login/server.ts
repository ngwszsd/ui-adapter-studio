import type { ApiResponse } from '@/types/axios';
import { httpRequest } from '@/utils/request.ts';

export interface LoginParams {
  mobile: string;
  password: string;
}

export interface LoginResDto {
  /**
   * 过期时间，令牌过期时间，单位：毫秒
   */
  expire_time: number;
  /**
   * 令牌，身份验证令牌
   */
  token: string;
}

// 登录接口，不需要 Token
export const loginApi = (data: LoginParams) => {
  return httpRequest.post<LoginResDto>({
    url: '/login',
    data,
    isAuth: false,
  });
};

export interface RegisterParams {
  /**
   * 姓名，用户填写的姓名
   */
  name: string;
  /**
   * 验证码，短信发送的验证码
   */
  code: string;
  /**
   * 手机号，用户的手机号码，用于注册和验证
   */
  mobile: string;
  /**
   * 密码，用户设置的登录密码
   */
  password: string;
}

// 注册接口
export const registerApi = (data: RegisterParams) => {
  return httpRequest.post<boolean>({
    url: '/register',
    data,
    isAuth: false,
  });
};

export interface SendVerificationCodeParams {
  /**
   * 目标，接收验证码的目标地址，如手机号或邮箱
   */
  target: string;
  /**
   * 类型，验证码用途类型
   * FORGOT_PASSWORD("forgot_password", "忘记密码验证码"),
   * CHANGE_PASSWORD("change_password", "修改密码验证码");
   * REGISTER("register", "注册验证码"),
   * * 注册验证码
   */
  type: 'register' | 'forgot_password' | 'change_password';
}

// 发送验证码接口
export const sendVerificationCodeApi = (data: SendVerificationCodeParams) => {
  return httpRequest.post<boolean>({
    url: '/send-code',
    data,
  });
};

/**
 * 查询邀请链接是否可用
 * @param inviteCode
 * @returns
 */
export const validateInviteCodeApi = async (
  inviteCode: string,
  onError?: (info: ApiResponse<boolean>) => void,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.get<boolean>({
      url: `/teams/invites/${inviteCode}/validate`,
      returnFullError: true,
      showError: false,
    });
    result = Boolean(dtoResult?.data);
  } catch (error: any) {
    const msg_content = error?.message;
    if (
      String(msg_content).includes('1003008') ||
      String(msg_content).includes('1003004')
    ) {
      let warningInfo = {} as ApiResponse<boolean>;
      try {
        warningInfo = JSON.parse(msg_content);
      } catch (_error) {}
      onError?.(warningInfo);
    }
  }

  return result;
};
