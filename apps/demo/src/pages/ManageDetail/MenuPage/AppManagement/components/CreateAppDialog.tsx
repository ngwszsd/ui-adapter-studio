import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Plus, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppIcon from '@/assets/img/app-icon.png';
import {
  Modal,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  Input,
  FormMessage,
  EnhancedTextarea,
  EnhancedButton as Button,
  Form,
  message,
} from '@teamhelper/ui';
import { createAppInfoApi, editAppInfoApi, getAppDetailApi } from '../server';
import { pick } from 'es-toolkit';
import ThUpload from '@/components/common/ThUpload';

interface CreateAppProps {
  initData?: () => void;
  app_id?: number;
  project_id: number;
}

const CreateAppDialog: React.FC<CreateAppProps> = ({
  project_id,
  app_id,
  initData,
}) => {
  const modal = useModal();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { t } = useTranslation('manageDetail');

  const createAppSchema = z.object({
    name: z
      .string()
      .min(1, t('errors.createApp.appName.required'))
      .max(12, t('errors.createApp.appName.max')),
    icon_url: z.string().optional(),
    file_key: z.string().optional(),
    description: z.string().optional(),
  });

  type CreateAppFormData = z.infer<typeof createAppSchema>;

  const form = useForm<CreateAppFormData>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      name: '',
      icon_url: '',
      file_key: '',
      description: '',
    },
    mode: 'onChange',
  });

  const appNameValue = form.watch('name') || '';
  const icon_url = form.watch('icon_url') || '';
  const file_key = form.watch('file_key') || '';

  const onCancel = () => {
    form.reset();
    modal.hide();
    modal.remove();
  };

  const onSubmit = async (data: CreateAppFormData) => {
    try {
      setIsSubmitting(true);
      if (!app_id) {
        await createAppInfoApi(project_id, {
          name: data.name,
          description: data.description,
          icon_object_key: data.file_key || null, // 优先使用 file_key
        });
        message.success(t('createApp.success'));
      } else {
        await editAppInfoApi(app_id, {
          name: data.name,
          description: data.description,
          icon_object_key: data.file_key || null, // 优先使用 file_key
        });
        message.success(t('createApp.edit.success'));
      }
      modal.resolve(true);
      initData?.();
      form.reset();
      modal.remove();
    } catch (error) {
      console.error('Submit project error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAppDetail = async () => {
    try {
      const res = await getAppDetailApi(app_id as number);
      const detailData = pick(res.data, ['name', 'icon_url', 'description']);
      (Object.keys(detailData) as Array<keyof typeof detailData>).forEach(
        (key) => {
          form.setValue(key, detailData[key]);
        },
      );
    } catch (e) {
      console.error('Get App Detail Failed', e);
    }
  };

  useEffect(() => {
    if (app_id) getAppDetail();
  }, [app_id]);

  return (
    <Modal
      open={modal.visible}
      title={!app_id ? t('createApp.title') : t('createApp.title.edit')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        if (isSubmitting) return false;
        const valid = await form.trigger();
        return valid;
      }}
      onOk={async () => form.handleSubmit(onSubmit)()}
      classNames={{
        content: 'w-[488px]',
      }}
    >
      <Form {...form}>
        <form className="space-y-4">
          {/* 应用名称 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field, formState }) => (
              <FormItem className="mb-4">
                <FormLabel className="text-sm font-medium">
                  {t('createApp.appName.label')}
                  <span className="text-destructive">*</span>
                  <span className="text-muted-foreground text-xs">
                    ({t('createApp.appName.tips')})
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      maxLength={12}
                      placeholder={t('createApp.appName.placeholder')}
                      {...field}
                      className={
                        formState.errors.name ? 'border-destructive' : ''
                      }
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {appNameValue.length}/12
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 项目描述 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('createApp.description.label')}</FormLabel>
                <FormControl>
                  <EnhancedTextarea
                    placeholder={t('createApp.description.placeholder')}
                    className="min-h-[100px] shadow-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 图标 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t('createApp.icon.label')}
            </div>
            <div className="flex items-center gap-4">
              {/* 预览框 */}
              <div className="w-16 h-16 rounded-lg bg-transparent flex items-center justify-center overflow-hidden border border-border">
                {
                  <img
                    src={icon_url ? icon_url : AppIcon}
                    alt="app icon"
                    className="w-[42px] h-[42px] rounded-lg object-cover"
                  />
                }
              </div>

              <ThUpload
                type="avatar"
                accept=".jpg,.jpeg,.png"
                multiple={false}
                showUploadList={false}
                crop
                maxSizeMB={3}
                onChange={({ file }) => {
                  const f = file?.originFileObj;
                  if (f) {
                    const url = URL.createObjectURL(f);
                    form.setValue('icon_url', url);
                  }
                }}
                onUploaded={(fileKey) => {
                  form.setValue('file_key', fileKey, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
              >
                <Button shape="round">
                  <Plus className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {t('createApp.icon.upload')}
                  </span>
                </Button>
              </ThUpload>
            </div>
          </div>
        </form>
      </Form>
    </Modal>
  );
};

const CreateAppModal = NiceModal.create(CreateAppDialog);

export const openCreateAppModal = (options?: CreateAppProps) => {
  return NiceModal.show(CreateAppModal, { ...options });
};

export default CreateAppModal;
