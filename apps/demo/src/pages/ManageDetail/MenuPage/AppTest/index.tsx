import React, { type FC, useState, useEffect, memo } from 'react';
import { Package, MoreHorizontal, CircleUser, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  EnhancedAvatar,
  EnhancedButton as Button,
  Dropdown,
  Badge,
  Empty,
  EnhancedPopover as Popover,
  Timeline,
  EnhancedSpinner as Spinner,
} from '@teamhelper/ui';
import betaIcon from '@/assets/img/beta@2x.webp';
import { AppTestSkeleton } from './Skeleton';
import { useManageDetailLayoutControlStore } from '@/pages/ManageDetail/store';
import {
  getAppsTestListApi,
  type AppsTestListDto,
  getAppTestVersionListApi,
  type VersionListDto,
} from './server';
import { useParams } from 'react-router';
import { format } from 'date-fns';

export const AppTest: FC = memo(() => {
  const { t } = useTranslation('manageDetail');
  const { setPageFlag } = useManageDetailLayoutControlStore();
  const { project_id } = useParams<{ project_id: string }>();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<AppsTestListDto[]>([]);
  const [historyData, setHistoryData] = useState<
    Record<string, VersionListDto[]>
  >({});
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>(
    {},
  );

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await getAppsTestListApi({
          project_id: project_id ? Number(project_id) : undefined,
          page: 0,
          size: 9999,
        });
        setApps(res.data.content);
      } catch (error) {
        console.error('Failed to load test apps:', error);
      } finally {
        setLoading(false);
      }
    };
    if (project_id) loadData();
  }, [project_id]);

  // 查看历史
  async function loadHistory(app_id: number, type: 1 | 2) {
    const key = `${app_id}-${type}`;
    // if (historyData[key]) return; // 已加载过，不重复请求
    setHistoryLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await getAppTestVersionListApi({ app_id, type });
      const data = Array.isArray(res.data) ? res.data : [];
      setHistoryData((prev) => ({ ...prev, [key]: data }));
    } catch (e) {
      console.error('Failed to load version history:', e);
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 页面标题和操作按钮 */}
      <div className="shrink-0 p-5 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <div className="font-medium text-lg">{t('appTest.title')}</div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {t('appTest.description')}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button>
              <Download className="h-4 w-4" />
              {t('appTest.downloadPackage')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setPageFlag('users', { project_id });
              }}
            >
              <CircleUser className="h-4 w-4" />
              {t('appTest.manageTestUsers')}
            </Button>
          </div>
        </div>
      </div>
      {/* 应用卡片网格 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto p-5 pt-0">
        {loading ? (
          <AppTestSkeleton />
        ) : apps.length === 0 ? (
          <Empty description={t('common.nodata')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {apps.map((app, i) => {
              return (
                <div
                  key={app.app_id}
                  className="relative bg-card rounded-[18px] border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setPageFlag('detail', {
                      app_id: app.app_id,
                      name: app.name,
                      create_icon_url: app.create_icon_url,
                      project_id,
                    });
                  }}
                >
                  {/* 左上角状态角标 */}
                  {app.new_flag === 1 && (
                    <div className="absolute top-3.5 left-3.5">
                      <Badge
                        variant="destructive"
                        className="hover:bg-destructive p-0 w-[46px] h-5 rounded-full flex items-center justify-center"
                      >
                        <div className="text-xs scale-[0.83] font-normal">
                          New
                        </div>
                      </Badge>
                    </div>
                  )}
                  <div className="p-6">
                    {/* 右上角更多菜单 */}
                    <div className="flex items-start justify-end">
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'version',
                              label: t('appTest.dropdown.versionManagement'),
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
                                  create_icon_url: app.create_icon_url,
                                  project_id,
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
                    {/* 应用图标与标题（居中） */}
                    <div className="flex flex-col items-center">
                      {app.icon_url ? (
                        <img
                          src={app.icon_url}
                          alt={app.name}
                          className="h-15 w-15 object-cover rounded-[12px] mb-3"
                        />
                      ) : (
                        <EnhancedAvatar
                          icon={<Package className="h-6 w-6 text-primary" />}
                          autoColor={false}
                          className="bg-primary/10 h-15 w-15 rounded-[12px] mb-3"
                          shape="square"
                        />
                      )}
                      <div className="flex items-center">
                        <div className="text-base font-medium truncate max-w-[200px]">
                          {app.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col border-t border-border px-5 py-3.5 relative">
                    <div className="flex items-center">
                      {app.create_icon_url ? (
                        <img
                          className="rounded-full w-[26px] h-[26px] mr-1.5"
                          src={app.create_icon_url}
                          alt={app.create_user_name}
                        />
                      ) : (
                        <EnhancedAvatar
                          size="26"
                          className="mr-1.5"
                          initialOnly
                        >
                          {app.create_user_name}
                        </EnhancedAvatar>
                      )}

                      <div className="font-medium text-xs text-muted-foreground">
                        {app.create_user_name}
                      </div>
                    </div>
                    <div
                      className="space-y-0.5 text-xs text-muted-foreground text-center mt-1"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {/*可发布版本*/}
                      <div className="flex items-center text-xs font-normal">
                        {t('appTest.releasableCount.text')}
                        <Popover
                          placement="bottomLeft"
                          onOpenChange={(open) => {
                            if (open) loadHistory(app.app_id, 1);
                          }}
                          content={
                            historyLoading[`${app.app_id}-1`] ? (
                              <div className="py-4 text-center">
                                <Spinner spinning />
                              </div>
                            ) : (historyData[`${app.app_id}-1`] || [])
                                .length === 0 ? (
                              <div className="py-4">
                                <Empty description={t('common.nodata')} />
                              </div>
                            ) : (
                              <Timeline
                                className="h-[300px] overflow-auto scrollbar-hide"
                                items={(
                                  historyData[`${app.app_id}-1`] || []
                                ).map((item, index) => ({
                                  label: (
                                    <div
                                      className={`rounded-[4px] ${index === 0 ? 'bg-[#EBF4FF]' : 'bg-[#FFF6EB]'} px-2 flex items-center justify-center w-fit py-0.5`}
                                    >
                                      <div
                                        className={`text-xs ${index === 0 ? 'text-primary' : 'text-[#EE7B30]'}`}
                                      >
                                        {index === 0
                                          ? t('appManagement.timeline.current')
                                          : t('appManagement.timeline.history')}
                                      </div>
                                    </div>
                                  ),
                                  children: (
                                    <div className="mt-3">
                                      <div className="text-[#165DFF] text-xs">
                                        {item.version}
                                      </div>
                                      <div className="mt-1.5">
                                        <div className="flex items-center">
                                          <EnhancedAvatar
                                            size="18"
                                            className="mr-1.5"
                                            src={item.creator_avatar_url}
                                            initialOnly
                                          >
                                            {item.creator_name?.[0]}
                                          </EnhancedAvatar>
                                          <div className="text-[#718096] text-xs">
                                            {item.creator_name}
                                          </div>
                                        </div>
                                        {item.version_description && (
                                          <div className="text-[#A0AEC0] text-xs mt-1">
                                            {item.version_description}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-[#718096] text-xs mt-1.5">
                                        {format(
                                          new Date(item.created_at),
                                          'yyyy-MM-dd',
                                        )}
                                      </div>
                                    </div>
                                  ),
                                  color: index === 0 ? '#165DFF' : '#D3D3D8',
                                }))}
                                itemClassName="mb-6"
                              />
                            )
                          }
                          overlayClassName="min-w-[184px]"
                        >
                          <Button
                            size="small"
                            type="link"
                            className="text-xs py-0 px-1 font-medium h-auto"
                          >
                            {app.publishable_version_count}
                          </Button>
                        </Popover>
                        {t('appTest.releasableCount.unit')}
                      </div>
                      {/*可测试版本*/}
                      <div className="flex items-center text-xs font-normal">
                        {t('appTest.testableCount.text')}
                        <Popover
                          placement="bottomLeft"
                          onOpenChange={(open) => {
                            if (open) loadHistory(app.app_id, 2);
                          }}
                          content={
                            historyLoading[`${app.app_id}-2`] ? (
                              <div className="py-4 text-center">
                                <Spinner spinning />
                              </div>
                            ) : (historyData[`${app.app_id}-2`] || [])
                                .length === 0 ? (
                              <div className="py-4">
                                <Empty description={t('common.nodata')} />
                              </div>
                            ) : (
                              <Timeline
                                className="h-[300px] overflow-auto scrollbar-hide"
                                items={(
                                  historyData[`${app.app_id}-2`] || []
                                ).map((item, index) => ({
                                  label: (
                                    <div
                                      className={`rounded-[4px] ${index === 0 ? 'bg-[#EBF4FF]' : 'bg-[#FFF6EB]'} px-2 flex items-center justify-center w-fit py-0.5`}
                                    >
                                      <div
                                        className={`text-xs ${index === 0 ? 'text-primary' : 'text-[#EE7B30]'}`}
                                      >
                                        {index === 0
                                          ? t('appManagement.timeline.current')
                                          : t('appManagement.timeline.history')}
                                      </div>
                                    </div>
                                  ),
                                  children: (
                                    <div className="mt-3">
                                      <div className="text-[#165DFF] text-xs">
                                        {item.version}
                                      </div>
                                      <div className="mt-1.5">
                                        <div className="flex items-center">
                                          <EnhancedAvatar
                                            size="18"
                                            className="mr-1.5"
                                            src={item.creator_avatar_url}
                                            initialOnly
                                          >
                                            {item.creator_name?.[0]}
                                          </EnhancedAvatar>
                                          <div className="text-[#718096] text-xs">
                                            {item.creator_name}
                                          </div>
                                        </div>
                                        {item.version_description && (
                                          <div className="text-[#A0AEC0] text-xs mt-1">
                                            {item.version_description}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-[#718096] text-xs mt-1.5">
                                        {format(
                                          new Date(item.created_at),
                                          'yyyy-MM-dd',
                                        )}
                                      </div>
                                    </div>
                                  ),
                                  color: index === 0 ? '#165DFF' : '#D3D3D8',
                                }))}
                                itemClassName="mb-6"
                              />
                            )
                          }
                          overlayClassName="min-w-[184px]"
                        >
                          <Button
                            size="small"
                            type="link"
                            className="text-xs py-0 px-1 font-medium h-auto"
                          >
                            {app.testable_version_count}
                          </Button>
                        </Popover>
                        {t('appTest.testableCount.unit')}
                      </div>
                    </div>

                    <div className="absolute right-3 bottom-3">
                      <img
                        src={betaIcon}
                        alt="beta"
                        className="w-[93px] object-cover"
                        draggable={false}
                      />
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
