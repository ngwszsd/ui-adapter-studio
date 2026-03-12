import React, { useEffect } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
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
import { addUserApi, editUserApi, type AppTestUserListDto } from '../../server';
import { message } from '@teamhelper/ui';
import { isNumber } from 'es-toolkit/compat';
import { PASSWORD_VALIDATION } from '@/constants';
import { Eye, EyeOff } from 'lucide-react';

const AppTestCreateUserSchema = z.object({
  name: z
    .string()
    .min(
      1,
      i18n.t('manageDetail:officialUsers.create.errors.userName.required'),
    ),
  account: z
    .string()
    .min(4, i18n.t('manageDetail:officialUsers.account.test.min'))
    .max(8, i18n.t('manageDetail:officialUsers.account.test.max')),
  password: z
    .string()
    .min(4, i18n.t('manageDetail:appTestUsers.reset.errors.minPassword'))
    .max(8, i18n.t('manageDetail:appTestUsers.reset.errors.maxPassword')),
});

const AppTestEditUserSchema = z.object({
  name: z
    .string()
    .min(
      1,
      i18n.t('manageDetail:officialUsers.create.errors.userName.required'),
    ),
  account: z.string().optional(),
  password: z.string().optional(),
});

type AppTestCreateUserFormData = {
  name: string;
  account: string;
  password: string;
};

interface AppTestCreateUserDialogProps {
  userRow?: AppTestUserListDto;
  getUserList: () => void;
  project_id: number;
}

const AppTestCreateUserDialog: React.FC<AppTestCreateUserDialogProps> = ({
  userRow,
  getUserList,
  project_id,
}) => {
  const { user_id } = userRow ?? {};
  const modal = useModal();
  const { t } = useTranslation('manageDetail');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<AppTestCreateUserFormData>({
    resolver: zodResolver(
      user_id ? AppTestEditUserSchema : AppTestCreateUserSchema,
    ) as any,
    defaultValues: {
      name: '',
      account: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onCancel = () => {
    form.reset();
    modal.resolve(false);
    modal.hide();
    modal.remove();
  };

  useEffect(() => {
    if (userRow && user_id) {
      const detailData = {
        name: userRow.name,
        account: userRow.account,
        password: userRow.password,
      };
      (Object.keys(detailData) as Array<keyof typeof detailData>).forEach(
        (key) => {
          form.setValue(key, detailData[key]);
        },
      );
    }
  }, [userRow, user_id]);
  const onSubmit = async (data: AppTestCreateUserFormData) => {
    try {
      setIsSubmitting(true);
      if (!user_id) {
        await addUserApi({
          name: data.name,
          account: data.account,
          password: data.password,
          project_id: Number(project_id),
        });
      } else {
        await editUserApi({
          name: data.name,
          user_id: user_id,
        });
      }
      message.success(
        !user_id
          ? t('officialUsers.toast.createUserSuccess')
          : t('officialUsers.toast.updateUserSuccess'),
      );
      getUserList();
      modal.resolve(true);
      form.reset();
      modal.hide();
      modal.remove();
    } catch (error) {
      console.error('创建用户失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Modal
      open={modal.visible}
      title={
        !user_id
          ? t('officialUsers.create.title')
          : t('officialUsers.toast.editUser')
      }
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        if (isSubmitting) return false;
        const valid = await form.trigger();
        if (valid) {
          await form.handleSubmit(onSubmit)();
        }
        return valid;
      }}
      classNames={{
        content: 'w-[488px]',
        body: 'py-[2px]',
      }}
    >
      <Form {...form}>
        <form className="space-y-6">
          {/* 用户名 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>
                  {t('officialUsers.create.form.userName.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    maxLength={20}
                    placeholder={t(
                      'officialUsers.create.form.userName.placeholder',
                    )}
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

          {/* 账号 */}
          {isNumber(user_id) ? (
            <></>
          ) : (
            <FormField
              control={form.control}
              name="account"
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>
                    {t('officialUsers.create.form.account.label')}{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={isNumber(user_id)}
                      placeholder={t(
                        'officialUsers.create.form.account.placeholder',
                      )}
                      {...field}
                      className={
                        formState.errors.account ? 'border-destructive' : ''
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 密码 */}
          {isNumber(user_id) ? (
            <></>
          ) : (
            <FormField
              control={form.control}
              name="password"
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>
                    {t('officialUsers.create.form.password.label')}{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t(
                          'officialUsers.create.form.password.placeholder',
                        )}
                        {...field}
                        className={
                          formState.errors.password ? 'border-destructive' : ''
                        }
                      />
                      {
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {!showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      }
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>
    </Modal>
  );
};

const AppTestCreateUserModal = NiceModal.create(AppTestCreateUserDialog);

export const openAppTestCreateUserModal = (
  options?: AppTestCreateUserDialogProps,
): Promise<AppTestCreateUserFormData> => {
  return NiceModal.show(AppTestCreateUserModal, { ...options });
};

export default AppTestCreateUserModal;
