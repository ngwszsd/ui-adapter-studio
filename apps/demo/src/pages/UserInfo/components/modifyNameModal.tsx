import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Modal,
  Input,
} from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import { editUserInfoApi } from '../server';
import { useAuthStore } from '@/store';
type ModifyNameFormData = {
  name: string;
};

interface ModifyNameModalProps {}

const ModifyNameModal: React.FC<ModifyNameModalProps> = ({}) => {
  const modal = useModal();
  const { userInfo, fetchUserInfo, fetchUserTeamList } = useAuthStore();
  const { avatar } = userInfo || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation('userInfo');

  const ModifyNameSchema = React.useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(1, t('ModifyName.errorRequired'))
          .max(20, t('ModifyName.errorLength')),
      }),
    [t],
  );

  const form = useForm<ModifyNameFormData>({
    resolver: zodResolver(ModifyNameSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: ModifyNameFormData) => {
    try {
      setIsSubmitting(true);

      // 调用修改用户信息API
      await editUserInfoApi({
        name: data.name,
        // avatar: avatar || '',
      });

      // 重新获取用户信息
      await fetchUserInfo();
      await fetchUserTeamList();

      modal.resolve(true);
      form.reset();
      modal.remove();
    } catch (error) {
      console.error('修改名称失败:', error);
      // 可以在这里显示错误提示
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancel = () => {
    form.reset();
    modal.hide();
    modal.remove();
    modal.resolve(false);
  };
  return (
    <Modal
      open={modal.visible}
      title={t('ModifyName.title')}
      onCancelBeforeFunction={() => true}
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        if (isSubmitting) return false;
        const valid = await form.trigger();
        return valid;
      }}
      onOk={form.handleSubmit(onSubmit)}
    >
      <Form {...form}>
        <form className="space-y-4">
          {/* 名称 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t('ModifyName.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('ModifyName.placeholder')}
                    maxLength={20}
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

// 创建NiceModal组件
const ModifyNameModalComponent = NiceModal.create(ModifyNameModal);

export const openModifyNameModal = (
  options?: ModifyNameModalProps,
): Promise<boolean> => {
  return NiceModal.show(ModifyNameModalComponent, options);
};

export default ModifyNameModalComponent;
