import React, { useRef, useState, useEffect, memo } from 'react';
import { useParams } from 'react-router';
import {
  Package,
  MoreHorizontal,
  CirclePlus,
  FolderOpen,
  Megaphone,
  History,
  Upload as UploadIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  deleteAppApi,
  getProjectAppsApi,
  getAppsHistoryApi,
  type ProjectDetailDesignsAppsDto,
  type AppHistoryDto,
  modifyAppNameApi,
  createCopyAppApi,
  modifyAppIconApi,
} from './server';
import { useSize } from '@/hooks/useSize';
import { openCreateAppModal } from './components/CreateAppDialog';
import { openImportJsonModal } from './components/ImportJsonDialog';
import { openModalError, openModalWarning } from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import { InlineEditableText } from '@/components/common/InlineEditableText';
import {
  EnhancedTooltip,
  Timeline,
  EnhancedPopover as Popover,
  Dropdown,
  EnhancedAlert as Alert,
  EnhancedButton as Button,
  EnhancedAvatar,
  message,
  EnhancedSpinner as Spinner,
  Empty,
} from '@teamhelper/ui';
import { AppManagementSkeleton } from './Skeleton';
import TextFlipCarousel from './components/TextFlipCarousel';
import type { DynamicRoutingParameters } from '@/pages/ManageDetail/types.ts';
import ThMegaphoneIcon from '@/assets/icon/th_megaphone.svg?react';
import ThUpload from '@/components/common/ThUpload';
import { useRequest } from 'ahooks';
import { queryApplicationPermissionApi } from '@/common/server';

