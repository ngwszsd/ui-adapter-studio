import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { CloudUpload, Package } from 'lucide-react';
import AppIcon from '@/assets/img/app-icon.webp';
import LaunchPage from '@/assets/img/launch-page.webp';
import {
  EnhancedButton,
  EnhancedInput,
  EnhancedTextarea,
  EnhancedSelect,
  EnhancedCard,
  EnhancedAvatar,
  message,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@teamhelper/ui';
import { ProTable } from '@/components/ProTable';
import { PageHeader } from '@/components/PageHeader';
import ThUploadDragger from '@/components/common/ThUploadDragger';
import type { ColumnType } from '@teamhelper/ui';
import { HelpPopover } from '@/components/common/HelpPopover';
import { openSupportedHardwareDialog } from './components/SupportedHardwareDialog';

interface SubAppVersion {
  id: string;
  version: string;
  description: string;
  releaseTime: string;
  appName: string;
  owner: {
    name: string;
    avatar?: string;
  };
  versions: { label: string; value: string }[];
}

const mockSubAppVersions: SubAppVersion[] = [
  {
    id: '1',
    version: 'v2.1.0',
    description: '修复了数据导出时的格式错误问题',
    releaseTime: '2025-09-16 15:34',
    appName: '数据分析模块',
    owner: { name: '李明' },
    versions: [
      { label: 'v2.1.0', value: 'v2.1.0' },
      { label: 'v2.0.9', value: 'v2.0.9' },
      { label: 'v2.0.0', value: 'v2.0.0' },
    ],
  },
  {
    id: '2',
    version: 'v2.1.0',
    description: '新增实时监控仪表盘功能',
    releaseTime: '2025-09-16 15:34',
    appName: '远程协作',
    owner: { name: '张磊' },
    versions: [
      { label: 'v2.1.0', value: 'v2.1.0' },
      { label: 'v2.0.5', value: 'v2.0.5' },
    ],
  },
  {
    id: '3',
    version: 'v1.5.0',
    description: '优化了系统的启动速度',
    releaseTime: '2025-09-15 10:00',
    appName: '用户管理',
    owner: { name: '王芳' },
    versions: [
      { label: 'v1.5.0', value: 'v1.5.0' },
      { label: 'v1.4.0', value: 'v1.4.0' },
    ],
  },
  {
    id: '4',
    version: 'v1.2.0',
    description: '修复部分已知bug',
    releaseTime: '2025-09-14 14:20',
    appName: '系统设置',
    owner: { name: '赵强' },
    versions: [
      { label: 'v1.2.0', value: 'v1.2.0' },
      { label: 'v1.1.0', value: 'v1.1.0' },
    ],
  },
];

const formSchema = z.object({
  version: z.string().min(1, '请输入版本号'),
  description: z.string().min(1, '请输入版本描述'),
  baseVersion: z.string().min(1, '请选择基座版本'),
  cert: z.string().min(1, '请选择开发者证书'),
  selectedApps: z.array(z.string()).min(1, '请至少选择一个发布应用'),
  icon_url: z.string().optional(),
  splash_image_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreatePackage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('manageDetail');
  const [iconPreviewUrl, setIconPreviewUrl] = useState('');
  const [splashPreviewUrl, setSplashPreviewUrl] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<
    Record<string, string>
  >({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      version: 'v.0.0.1',
      description: '',
      baseVersion: '',
      cert: '',
      selectedApps: [],
      icon_url: '',
      splash_image_url: '',
    },
    mode: 'onChange',
  });

  const baseVersion = form.watch('baseVersion');

  const baseVersionDetails: Record<
    string,
    {
      version: string;
      releaseDate: string;
      description: string;
      hardware: string;
    }
  > = {
    'v2.1.3': {
      version: 'V2.1.3',
      releaseDate: '2024-02-15',
      description: '新增硬件兼容性优化，提升系统稳定性',
      hardware: 'ARGOOZ+',
    },
    'v2.1.2': {
      version: 'V2.1.2',
      releaseDate: '2024-01-20',
      description: '修复已知问题',
      hardware: 'ARGOOZ',
    },
  };

  const columns: ColumnType<SubAppVersion>[] = [
    {
      title: '应用',
      dataIndex: 'appName',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <span className="text-foreground font-medium">{record.appName}</span>
        </div>
      ),
    },
    {
      title: '版本描述',
      dataIndex: 'description',
      width: 300,
      render: (text) => (
        <span className="text-muted-foreground truncate block">{text}</span>
      ),
    },
    {
      title: '所属人',
      dataIndex: 'owner',
      width: 150,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <EnhancedAvatar className="w-6 h-6 text-xs bg-orange-100 text-orange-600">
            {record.owner.name.charAt(0)}
          </EnhancedAvatar>
          <span className="text-muted-foreground">{record.owner.name}</span>
        </div>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'releaseTime',
      width: 180,
      render: (text) => <span className="text-muted-foreground">{text}</span>,
    },
    {
      title: '选择版本',
      dataIndex: 'version',
      width: 160,
      render: (_, record) => (
        <EnhancedSelect
          value={selectedVersions[record.id]}
          onChange={(value) => {
            setSelectedVersions((prev) => ({
              ...prev,
              [record.id]: value || '',
            }));
          }}
          options={record.versions}
          placeholder="选择版本"
          className="w-full"
          allowClear={false}
          showCheck={false}
          listHeight="auto"
        />
      ),
    },
  ];

  const onSubmit = (values: FormValues) => {
    console.log('Form values:', values);
    message.success('发布成功');
    navigate(-1);
  };

  const selectedApps = form.watch('selectedApps');
  const iconUrl = form.watch('icon_url');
  const splashUrl = form.watch('splash_image_url');

  const iconFileList = useMemo(
    () =>
      iconUrl
        ? [
            {
              uid: 'icon',
              name: 'icon.png',
              status: 'done' as const,
              url: iconPreviewUrl || iconUrl,
            },
          ]
        : [],
    [iconUrl, iconPreviewUrl],
  );

  const splashFileList = useMemo(
    () =>
      splashUrl
        ? [
            {
              uid: 'splash',
              name: 'splash.png',
              status: 'done' as const,
              url: splashPreviewUrl || splashUrl,
            },
          ]
        : [],
    [splashUrl, splashPreviewUrl],
  );

  const handleRemove = (type: 'appIcon' | 'startUpIcon') => {
    if (type === 'appIcon') {
      form.setValue('icon_url', '');
      setIconPreviewUrl('');
    } else {
      form.setValue('splash_image_url', '');
      setSplashPreviewUrl('');
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col w-full h-full"
        >
          <PageHeader
            title="应用打包"
            subTitle="返回"
            extra={
              <div className="flex items-center gap-3">
                <EnhancedButton type="primary" htmlType="submit">
                  发布
                </EnhancedButton>
              </div>
            }
            classNames={{
              box: 'p-5',
              subTitleBox: 'text-primary',
            }}
          />

          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-5 w-[1153px] mx-auto">
            {/* Version Info Section */}
            <div className="space-y-4 bg-card rounded-[18px] p-6">
              <div className="text-base font-medium text-foreground">
                版本信息
              </div>
              <div className="grid grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        版本号
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <EnhancedInput placeholder="请输入版本号" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        版本描述
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <EnhancedTextarea
                            placeholder="请输入版本描述"
                            maxLength={800}
                            className="min-h-25"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Select Release App Section */}
            <div className="space-y-4 bg-card rounded-[18px] p-6">
              <div className="text-base font-medium text-foreground">
                选择发布应用
                <span className="text-destructive">*</span>
              </div>
              <FormField
                control={form.control}
                name="selectedApps"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ProTable
                        columns={columns}
                        dataSource={mockSubAppVersions}
                        rowKey="id"
                        pagination={false}
                        rowSelection={{
                          type: 'checkbox',
                          selectedRowKeys: field.value,
                          onChange: (keys) => field.onChange(keys),
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Launch Settings Section */}
            <div className="space-y-4 bg-card rounded-[18px] p-6">
              <div className="text-base font-medium text-foreground">
                启动设置
              </div>
              <div className="flex justify-between">
                {/* Upload Icon */}
                <div className="flex items-start gap-5">
                  <div className="shrink-0 flex flex-col gap-2 w-[280px]">
                    <div className="font-medium text-sm text-foreground">
                      {t('launch.design.upload.icon')}
                    </div>
                    <div>
                      <ThUploadDragger
                        type="avatar"
                        accept=".png"
                        multiple={false}
                        listType={'card'}
                        className="h-[171px]"
                        iconClassName="w-10"
                        bodyClassName="px-0"
                        fileList={iconFileList as any}
                        showFileList={true}
                        title={
                          <div className="text-sm font-medium">
                            {t('launch.design.click.or.drag')}
                          </div>
                        }
                        description={
                          <div className="text-xs font-normal">
                            {t('launch.design.uploadcomp')}
                          </div>
                        }
                        onUploaded={(fileKey, file) => {
                          form.setValue('icon_url', fileKey);
                          setIconPreviewUrl(URL.createObjectURL(file));
                        }}
                        onFileListChange={(files) => {
                          if (!files || files.length === 0) {
                            handleRemove('appIcon');
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* 预览效果 */}
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground mb-2">
                      {t('launch.design.defaultEffect')}
                    </div>
                    <div className="w-fit">
                      <div className="flex flex-col justify-center gap-3 ">
                        <div className="w-[62px] h-[62px] rounded-[8px] flex items-center justify-center">
                          <img
                            style={{ objectFit: 'cover' }}
                            src={iconPreviewUrl || AppIcon}
                            alt=""
                            className="w-full h-full rounded-[8px]"
                            draggable={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Splash Screen */}
                <div className="flex items-start gap-5">
                  <div className="shrink-0 flex flex-col gap-2 w-[304px]">
                    <div className="font-medium text-sm text-foreground">
                      上传启动页
                    </div>
                    <div>
                      <ThUploadDragger
                        type="avatar"
                        accept=".png,.gif"
                        multiple={false}
                        listType={'card'}
                        className="h-[171px]"
                        iconClassName="w-10"
                        bodyClassName="px-0"
                        fileList={splashFileList as any}
                        showFileList={true}
                        title={
                          <div className="text-sm font-medium">
                            点击或拖拽上传启动页
                          </div>
                        }
                        description={
                          <div className="text-[12px] font-normal">
                            {t('launch.design.uploadcomp1')}
                          </div>
                        }
                        onUploaded={(fileKey, file) => {
                          form.setValue('splash_image_url', fileKey);
                          setSplashPreviewUrl(URL.createObjectURL(file));
                        }}
                        onFileListChange={(files) => {
                          if (!files || files.length === 0) {
                            handleRemove('startUpIcon');
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* 预览效果 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground mb-2">
                      {t('launch.design.defaultEffect')}
                    </div>
                    <div className="bg-muted rounded-[8px] w-[304px] h-[171px] overflow-hidden">
                      <img
                        style={{ objectFit: 'cover' }}
                        src={splashPreviewUrl || LaunchPage}
                        alt=""
                        className="w-full h-full rounded-[8px]"
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-4">
                <FormField
                  control={form.control}
                  name="baseVersion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        选择基座版本
                        <span className="text-destructive">*</span>
                        <HelpPopover content="选择基座版本" />
                      </FormLabel>
                      <FormControl>
                        <EnhancedSelect
                          placeholder="请先选择基座版本"
                          options={[
                            {
                              label: 'V2.1.3 - 新增硬件兼容性优化',
                              value: 'v2.1.3',
                            },
                            { label: 'V2.1.2 - 修复已知问题', value: 'v2.1.2' },
                          ]}
                          className="w-60"
                          value={field.value}
                          onChange={field.onChange}
                          searchable={false}
                          allowClear={false}
                          showCheck={false}
                          listHeight="auto"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-[18px] border-2 border-dashed rounded-[8px] p-4 min-h-50">
                <div className="font-medium text-sm text-foreground mb-6">
                  版本详情
                </div>
                {!baseVersion ? (
                  <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
                    请先选择基座版本
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-y-6">
                    <div>
                      <div className="text-muted-foreground mb-2 text-xs">
                        版本号
                      </div>
                      <div className="text-foreground font-medium text-sm">
                        {baseVersionDetails[baseVersion]?.version}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-2 text-xs">
                        发布时间
                      </div>
                      <div className="text-foreground font-medium text-sm">
                        {baseVersionDetails[baseVersion]?.releaseDate}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-2 text-xs">
                        详情介绍
                      </div>
                      <div className="text-primary cursor-pointer text-sm hover:text-primary/70">
                        查看详情
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-2 text-xs">
                        版本描述
                      </div>
                      <div className="text-foreground text-sm">
                        {baseVersionDetails[baseVersion]?.description}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-2 text-xs">
                        支持硬件
                      </div>
                      <div className="text-foreground flex items-center text-sm">
                        <span className="mr-1">
                          {baseVersionDetails[baseVersion]?.hardware}
                        </span>
                        <span
                          className="text-primary cursor-pointer hover:text-primary/70"
                          onClick={() => openSupportedHardwareDialog()}
                        >
                          等5项
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-[18px] p-6 mb-5">
              <FormField
                control={form.control}
                name="cert"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      选择开发者证书
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <EnhancedSelect
                        placeholder="请选择开发者证书"
                        options={[
                          {
                            label: 'Certificate A (Exp: 2025)',
                            value: 'cert-a',
                          },
                          {
                            label: 'Certificate B (Exp: 2026)',
                            value: 'cert-b',
                          },
                        ]}
                        className="w-[336px]"
                        value={field.value}
                        onChange={field.onChange}
                        searchable={false}
                        allowClear={false}
                        showCheck={false}
                        listHeight="auto"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreatePackage;
