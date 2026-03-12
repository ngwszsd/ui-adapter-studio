import React from 'react';
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
import { Users, CircleDollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { updateEnterpriseApi } from '../../server';
import { useAuthStore } from '@/store';

type UpgradeEnterpriseFormData = {
  company_name: string;
  social_credit_code: string;
  phone_number: string;
  team_size: number;
};

// 移除 onSubmit 接口，不再需要外部回调
interface UpgradeEnterpriseDialogProps {
  // 可以添加其他配置项，但不需要 onSubmit
}

const UpgradeEnterpriseDialog: React.FC<UpgradeEnterpriseDialogProps> = () => {
  const modal = useModal();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { t } = useTranslation('manage');
  const { userInfo } = useAuthStore();

  const upgradeEnterpriseSchema = React.useMemo(
    () =>
      z.object({
        company_name: z
          .string()
          .min(1, t('errors.companyName.required'))
          .min(2, t('errors.companyName.min')),
        social_credit_code: z
          .string()
          .min(1, t('errors.creditCode.required'))
          .regex(
            /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
            t('errors.creditCode.format'),
          ),
        phone_number: z
          .string()
          .min(1, t('errors.phone.required'))
          .regex(/^1[3-9]\d{9}$/, t('errors.phone.format')),
        team_size: z.number(),
      }),
    [t],
  );

  const teamSizeOptions = React.useMemo(
    () => [
      { value: 1, label: t('enterprise.teamSize.option.1_10') },
      { value: 2, label: t('enterprise.teamSize.option.11_50') },
      { value: 3, label: t('enterprise.teamSize.option.51_100') },
      { value: 4, label: t('enterprise.teamSize.option.101_500') },
      { value: 5, label: t('enterprise.teamSize.option.500_plus') },
    ],
    [t],
  );

  const form = useForm<UpgradeEnterpriseFormData>({
    resolver: zodResolver(upgradeEnterpriseSchema),
    defaultValues: {
      company_name: '',
      social_credit_code: '',
      phone_number: userInfo?.mobile || '',
      team_size: 1,
    },
  });

  const handleSubmit = async (data: UpgradeEnterpriseFormData) => {
    setIsSubmitting(true);

    try {
      const team_id = userInfo?.team_id;
      if (!team_id) {
        throw new Error('团队ID不存在');
      }

      await updateEnterpriseApi({
        team_id: team_id,
        data,
      });

      // 成功时使用 modal.resolve 返回数据
      modal.resolve(data);
      form.reset();
      modal.remove();
    } catch (error) {
      // 失败时使用 modal.reject 返回错误
      modal.reject(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    modal.resolve(null);
    modal.remove();
  };
  return (
    <Modal
      open={modal.visible}
      title={
        <div className="flex space-x-5">
          <div>{t('enterprise.dialog.title')}</div>
          <div className="font-medium text-sm text-primary flex items-center">
            <CircleDollarSign className="h-4 w-4 mr-1" />
            {t('package.fee')}
          </div>
        </div>
      }
      okText={t('enterprise.submit')}
      cancelText={t('enterprise.cancel')}
      onCancel={handleCancel}
      onOkBeforeFunction={async () => {
        if (isSubmitting) return false; // 提交中阻止二次提交
        const valid = await form.trigger(); // 先做整体校验
        return valid; // 校验失败则阻止执行 onOk
      }}
      onOk={form.handleSubmit(handleSubmit)}
    >
      <Form {...form}>
        <form className="space-y-4">
          {/* 公司名称 */}
          <FormField
            control={form.control}
            name="company_name"
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t('enterprise.companyName.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t('enterprise.companyName.placeholder')}
                      {...field}
                      className={
                        formState.errors.company_name
                          ? 'border-destructive'
                          : ''
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 统一社会信用代码 */}
          <FormField
            control={form.control}
            name="social_credit_code"
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t('enterprise.creditCode.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t('enterprise.creditCode.placeholder')}
                      {...field}
                      className={
                        formState.errors.social_credit_code
                          ? 'border-destructive'
                          : ''
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 手机号 */}
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t('enterprise.phone.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('enterprise.phone.placeholder')}
                    {...field}
                    maxLength={11}
                    className={
                      formState.errors.phone_number ? 'border-destructive' : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 团队人数 */}
          <FormField
            control={form.control}
            name="team_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t('enterprise.teamSize.label')}
                </FormLabel>
                <FormControl>
                  <div className="grid grid-cols-5 gap-2">
                    {teamSizeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`
                            px-0 py-[12px] text-sm rounded-md border transition-colors flex flex-col items-center gap-[6px]
                            ${
                              field.value === option.value
                                ? 'text-primary! border-primary'
                                : 'text-muted-foreground bg-card border-input hover:bg-accent hover:text-accent-foreground'
                            }
                          `}
                      >
                        <Users />
                        <div className="font-normal text-sm ">
                          {option.label}
                        </div>
                      </button>
                    ))}
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
};

// 使用 NiceModal.create 包装组件
export default NiceModal.create(UpgradeEnterpriseDialog);
