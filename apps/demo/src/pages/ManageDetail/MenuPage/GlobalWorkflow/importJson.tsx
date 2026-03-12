import React from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import {
  Modal,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  Upload,
  Form,
} from '@teamhelper/ui';

const importJsonSchema = z.object({
  name: z.string().min(1, i18n.t('manageDetail:importJson.name.required')),
  files: z
    .array(z.instanceof(File))
    .min(1, i18n.t('manageDetail:importJson.file.required'))
    .refine(
      (files) =>
        files.every(
          (f) =>
            f.type === 'application/json' ||
            f.name.toLowerCase().endsWith('.json'),
        ),
      {
        message: i18n.t('manageDetail:importJson.file.required'),
      },
    ),
});

type ImportJsonFormData = z.infer<typeof importJsonSchema>;

const ImportJsonDialog: React.FC = () => {
  const { t } = useTranslation('manageDetail');
  const modal = useModal();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // 上传集成到 form，不再使用本地文件/错误状态

  const form = useForm<ImportJsonFormData>({
    resolver: zodResolver(importJsonSchema),
    defaultValues: { name: '', files: [] },
    mode: 'onChange',
  });

  const onCancel = () => {
    form.reset();
    modal.hide();
  };

  const onSubmit = async (data: ImportJsonFormData) => {
    try {
      setIsSubmitting(true);

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('导入配置:', data);

      // 返回成功结果，关闭交由 Modal 的 onOpenChange 处理
      modal.resolve(true);
      form.reset();
    } catch (error) {
      console.error('导入配置失败:', error);
      // 可以在这里显示错误提示
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        open={modal.visible}
        onOpenChange={(open) => !open && modal.hide()}
        title={t('importJson.title')}
        okText={t('importJson.confirm')}
        cancelText={t('importJson.cancel')}
        onCancelBeforeFunction={() => true}
        onCancel={onCancel}
        onOkBeforeFunction={async () => {
          if (isSubmitting) return false;
          const valid = await form.trigger();
          return valid;
        }}
        onOk={form.handleSubmit(onSubmit)}
      >
        <Form {...form}>
          <form>
            {/* 配置名称 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-sm font-medium">
                    {t('importJson.name.label')}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('importJson.name.placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 上传JSON文件 */}
            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {t('importJson.file.label')}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Upload.Dragger
                      accept=".json,application/json"
                      multiple={false}
                      showFileList
                      fileList={field.value ?? []}
                      onFileListChange={(files) => {
                        form.clearErrors('files');
                        field.onChange(files);
                      }}
                      onError={(msg) => {
                        form.setError('files', {
                          type: 'manual',
                          message: msg,
                        });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </Modal>
    </>
  );
};

const BaseImportJson = NiceModal.create(ImportJsonDialog);
export const ImportJsonModal = (): Promise<boolean> => {
  return NiceModal.show(BaseImportJson);
};
