import React from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import {
  Modal,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  Form,
  message,
} from '@teamhelper/ui';
import i18n from '@/i18n';
import { modifyPwdApi } from '../server';
import { PASSWORD_VALIDATION } from '@/constants';

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(4, i18n.t('manageDetail:appTestUsers.reset.errors.minPassword'))
      .max(8, i18n.t('manageDetail:appTestUsers.reset.errors.maxPassword')),
    confirmPassword: z
      .string()
      .min(4, i18n.t('manageDetail:appTestUsers.reset.errors.minPassword'))
      .max(8, i18n.t('manageDetail:appTestUsers.reset.errors.maxPassword')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: i18n.t('manageDetail:officialUsers.reset.errors.passwordMismatch'),
  });
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
function ChangePasswordDialog({
  user_id,
  getUserList,
}: {
  user_id: number;
  getUserList: () => void;
}) {
  const modal = useModal();
  const { t } = useTranslation('manageDetail');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const onCancel = async () => {
    modal.resolve(false);
    modal.hide();
    modal.remove();
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsSubmitting(true);
      await modifyPwdApi({ password: data.password, user_id });
      message.success(t('officialUsers.create.form.password.success'));
      modal.resolve(true);
      getUserList();
      modal.hide();
      modal.remove();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={modal.visible}
      title={t('officialUsers.reset.title')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        if (isSubmitting) return false;
        const valid = await form.trigger();
        return valid;
      }}
      onOk={async () => form.handleSubmit(onSubmit)()}
      closable
      classNames={{
        content: 'w-[488px]',
        body: 'py-[2px]',
      }}
    >
      <Form {...form}>
        <form className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('officialUsers.reset.form.newPassword.label')}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t(
                        'officialUsers.reset.form.newPassword.placeholder',
                      )}
                      type={showNew ? 'text' : 'password'}
                      {...field}
                      className={
                        form.formState.errors.password
                          ? 'border-destructive'
                          : ''
                      }
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNew((v) => !v)}
                    >
                      {showNew ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('officialUsers.reset.form.confirmPassword.label')}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t(
                        'officialUsers.reset.form.confirmPassword.placeholder',
                      )}
                      type={showConfirm ? 'text' : 'password'}
                      {...field}
                      className={
                        form.formState.errors.confirmPassword
                          ? 'border-destructive'
                          : ''
                      }
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      {showConfirm ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
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

const ChangePasswordModal = NiceModal.create(ChangePasswordDialog);

export const openChangePasswordModal = (options?: {
  user_id: number;
  getUserList: () => void;
}): Promise<ChangePasswordFormData> => {
  return NiceModal.show(ChangePasswordModal, { ...options });
};

export default ChangePasswordModal;
