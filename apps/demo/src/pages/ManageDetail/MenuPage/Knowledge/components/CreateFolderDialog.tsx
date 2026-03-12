import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useEffect } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  Form,
  EnhancedTextarea,
  FormMessage,
} from '@teamhelper/ui';
import { EnhancedInput, Modal } from '@teamhelper/ui';
import {
  createKnowledgeBasesApi,
  updateKnowledgeBasesApi,
  type IKnowledgeBasesDto,
} from '../server';

export interface CreateFolderDialogProps {
  actionType?: 'create' | 'edit';
  formValues?: Partial<IKnowledgeBasesDto>;
}

function CreateFolderDialog({
  actionType = 'create',
  formValues,
}: CreateFolderDialogProps) {
  const { t } = useTranslation('knowledge');
  const modal = useModal();

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

  const onSubmit = async (values: IFormSchema) => {
    let result = false;
    if (!formValues?.id) {
      result = await createKnowledgeBasesApi({
        ...values,
        type: 2,
        parent_id: formValues?.parent_id,
      });
    } else {
      result = await updateKnowledgeBasesApi({
        ...values,
        id: formValues?.id || null,
      });
    }
    if (!result) return Promise.reject();

    onCancel(true);
  };

  const onCancel = (result: boolean = false) => {
    modal.resolve(result);
    modal.hide();
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={
        actionType === 'create'
          ? t('dialog.folder.create.title')
          : t('dialog.folder.edit.title')
      }
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
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t('dialog.folder.name.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
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

          {/* 文件夹描述 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t('dialog.folder.desc.label')}
                </FormLabel>
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

const CreateFolderModal = NiceModal.create(CreateFolderDialog);

export const openCreateFolderDialog = (
  options?: CreateFolderDialogProps,
): Promise<boolean> => {
  return NiceModal.show(CreateFolderModal, { ...options });
};

export default CreateFolderModal;