export const AppManagement: React.FC = memo(() => {
  const { project_id } = useParams<DynamicRoutingParameters>();
  const { t } = useTranslation('manageDetail');
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<ProjectDetailDesignsAppsDto[]>([]);
  const [historyData, setHistoryData] = useState<
    Record<number, AppHistoryDto[]>
  >({});
  const [historyLoading, setHistoryLoading] = useState<Record<number, boolean>>(
    {},
  );

  const titleRef = useRef<HTMLDivElement>(null);
  const { width } = useSize(titleRef);
  const titleW = React.useMemo(() => width, [width]);
  const isFocusRef = useRef(false);
  const isInputEmpty = useRef(false);

  async function initData() {
    try {
      const res = await getProjectAppsApi(Number(project_id), {
        page: 0,
        size: 9999,
      });
      setApps(res.data.content || []);
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initData();
  }, [project_id]);

  // 删除app
  async function delApp(app_id: number) {
    await openModalError({
      title: t('appManagement.delete.title'),
      content: t('appManagement.delete.confirmDesc'),
      onOkBeforeFunction: async () => {
        const statusData = await deleteAppApi(app_id);
        initData();
        return !!statusData.data;
      },
      onOk: () => {
        message.success(t('toast.delete.success'));
      },
    });
  }

  // 查看历史
  async function loadHistory(app_id: number) {
    setHistoryLoading((prev) => ({ ...prev, [app_id]: true }));
    try {
      const res = await getAppsHistoryApi(app_id);
      const data = Array.isArray(res.data) ? res.data : [];
      setHistoryData((prev) => ({ ...prev, [app_id]: data }));
    } catch (e) {
      console.error('Failed to load app history:', e);
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [app_id]: false }));
    }
  }

  async function modifyAppName(application_id: number, name: string) {
    try {
      await modifyAppNameApi(application_id, { name });
      initData();
    } catch (e) {
      console.error('Failed to modifyAppName:', e);
    }
  }

  async function createCopyApp(app_id: number) {
    try {
      const res = await createCopyAppApi(app_id);
      if (res.data) message.success(t('appManagement.copy.success'));
      initData();
    } catch (e) {
      console.error('Failed to createCopyApp:', e);
    }
  }

  const { data: appPermissionInfo, run: runQueryApplicationPermission } =
    useRequest(
      (appId: string | number | null) => {
        return queryApplicationPermissionApi(appId);
      },
      {
        manual: true,
      },
    );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 页面标题和操作按钮 */}
      <div className="shrink-0 p-5 pb-0">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center relative w-full">
            <div className="font-medium text-lg" ref={titleRef}>
              {t('menu.apps')}
            </div>
            <div
              className="absolute left-[70px] top-[-5px]"
              style={{ left: `${titleW}px` }}
            >
              <Alert
                icon={<ThMegaphoneIcon className="shrink-0" />}
                description={
                  <TextFlipCarousel
                    items={[
                      t('appManagement.tip1'),
                      t('appManagement.tip2'),
                      t('appManagement.tip3'),
                      t('appManagement.tip4'),
                      t('appManagement.tip5'),
                      t('appManagement.tip6'),
                      t('appManagement.tip7'),
                      t('appManagement.tip8'),
                    ]}
                    interval={3000}
                    duration={3000}
                    height={34}
                    fontSize={12}
                    direction="up"
                  />
                }
                closable
                classNames={{
                  body: 'ml-4 w-[448px] py-0',
                  content: 'min-w-0',
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                openImportJsonModal({
                  initData: initData,
                  project_id: Number(project_id),
                });
              }}
            >
              <FolderOpen />
              {t('appManagement.importJson')}
            </Button>

            <Button
              type="primary"
              onClick={() => {
                openCreateAppModal({
                  initData: initData,
                  project_id: Number(project_id),
                });
              }}
            >
              <CirclePlus className="h-6 w-6" />
              {t('appManagement.createApp')}
            </Button>
          </div>
        </div>
      </div>

      {/* 应用卡片网格 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto p-5 pt-0">
        {loading ? (
          <AppManagementSkeleton />
        ) : apps.length === 0 ? (
          <Empty description={t('common.nodata')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {apps.map((app, i) => {
              const id = app?.app_id;
              const appName = app?.name;
              const isEditing = app?.editing;
              const lastEditedDate = format(
                new Date(app?.last_edited_time),
                'yyyy-MM-dd',
              );
              return (
                <div
                  key={id}
                  className="relative bg-card rounded-[18px] border hover:shadow-md transition-shadow overflow-hidden"
                  onFocus={() => {
                    isFocusRef.current = true;
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      isFocusRef.current = false;
                    }, 0);
                  }}
                  onClick={() => {
                    if (isFocusRef?.current) return;
                    if (isEditing) {
                      openModalWarning({
                        title: t('app.status.editing.des'),
                        description: (
                          <div>
                            {t('app.user')}
                            <span className="text-foreground font-medium mx-1">
                              {app.user_name}
                            </span>
                            {t('app.status.editing.tips')}
                          </div>
                        ),
                        options: {
                          footerBtnPosition: 'block',
                          cancelText: null,
                          okText: '我知道了',
                        },
                      });
                    }
                  }}
                >
                  {/* 左上角状态角标 */}
                  {isEditing ? (
                    <EnhancedTooltip
                      title={
                        <div className="flex items-center gap-1">
                          <EnhancedAvatar size="small" src={app.avatar_url} />
                          <div>{app.user_name}</div>
                        </div>
                      }
                      className="absolute"
                    >
                      <div className="rounded-br-[16px] bg-[#FBA124] px-3 py-[5px] flex items-center cursor-default">
                        <div className="mr-1.5 bg-[#FFFCE9] w-4 h-4 rounded-full flex items-center justify-center ">
                          <div className="text-[#FBA124] text-xs font-medium scale-[0.8]">
                            {app?.user_name?.[0]}
                          </div>
                        </div>

                        <div className="text-xs font-medium text-primary-foreground">
                          {t('app.status.editing')}
                        </div>
                      </div>
                    </EnhancedTooltip>
                  ) : null}

                  <div className="p-6 pb-3.5">
                    {/* 右上角更多菜单 */}
                    <div className="flex items-start justify-end">
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'copy',
                              label: t('app.card.createCopy'),
                              cursorPointer: true,
                            },
                            {
                              key: 'edit',
                              label: t('globalWorkflow.actions.edit'),
                              cursorPointer: true,
                            },
                            {
                              key: 'delete',
                              label: t('globalWorkflow.actions.delete'),
                              danger: true,
                              cursorPointer: true,
                            },
                          ],
                          onClick({ key, domEvent }) {
                            domEvent.stopPropagation();
                            if (!appPermissionInfo?.editable) {
                              return message.error(t('tips.noPermission'));
                            }

                            switch (key) {
                              case 'copy':
                                createCopyApp(id);
                                return;
                              case 'edit':
                                openCreateAppModal({
                                  app_id: id,
                                  initData: initData,
                                  project_id: Number(project_id),
                                });
                                return;
                              case 'delete':
                                delApp(id);
                                return;
                            }
                          },
                        }}
                        placement="bottomRight"
                        overlayClassName="min-w-20"
                        onOpenChange={(open) => {
                          if (open) {
                            runQueryApplicationPermission(id);
                          }
                        }}
                      >
                        <Button className="rounded-full w-8 h-[18px] flex items-center justify-center bg-muted hover:bg-muted-foreground/10">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </Dropdown>
                    </div>

                    <div className="flex flex-col items-center mb-6">
                      <ThUpload
                        type="avatar"
                        accept=".jpg,.jpeg,.png"
                        multiple={false}
                        showUploadList={false}
                        crop
                        maxSizeMB={3}
                        onUploaded={async (fileKey) => {
                          try {
                            await modifyAppIconApi(id, {
                              icon_object_key: fileKey,
                            });
                            initData();
                          } catch (error) {
                            console.error('Failed to update app icon:', error);
                          }
                        }}
                      >
                        <div className="h-15 w-15 bg-blue-100 rounded-[12px] flex flex-col items-center justify-center mb-1 cursor-pointer relative overflow-hidden group">
                          {app.icon_url ? (
                            <img
                              src={app.icon_url}
                              alt="app icon"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-primary" />
                          )}

                          <div className="text-muted flex flex-col items-center justify-center gap-1 bg-foreground/30 absolute w-full h-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <UploadIcon className="w-4 h-4" />
                            <div className="text-xs scale-[0.83] font-medium">
                              {t('officialUsers.import.clickUpload')}
                            </div>
                          </div>
                        </div>
                      </ThUpload>

                      <div className="flex items-center relative">
                        <InlineEditableText
                          key={appName}
                          textClassName="max-w-[200px]"
                          defaultValue={appName}
                          onChange={(value) => {
                            const val = String(value || '').trim();
                            modifyAppName(id, val);
                            isInputEmpty.current = !val;
                          }}
                          editEmit={() => {
                            if (isInputEmpty.current) {
                              return false;
                            }
                            return true;
                          }}
                        />
                      </div>
                    </div>

                    {/* 作者与时间（居中） */}
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <EnhancedAvatar
                          size="26"
                          className="mr-1.5"
                          src={app?.avatar_url}
                          initialOnly
                        >
                          {app?.user_name?.[0]}
                        </EnhancedAvatar>

                        <div className="font-medium text-xs text-muted-foreground">
                          {app.user_name}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-muted-foreground text-center mt-1">
                        <div className="flex items-center gap-1 text-xs font-normal">
                          {t('app.card.updatedAt')}
                          <span>{lastEditedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 底部操作栏：仅保留历史版本 */}
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="px-5 py-1.5 flex items-center justify-between border-t border-under-line"
                  >
                    <div className="text-xs text-muted-foreground">
                      {t('appManagement.latestVersion')}
                      {app?.latest_version || t('appManagement.noVersion')}
                    </div>
                    <Popover
                      placement="bottomRight"
                      onOpenChange={(open) => {
                        if (open) loadHistory(id);
                      }}
                      content={
                        historyLoading[id] ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <Spinner spinning />
                          </div>
                        ) : (historyData[id] || []).length === 0 ? (
                          <div className="py-4">
                            <Empty description={t('common.nodata')} />
                          </div>
                        ) : (
                          <Timeline
                            className="h-[300px] overflow-auto  scrollbar-hide"
                            items={(historyData[id] || []).map(
                              (item, index) => ({
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
                              }),
                            )}
                            itemClassName="mb-6"
                          />
                        )
                      }
                      overlayClassName="min-w-[184px]"
                    >
                      <Button type="primary" ghost size="small">
                        <History className="w-4 h-4" />
                        <div className="text-xs">
                          {t('appManagement.historyVersions')}
                        </div>
                      </Button>
                    </Popover>
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
