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
import { useEffect } from 'react';
import {
  renameKnowledgeDatasetsApi,
  type IKnowledgeDatasetsDto,
} from '../server.ts';

export interface RenameDialogProps {
  formValues?: IKnowledgeDatasetsDto;
}

function RenameDialog({ formValues }: RenameDialogProps) {
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
    const result = await renameKnowledgeDatasetsApi({
      ...values,
      dataset_id: formValues?.id || null,
    });
    if (!result) return Promise.reject();

    onCancel(true);
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={t('dialog.rename.title')}
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
                <FormLabel>
                  {t('dialog.name')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('folder.placeholder')}
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

const RenameDialogModal = NiceModal.create(RenameDialog);

/** 打开重命名弹窗，返回用户确认的名称 */
export const openRenameDialog = (
  options?: RenameDialogProps,
): Promise<boolean> => {
  return NiceModal.show(RenameDialogModal, options);
};

export default RenameDialogModal;
