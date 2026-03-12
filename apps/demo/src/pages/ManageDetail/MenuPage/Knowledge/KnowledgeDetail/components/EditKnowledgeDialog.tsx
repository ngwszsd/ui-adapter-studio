import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import {
  Modal,
  Label,
  EnhancedButton as Button,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  EnhancedTextarea,
  Form,
  EnhancedInput,
  message,
} from '@teamhelper/ui';
import {
  updateKnowledgeBasesApi,
  type IKnowledgeBasesDto,
} from '../../server.ts';
import ThUpload from '@/components/common/ThUpload';
import { KnowledgeBaseIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon';

export interface EditKnowledgeDialogProps {
  formValues?: Partial<IKnowledgeBasesDto>;
}

function EditKnowledgeDialog({ formValues }: EditKnowledgeDialogProps) {
  const modal = useModal();
  const { t } = useTranslation('knowledge');
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [avatarFileKey, setAvatarFileKey] = React.useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const formSchema = z.object({
    name: z.string().min(1, t('folder.placeholder')),
    description: z.string().optional(),
  });
  type IFormSchema = z.infer<typeof formSchema>;

  const form = useForm<IFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!modal.visible) return;
    form.reset({
      name: formValues?.name || '',
      description: formValues?.description || '',
    });
  }, [modal?.visible, formValues?.name, formValues?.description]);

  useEffect(() => {
    if (!modal.visible) return;
    setAvatarPreview(formValues?.avatar || '');
  }, [modal?.visible, formValues?.avatar]);

  const onCancel = (result: boolean = false) => {
    modal.resolve(result);
    modal.hide();
  };

  const onSubmit = async (values: IFormSchema) => {
    if (isUploading) {
      message.warning(t('imageDataset.upload.uploading'));
      return Promise.reject();
    }

    const result = await updateKnowledgeBasesApi({
      ...values,
      id: formValues?.id || null,
      avatar: avatarFileKey || formValues?.avatar || '',
    });
    if (!result) return Promise.reject();

    onCancel(true);
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={t('dialog.edit.title')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => form.trigger()}
      onOk={async () => onSubmit(form.getValues() as IFormSchema)}
      classNames={{
        content: 'w-[560px] max-w-none',
      }}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            modal.remove();
          }, 360);
        }
      }}
    >
      <Form {...form}>
        <form className="space-y-6">
          <div className="space-y-2" onFocus={(e) => e.stopPropagation()}>
            <Label>{t('dialog.edit.avatar')}</Label>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-transparent flex items-center justify-center overflow-hidden border border-border relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="app icon"
                    className="w-[42px] h-[42px] rounded-lg object-cover"
                    draggable={false}
                  />
                ) : (
                  <KnowledgeBaseIcon type="default_knowledgeBase" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <ThUpload
                type="avatar"
                accept=".jpg,.png,.jpeg"
                multiple={false}
                showUploadList={false}
                disabled={isUploading}
                crop
                onChange={({ file }) => {
                  const f = file?.originFileObj;
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setAvatarPreview(url);
                    setIsUploading(true);
                  }
                }}
                onUploaded={(fileKey) => {
                  setAvatarFileKey(fileKey);
                  setIsUploading(false);
                }}
              >
                <Button shape="round" disabled={isUploading}>
                  <Plus className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {t('dialog.edit.upload')}
                  </span>
                </Button>
              </ThUpload>
            </div>
          </div>

          {/* 名称 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dialog.name')}</FormLabel>
                <FormControl>
                  <EnhancedInput
                    placeholder={t('folder.placeholder')}
                    maxLength={30}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 介绍 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dialog.desc')}</FormLabel>
                <FormControl>
                  <EnhancedTextarea
                    className="min-h-22 shadow-none"
                    placeholder={t('folder.placeholder')}
                    maxLength={200}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Modal>
  );
}

const EditKnowledgeDialogModal = NiceModal.create(EditKnowledgeDialog);

export const openEditKnowledgeDialog = (
  options?: EditKnowledgeDialogProps,
): Promise<boolean> => {
  return NiceModal.show(EditKnowledgeDialogModal, { ...options });
};

export default EditKnowledgeDialogModal;
