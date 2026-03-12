import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import {
  message,
  openModalError,
  openModalWarning,
  openModalWarning02,
} from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader.tsx';
import { ProTable } from '@/components/ProTable.tsx';
import { cn } from '@/lib/utils.ts';
import {
  type AppVersionsListForVersionDto,
  getProjectAppsVersionsForVersionApi,
  revokeCurrentApi,
  rollbackTestApi,
  useCurrentVersionApi,
} from '../server';
import {
  EnhancedButton as Button,
  EnhancedAvatar,
  type ColumnType,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';
import { format } from 'date-fns';
import { useManageDetailContext } from '@/pages/ManageDetail/context/ManageDetailContext.tsx';
export const VersionManagementDetail: React.FC = () => {
  const { t, i18n } = useTranslation('manageDetail');
  const { pageParams } = useManageDetailContext();
  const { app_id, name, icon_url } = pageParams as {
    app_id: number;
    name: string;
    icon_url: string;
  };
  const [loading, setLoading] = useState<boolean>(true);
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: 10,
  });
  const [total, setTotal] = useState<number>(0);
  const [versionList, setVersionList] = useState<
    AppVersionsListForVersionDto[]
  >([]);
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getProjectAppsVersionsForVersionApi({
        app_id, // 替换为实际的 app_id
        page: pageInfo.page,
        size: pageInfo.size,
      });
      setTotal(res.data.total_elements);
      setVersionList(res.data.content);
    } catch (error) {
      console.error('load data faild:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (app_id) loadData();
  }, [app_id, pageInfo.size, pageInfo.page]);
  // 列配置
  const columns: ColumnType<AppVersionsListForVersionDto>[] = [
    {
      title: t('versionManagementDetail.table.columns.version'),
      key: 'version_code',
      dataIndex: 'version_code',
      width: i18n.language === 'zh' ? 180 : 226,
      render: (_, record, index) => {
        const isCurrent = record.current_prod_flag === 1;
        return (
          <div className="flex items-center gap-2">
            <span>{record.version_code}</span>
            {isCurrent ? (
              <Badge
                className={cn(
                  'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit',
                  'bg-primary/10 text-primary',
                )}
                variant="outline"
              >
                <div className="text-xs">
                  {t('versionManagementDetail.ui.currentVersionBadge')}
                </div>
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      title: t('appTestDetail.table.columns.publisher'),
      key: 'publisher_name',
      dataIndex: 'publisher_name',
      width: 160,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record.publisher_icon ? (
            <img
              src={record.publisher_icon}
              alt={record.publisher_name}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <EnhancedAvatar size="default" initialOnly>
              {record.publisher_name}
            </EnhancedAvatar>
          )}
          <div className="text-sm">{record.publisher_name}</div>
        </div>
      ),
    },
    {
      title: t('appTestDetail.table.columns.time'),
      dataIndex: 'publish_time',
      key: 'publish_time',
      width: 180,
      render: (_, record) => {
        return record.publish_time
          ? format(new Date(record.publish_time), 'yyyy-MM-dd HH:mm')
          : '';
      },
    },
    {
      title: t('appTestDetail.table.columns.desc'),
      dataIndex: 'description',
      key: 'description',
      width: 300,
    },
    {
      title: t('appTestDetail.table.columns.actions'),
      key: 'actions',
      width: i18n.language === 'zh' ? 280 : 430,
      fixed: 'right',
      render: (_, record, index) => {
        let renderDom;
        switch (record.current_prod_flag) {
          case 0:
            renderDom = (
              <>
                <Button
                  size="small"
                  className={cn(
                    'text-primary border border-primary hover:text-primary/70 hover:border-primary/70',
                    {},
                  )}
                  onClick={() => {
                    openModalWarning02({
                      title: t(
                        'versionManagementDetail.confirm.useCurrentVersion.title',
                      ),
                      content: t(
                        'versionManagementDetail.confirm.useCurrentVersion.desc',
                      ),
                      onOkBeforeFunction: async () => {
                        const statusData = await useCurrentVersionApi({
                          version_id: record.id,
                        });
                        loadData();
                        message.success(t('toast.op.success'));
                        return !!statusData.data;
                      },
                    });
                  }}
                >
                  {t('versionManagementDetail.actions.useCurrentVersion')}
                </Button>

                <Button
                  type="text"
                  size="small"
                  className="text-primary border border-primary hover:text-primary/70 hover:border-primary/70"
                  onClick={() => {
                    openModalError({
                      title: t(
                        'versionManagementDetail.confirm.backTest.title',
                      ),
                      content: t(
                        'versionManagementDetail.confirm.toTesting.desc',
                      ),
                      onOkBeforeFunction: async () => {
                        const statusData = await rollbackTestApi({
                          version_id: record.id,
                        });
                        loadData();
                        message.success(t('toast.op.success'));
                        return !!statusData.data;
                      },
                    });
                  }}
                >
                  {t('versionManagementDetail.actions.returnToTestEnv')}
                </Button>
              </>
            );
            break;
          case 1:
            renderDom = (
              <>
                <Button
                  type="text"
                  size="small"
                  className="text-destructive border border-destructive hover:text-destructive/70 hover:border-destructive/70"
                  onClick={() => {
                    openModalWarning({
                      title: t(
                        'versionManagementDetail.confirm.revokeCurrentVersion.title',
                      ),
                      description: t(
                        'versionManagementDetail.confirm.revokeCurrentVersion.warning3',
                      ),
                      options: {
                        footerBtnPosition: 'block',
                      },
                      onOkBeforeFunction: async () => {
                        const statusData = await revokeCurrentApi({
                          version_id: record.id,
                        });
                        message.success(t('toast.op.success'));
                        loadData();
                        return !!statusData.data;
                      },
                    });
                  }}
                >
                  {t('versionManagementDetail.actions.revokeCurrentVersion')}
                </Button>

                <Button
                  type="text"
                  size="small"
                  disabled
                  className="text-primary border border-primary hover:text-primary/70 hover:border-primary/70"
                  onClick={() => {
                    // openModalError({
                    //   title: '是否退回测试环境？',
                    //   content: '确认后当前版本回退到应用测试中。',
                    // });
                  }}
                >
                  {t('versionManagementDetail.actions.returnToTestEnv')}
                </Button>
              </>
            );
            break;
        }

        return <div className="flex items-center gap-[14px]">{renderDom}</div>;
      },
    },
  ];

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
            <EnhancedAvatar
              icon={<Package className="h-4 w-4 text-primary" />}
              autoColor={false}
              className="bg-primary/10"
              shape="square"
            />
          )
        }
      />

      {/* 列表卡片 */}
      <div className="flex-1 min-h-0 px-[15px] pb-6">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center mb-6">
              <div className="text-lg font-medium text-foreground">
                {t('versionManagementDetail.ui.releaseLabel')}
              </div>
            </div>
            <CardTitle>{t('appTestDetail.card.title.versionList')}</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 min-h-0 flex flex-col">
            <ProTable
              loading={loading}
              columns={columns}
              dataSource={versionList}
              rowKey="version_id"
              pagination={{
                current: pageInfo.page,
                pageSize: pageInfo.size,
                total,
              }}
              onChange={(pagination) => {
                setPageInfo({
                  page: pagination.current,
                  size: pagination.pageSize,
                });
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VersionManagementDetail;
