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
  Input,
  FormMessage,
  Upload,
  Form,
  message,
} from '@teamhelper/ui';
import { importAppConfigApi } from '../server';

const importJsonSchema = z.object({
  name: z
    .string()
    .min(1, i18n.t('manageDetail:errors.importJson.name.required')),
});

type ImportJsonFormData = z.infer<typeof importJsonSchema>;

interface ImportJsonDialogProps {
  project_id: number;
  initData?: () => void;
}

const ImportJsonDialog: React.FC<ImportJsonDialogProps> = ({
  project_id,
  initData,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const modal = useModal();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const { t } = useTranslation('manageDetail');

  const form = useForm<ImportJsonFormData>({
    resolver: zodResolver(importJsonSchema),
    defaultValues: { name: '' },
    mode: 'onChange',
  });

  const onCancel = () => {
    form.reset();
    setSelectedFile(null);
    setFileError(null);
    modal.hide();
    modal.remove();
  };

  const onSubmit = async (data: ImportJsonFormData) => {
    if (!selectedFile) {
      setFileError(t('importJson.file.required'));
      return;
    }

    try {
      setIsSubmitting(true);
      // 构建FormData
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('config_json', selectedFile);

      // 调用导入接口
      await importAppConfigApi(project_id, formData);

      message.success(t('importJson.importing.success'));
      modal.resolve(true);
      initData?.();
      form.reset();
      setSelectedFile(null);
      setFileError(null);
      modal.hide();
      modal.remove();
    } catch (error) {
      // 错误已经在httpRequest中处理并显示
      console.error('Import failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={modal.visible}
      title={t('importJson.title')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        if (isSubmitting) return false;
        const valid = await form.trigger();
        if (!selectedFile) {
          setFileError(t('importJson.file.required'));
          return false;
        }
        return valid;
      }}
      onOk={async () => form.handleSubmit(onSubmit)()}
      closable
      classNames={{
        content: 'w-[488px]',
      }}
    >
      <Form {...form}>
        <form>
          {/* 配置名称 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field, formState }) => (
              <FormItem className="mb-4">
                <FormLabel className="text-sm font-medium">
                  {t('importJson.name.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('importJson.name.placeholder')}
                    {...field}
                    className={
                      formState.errors.name ? 'border-destructive' : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 上传区域 */}
          <div>
            <Upload.Dragger
              accept=".json,application/json"
              multiple={false}
              onChange={(files: File[]) => {
                const f = files?.[0] ?? null;
                setSelectedFile(f);
                setFileError(null);
              }}
            />

            {fileError && (
              <div className="text-[0.8rem] font-medium text-destructive">
                {fileError}
              </div>
            )}
          </div>
        </form>
      </Form>
    </Modal>
  );
};

const ImportJsonModal = NiceModal.create(ImportJsonDialog);

export const openImportJsonModal = (options: ImportJsonDialogProps) => {
  return NiceModal.show(ImportJsonModal, { ...options });
};

export default ImportJsonModal;
