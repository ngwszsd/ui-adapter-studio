import React, { useEffect, useMemo, useState, useRef } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
  Label,
  EnhancedTextarea,
} from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import { inviteDesignerApi } from '../../server';
import { useAuthStore } from '@/store';

type InviteDesignerFormData = {
  invite_describe: string;
  expire_type: number;
  use_limit_type: number;
};

interface InviteDesignerModalProps {
  onInvite?: (inviteUrl: string) => Promise<void> | void;
}

const InviteDesignerModal: React.FC<InviteDesignerModalProps> = ({
  onInvite,
}) => {
  const modal = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { t, i18n } = useTranslation('manage');
  const { userInfo } = useAuthStore();

  const inviteDesignerSchema = React.useMemo(
    () =>
      z.object({
        invite_describe: z
          .string()
          .min(1, t('errors.invite.tips.required'))
          .max(100, t('errors.invite.tips.max')),
        expire_type: z.number().min(1, t('errors.invite.expiry.required')),
        use_limit_type: z.number().refine((val) => val !== undefined, {
          message: t('errors.invite.memberLimit.required'),
        }),
      }),
    [t],
  );

  const form = useForm<InviteDesignerFormData>({
    resolver: zodResolver(inviteDesignerSchema),
    defaultValues: {
      invite_describe: '',
      expire_type: 2,
      use_limit_type: 1,
    },
  });

  const onSubmit = async (data: InviteDesignerFormData) => {
    try {
      setIsSubmitting(true);

      const team_id = userInfo?.team_id;
      if (!team_id) {
        throw new Error('团队ID不存在');
      }

      const res = await inviteDesignerApi({
        team_id: team_id,
        data,
      });

      // 调用外部传入的邀请函数
      if (onInvite) {
        await onInvite(res.data);
      }

      // 返回成功结果，关闭交由 Modal 的 onOpenChange 处理
      modal.resolve(true);
      form.reset();
      modal.hide();
      modal.remove();
    } catch (error) {
      console.error('邀请设计师失败:', error);
      modal.reject(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancel = () => {
    form.reset();
    modal.resolve(false);
    modal.remove();
  };

  const inviteDes = useMemo(() => {
    let w = '邀请您加入';
    if (i18n.language !== 'zh') w = 'invites you to join';
    return `${userInfo?.name} ${w} ${userInfo?.team_name}`;
  }, [i18n.language, userInfo?.name, userInfo?.team_name]);

  useEffect(() => {
    form.setValue('invite_describe', inviteDes);
    // 设置光标到文本末尾
    setTimeout(() => {
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }
    }, 0);
  }, [inviteDes, form]);
  return (
    <Modal
      open={modal.visible}
      title={t('inviteDesigner.dialog.title')}
      okText={t('inviteDesigner.ok')}
      cancelText={t('inviteDesigner.cancel')}
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
          {/* 邀请语 */}
          <FormField
            control={form.control}
            name="invite_describe"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t('inviteDesigner.word.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <EnhancedTextarea
                    className={
                      form.formState.errors.invite_describe
                        ? 'border-destructive'
                        : ''
                    }
                    placeholder={inviteDes}
                    maxLength={200}
                    {...field}
                    ref={textareaRef}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 过期时间 */}
          <FormField
            control={form.control}
            name="expire_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('inviteDesigner.expiry.label')}</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('inviteDesigner.expiry.placeholder')}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={1}>
                      {t('inviteDesigner.expiry.day.1')}
                    </SelectItem>
                    <SelectItem value={2}>
                      {t('inviteDesigner.expiry.day.7')}
                    </SelectItem>
                    <SelectItem value={3}>
                      {t('inviteDesigner.expiry.day.365')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 有效人数 */}
          <FormField
            control={form.control}
            name="use_limit_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('inviteDesigner.memberLimit.label')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                    className="flex items-center space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="one-person" />
                      <Label htmlFor="one-person">
                        {t('inviteDesigner.memberLimit.one')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id="unlimited" />
                      <Label htmlFor="unlimited">
                        {t('inviteDesigner.memberLimit.unlimited')}
                      </Label>
                    </div>
                  </RadioGroup>
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
const InviteDesignerModalComponent = NiceModal.create(InviteDesignerModal);

/**
 * 打开邀请设计师弹窗
 * @param options 邀请选项
 */
export const openInviteDesignerModal = (
  options?: InviteDesignerModalProps,
): Promise<boolean> => {
  return NiceModal.show(InviteDesignerModalComponent, options);
};

export default InviteDesignerModalComponent;
