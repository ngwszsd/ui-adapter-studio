import React, { useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils.ts';
import { Package, ChevronRight, ChevronDown } from 'lucide-react';
import {
  type MenuItem,
  type MenuItemKey,
  useManageDetailContext,
} from '../context/ManageDetailContext.tsx';
import ws from '@/lib/websocket.ts';
import { getAppUpdatedByProjectApi } from '@/pages/ManageDetail/server.ts';
import { useParams } from 'react-router';
import ThAppsDesignIcon from '@/assets/icon/th_apps_design.svg?react';
// import ThAppsTestIcon from '@/assets/icon/th_apps_test.svg?react';
import ThAppsPublishIcon from '@/assets/icon/th_apps_publish.svg?react';
import ThWorkflowIcon from '@/assets/icon/th_workflow.svg?react';
import ThKnowledgeBaseIcon from '@/assets/icon/th_knowledge_base.svg?react';
import ThIntegrationsIcon from '@/assets/icon/th_integrations.svg?react';

// 菜单图标映射
const MENU_ICONS: Record<string, React.ReactNode> = {
  'apps-design': <ThAppsDesignIcon />,
  // 'apps-test': <ThAppsTestIcon />,
  'apps-publish': <ThAppsPublishIcon />,
  workspace: <ThWorkflowIcon />,
  'knowledge-base': <ThKnowledgeBaseIcon />,
  integrations: <ThIntegrationsIcon />,
};

export const ProjectSidebar: React.FC<{
  className?: string;
}> = memo(({ className }) => {
  const { menuItems, activeTab, setActiveTab, expandedKeys, toggleExpanded } =
    useManageDetailContext();
  const { project_id } = useParams<{ project_id: string }>();
  // 本地管理 badges 状态
  const [badges, setBadges] = useState<Record<MenuItemKey, boolean>>({});

  // 首次通过http获取更新status 等待socket更新
  const getHttpMomentBadgeStatus = async () => {
    try {
      const res = await getAppUpdatedByProjectApi({
        project_id: Number(project_id),
      });
      setBadges((prev) => ({
        ...prev,
        'apps-publish': res.data,
      }));
    } catch (error) {
      console.error('获取app更新状态失败：', error);
    }
  };
  useEffect(() => {
    getHttpMomentBadgeStatus();
  }, []);

  // WebSocket 初始化和消息处理
  // useEffect(() => {
  //   const handleMessage = (data: {
  //     key: MenuItemKey;
  //     show: boolean;
  //     type: 'UPDATE_BADGE';
  //   }) => {
  //     if (data.type === 'UPDATE_BADGE') {
  //       setBadges((prev) => ({
  //         ...prev,
  //         [data.key]: data.show,
  //       }));
  //     }
  //   };
  //
  //   ws.init('ws://localhost:10010/notice', { heartbeatInterval: 60 * 1000 });
  //   ws.onMessage(handleMessage);
  //
  //   return () => {
  //     ws.offMessage(handleMessage);
  //     ws.close();
  //   };
  // }, []);

  // 检查是否为活跃项（包括父子关系）
  const isActiveItem = (item: any) => {
    // 直接选中
    if (activeTab === item.key) return true;
    // 子项被选中时，父项也应该显示为选中
    if (item.children) {
      return item.children.some((child: any) => activeTab === child.key);
    }
    return false;
  };

  // 检查是否为直接选中的项（不包括父子关系）
  const isDirectlyActive = (itemKey: string) => {
    return activeTab === itemKey;
  };

  // 渲染菜单项
  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const isActive = isActiveItem(item);
    const isDirectActive = isDirectlyActive(item.key);

    return (
      <div key={item.key}>
        {['workspace'].includes(item?.key) ? (
          <div className="border-t my-6"></div>
        ) : null}

        {/* 父级菜单项 */}
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.key);
            } else {
              setActiveTab(item.key);
            }
          }}
          className={cn(
            'w-full flex items-center px-4 py-4 text-sm font-bold rounded-[12px] transition-colors cursor-pointer',
            level === 0 ? '' : 'ml-4',
            isDirectActive
              ? 'bg-primary text-primary-foreground'
              : isActive && hasChildren
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          <span className="mr-3">
            {MENU_ICONS[item.key] || <Package className="h-4 w-4" />}
          </span>
          <div className="flex-1 text-left">
            <span className="relative">
              {item.label}
              <div
                data-comment={`当前dom是根据socket来显示 >> ${badges['apps-publish']}`}
                datatype={`${item.key}`}
                className={cn(
                  'absolute -right-2 top-0 w-1.5 h-1.5 rounded-full bg-destructive',
                  ['apps-publish'].includes(item.key) && badges['apps-publish']
                    ? ''
                    : 'hidden',
                )}
              />
            </span>
          </div>
          {hasChildren && (
            <span className="ml-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
        </button>

        {/* 子级菜单项 */}
        {hasChildren && isExpanded && (
          <div className="ml-[44px] pt-2">
            {item.children?.map((child: any) => (
              <button
                key={child.key}
                onClick={() => setActiveTab(child.key)}
                className={cn(
                  'w-full flex items-center py-[11px] text-xs font-bold transition-colors cursor-pointer',
                  isDirectlyActive(child.key)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span>{child.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'w-[260px] bg-card shrink-0 px-[20px] py-[20px] border-r flex flex-col',
        className,
      )}
    >
      <nav className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </div>
  );
});
