import React from 'react';
import { ProTable } from '@/components/ProTable';
import {
  EnhancedButton,
  EnhancedSelect,
  SearchInput,
  EnhancedAvatar,
  EnhancedPopover,
  Dropdown,
  EnhancedCard,
  Progress,
  Badge,
  EnhancedTooltip,
  openModalError,
  openTipsModal,
} from '@teamhelper/ui';
import type { ColumnType } from '@teamhelper/ui';
import { Package, BarChart3, Users, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router';

interface SubApp {
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: React.ReactNode;
}

interface PackagingRecord {
  id: string;
  version: string;
  description: string;
  status: 'released' | 'unreleased';
  releaseTime: string;
  publisher: {
    name: string;
    avatarColor: string;
  };
  subApps: SubApp[];
  packagingStatus: 'packaging' | 'completed' | 'failed';
  progress?: number;
}

const mockData: PackagingRecord[] = [
  {
    id: '1',
    version: 'v.2.3.3',
    description: '修复了数据导出时的格式错误问题',
    status: 'released',
    releaseTime: '2025-09-16 15:34',
    publisher: { name: '李明', avatarColor: 'bg-orange-100 text-orange-600' },
    subApps: [
      {
        id: 'sa1',
        name: '数据分析模块',
        version: 'v2.1.0',
        description: '修复了数据导出时的格式错误问题',
        icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
      },
      {
        id: 'sa2',
        name: '用户管理',
        version: 'v2.1.0',
        description: '新增实时监控仪表盘功能',
        icon: <Users className="h-5 w-5 text-orange-500" />,
      },
      {
        id: 'sa3',
        name: '系统设置',
        version: 'v1.0.0',
        description: '基础设置功能',
      },
    ],
    packagingStatus: 'packaging',
    progress: 40,
  },
  {
    id: '2',
    version: 'v.2.3.2',
    description: '新增实时监控仪表盘功能，优化了系统性能',
    status: 'unreleased',
    releaseTime: '2025-10-09 15:34',
    publisher: { name: '王芳芳', avatarColor: 'bg-blue-100 text-blue-600' },
    subApps: [
      {
        id: 'sa1',
        name: '数据分析模块',
        version: 'v2.1.0',
        description: '修复了数据导出时的格式错误问题',
        icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
      },
      {
        id: 'sa2',
        name: '用户管理',
        version: 'v2.1.0',
        description: '新增实时监控仪表盘功能',
        icon: <Users className="h-5 w-5 text-orange-500" />,
      },
      {
        id: 'sa3',
        name: '系统设置',
        version: 'v1.0.0',
        description: '基础设置功能',
      },
      {
        id: 'sa4',
        name: '日志模块',
        version: 'v1.0.0',
        description: '日志记录',
      },
    ],
    packagingStatus: 'completed',
  },
  {
    id: '3',
    version: 'v.2.3.1',
    description: '修复了数据导出时的格式错误问题',
    status: 'unreleased',
    releaseTime: '2025-10-23 15:34',
    publisher: { name: '张磊', avatarColor: 'bg-green-100 text-green-600' },
    subApps: [
      {
        id: 'sa1',
        name: '数据分析模块',
        version: 'v2.1.0',
        description: '修复了数据导出时的格式错误问题',
        icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
      },
      {
        id: 'sa2',
        name: '用户管理',
        version: 'v2.1.0',
        description: '新增实时监控仪表盘功能',
        icon: <Users className="h-5 w-5 text-orange-500" />,
      },
    ],
    packagingStatus: 'failed',
  },
  {
    id: '4',
    version: 'v.2.3.0',
    description: '新增实时监控仪表盘功能',
    status: 'unreleased',
    releaseTime: '2025-10-23 15:34',
    publisher: { name: '李明', avatarColor: 'bg-orange-100 text-orange-600' },
    subApps: [
      {
        id: 'sa1',
        name: '数据分析模块',
        version: 'v2.1.0',
        description: '修复了数据导出时的格式错误问题',
        icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
      },
      {
        id: 'sa2',
        name: '用户管理',
        version: 'v2.1.0',
        description: '新增实时监控仪表盘功能',
        icon: <Users className="h-5 w-5 text-orange-500" />,
      },
    ],
    packagingStatus: 'completed',
  },
];

export const ApplicationPackaging = () => {
  const [dateRange, setDateRange] = React.useState<string>();
  const [selectedApp, setSelectedApp] = React.useState<string>();
  const [searchText, setSearchText] = React.useState<string>();
  const navigate = useNavigate();

  const columns: ColumnType<PackagingRecord>[] = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '版本描述',
      dataIndex: 'description',
      width: 200,
      render: (text: string) => (
        <EnhancedTooltip title={text}>
          <span className="max-w-50 truncate block">{text}</span>
        </EnhancedTooltip>
      ),
    },
    {
      title: '发布状态',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => (
        <Badge
          variant="outline"
          className={`px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0 ${
            status === 'released'
              ? 'bg-blue-50 text-primary'
              : 'bg-green-50 text-green-500'
          }`}
        >
          <span className="text-xs">
            {status === 'released' ? '发布版' : '未发布版'}
          </span>
        </Badge>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'releaseTime',
      width: 180,
      render: (text: string) => text || '-',
    },
    {
      title: '发布人',
      dataIndex: 'publisher',
      width: 150,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <EnhancedAvatar>{record.publisher.name.charAt(0)}</EnhancedAvatar>
          <span className="text-sm">{record.publisher.name}</span>
        </div>
      ),
    },
    {
      title: '包含子应用',
      key: 'subApps',
      width: 200,
      render: (_, record) => (
        <EnhancedPopover
          placement="bottomLeft"
          content={
            <div className="flex flex-col gap-2 max-h-75 overflow-y-auto">
              {record.subApps.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-[8px] bg-background space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-[8px]">
                      {app.icon || <Package className="h-5 w-5 text-primary" />}
                    </div>

                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {app.name}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {app.version}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {app.description}
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1.5 rounded-md w-fit transition-colors">
            <div className="bg-blue-600 p-1 rounded">
              <BarChart3 className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm text-gray-600">
              {record.subApps[0]?.name}
            </span>
            {record.subApps.length > 1 && (
              <span className="text-xs text-muted-foreground bg-background rounded-[4px] px-1 py-0.5">
                +{record.subApps.length - 1}
              </span>
            )}
          </div>
        </EnhancedPopover>
      ),
    },
    {
      title: '打包进度',
      dataIndex: 'packagingStatus',
      width: 200,
      render: (_, record) => {
        if (record.packagingStatus === 'packaging') {
          return (
            <div className="flex flex-col gap-1.5 max-w-35">
              <div className="flex justify-between items-center">
                <span className="text-primary text-sm">打包中</span>
                <span className="text-primary text-xs">{record.progress}%</span>
              </div>
              <Progress value={record.progress} className="h-1 bg-primary/10" />
            </div>
          );
        }
        if (record.packagingStatus === 'completed') {
          return <span className="text-green-500 text-sm">打包完成</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <span className="text-destructive text-sm">打包失败</span>
            <div className="flex items-center gap-1 px-2 h-[21px] rounded-[10px] bg-primary/6 cursor-pointer hover:opacity-80 transition-opacity">
              <RotateCw className="w-3 h-3 text-primary" />
              <span className="text-primary text-xs font-medium leading-none">
                重试
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'right',
      fixed: 'right',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.packagingStatus === 'completed' &&
            record.status === 'unreleased' && (
              <button
                className="text-primary hover:text-primary/70 text-sm font-medium transition-colors cursor-pointer"
                onClick={() => {
                  openTipsModal(
                    '发布后会将线上版本转为未发布版，请谨慎操作！',
                    {
                      title: '发布',
                      onOk: () => {},
                      classNames: {
                        content: 'w-[474px] max-w-none',
                        body: 'text-base!',
                      },
                    },
                  );
                }}
              >
                发布
              </button>
            )}

          <Dropdown
            placement="bottom"
            menu={{
              items: [
                {
                  key: 'detail',
                  label: '查看详情',
                },
                {
                  key: 'download',
                  label: '下载安装包',
                },
                ...(record.status === 'released'
                  ? [
                      {
                        key: 'undo',
                        label: '撤销发布',
                      },
                    ]
                  : []),
                {
                  key: 'delete',
                  label: '删除',
                  danger: true,
                },
              ],
              onClick({ key }) {
                switch (key) {
                  case 'detail':
                    navigate(`application-packaging/detail`);
                    break;
                  case 'delete':
                    openModalError({
                      title: '撤销发布',
                      content: '您确定要撤销此次发布吗？',
                      onOk() {},
                    });
                    break;
                }
              },
            }}
            itemClassName="text-muted-foreground"
          >
            <button className="text-muted-foreground hover:text-muted-foreground/70 transition-colors outline-none cursor-pointer font-medium">
              更多
            </button>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-[18px] h-full flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[18px] font-medium text-foreground">应用发布</h1>
          <p className="text-muted-foreground mt-1.5 text-xs">
            统一管理 AR 应用的可发布版本，并随时向终端眼镜用户分发更新。
          </p>
        </div>
        <EnhancedButton
          type="primary"
          onClick={() => {
            navigate(`application-packaging/create`);
          }}
        >
          应用打包
        </EnhancedButton>
      </div>

      {/* Main Content Card */}
      <EnhancedCard
        className="pt-6 flex-1 min-h-0"
        contentClassName="h-full flex flex-col"
      >
        <div className="flex flex-wrap gap-4 mb-[14px]">
          <EnhancedSelect
            placeholder="发布时间"
            options={[
              { label: '最近7天', value: '7days' },
              { label: '最近30天', value: '30days' },
            ]}
            value={dateRange}
            onChange={(val) => setDateRange(val)}
            searchable={false}
            allowClear={false}
            showCheck={false}
            listHeight="auto"
            className="w-52"
          />

          <EnhancedSelect
            placeholder="包含子应用"
            options={[
              { label: '数据分析模块', value: 'app1' },
              { label: '用户管理', value: 'app2' },
            ]}
            value={selectedApp}
            onChange={(val) => setSelectedApp(val)}
            searchable={false}
            allowClear={false}
            showCheck={false}
            listHeight="auto"
            className="w-[116px]"
          />

          <SearchInput
            placeholder="搜索版本号..."
            className="w-60"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <ProTable
          columns={columns}
          dataSource={mockData}
          rowKey="id"
          loading={false}
          className="flex-1 min-h-0"
        />
      </EnhancedCard>
    </div>
  );
};
