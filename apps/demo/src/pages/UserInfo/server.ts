import { httpRequest } from '@/utils/request.ts';

export interface EditUserInfoParams {
  /**
   * 头像，头像的 URL 地址（如果提供则更新）
   */
  avatar?: string;
  /**
   * 姓名，新的姓名（如果提供则更新）
   */
  name?: string;
}

// 发送验证码接口
export const editUserInfoApi = (data: EditUserInfoParams) => {
  return httpRequest.post<boolean>({
    url: '/user/info',
    data,
  });
};
