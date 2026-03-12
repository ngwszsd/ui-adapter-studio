import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MoveLeft, Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCountdown } from '@/hooks/useCountDown';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useNavigate } from 'react-router';
import {
  Button,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  Form,
  message,
} from '@teamhelper/ui';
import { forgetPwdWithoutAuthApi, modifyPwdApi } from './server';
import { sendVerificationCodeApi } from '../Login/server';
import { PASSWORD_VALIDATION } from '@/constants';
import { PasswordCrypto } from '@/lib/crypto.ts';
function BaseForgetPassword({ isFromEditPwd }: { isFromEditPwd: boolean }) {
  const { t } = useTranslation('forgetPassword');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 定义忘记密码表单验证规则
  const forgetPasswordFormSchema = z
    .object({
      target: z
        .string()
        .min(1, t('phoneRequired'))
        .regex(/^1[3-9]\d{9}$/, t('phoneInvalid')),
      code: z
        .string()
        .min(6, t('verificationCodeMinLength'))
        .max(6, t('verificationCodeMaxLength'))
        .regex(/^\d+$/, t('verificationCodeOnlyNumbers')),
      new_password: z
        .string()
        .min(PASSWORD_VALIDATION.MIN_LENGTH, t('passwordMinLength'))
        .max(PASSWORD_VALIDATION.MAX_LENGTH, t('passwordMaxLength'))
        .regex(PASSWORD_VALIDATION.REGEX, t('passwordComplexity')),
      confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
    })
    .refine((data) => data.new_password === data.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    });

  type ForgetPasswordFormValues = z.infer<typeof forgetPasswordFormSchema>;

  // 默认表单值
  const defaultValues: Partial<ForgetPasswordFormValues> = {
    target: '',
    code: '',
    new_password: '',
    confirmPassword: '',
  };

  // 初始化 react-hook-form
  const form = useForm<ForgetPasswordFormValues>({
    resolver: zodResolver(forgetPasswordFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const navigate = useNavigate();
  const { seconds, isRunning, start } = useCountdown(60);

  // 表单提交处理
  async function onSubmit(data: ForgetPasswordFormValues) {
    console.log('忘记密码表单数据:', data);

    try {
      // 对新密码进行加密
      const encryptedPassword = await PasswordCrypto.encryptPassword(
        data.new_password,
      );

      if (isFromEditPwd) {
        await modifyPwdApi({
          target: data.target,
          code: data.code,
          new_password: encryptedPassword,
        });
      } else {
        await forgetPwdWithoutAuthApi({
          target: data.target,
          code: data.code,
          new_password: encryptedPassword,
        });
      }
      message.success(t('resetSuccess'));
      navigate('/login');
    } catch (error) {
      console.error('重置密码失败:', error);
      // 错误提示已经在 request.ts 拦截器中处理了
    }
  }

  // 发送验证码
  const handleSendVerificationCode = async () => {
    const target = form.getValues('target');
    if (!target || !/^1[3-9]\d{9}$/.test(target)) {
      form.setError('target', { message: t('phoneRequiredForCode') });
      return;
    }

    try {
      await sendVerificationCodeApi({
        target,
        type: isFromEditPwd ? 'change_password' : 'forgot_password',
      });
      start();
      message.success(t('verificationCodeSended'));
    } catch (error) {
      console.error('发送验证码失败:', error);
      // 错误提示已经在 request.ts 拦截器中处理了
    }
  };
  return (
    <div className="flex justify-center flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* 手机号字段 */}
          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('phoneLabel')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('phonePlaceholder')}
                    type="tel"
                    {...field}
                    className={
                      form.formState.errors.target ? 'border-destructive' : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 验证码字段 */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('verificationCodeLabel')}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder={t('verificationCodePlaceholder')}
                      type="text"
                      maxLength={6}
                      {...field}
                      className={
                        form.formState.errors.code ? 'border-destructive' : ''
                      }
                    />
                  </FormControl>
                  <Button
                    className="min-w-[100px]"
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={
                      !form.watch('target') ||
                      !!form.formState.errors.target ||
                      isRunning
                    }
                  >
                    {isRunning ? `${seconds}s` : t('getVerificationCode')}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 密码字段 */}
          <FormField
            control={form.control}
            name="new_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('passwordLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t('passwordPlaceholder')}
                      type={showPassword ? 'text' : 'password'}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // 当密码改变时，重新验证确认密码字段
                        if (form.getValues('confirmPassword')) {
                          form.trigger('confirmPassword');
                        }
                      }}
                      className={
                        form.formState.errors.new_password
                          ? 'border-destructive pr-10'
                          : 'pr-10'
                      }
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {!showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 确认密码字段 */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t('confirmPasswordPlaceholder')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...field}
                      className={
                        form.formState.errors.confirmPassword
                          ? 'border-destructive'
                          : 'pr-10'
                      }
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {!showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 提交按钮 */}
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting
              ? t('confirmingReset')
              : t('confirmReset')}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default function ForgetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation('forgetPassword');
  const query = useQueryParams<{ type: 'edit' }>();

  // 是否来自修改密码界面跳转
  const isFromEditPwd = useMemo(() => {
    return query && query?.type === 'edit';
  }, [query]);
  return (
    <div className="flex h-full justify-center items-center w-full bg-background">
      <div className="w-[384px] h-auto min-h-[400px] bg-card relative rounded-[12px]">
        <div
          aria-description={JSON.stringify(isFromEditPwd)}
          className="cursor-pointer flex items-center space-x-[4px] absolute left-0 top-[-40px]  text-primary font-medium text-base"
          onClick={() => {
            if (isFromEditPwd) {
              navigate(-1);
            } else {
              navigate('/login');
            }
          }}
        >
          <MoveLeft className="w-6 h-10 text-primary" />
          <span>{isFromEditPwd ? t('back') : t('backToLogin')}</span>
        </div>
        <div className="flex items-center">
          <div className="w-full text-center">
            <div className="font-bold text-2xl pt-[24px] pb-[8px] text-card-foreground">
              {isFromEditPwd ? t('title') : t('titleForget')}
            </div>
            <div className="font-normal text-sm text-muted-foreground pb-[28px]">
              {t('subtitle')}
            </div>
          </div>
        </div>
        <div className={'px-[24px] mb-[24px]'}>
          <BaseForgetPassword isFromEditPwd={isFromEditPwd} />
        </div>
      </div>
    </div>
  );
}
