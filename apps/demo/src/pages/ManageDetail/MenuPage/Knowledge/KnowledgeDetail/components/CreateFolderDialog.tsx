import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Modal,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  Form,
} from '@teamhelper/ui';
import {
  saveKnowledgeBasesDatasetApi,
  type ISaveKnowledgeBasesDatasetParams,
} from '../server.ts';

export interface CreateFolderDialogProps {
  formValues?: Partial<ISaveKnowledgeBasesDatasetParams>;
  refresh?: () => void;
}

function CreateFolderDialog({ formValues, refresh }: CreateFolderDialogProps) {
  const modal = useModal();
  const { t } = useTranslation('knowledge');
  const formSchema = z.object({
    name: z.string().min(1, t('folder.placeholder')),
  });
  type IFormSchema = z.infer<typeof formSchema>;

  const form = useForm<IFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const onCancel = (result: boolean = false) => {
    modal.resolve(result);
    modal.hide();
  };

  const onSubmit = async (values: IFormSchema) => {
    const result = await saveKnowledgeBasesDatasetApi({
      knowledge_base_id: formValues?.knowledge_base_id || null,
      dataset_type: 0,
      parent_id: formValues?.parent_id,
      files: [{ name: values?.name }],
    });
    if (!result) return Promise.reject();

    onCancel(true);
    refresh?.();
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={t('dialog.folder.create.title')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => form.trigger()}
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
                <FormLabel>{t('dialog.name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('dialog.folder.name.placeholder')}
                    maxLength={100}
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

const CreateFolderDialogModal = NiceModal.create(CreateFolderDialog);

export const openCreateKBFolderDialog = (
  options?: CreateFolderDialogProps,
): Promise<boolean> => {
  return NiceModal.show(CreateFolderDialogModal, { ...options });
};

export default CreateFolderDialogModal;
