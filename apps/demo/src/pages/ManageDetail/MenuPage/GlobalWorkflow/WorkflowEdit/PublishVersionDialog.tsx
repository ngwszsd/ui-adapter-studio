import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EnhancedInput,
  EnhancedTextarea,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Modal,
} from '@teamhelper/ui';
import { CircleHelp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export type PublishPayload = {
  version: string;
  description: string;
};

export type PublishDialogProps = {
  defaultVersion?: string;
  defaultDescription?: string;
};

const publishVersionSchema = z.object({
  version: z.string().trim().min(1, '请输入版本号'),
  description: z.string().trim().min(1, '请输入存档介绍...'),
});

type FormSchema = z.infer<typeof publishVersionSchema>;

function PublishVersionDialog({
  defaultVersion = 'v0.0.1',
  defaultDescription = '',
}: PublishDialogProps) {
  const modal = useModal();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(publishVersionSchema),
    defaultValues: {
      version: defaultVersion,
      description: defaultDescription,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!modal.visible) return;
    form.reset({
      version: defaultVersion,
      description: defaultDescription,
    });
  }, [defaultDescription, defaultVersion, form, modal.visible]);

  const onCancel = () => {
    modal.resolve(null);
    modal.hide();
    modal.remove();
  };

  const onSubmit = async (values: FormSchema) => {
    try {
      setSubmitting(true);
      modal.resolve({
        version: values.version.trim(),
        description: values.description.trim(),
      } satisfies PublishPayload);
      modal.hide();
      modal.remove();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={Boolean(modal.visible)}
      title={
        <div className="flex items-center gap-2">
          <span>发布版本</span>
          <CircleHelp className="w-4 h-4 text-muted-foreground" />
        </div>
      }
      okText="确认"
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
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  版本号<span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <EnhancedInput
                    {...field}
                    maxLength={30}
                    disabled
                    placeholder="-"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

const PublishVersionModal = NiceModal.create(PublishVersionDialog);

export const openWorkflowPublishDialog = (
  options?: PublishDialogProps,
): Promise<PublishPayload | null> => {
  return NiceModal.show(PublishVersionModal, { ...options });
};

export default PublishVersionModal;
