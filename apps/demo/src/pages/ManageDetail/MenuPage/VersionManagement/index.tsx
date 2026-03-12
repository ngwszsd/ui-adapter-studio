import React, { useState, useEffect } from 'react';
import { Package, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  EnhancedButton as Button,
  EnhancedAvatar as Avatar,
  Dropdown,
  Badge,
  Empty,
} from '@teamhelper/ui';
import { VersionManagementSkeleton } from './Skeleton';
import { useManageDetailLayoutControlStore } from '@/pages/ManageDetail/store';
import {
  type AppsListForVersionDto,
  getProjectAppsForVersionApi,
} from '@/pages/ManageDetail/MenuPage/VersionManagement/server.ts';
import { useParams } from 'react-router';

export const VersionManagement: React.FC = () => {
  const { setPageFlag } = useManageDetailLayoutControlStore();
  const { t } = useTranslation('manageDetail');
  const [loading, setLoading] = useState(true);
  const { project_id } = useParams<{ project_id: string }>();
  const [apps, setApps] = useState<AppsListForVersionDto[]>([]);
  // 模拟数据加载
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await getProjectAppsForVersionApi({
          page: 0,
          size: 9999,
          project_id: Number(project_id),
        });
        setApps(res.data.content);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    if (project_id) loadData();
  }, [project_id]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 p-5 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <div className="font-medium text-lg">
              {t('versionManagement.title')}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {t('versionManagement.description')}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5 pt-0">
        {loading ? (
          <VersionManagementSkeleton />
        ) : apps.length === 0 ? (
          <Empty description={t('common.nodata')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {apps.map((app, i) => {
              const isPublished = !!app.current_version_code;
              return (
                <div
                  key={app.app_id}
                  className="relative bg-card rounded-[18px] border hover:shadow-md transition-shadow  cursor-pointer overflow-hidden"
                  onClick={() => {
                    setPageFlag('detail', {
                      app_id: app.app_id,
                      name: app.name,
                      icon_url: app.icon_url,
                    });
                  }}
                >
                  {/* 左上角版本/状态标识 */}
                  <div
                    className={`absolute top-0 left-0 rounded-br-[16px] px-5 min-h-7 flex items-center ${
                      isPublished ? 'bg-[#EDF3FF]' : 'bg-muted'
                    }`}
                  >
                    <div
                      className={`text-xs font-medium ${
                        isPublished ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {isPublished
                        ? t('versionManagement.currentVersion', {
                            version: app.current_version_code,
                          })
                        : t('versionManagement.unpublished')}
                    </div>
                  </div>

                  {/* 右上角更多菜单 */}
                  <div className="p-5 pb-0 flex items-start justify-end">
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'version',
                            label: t('versionManagement.title'),
                            cursorPointer: true,
                          },
                        ],
                        onClick({ key, domEvent }) {
                          domEvent.stopPropagation();
                          switch (key) {
                            case 'version':
                              setPageFlag('detail', {
                                app_id: app.app_id,
                                name: app.name,
                                icon_url: app.icon_url,
                              });
                              return;
                          }
                        },
                      }}
                      placement="bottomRight"
                      overlayClassName="min-w-20"
                    >
                      <Button className="rounded-full w-8 h-[18px] flex items-center justify-center bg-muted hover:bg-muted-foreground/10">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </Dropdown>
                  </div>

                  {/* 图标与名称 */}
                  <div className="px-5 pt-3.5 pb-8 flex flex-col items-center">
                    {app.icon_url ? (
                      <img
                        src={app.icon_url}
                        alt={app.name}
                        className="h-15 w-15 rounded-[12px] object-cover mb-3"
                      />
                    ) : (
                      <Avatar
                        icon={<Package className="h-6 w-6 text-primary" />}
                        autoColor={false}
                        className="bg-primary/10 h-15 w-15 rounded-[12px] mb-3"
                        shape="square"
                      />
                    )}
                    <div className="text-base font-medium truncate max-w-[200px]">
                      {app.name}
                    </div>

                    <Badge
                      style={app.new_flag === 1 ? {} : { visibility: 'hidden' }}
                      variant="destructive"
                      className="hover:bg-destructive p-0 w-[46px] h-5 rounded-full flex items-center justify-center mt-2"
                    >
                      <div className="text-xs scale-[0.83] font-normal">
                        New
                      </div>
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
