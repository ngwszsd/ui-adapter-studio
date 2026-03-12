import React, { useEffect, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldUser, UploadIcon } from 'lucide-react';
import McpIcon from '@/assets/img/mcp-icon.png';
import {
  type AuthConfigResult,
  openAuthConfigDialog,
} from './AuthConfigDialog.tsx';
import {
  Modal,
  EnhancedButton as Button,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  EnhancedTable as Table,
  Form,
  Empty,
  message,
  EnhancedTextarea,
} from '@teamhelper/ui';

import {
  addMcpListApi,
  parseMcpAddressApi,
  type McpParsedResultDto,
  getMcpDetailApi,
  type McpInfoParams,
  editMcpAllInfoApi,
} from './server';
import { useTranslation } from 'react-i18next';
import ThUpload from '@/components/common/ThUpload';

type CreateMcpFormData = {
  name: string;
  server_url: string;
  description?: string;
};

interface CreateMcpDialogProps {
  id?: number;
  project_id?: number;
}

const CreateMcpDialog: React.FC<CreateMcpDialogProps> = ({
  id,
  project_id,
}) => {
  const modal = useModal();
  const { t } = useTranslation('manageDetail');

  /** 表单校验 */
  const createMcpSchema = z.object({
    name: z.string().min(1, t('createMcp.name.required')),
    server_url: z.string().min(1, t('createMcp.serverUrl.required')),
    description: z.string().optional(),
  });

  const [parsedData, setParsedData] = React.useState<McpParsedResultDto[]>([]);
  const [parsing, setParsing] = React.useState(false);
  const [iconUrl, setIconUrl] = useState<string>('');
  const [iconObjectKey, setIconObjectKey] = useState<string>('');
  const [authConfig, setAuthConfig] = useState<AuthConfigResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateMcpFormData>({
    resolver: zodResolver(createMcpSchema),
    defaultValues: {
      name: '',
      server_url: '',
      description: '',
    },
    mode: 'onChange',
  });

  /** 点击解析 MCP 地址 */
  const handleParse = async () => {
    const valid = await form.trigger('server_url');
    if (!valid) return;

    const serverUrl = form.getValues('server_url');
    setParsing(true);

    try {
      const response = await parseMcpAddressApi({
        server_url: serverUrl,
        headers: authConfig?.headers,
      });

      if (response.data) {
        setParsedData(response.data);
        message.success(t('createMcp.parse.success'));
      } else {
        setParsedData([]);
      }
    } catch (error) {
      console.error(t('createMcp.parse.error'), error);
      setParsedData([]);
    } finally {
      setParsing(false);
    }
  };

  const getMapEditInfo = async () => {
    const { data } = await getMcpDetailApi(id as number);
    const detailData: Pick<
      McpInfoParams,
      'name' | 'server_url' | 'description'
    > = {
      name: data.name,
      server_url: data.service_url,
      description: data.description || '',
    };
    (Object.keys(detailData) as Array<keyof typeof detailData>).forEach(
      (key) => {
        form.setValue(key, detailData[key]);
      },
    );
    // 1: 图标
    setIconUrl(data.icon_url);
    setIconObjectKey(data.icon_object_key);
    // 2: 请求验证 如果是Bearer
    if (data.auth_type === 1) {
      const [scheme, token] = (data.auth_config?.Authorization as string).split(
        ' ',
        2,
      );
      setAuthConfig({
        headers: data.auth_config,
        kind: scheme as AuthConfigResult['kind'],
        bearerValue: token,
      });
    } else {
      // 2: 请求验证 如果是自定义todo
      setAuthConfig({
        headers: data.auth_config,
        kind: 'Custom',
        bearerValue: '',
      });
    }

    // 3: tool list
    setParsedData(
      data.tools?.map((v) => ({
        tool_name: v.tool_name,
        param: v.param,
        description: v.description || '',
      })),
    );
  };
  useEffect(() => {
    if (id) getMapEditInfo();
  }, [id]);

  /** 取消，重置表单与数据 */
  const onCancel = () => {
    modal.resolve(false);
    form.reset();
    setParsedData([]);
    setIconUrl('');
    setIconObjectKey('');
    setAuthConfig(null);
    modal.hide();
    modal.remove();
  };

  /** 确认创建 */
  const onSubmit = async (data: CreateMcpFormData) => {
    // if (!iconObjectKey) {
    //   message.error(t('createMcp.create.iconRequired'));
    //   return;
    // }

    if (parsedData.length === 0) {
      message.error(t('createMcp.create.parseRequired'));
      return;
    }

    setSubmitting(true);

    try {
      // 转换解析数据为工具列表格式
      const toolsList = parsedData.map((item) => ({
        tool_name: item.tool_name,
        description: item.description,
        param: item.param,
        required: item.required,
      }));

      const createData: McpInfoParams = {
        project_id,
        name: data.name,
        server_url: data.server_url,
        description: data.description || '',
        icon_object_key: iconObjectKey,
        auth_config: authConfig?.headers,
        tools_list: toolsList,
        auth_type: authConfig?.kind === 'Bearer' ? 1 : 2,
      };

      if (id) {
        createData.id = id;
        await editMcpAllInfoApi(createData);
      } else {
        await addMcpListApi(createData);
      }

      message.success(t('createMcp.create.success'));
      modal.resolve(true);
      form.reset();
      setParsedData([]);
      setIconUrl('');
      setIconObjectKey('');
      setAuthConfig(null);
      modal.hide();
      modal.remove();
    } catch (error) {
      console.error(t('createMcp.create.error'), error);
    } finally {
      setSubmitting(false);
    }
  };

  /** 表格列定义 */
  const columns = React.useMemo(
    () => [
      {
        title: t('createMcp.toolsList.toolName'),
        dataIndex: 'tool_name',
        key: 'tool_name',
        width: 150,
        ellipsis: true,
      },
      {
        title: t('createMcp.toolsList.description'),
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
      },
      {
        title: t('createMcp.toolsList.param'),
        dataIndex: 'param',
        key: 'param',
        width: 120,
        ellipsis: true,
      },
    ],
    [t],
  );

  return (
    <Modal
      open={modal.visible}
      title={id ? t('createMcp.title.edit') : t('createMcp.title.create')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        const valid = await form.trigger();
        return valid;
      }}
      onOk={async () => form.handleSubmit(onSubmit)()}
      classNames={{
        content: 'w-[600px] max-w-none',
      }}
    >
      <Form {...form}>
        <form className="space-y-6">
          {/* 图标 */}
          <div className="flex flex-col gap-4">
            <div className="text-sm text-foreground font-medium">
              {t('createMcp.icon.label')}
            </div>

            <ThUpload
              type="avatar"
              accept=".jpg,.jpeg,.png"
              multiple={false}
              showUploadList={false}
              crop
              maxSizeMB={5}
              onChange={({ file }) => {
                const f = file?.originFileObj;
                if (f) {
                  const url = URL.createObjectURL(f);
                  setIconUrl(url);
                }
              }}
              onUploaded={(fileKey) => {
                setIconObjectKey(fileKey);
                message.success(t('createMcp.upload.success'));
              }}
            >
              <div className="border border-border h-16 w-16 rounded-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group">
                <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center bg-primary/10 overflow-hidden">
                  {
                    <img
                      src={iconUrl || McpIcon}
                      alt="app icon"
                      className="w-full h-full object-cover"
                    />
                  }
                </div>

                <div className="text-muted flex flex-col items-center justify-center gap-1 bg-foreground/30 absolute w-full h-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <UploadIcon className="w-4 h-4" />
                  <div className="text-xs scale-[0.83] font-medium">
                    {t('createMcp.icon.upload')}
                  </div>
                </div>
              </div>
            </ThUpload>
          </div>

          {/* 名称 + 鉴权配置 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field, formState }) => (
              <FormItem className="space-y-0">
                <div className="flex items-center justify-between">
                  <FormLabel>
                    {t('createMcp.name.label')}{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Button
                    type="link"
                    onClick={async () => {
                      try {
                        const config = await openAuthConfigDialog({
                          authConfig,
                        });
                        if (Object.keys(config).length > 0) {
                          setAuthConfig(config);
                          message.success(t('createMcp.authConfig.success'));
                        }
                      } catch (error) {
                        console.error(t('createMcp.authConfig.error'), error);
                      }
                    }}
                    className="px-0"
                  >
                    <ShieldUser className="w-4 h-4" />
                    {t('createMcp.authConfig')}
                  </Button>
                </div>
                <FormControl>
                  <Input
                    placeholder={t('createMcp.name.placeholder')}
                    {...field}
                    maxLength={30}
                    className={
                      formState.errors.name ? 'border-destructive' : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 描述 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>{t('createMcp.description.label')}</FormLabel>
                <FormControl>
                  <EnhancedTextarea
                    placeholder={t('createMcp.description.placeholder')}
                    rows={3}
                    {...field}
                    maxLength={200}
                    className={
                      formState.errors.description ? 'border-destructive' : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* MCP 地址 + 解析按钮 */}
          <FormField
            control={form.control}
            name="server_url"
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>
                  {t('createMcp.serverUrl.label')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <div className="flex items-center gap-3">
                  <FormControl className="flex-1">
                    <Input
                      placeholder={t('createMcp.serverUrl.placeholder')}
                      {...field}
                      className={
                        formState.errors.server_url ? 'border-destructive' : ''
                      }
                    />
                  </FormControl>
                  <Button
                    onClick={handleParse}
                    disabled={parsing}
                    type="primary"
                  >
                    {parsing ? t('createMcp.parsing') : t('createMcp.parse')}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 数据展示 */}
          <div>
            <div className="text-sm font-medium mb-3">
              {t('createMcp.toolsList.title')}
            </div>
            <Table<McpParsedResultDto>
              columns={columns}
              dataSource={parsedData}
              rowKey={(record) => record.tool_name || Math.random().toString()}
              loading={parsing}
              bordered
              size="middle"
              scroll={{ y: 220 }}
              locale={{
                emptyText: (
                  <Empty
                    image={null}
                    description={t('createMcp.toolsList.empty')}
                    classNames={{
                      root: 'h-[140px]',
                    }}
                  />
                ),
              }}
            />
          </div>
        </form>
      </Form>
    </Modal>
  );
};

const CreateMcpModal = NiceModal.create(CreateMcpDialog);

export const openCreateMcpDialog = (options?: any): Promise<boolean> => {
  return NiceModal.show(CreateMcpModal, options);
};

export default CreateMcpModal;
