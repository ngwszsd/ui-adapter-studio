import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useLogin } from './login-context.tsx';
import { useCountdown } from '@/hooks/useCountDown';
import { useTranslation } from 'react-i18next';
import PasswordInput from './PasswordInput';
import { loginApi, registerApi, sendVerificationCodeApi } from './server';
import { PASSWORD_VALIDATION, LS_KEYS } from '@/constants';
import { PasswordCrypto } from '@/lib/crypto.ts';
import { InvitationInfo } from './InvitationInfo';
import { cn } from '@/lib/utils.ts';
import { handleInviteApi } from '../Manage/server.ts';
import { useNavigate, useSearchParams } from 'react-router';
import { useValidateInviteCode } from '@/hooks/useValidateInviteCode.ts';

export default function RegisterForm() {
  const { validateInviteCode } = useValidateInviteCode();
  const { t } = useTranslation('login');
  const { switchToLogin, switchToRegisterSuccess, inviteCode, setInviteCode } =
    useLogin();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const registerFormSchema = z
    .object({
      name: z.string().min(1, t('nameRequired')),
      mobile: z
        .string()
        .min(1, t('phoneRequired'))
        .regex(/^1[3-9]\d{9}$/, t('phoneInvalid')),
      code: z
        .string()
        .min(6, t('verificationCodeMinLength'))
        .max(6, t('verificationCodeMaxLength'))
        .regex(/^\d+$/, t('verificationCodeOnlyNumbers')),
      password: z
        .string()
        .min(PASSWORD_VALIDATION.MIN_LENGTH, t('passwordMinLength'))
        .max(PASSWORD_VALIDATION.MAX_LENGTH, t('passwordMaxLength'))
        .regex(PASSWORD_VALIDATION.REGEX, t('passwordComplexity')),
      confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    });
  type RegisterFormValues = z.infer<typeof registerFormSchema>;
  const defaultValues: Partial<RegisterFormValues> = {
    mobile: '',
    code: '',
    password: '',
    confirmPassword: '',
  };

  // 初始化 react-hook-form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues,
    mode: 'onChange', // 实时验证
  });

  // 表单提交处理
  async function onSubmit(data: RegisterFormValues) {
    try {
      // 对密码进行加密
      const encryptedPassword = await PasswordCrypto.encryptPassword(
        data.password,
      );

      await registerApi({
        name: data.name,
        mobile: data.mobile,
        code: data.code,
        password: encryptedPassword,
      });

      if (!inviteCode) {
        sessionStorage.setItem(
          LS_KEYS.REGISTER_INFO,
          JSON.stringify({ mobile: data.mobile, password: encryptedPassword }),
        );
        switchToRegisterSuccess?.();
      } else {
        nextActionFn(data);
      }
    } catch (error) {
      console.error('注册失败:', error);
    }
  }

  const nextActionFn = async (data: RegisterFormValues) => {
    if (inviteCode) {
      const isValid = await validateInviteCode(inviteCode, () => {
        setInviteCode?.('');
      });
      if (!isValid) {
        message.success(t('registerSuccess'));
        return;
      }
    }

    try {
      // 对密码进行加密
      const encryptedPassword = await PasswordCrypto.encryptPassword(
        data?.password,
      );
      const res = await loginApi({
        mobile: data?.mobile,
        password: encryptedPassword,
      });

      // 存储 Token 和过期时间
      const { token, expire_time } = res.data;
      localStorage.setItem(LS_KEYS.TOKEN, token);
      message.success(t('loginSuccess'));

      try {
        await handleInviteApi(
          inviteCode,
          {
            approval_type: 1,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch (_error) {}

      // 获取重定向地址
      const redirect = searchParams.get('redirect');
      // 跳转到重定向地址或首页
      navigate(redirect ? decodeURIComponent(redirect) : '/', {
        replace: true,
      });
    } catch (error) {
      console.error('登录失败:', error);
      // 错误提示已经在 request.ts 拦截器中处理了，这里不需要重复弹出
    }
  };

  const { seconds, isRunning, start } = useCountdown(60);
  // 发送验证码
  const handleSendVerificationCode = async () => {
    const mobile = form.getValues('mobile');
    if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) {
      form.setError('mobile', { message: t('phoneInvalid') });
      return;
    }

    try {
      await sendVerificationCodeApi({
        target: mobile,
        type: 'register',
      });
      start();
      message.success(t('codeSended'));
    } catch (error) {
      console.error('发送验证码失败:', error);
      // 错误提示已经在 request.ts 拦截器中处理了
    }
  };

  return (
    <div className="flex justify-center flex-col">
      {!inviteCode ? (
        <div className="flex items-center">
          <div className="w-full">
            <div className="font-bold text-[24px] pb-[8px]  text-center">
              {t('registerTitle')}
            </div>
            <div className="font-normal text-[14px] pb-[42px] text-muted-foreground  text-center">
              {t('registerSubtitle')}
            </div>
          </div>
        </div>
      ) : (
        <InvitationInfo />
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn('space-y-0', inviteCode && 'mt-4')}
        >
          {/* 姓名字段 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>{t('nameLabel')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('namePlaceholder')}
                    type="text"
                    {...field}
                    className={
                      form.formState.errors.name ? 'border-destructive' : ''
                    }
                    maxLength={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 手机号字段 */}
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>{t('phoneLabel')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('phonePlaceholder')}
                    type="tel"
                    {...field}
                    className={
                      form.formState.errors.mobile ? 'border-destructive' : ''
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
              <FormItem className="mb-4">
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
                      !form.watch('mobile') ||
                      !!form.formState.errors.mobile ||
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
            name="password"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>{t('passwordLabel')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={t('passwordPlaceholder')}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // 当密码改变时，重新验证确认密码字段
                      if (form.getValues('confirmPassword')) {
                        form.trigger('confirmPassword');
                      }
                    }}
                    className={
                      form.formState.errors.password ? 'border-destructive' : ''
                    }
                  />
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
              <FormItem className="mb-7">
                <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={t('confirmPasswordPlaceholder')}
                    {...field}
                    className={
                      form.formState.errors.confirmPassword
                        ? 'border-destructive'
                        : ''
                    }
                  />
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
            {!inviteCode ? (
              <>
                {form.formState.isSubmitting ? t('registering') : t('register')}
              </>
            ) : (
              <>
                {form?.formState?.isSubmitting
                  ? t('registering')
                  : t('registerAndJoinTeam')}
              </>
            )}
          </Button>

          {/* 切换到登录 */}
          <div className="mt-5 text-center font-normal text-sm text-muted-foreground">
            <div>
              {t('loginPrompt')}
              <span
                onClick={() => switchToLogin?.()}
                className="text-primary cursor-pointer"
              >
                {!inviteCode ? <>{t('loginLink')}</> : t('loginNowAndJoinTeam')}
              </span>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
