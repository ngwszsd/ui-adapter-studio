import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { openPublishVersionModal } from './components/PublishVersionDialog.tsx';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader.tsx';
import { cn } from '@/lib/utils.ts';
import {
  Badge,
  EnhancedAvatar,
  EnhancedButton as Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EnhancedTooltip as Tooltip,
  type ColumnType,
} from '@teamhelper/ui';
import { ProTable } from '@/components/ProTable.tsx';
import {
  getAppsTestVersionsApi,
  type AppsTestVersionsDto,
  setCanTestApi,
  revokeTestApi,
} from '../server';
import { useManageDetailContext } from '@/pages/ManageDetail/context/ManageDetailContext.tsx';
import { format } from 'date-fns';

export const AppTestDetail: React.FC = () => {
  const { t, i18n } = useTranslation('manageDetail');
  const { pageParams } = useManageDetailContext();
  const { app_id, name, create_icon_url } = pageParams as {
    app_id: number;
    name: string;
    create_icon_url: string;
  };

  const [loading, setLoading] = useState<boolean>(false);
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: 10,
  });
  const [total, setTotal] = useState<number>(0);
  const [versionList, setVersionList] = useState<AppsTestVersionsDto[]>([]);
  const [testStatusLoading, setTestStatusLoading] = useState<
    Record<number, boolean>
  >({});

  const loadData = async () => {
    if (!app_id) return;

    try {
      setLoading(true);
      const res = await getAppsTestVersionsApi({
        app_id,
        page: pageInfo.page,
        size: pageInfo.size,
      });
      setTotal(res.data.total_elements);
      setVersionList(res.data.content);
    } catch (error) {
      console.error('load data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (app_id) loadData();
  }, [app_id, pageInfo.size, pageInfo.page]);

  const getStatusInfo = (testStatus: 1 | 2 | 3) => {
    if (testStatus === 2) {
      return {
        label: t('appTestDetail.status.testable'),
        color: 'bg-green-100 text-green-600',
      };
    }
    if (testStatus === 1) {
      return {
        label: t('appTestDetail.status.notTestable'),
        color: 'bg-gray-100 text-gray-600',
      };
    }
    if (testStatus === 3) {
      return {
        label: t('appTestDetail.status.canPublish'),
        color: 'bg-green-100 text-green-600',
      };
    }
    return {
      label: '',
      color: '',
    };
  };

  async function setTestStatus(row: AppsTestVersionsDto, isTestable: boolean) {
    try {
      setTestStatusLoading((prev) => ({ ...prev, [row.version_id]: true }));
      const params = {
        version_id: row.version_id,
        description: row.description,
        version_code: row.version_code,
      };
      isTestable ? await revokeTestApi(params) : await setCanTestApi(params);
      await loadData();
    } catch (error) {
      console.error('setTestStatus failed:', error);
    } finally {
      setTestStatusLoading((prev) => ({ ...prev, [row.version_id]: false }));
    }
  }
  const columns: ColumnType<AppsTestVersionsDto>[] = [
    {
      title: t('appTestDetail.table.columns.version'),
      dataIndex: 'version_code',
      key: 'version_code',
      width: 120,
    },
    {
      title: t('appTestDetail.table.columns.publisher'),
      key: 'publisher',
      width: 160,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record.publisher_icon_url ? (
            <img
              src={record.publisher_icon_url}
              className="w-8 h-8 rounded-full"
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
      title: t('appTestDetail.table.columns.status'),
      key: 'test_status',
      width: 140,
      render: (_, record) => {
        const statusInfo = getStatusInfo(record.test_status);
        return (
          <Badge
            className={cn(
              'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
              statusInfo.color,
            )}
            variant="outline"
          >
            <div className="text-xs">{statusInfo.label}</div>
          </Badge>
        );
      },
    },
    {
      title: t('appTestDetail.table.columns.time'),
      dataIndex: 'publish_time',
      key: 'publish_time',
      width: 180,
      render: (_, record) => {
        return record.publish_time
          ? format(new Date(record.publish_time), 'yyyy-MM-dd HH:mm')
          : null;
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
      width: i18n.language === 'zh' ? 250 : 366,
      fixed: 'right',
      render: (_, record) => {
        // 发布状态 1：不可发布  2：可测试 3：可发布
        const isReleasable = record.test_status === 3;
        // 测试状态 1：不可测试 2：可测试 3：可发布
        const isTestable = record.test_status === 2;
        const isZh = i18n.language === 'zh';
        const testButtonMinWidth = isZh ? 'min-w-[94px]' : 'min-w-[140px]';
        const publishButtonMinWidth = isZh ? 'min-w-[108px]' : 'min-w-[180px]';

        const isTestStatusLoading = testStatusLoading[record.version_id];

        return (
          <div className="flex gap-2.5">
            {/* 测试状态为不可测试时显示"设为可测试"按钮 */}
            {!isTestable && (
              <Button
                onClick={() => setTestStatus(record, isTestable)}
                size="small"
                loading={isTestStatusLoading}
                disabled={isTestStatusLoading || isReleasable}
                className={cn(
                  'text-primary border border-primary hover:text-primary/70 hover:border-primary/70',
                  testButtonMinWidth,
                )}
              >
                {t('appTestDetail.actions.makeTestable')}
              </Button>
            )}
            {/* 测试状态为可测试时显示"撤销测试"按钮 */}
            {isTestable && (
              <Button
                onClick={() => setTestStatus(record, isTestable)}
                type="text"
                size="small"
                loading={isTestStatusLoading}
                disabled={isTestStatusLoading}
                className={cn(
                  'text-destructive border border-destructive hover:text-destructive/70 hover:border-destructive/70',
                  testButtonMinWidth,
                )}
              >
                {t('appTestDetail.actions.revokeTesting')}
              </Button>
            )}
            {/* 发布状态为可发布时显示"可发布"按钮 */}
            {isReleasable && (
              <Tooltip
                title={t('appTestDetail.tooltip.releasableInfo')}
                triggerClassName="flex justify-center"
                overlayClassName="max-w-[200px]"
              >
                <Button
                  type="text"
                  size="small"
                  className={cn(
                    'text-muted-foreground hover:text-muted-foreground/70',
                    publishButtonMinWidth,
                  )}
                >
                  {t('appTestDetail.status.releasable')}
                </Button>
              </Tooltip>
            )}

            {/* 发布状态为不可发布时显示"转为可发布"按钮 */}
            {!isReleasable && (
              <Button
                disabled={isTestable}
                type="text"
                size="small"
                className={cn(
                  'text-green-500 border border-green-500 hover:text-green-500/70 hover:border-green-500/70',
                  publishButtonMinWidth,
                )}
                onClick={async () => {
                  await openPublishVersionModal({
                    version_id: record.version_id,
                    version_code: record.version_code,
                    description: record.description,
                    loadData,
                  });
                }}
              >
                {t('appTestDetail.actions.convertToReleasable')}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <PageHeader
        title={name}
        subTitle={t('appsPermissionsDetail.ui.back')}
        avatar={
          create_icon_url ? (
            <img
              src={create_icon_url}
              alt={name}
              className="h-8 w-8 rounded-full"
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

      <div className="flex-1 min-h-0 px-[15px] pb-6">
        <Card className="h-full flex flex-col border border-border rounded-[18px]">
          <CardHeader>
            <div className="flex items-center mb-6">
              <div className="text-lg font-medium text-foreground">
                {t('appTestDetail.ui.betaLabel')}
              </div>

              <Badge className="p-0 w-[46px] h-[18px] rounded-full flex items-center justify-center bg-gray-900 hover:bg-foreground ml-1.5 border-0">
                <div className="text-xs scale-[0.9] font-normal">Beta</div>
              </Badge>
            </div>

            <CardTitle>{t('appTestDetail.card.title.versionList')}</CardTitle>
          </CardHeader>
          <CardContent
            className="flex-1 min-h-0 flex flex-col"
            datatype={JSON.stringify(versionList)}
          >
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
