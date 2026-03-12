import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getUserInfoApi,
  fetchUserTeamListApi,
  type UserDataDto,
  type UserTeamListDto,
} from '@/common/server';
import { LS_KEYS } from '@/constants';

interface AuthState {
  userInfo: UserDataDto | null; // 用户信息
  userTeamList: UserTeamListDto[]; // 团队列表
  isAuthenticated: boolean; // 是否已认证

  setUserInfo: (userInfo: UserDataDto) => void; // 设置用户信息
  clearUserInfo: () => void; // 清除用户信息
  logout: () => void; // 登出（清除所有认证数据）
  fetchUserInfo: () => Promise<void>; // 获取用户信息
  fetchUserTeamList: () => Promise<void>; // 获取团队列表
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userInfo: null,
      userTeamList: [],
      isAuthenticated: false,

      setUserInfo: (userInfo) => {
        set({
          userInfo,
          isAuthenticated: true,
        });
      },

      clearUserInfo: () => {
        set({
          userInfo: null,
          isAuthenticated: false,
        });
      },

      logout: () => {
        set({
          userInfo: null,
          isAuthenticated: false,
        });
        // 清除所有认证相关数据
        localStorage.removeItem(LS_KEYS.TOKEN);
        localStorage.removeItem(LS_KEYS.AUTH_STORAGE);
      },

      fetchUserInfo: async () => {
        try {
          const res = await getUserInfoApi();
          if (res.data) {
            set({
              userInfo: res.data,
              isAuthenticated: true,
            });
          }
        } catch (e) {
          console.error('获取用户信息失败:', e);
          // 如果获取失败，可以选择清除认证状态
          // set({ userInfo: null, isAuthenticated: false });
        }
      },
      fetchUserTeamList: async () => {
        try {
          const res = await fetchUserTeamListApi();
          if (res.data) {
            set({
              userTeamList: res.data,
            });
          }
        } catch (e) {
          console.error('获取团队列表信息失败:', e);
        }
      },
    }),
    {
      name: LS_KEYS.AUTH_STORAGE,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
