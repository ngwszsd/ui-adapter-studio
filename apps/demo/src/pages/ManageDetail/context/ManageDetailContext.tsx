import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from 'react';
import { useSearchParams, useParams } from 'react-router';
import type { ReactNode, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { type ProjectDetailDto, getProjectDetailApi } from '../server';
import { useRequest } from 'ahooks';

export type MenuItemKey =
  | 'apps-design'
  | 'apps-test'
  | 'version-management'
  | 'official-users'
  | 'apps-permissions'
  | 'auto-design'
  | 'workspace'
  | 'knowledge-base'
  | 'integrations'
  | 'api-service'
  | 'mcp-service'
  | string;

// 菜单项接口
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  parentKey?: string;
}

// Context类型定义
export interface ManageDetailContextType {
  /** 项目详情数据相关 */
  project: ProjectDetailDto | null; // 项目详情信息
  setProject: (pj: ProjectDetailDto | null) => void; // 存项目详情
  fetchingProjectDetail: boolean; // fetching 项目详情信息

  /** 菜单相关 */
  activeTab: MenuItemKey; // 当前菜单
  setActiveTab: (tab: string) => void; // 设置当前菜单
  pageFlag: string; // 当前页面标记
  pageParams: Record<string, any>; // 当前页面参数
  menuItems: MenuItem[]; // 菜单数据
  expandedKeys: MenuItemKey[]; // 默认展开的菜单
  toggleExpanded: (key: MenuItemKey) => void; // 快速切换展开/收起状态
  refreshProjectDetail: () => void; // 刷新项目详情
}

// 创建Context
const ManageDetailContext = createContext<ManageDetailContextType | undefined>(
  undefined,
);

// Provider组件
export const ManageDetailProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation('manageDetail');
  const { project_id } = useParams<{ project_id: string }>();

  const DEFAULT_MENU_ITEMS: MenuItem[] = useMemo(
    () => [
      {
        key: 'apps-design',
        label: t('menu.apps'),
      },
      // { key: 'apps-test', label: t('menu.apps-test') },
      {
        key: 'apps-publish',
        label: t('menu.apps-publish'),
        children: [
          {
            key: 'developer-certificate',
            label: t('menu.developerCertificate'),
            parentKey: 'apps-publish',
          },
          {
            key: 'application-packaging',
            label: t('menu.applicationPackaging'),
            parentKey: 'apps-publish',
          },
          // {
          //   key: 'version-management',
          //   label: t('menu.version-management'),
          //   parentKey: 'apps-publish',
          // },
          // {
          //   key: 'official-users',
          //   label: t('menu.officialUsers'),
          //   parentKey: 'apps-publish',
          // },
          // {
          //   key: 'apps-permissions',
          //   label: t('menu.apps-permissions'),
          //   parentKey: 'apps-publish',
          // },
          // {
          //   key: 'auto-design',
          //   label: t('menu.auto-design'),
          //   parentKey: 'apps-publish',
          // },
        ],
      },
      { key: 'workspace', label: t('menu.workflows') },
      { key: 'knowledge-base', label: t('menu.knowledgeBase') },
      {
        key: 'integrations',
        label: t('menu.integrations'),
        children: [
          {
            key: 'api-service',
            label: t('menu.api'),
            parentKey: 'integrations',
          },
          {
            key: 'mcp-service',
            label: t('menu.mcp'),
            parentKey: 'integrations',
          },
        ],
      },
    ],
    [t],
  );

  const [searchParams, setSearchParams] = useSearchParams();

  // 状态管理
  const [project, setProject] = useState<ProjectDetailDto | null>(null);

  const {
    loading: fetchingProjectDetail,
    refresh: refreshProjectDetail,
    run: fetchProjectDetail,
  } = useRequest(
    async () => {
      if (!project_id) return;
      try {
        const res = await getProjectDetailApi(Number(project_id));
        setProject(res.data);
      } catch (e) {
        console.error(e);
      }
    },
    {
      refreshDeps: [project_id],
      ready: !!project_id,
    },
  );

  const [expandedKeys, setExpandedKeys] = useState<MenuItemKey[]>([
    'apps-publish',
  ]); // 默认展开应用发布

  // 从URL获取当前tab
  const activeTab = searchParams.get('tab') || ('apps-design' as MenuItemKey);

  // 设置活跃tab并更新URL
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });

    // 如果选中的是子项，自动展开其父项
    const findParentKey = (
      items: MenuItem[],
      childKey: string,
    ): string | null => {
      for (const item of items) {
        if (item.children) {
          const child = item.children.find((c) => c.key === childKey);
          if (child) {
            return item.key;
          }
        }
      }
      return null;
    };

    const parentKey = findParentKey(DEFAULT_MENU_ITEMS, tab);
    if (parentKey && !expandedKeys.includes(parentKey)) {
      setExpandedKeys((prev) => [...prev, parentKey]);
    }
  };

  // 切换展开/收起状态
  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // 从URL获取当前页面标记和参数
  const pageFlag = useMemo(
    () => searchParams.get('flag') || '',
    [searchParams],
  );
  const pageParams = useMemo(() => {
    try {
      return JSON.parse(decodeURIComponent(searchParams.get('params') || ''));
    } catch (e) {
      return {};
    }
  }, [searchParams]);

  const value: ManageDetailContextType = useMemo(
    () => ({
      project,
      setProject,
      fetchingProjectDetail,
      activeTab,
      pageFlag,
      pageParams,
      menuItems: DEFAULT_MENU_ITEMS,
      expandedKeys,
      setActiveTab,
      toggleExpanded,
      refreshProjectDetail,
    }),
    [
      project,
      fetchingProjectDetail,
      activeTab,
      pageFlag,
      pageParams,
      DEFAULT_MENU_ITEMS,
      expandedKeys,
      refreshProjectDetail,
    ],
  );

  return (
    <ManageDetailContext.Provider value={value}>
      {children}
    </ManageDetailContext.Provider>
  );
};

// Hook for using context
export const useManageDetailContext = () => {
  const context = useContext(ManageDetailContext);
  if (context === undefined) {
    throw new Error(
      'useManageDetailContext must be used within a ManageDetailProvider',
    );
  }
  return context;
};
