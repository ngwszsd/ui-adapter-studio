import { httpRequest } from '@/utils/request.ts';

// 忘记密码
export const logoutApi = () => {
  return httpRequest.post<boolean>({
    url: '/logout',
  });
};
