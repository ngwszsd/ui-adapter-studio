import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EnhancedTextarea,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Modal,
} from '@teamhelper/ui';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export type DraftArchivePayload = {
  description: string;
};

export type DraftArchiveDialogProps = {
  defaultDescription?: string;
};

const draftArchiveSchema = z.object({
  description: z.string().trim().min(1, '请输入存档介绍...'),
});

type FormSchema = z.infer<typeof draftArchiveSchema>;

function DraftArchiveDialog({
  defaultDescription = '',
}: DraftArchiveDialogProps) {
  const modal = useModal();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(draftArchiveSchema),
    defaultValues: {
      description: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!modal.visible) return;
    form.reset({
      description: defaultDescription,
    });
  }, [defaultDescription, form, modal.visible]);

  const onCancel = () => {
    modal.resolve(null);
    modal.hide();
    modal.remove();
  };

  const onSubmit = async (values: FormSchema) => {
    try {
      setSubmitting(true);
      modal.resolve({
        description: values.description.trim(),
      } satisfies DraftArchivePayload);
      modal.hide();
      modal.remove();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={Boolean(modal.visible)}
      title="草稿存档"
      okText="存档"
      cancelText="取消"
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        if (submitting) return false;
        const valid = await form.trigger();
        return valid;
      }}
      onOk={async () => {
        await form.handleSubmit(onSubmit)();
      }}
      classNames={{
        content: 'w-[488px] max-w-none',
      }}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  存档描述<span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <EnhancedTextarea
                    {...field}
                    maxLength={1000}
                    className="min-h-[120px] shadow-none"
                    placeholder="请输入存档介绍..."
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

const DraftArchiveModal = NiceModal.create(DraftArchiveDialog);

export const openWorkflowDraftArchiveDialog = (
  options?: DraftArchiveDialogProps,
): Promise<DraftArchivePayload | null> => {
  return NiceModal.show(DraftArchiveModal, { ...options });
};

export default DraftArchiveModal;
