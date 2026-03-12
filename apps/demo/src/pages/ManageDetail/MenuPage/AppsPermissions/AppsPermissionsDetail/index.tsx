// 顶部导入部分
import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { openMembersConfigModal } from './components/MembersConfigDialog.tsx';
import { useTranslation } from 'react-i18next';
import {
  List,
  openTipsModal,
  EnhancedAvatar as Avatar,
  EnhancedButton as Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
} from '@teamhelper/ui';
import { PageHeader } from '@/components/PageHeader';
import {
  getAppsVersionUserListApi,
  type AppVersionUsers,
  type ViewUserListParams,
} from '../server';
import { useManageDetailContext } from '@/pages/ManageDetail/context/ManageDetailContext.tsx';
export const AppsPermissionsDetail: React.FC = () => {
  const { t } = useTranslation('manageDetail');
  const { pageParams } = useManageDetailContext();
  const { app_id, name, icon_url, project_id } = pageParams as {
    app_id: number;
    name: string;
    icon_url: string;
    project_id: number;
  };
  const [users, setUsers] =
    useState<Record<ViewUserListParams['allowed_flag'], AppVersionUsers[]>>();

  // 获取用户列表数据
  const fetchUsersList = async () => {
    try {
      const [allowedResponse, disabledResponse] = await Promise.all([
        getAppsVersionUserListApi({ allowed_flag: 1, app_id }),
        getAppsVersionUserListApi({ allowed_flag: 0, app_id }),
      ]);

      setUsers({
        1: allowedResponse.data || [],
        0: disabledResponse.data || [],
      });
    } catch (error) {
      console.error('Failed to fetch users list:', error);
    }
  };

  useEffect(() => {
    const idleCallbackId = requestIdleCallback(() => {
      fetchUsersList();
    });

    return () => {
      cancelIdleCallback(idleCallbackId);
    };
  }, []);

  // 打开“用户列表”弹窗
  const handleOpenUserList = async (
    allowed_flag: ViewUserListParams['allowed_flag'],
  ) => {
    const data = users?.[allowed_flag] || [];
    await openTipsModal(
      data.length === 0 ? (
        <Empty description={t('common.nodata')} />
      ) : (
        <List
          dataSource={data}
          estimatedItemSize={26}
          containerHeight={178}
          itemGap={6}
          renderItem={(u, i) => (
            <div className="flex items-center">
              <Avatar className="mr-3" initialOnly size="26">
                {u?.user_name}
              </Avatar>
              <div className="text-xs text-foreground">{u?.user_name}</div>
            </div>
          )}
          className="border border-border rounded-[4px] p-3"
        />
      ),
      {
        title: t('appsPermissionsDetail.modal.userList.title'),
        okText: t('appsPermissionsDetail.modal.userList.close'),
        cancelText: null,
        classNames: {
          content: 'w-[428px]',
        },
      },
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <PageHeader
        title={name}
        subTitle={t('appsPermissionsDetail.ui.back')}
        avatar={
          icon_url ? (
            <img
              src={icon_url}
              alt={name}
              className="h-8 w-8 object-cover rounded-full"
            />
          ) : (
            <Avatar
              icon={<Package className="h-4 w-4 text-primary" />}
              autoColor={false}
              className="bg-primary/10"
              shape="square"
            />
          )
        }
      />

      {/* 主体内容 */}
      <div className="flex-1 min-h-0 px-[15px] pb-6">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>{t('appsPermissionsDetail.title.range')}</CardTitle>
          </CardHeader>

          <CardContent>
            {/* 两列内容区：可用成员 / 禁用成员 */}
            <div className="border-t border-border flex items-center">
              {/* 可用成员 */}
              <div className="pt-6">
                <div className="text-base font-medium mb-4">
                  {t('appsPermissionsDetail.availableMembers')}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm font-normal mr-6">
                    {t('appsPermissionsDetail.available.scopeAll')}
                  </div>

                  <div className="space-x-3">
                    <Button
                      type="link"
                      className="px-0"
                      onClick={async () => {
                        openMembersConfigModal({
                          initialMode: 'available',
                          fetchUsersList,
                          project_id,
                          app_id: Number(app_id),
                        });
                      }}
                    >
                      {t('appsPermissionsDetail.actions.config')}
                    </Button>

                    <Button
                      type="link"
                      className="px-0"
                      onClick={() => handleOpenUserList(1)}
                    >
                      {t('appsPermissionsDetail.actions.viewUserList')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="w-[1px] h-[34px] border-l border-border mx-[26px] mt-3"></div>

              {/* 禁用成员 */}
              <div className="pt-6">
                <div className="text-base font-medium mb-4">
                  {t('appsPermissionsDetail.disabledMembers')}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm font-normal mr-6">
                    {t('appsPermissionsDetail.disabled.scopePartial')}
                  </div>

                  <div className="space-x-3">
                    <Button
                      type="link"
                      className="px-0"
                      onClick={async () => {
                        openMembersConfigModal({
                          initialMode: 'not_available',
                          fetchUsersList,
                          project_id,
                          app_id: Number(app_id),
                        });
                      }}
                    >
                      {t('appsPermissionsDetail.actions.config')}
                    </Button>

                    <Button
                      type="link"
                      className="px-0"
                      onClick={() => handleOpenUserList(0)}
                    >
                      {t('appsPermissionsDetail.actions.viewMembersList')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppsPermissionsDetail;
