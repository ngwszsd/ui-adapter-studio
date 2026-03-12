import React, { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppsPermissionsSkeleton } from './Skeleton';
import { useManageDetailLayoutControlStore } from '@/pages/ManageDetail/store';
import { useParams } from 'react-router';
import { type PublishedAppListDto, getPublishedAppListApi } from './server';
import { format } from 'date-fns';
import { Empty, EnhancedAvatar } from '@teamhelper/ui';

export const AppsPermissions: React.FC = memo(() => {
  const { setPageFlag } = useManageDetailLayoutControlStore();
  const { t } = useTranslation('manageDetail');

  const { project_id } = useParams<{ project_id: string }>();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<PublishedAppListDto[]>([]);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await getPublishedAppListApi({
          project_id: project_id ? Number(project_id) : undefined,
          page: 0,
          size: 9999,
        });
        setApps(res.data.content);
      } catch (error) {
        console.error('Failed to load published apps:', error);
      } finally {
        setLoading(false);
      }
    };
    if (project_id) loadData();
  }, [project_id]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 页面标题与说明 */}
      <div className="shrink-0 p-5 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <div className="font-medium text-lg">
              {t('appsPermissions.title')}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {t('appsPermissions.description')}
            </div>
          </div>
        </div>
      </div>

      {/* 卡片网格 */}
      <div className="flex-1 overflow-y-auto p-5 pt-0">
        {loading ? (
          <AppsPermissionsSkeleton />
        ) : apps.length === 0 ? (
          <Empty description={t('common.nodata')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {apps.map((app) => {
              return (
                <div
                  className="relative bg-card rounded-[18px] border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setPageFlag('detail', {
                      app_id: app.app_id,
                      name: app.name,
                      icon_url: app.icon_url,
                      project_id: Number(project_id),
                    });
                  }}
                >
                  <div className="p-6">
                    {/* 图标与标题 */}
                    <div className="flex flex-col items-center">
                      {app.icon_url ? (
                        <img
                          src={app.icon_url}
                          alt={app.name}
                          className="h-15 w-15 object-cover rounded-[12px] mb-3"
                        />
                      ) : (
                        <EnhancedAvatar
                          autoColor={false}
                          className="bg-primary/10 h-15 w-15 rounded-[12px] mb-3"
                          shape="square"
                          initialOnly
                        >
                          {app.name}
                        </EnhancedAvatar>
                      )}
                      <div className="text-base font-medium truncate max-w-[200px]">
                        {app.name}
                      </div>
                    </div>
                  </div>

                  {/* 底部信息 */}
                  <div className="flex flex-col px-5 pb-3.5">
                    <div className="flex items-center">
                      {app.create_icon_url ? (
                        <img
                          className="w-[26px] h-[26px] rounded-full mr-1.5"
                          src={app.create_icon_url}
                          alt={app.create_user_name}
                        />
                      ) : (
                        <EnhancedAvatar
                          className="w-[26px] h-[26px] mr-1.5"
                          initialOnly
                        >
                          {app.create_user_name}
                        </EnhancedAvatar>
                      )}

                      <div className="font-medium text-xs text-muted-foreground">
                        {app.create_user_name}
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs text-muted-foreground text-center mt-1">
                      <div className="flex items-center text-xs font-normal">
                        {t('appsPermissions.versionLabel')}
                        {app.current_version_code}
                      </div>

                      <div className="flex items-center text-xs font-normal">
                        {t('appsPermissions.releaseAtLabel')}
                        {app.publish_time &&
                          format(
                            new Date(app.publish_time),
                            'yyyy-MM-dd HH:mm',
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
