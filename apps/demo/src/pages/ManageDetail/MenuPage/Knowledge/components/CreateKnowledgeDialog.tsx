import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
  Label,
  EnhancedButton,
  message,
} from '@teamhelper/ui';
import { CircleHelp, Plus, Loader2 } from 'lucide-react';
import { EnhancedInput, EnhancedTooltip, Modal } from '@teamhelper/ui';
import { createKnowledgeBasesApi, type IKnowledgeBasesDto } from '../server';
import { useEffect, useState } from 'react';
import { KnowledgeBaseIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon';
import ThUpload from '@/components/common/ThUpload';
import { AiModelSelect } from '@/components/knowledgeBase/AiModelSelect';
import { useTranslation } from 'react-i18next';

interface ICreateKnowledgeDialogProps {
  formValues?: Partial<IKnowledgeBasesDto>;
}

function CreateKnowledgeDialog({ formValues }: ICreateKnowledgeDialogProps) {
  const { t } = useTranslation('knowledge');
  const modal = useModal();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFileKey, setAvatarFileKey] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const formSchema = z.object({
    name: z.string().min(1, t('folder.placeholder')),
    embedding_model_id: z.number(),
    text_model_id: z.number(),
    image_model_id: z.number(),
  });
  type IFormSchema = z.infer<typeof formSchema>;

  const form = useForm<IFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      embedding_model_id: undefined,
      text_model_id: undefined,
      image_model_id: undefined,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!modal.visible) return;
    form.reset({
      name: formValues?.name || '',
    });
  }, [modal?.visible, formValues?.name]);

  const onCancel = (result: boolean = false) => {
    modal.resolve(result);
    modal.hide();
  };

  const onSubmit = async (values: IFormSchema) => {
    if (isUploading) {
      message.warning(t('imageDataset.upload.uploading'));
      return Promise.reject();
    }

    const result = await createKnowledgeBasesApi({
      ...values,
      embedding_model_id: Number(values.embedding_model_id),
      text_model_id: Number(values.text_model_id),
      image_model_id: Number(values.image_model_id),
      type: 1,
      avatar: avatarFileKey || formValues?.user_icon || '',
      parent_id: formValues?.parent_id,
    });
    if (!result) return Promise.reject();

    onCancel(true);
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={t('dialog.create.knowledge.title')}
      onCancel={onCancel}
      onOkBeforeFunction={() => form.trigger()}
      onOk={async () => onSubmit(form.getValues() as IFormSchema)}
      classNames={{
        content: 'w-[488px] max-w-none',
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
        <form className="space-y-4">
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
                <EnhancedButton shape="round" disabled={isUploading}>
                  <Plus className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {t('dialog.edit.upload')}
                  </span>
                </EnhancedButton>
              </ThUpload>
            </div>
          </div>

          {/* 知识库名称 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t('dialog.knowledge.name.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <EnhancedInput
                    placeholder={t('folder.placeholder')}
                    maxLength={30}
                    {...field}
                    className={
                      form.formState.errors.name ? 'border-destructive' : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 索引模型 */}
          <FormField
            control={form.control}
            name="embedding_model_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-1">
                  <FormLabel className="text-sm font-medium">
                    {t('detail.model.index')}
                  </FormLabel>

                  <EnhancedTooltip
                    title={
                      <ul className="text-xs">
                        <li>{t('dialog.knowledge.embedding.desc1')}</li>
                        <li>{t('dialog.knowledge.embedding.desc2')}</li>
                      </ul>
                    }
                  >
                    <CircleHelp
                      size={12}
                      className="text-muted-foreground cursor-pointer"
                    />
                  </EnhancedTooltip>
                </div>
                <FormControl>
                  <AiModelSelect
                    modelParams={{
                      type: '3',
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 文本理解模型 */}
          <FormField
            control={form.control}
            name="text_model_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-1">
                  <FormLabel className="text-sm font-medium">
                    {t('detail.model.text')}
                  </FormLabel>

                  <EnhancedTooltip
                    title={
                      <ul className="text-xs">
                        <li>{t('dialog.knowledge.text.desc')}</li>
                      </ul>
                    }
                  >
                    <CircleHelp
                      size={12}
                      className="text-muted-foreground cursor-pointer"
                    />
                  </EnhancedTooltip>
                </div>
                <FormControl>
                  <AiModelSelect
                    modelParams={{
                      type: '1',
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 图片理解模型 */}
          <FormField
            control={form.control}
            name="image_model_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-1">
                  <FormLabel className="text-sm font-medium">
                    {t('detail.model.image')}
                  </FormLabel>
                </div>
                <FormControl>
                  <AiModelSelect
                    modelParams={{
                      type: '2',
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-xs text-muted-foreground">
            {t('dialog.knowledge.legal.notice')}
          </div>
        </form>
      </Form>
    </Modal>
  );
}

const CreateKnowledgeModal = NiceModal.create(CreateKnowledgeDialog);

export const openCreateKnowledgeDialog = (
  options?: ICreateKnowledgeDialogProps,
): Promise<boolean> => {
  return NiceModal.show(CreateKnowledgeModal, { ...options });
};

export default CreateKnowledgeModal;
