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
  EnhancedSelect,
  Form,
} from '@teamhelper/ui';
import {
  addUserApi,
  editUserApi,
  type UseListDto,
  type UserGroupListDto,
} from '../server';
import { message } from '@teamhelper/ui';
import { useParams } from 'react-router';
import { isNumber } from 'es-toolkit/compat';
import { Eye, EyeOff } from 'lucide-react';
import { PASSWORD_VALIDATION } from '@/constants';

const createOfficialUserSchema = (isEdit: boolean = false) =>
  z.object({
    name: z
      .string()
      .min(
        1,
        i18n.t('manageDetail:officialUsers.create.errors.userName.required'),
      )
      .max(20, i18n.t('manageDetail:officialUsers.username.test.max')),
    account: z
      .string()
      .min(4, i18n.t('manageDetail:officialUsers.account.test.min'))
      .max(8, i18n.t('manageDetail:officialUsers.account.test.max')),
    password: isEdit
      ? z.string().optional()
      : z
          .string()
          .min(4, i18n.t('manageDetail:appTestUsers.reset.errors.minPassword'))
          .max(8, i18n.t('manageDetail:appTestUsers.reset.errors.maxPassword')),
    group_ids: z.array(z.number()),
  });

type CreateOfficialUserFormData = z.infer<
  ReturnType<typeof createOfficialUserSchema>
>;

interface CreateOfficialUserDialogProps {
  groups: UserGroupListDto[];
  userRow?: UseListDto;
  getUserList: () => void;
  getGroupList: () => void;
  project_id: number;
}

const CreateOfficialUserDialog: React.FC<CreateOfficialUserDialogProps> = ({
  groups = [],
  userRow,
  getUserList,
  project_id,
  getGroupList,
}) => {
  const { user_id } = userRow ?? {};
  const modal = useModal();
  const { t } = useTranslation('manageDetail');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEdit = isNumber(user_id);
  const form = useForm<CreateOfficialUserFormData>({
    resolver: zodResolver(createOfficialUserSchema(isEdit)),
    defaultValues: {
      name: '',
      account: '',
      password: '',
      group_ids: [],
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
        group_ids: userRow.groups.map((g) => g.group_id) || [],
      };
      (Object.keys(detailData) as Array<keyof typeof detailData>).forEach(
        (key) => {
          form.setValue(key, detailData[key]);
        },
      );
    }
  }, [userRow, user_id]);
  const onSubmit = async (data: CreateOfficialUserFormData) => {
    try {
      setIsSubmitting(true);
      if (!user_id) {
        await addUserApi({
          name: data.name,
          account: data.account,
          password: data.password as string,
          group_ids: data.group_ids,
          project_id: Number(project_id),
        });
      } else {
        await editUserApi({
          name: data.name,
          group_ids: data.group_ids,
          user_id: user_id,
        });
      }
      message.success(
        !user_id
          ? t('officialUsers.toast.createUserSuccess')
          : t('officialUsers.toast.updateUserSuccess'),
      );
      getUserList();
      getGroupList();
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
        return valid;
      }}
      onOk={async () => form.handleSubmit(onSubmit)()}
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
                  {t('officialUsers.create.form.userName.label')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      'officialUsers.create.form.userName.placeholder',
                    )}
                    {...field}
                    className={
                      formState.errors.name ? 'border-destructive' : ''
                    }
                    maxLength={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 账号 */}
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
                    disabled={isEdit}
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

          {/* 密码 */}
          {!isEdit && (
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
                        disabled={isEdit}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t(
                          'officialUsers.create.form.password.placeholder',
                        )}
                        {...field}
                        className={
                          formState.errors.password ? 'border-destructive' : ''
                        }
                      />
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
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 分组 */}
          <FormField
            control={form.control}
            name="group_ids"
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>
                  {t('officialUsers.create.form.group.label')}
                </FormLabel>
                <FormControl>
                  <EnhancedSelect
                    mode={'multiple'}
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    options={groups
                      .filter((v) => v.group_id !== 0)
                      .map((g) => ({
                        value: g.group_id,
                        label: g.group_name,
                      }))}
                    placeholder={t(
                      'officialUsers.create.form.group.placeholder',
                    )}
                    inputClassName={
                      formState.errors.group_ids ? 'border-destructive' : ''
                    }
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

const CreateOfficialUserModal = NiceModal.create(CreateOfficialUserDialog);

export const openCreateOfficialUserModal = (
  options?: CreateOfficialUserDialogProps,
): Promise<CreateOfficialUserFormData> => {
  return NiceModal.show(CreateOfficialUserModal, { ...options });
};

export default CreateOfficialUserModal;
