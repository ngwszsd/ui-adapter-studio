import React, { useEffect, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  message,
  Modal,
  EnhancedTextarea,
} from '@teamhelper/ui';
import { transCanPublishApi } from '@/pages/ManageDetail/MenuPage/AppTest/server.ts';

const publishSchema = z.object({
  version_code: z
    .string()
    .min(
      1,
      i18n.t('manageDetail:appTestDetail.publish.errors.version.required'),
    )
    .regex(
      /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
      i18n.t('manageDetail:appTestDetail.publish.errors.version.format'),
    ),
  description: z.string().optional(),
});

type PublishFormData = z.infer<typeof publishSchema>;
type PublishVersionDialogProps = Pick<PublishFormData, 'description'> & {
  version_id: number;
  loadData: () => void;
  version_code: string;
};
const PublishVersionDialog: React.FC<PublishVersionDialogProps> = ({
  version_id,
  version_code,
  description,
  loadData,
}) => {
  const modal = useModal();
  const { t } = useTranslation('manageDetail');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PublishFormData>({
    resolver: zodResolver(publishSchema),
    defaultValues: {
      version_code: '',
      description: '',
    },
    mode: 'onChange',
  });

  const onCancel = () => {
    form.reset();
    modal.resolve(false);
    modal.hide();
    modal.remove();
  };

  const onSubmit = async (data: PublishFormData) => {
    try {
      setIsSubmitting(true);
      await transCanPublishApi({
        version_code: data.version_code,
        description: data.description || '',
        version_id,
      });
      loadData();
      form.reset();
      message.success(t('common.set.success'));
      modal.resolve(true);
      modal.hide();
      modal.remove();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (version_code) {
      // const incrementedVersion = incrementVersion(version_code);
      form.setValue('version_code', version_code);
    }
    if (description) {
      form.setValue('description', description);
    }
  }, [version_code, description, form]);
  return (
    <Modal
      open={modal.visible}
      title={t('appTestDetail.publish.title')}
      okText={t('appTestDetail.publish.ok')}
      cancelText={t('appTestDetail.publish.cancel')}
      className="w-[488px] max-w-[488px]"
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        if (isSubmitting) return false;
        const valid = await form.trigger();
        return valid;
      }}
      onOk={async () => form.handleSubmit(onSubmit)()}
    >
      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="version_code"
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>
                  {t('appTestDetail.publish.form.version.label')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      'appTestDetail.publish.form.version.placeholder',
                    )}
                    {...field}
                    className={
                      formState.errors.version_code ? 'border-destructive' : ''
                    }
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
                <FormLabel>
                  {t('appTestDetail.publish.form.description.label')}
                </FormLabel>
                <FormControl>
                  <EnhancedTextarea
                    placeholder={t(
                      'appTestDetail.publish.form.description.placeholder',
                    )}
                    className="min-h-[100px] shadow-none"
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
};

const PublishVersionModal = NiceModal.create(PublishVersionDialog);

export const openPublishVersionModal = (
  options?: PublishVersionDialogProps,
): Promise<boolean> => {
  return NiceModal.show(PublishVersionModal, {
    ...options,
  });
};

export default PublishVersionModal;
