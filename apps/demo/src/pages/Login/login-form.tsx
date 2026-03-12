import { useForm } from 'react-hook-form';
import { useKeyPress } from 'ahooks';
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
import { useTranslation } from 'react-i18next';
import PasswordInput from './PasswordInput';
import { useNavigate, useSearchParams } from 'react-router';
import { loginApi } from './server';
import { LS_KEYS, PASSWORD_VALIDATION } from '@/constants';
import { PasswordCrypto } from '@/lib/crypto.ts';
import { InvitationInfo } from './InvitationInfo';
import { handleInviteApi } from '@/pages/Manage/server.ts';
import { cn } from '@/lib/utils.ts';
import { useValidateInviteCode } from '@/hooks/useValidateInviteCode.ts';

// 定义表单验证规则
export default function LoginForm() {
  const { validateInviteCode } = useValidateInviteCode();
  const navigate = useNavigate();
  const { t } = useTranslation('login');
  const { switchToRegister, inviteCode, setInviteCode } = useLogin();
  const loginFormSchema = z.object({
    mobile: z
      .string()
      .min(1, t('mobileRequired'))
      .regex(/^1[3-9]\d{9}$/, t('mobileInvalid')),
    password: z
      .string()
      .min(PASSWORD_VALIDATION.MIN_LENGTH, t('passwordMinLength'))
      .max(PASSWORD_VALIDATION.MAX_LENGTH, t('passwordMaxLength'))
      .regex(PASSWORD_VALIDATION.REGEX, t('passwordComplexity')),
    remember: z.boolean().optional(),
  });

  type LoginFormValues = z.infer<typeof loginFormSchema>;

  // 默认表单值
  const defaultValues: Partial<LoginFormValues> = {
    mobile: '',
    password: '',
    remember: false,
  };

  const [searchParams] = useSearchParams();

  // 初始化 react-hook-form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues,
    mode: 'onChange', // 实时验证
  });

  // 表单提交处理
  async function onSubmit(data: LoginFormValues) {
    try {
      // 对密码进行加密
      const encryptedPassword = await PasswordCrypto.encryptPassword(
        data.password,
      );
      const res = await loginApi({
        mobile: data.mobile,
        password: encryptedPassword,
      });

      // 存储 Token 和过期时间
      const { token, expire_time } = res.data;

      if (inviteCode) {
        const isValid = await validateInviteCode(inviteCode, () => {
          setInviteCode?.('');
        });
        if (!isValid) {
          return;
        }
      }

      localStorage.setItem(LS_KEYS.TOKEN, token);
      message.success(t('loginSuccess'));

      if (inviteCode) {
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
      }

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
  }

  useKeyPress('enter', (e) => {
    // 强制阻止默认行为并触发表单提交，解决部分插件（如 iCloud 密码）拦截/干扰回车事件的问题
    e.preventDefault();
    form.handleSubmit(onSubmit)();
  });

  return (
    <div className="flex justify-center flex-col">
      {!inviteCode ? (
        <div className="flex items-center">
          <div className="w-full">
            <div className="font-bold text-[24px] pb-[8px] text-center">
              {t('welcomeTitle')}
            </div>
            <div className="font-normal text-[14px] pb-[42px] text-center">
              {t('welcomeSubtitle')}
            </div>
          </div>
        </div>
      ) : (
        <InvitationInfo />
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn('space-y-0', inviteCode && 'mt-[22px]')}
        >
          {/* 邮箱字段 */}
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem className="mb-[28px]">
                <FormLabel>{t('mobileLabel')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('mobilePlaceholder')}
                    type="mobile"
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

          {/* 密码字段 */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('passwordLabel')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={t('passwordPlaceholder')}
                    {...field}
                    className={
                      form.formState.errors.password ? 'border-destructive' : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div
            onClick={() => navigate('/forgot-password')}
            className="font-normal text-sm text-primary text-right mt-3 mb-[36px] cursor-pointer"
          >
            {t('passwordForget')}?
          </div>
          {/* 提交按钮 */}
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {!inviteCode ? (
              <>{form.formState.isSubmitting ? t('loggingIn') : t('login')}</>
            ) : (
              <>
                {form?.formState?.isSubmitting
                  ? t('loggingIn')
                  : t('loginAndJoinTeam')}
              </>
            )}
          </Button>

          {/* 表单状态显示 */}
          <div className="mt-5 text-center text-muted-foreground font-normal text-sm">
            <div>
              {t('registerPrompt')}
              <span
                onClick={() => switchToRegister?.()}
                className="text-primary cursor-pointer"
              >
                {t('registerLink')}
              </span>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
