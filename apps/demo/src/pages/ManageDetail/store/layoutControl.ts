import { LS_KEYS } from '@/constants';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { SetURLSearchParams } from 'react-router';

export interface IManageDetailState {
  showSidebar: boolean; // 是否显示左侧菜单栏
  showProjectHeader: boolean; // 是否显示顶部详情信息
  searchParams: URLSearchParams | null;
  setSearchParams: SetURLSearchParams | null;
}

export interface IManageDetailActions {
  setShowSidebar: (value: boolean) => void; // 设置左侧菜单栏
  setShowProjectHeader: (value: boolean) => void; // 设置是否显示顶部详情信息
  bindSearchParams: (
    searchParams: URLSearchParams,
    _setSearchParams: SetURLSearchParams,
  ) => void;
  getPageFlag: <T extends string>() => T;
  setPageFlag: (
    flag: string,
    params?: Record<string, any>,
    isMerge?: boolean,
  ) => void;
  getPageParams: <T extends Record<string, any>>() => T;
  setPageParams: (params?: Record<string, any>) => void;
  updatePageParams: (params?: Record<string, any>) => void;
}

export const useManageDetailLayoutControlStore = create<
  IManageDetailState & IManageDetailActions
>()(
  persist(
    immer((set, get) => {
      const DEFAULT_STATE = {
        showSidebar: true,
        showProjectHeader: true,
        searchParams: null,
        setSearchParams: null,
      };

      return {
        ...DEFAULT_STATE,
        setShowSidebar: (value) =>
          set((state) => {
            state.showSidebar = Boolean(value);
          }),
        setShowProjectHeader: (value) =>
          set((state) => {
            state.showProjectHeader = Boolean(value);
          }),
        bindSearchParams: (sp, setter) =>
          set((state) => {
            state.searchParams = sp as any;
            state.setSearchParams = setter || null;
          }),
        getPageFlag: <T extends string>() => {
          const sp = get?.()?.searchParams;
          const pageFlag = sp?.get?.('flag') || '';
          return pageFlag as T;
        },
        setPageFlag: (flag, params, isMerge = true) => {
          if (!flag) return;

          const setter = get?.()?.setSearchParams;
          if (!setter) return;

          setter((prev: URLSearchParams) => {
            prev.set('flag', String(flag));

            if (params) {
              if (isMerge) {
                prev.set('params', encodeURIComponent(JSON.stringify(params)));
              } else {
                Object?.keys?.(params)?.forEach?.((key) => {
                  prev.set(key, params?.[key]);
                });
              }
            }

            return prev;
          });
        },
        getPageParams: <T extends Record<string, any>>() => {
          let pageParams: Record<string, any> = {};

          try {
            const sp = get?.()?.searchParams;
            pageParams = JSON.parse(
              decodeURIComponent(sp?.get?.('params') || ''),
            );
          } catch (_error) {}

          return pageParams as T;
        },
        setPageParams: (params) => {
          const setter = get?.()?.setSearchParams;
          if (!setter) return;

          setter((prev: URLSearchParams) => {
            prev.set(
              'params',
              encodeURIComponent(JSON.stringify(params || '')),
            );
            return prev;
          });
        },
        updatePageParams: (params) => {
          if (!params || !Object.keys(params).length) return;

          const setter = get?.()?.setSearchParams;
          if (!setter) return;

          const pageParams = get?.()?.getPageParams?.() || {};
          setter((prev: URLSearchParams) => {
            prev.set(
              'params',
              encodeURIComponent(
                JSON.stringify({
                  ...pageParams,
                  ...params,
                }),
              ),
            );
            return prev;
          });
        },
      };
    }),
    {
      name: LS_KEYS?.MANAGE_DETAIL_STORE,
    },
  ),
);
