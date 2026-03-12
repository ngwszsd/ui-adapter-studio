import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getApiGroup, type ApiGroupDto } from '../server';

// API 分组相关状态
interface ApiGroupState {
  apiGroups: ApiGroupDto[];
  isLoadingGroups: boolean;
}

// API 分组相关方法
interface ApiGroupActions {
  fetchApiGroups: (project_id: number) => Promise<void>;
  setApiGroups: (groups: ApiGroupDto[]) => void;
  setLoadingGroups: (loading: boolean) => void;
  clearApiGroups: () => void;
}

// 合并状态和方法
type ApiGroupStore = ApiGroupState & ApiGroupActions;

// 创建 Zustand store 使用 Immer 中间件
export const useApiGroupStore = create<ApiGroupStore>()(
  immer((set, get) => ({
    // 初始状态
    apiGroups: [],
    isLoadingGroups: false,

    // 获取 API 分组数据
    fetchApiGroups: async (project_id: number) => {
      try {
        set((state) => {
          state.isLoadingGroups = true;
        });

        const res = await getApiGroup({ project_id });

        set((state) => {
          state.apiGroups = res.data;
          state.isLoadingGroups = false;
        });
      } catch (e) {
        console.error('Failed to fetch API groups:', e);
        set((state) => {
          state.apiGroups = [];
          state.isLoadingGroups = false;
        });
      }
    },

    // 设置 API 分组数据
    setApiGroups: (groups: ApiGroupDto[]) => {
      set((state) => {
        state.apiGroups = groups;
      });
    },

    // 设置加载状态
    setLoadingGroups: (loading: boolean) => {
      set((state) => {
        state.isLoadingGroups = loading;
      });
    },

    // 清空 API 分组数据
    clearApiGroups: () => {
      set((state) => {
        state.apiGroups = [];
        state.isLoadingGroups = false;
      });
    },
  })),
);

// 导出选择器 hooks 以便组件使用
export const useApiGroups = () => useApiGroupStore((state) => state.apiGroups);
export const useIsLoadingGroups = () =>
  useApiGroupStore((state) => state.isLoadingGroups);
export const useFetchApiGroups = () =>
  useApiGroupStore((state) => state.fetchApiGroups);
