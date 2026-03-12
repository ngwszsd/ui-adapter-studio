import React, { useEffect } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { CirclePlus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnhancedButton, Form } from '@teamhelper/ui';
import {
  Modal,
  Label,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  EnhancedSelect as Select,
} from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils.ts';

type AuthKind = 'Bearer' | 'Custom';
type HeaderKV = { id: number; key: string; value: string };

export interface AuthConfigResult {
  kind: AuthKind;
  headers?: {
    Authorization?: string;
  } & Record<any, any>;
  bearerValue?: string;
}

const AuthConfigDialog: React.FC<{
  authConfig: AuthConfigResult | null;
}> = ({ authConfig }) => {
  const modal = useModal();
  const { t } = useTranslation('manageDetail');
  // 表单 schema：全部必填；根据 kind 条件校验
  const authSchema = z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('Bearer'),
      bearerValue: z.string().min(1, t('authConfig.bearer.value.required')),
      headers: z
        .array(
          z.object({
            id: z.number(),
            key: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
    }),
    z.object({
      kind: z.literal('Custom'),
      bearerValue: z.string().optional(),
      headers: z
        .array(
          z.object({
            id: z.number(),
            key: z.string().min(1, t('authConfig.custom.key.required')),
            value: z.string().min(1, t('authConfig.custom.value.required')),
          }),
        )
        .min(1, t('authConfig.custom.minHeaders')),
    }),
  ]);

  const form = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      kind: 'Bearer' as AuthKind,
      bearerValue: '',
      headers: [{ id: 1, key: '', value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'headers',
  });

  const kind = form.watch('kind') as AuthKind;

  const onSubmit = (data: AuthConfigResult) => {
    let result: AuthConfigResult = {
      kind: data.kind,
    };
    if (data.kind === 'Bearer') {
      result = {
        kind: data.kind,
        headers: {
          Authorization: `Bearer ${data.bearerValue}`,
        },
      };
    }
    if (data.kind === 'Custom') {
      // 将 headers 数组转换为对象格式
      const headersObj =
        data.headers?.reduce(
          (acc: Record<string, string>, header: HeaderKV) => {
            if (header.key && header.value) {
              acc[header.key] = header.value;
            }
            return acc;
          },
          {} as Record<any, string>,
        ) || {};
      result = {
        kind: data.kind,
        headers: headersObj,
      };
    }
    modal.resolve(result);
    form.reset();
    modal.hide();
    modal.remove();
  };

  useEffect(() => {
    if (!authConfig) return;

    // 编辑时回显
    const isBearer = authConfig?.kind === 'Bearer';
    // 第一种Bearer token
    if (isBearer) {
      const { Authorization } = authConfig.headers ?? {};
      const authString = Authorization as string;
      const firstSpaceIndex = authString.indexOf(' ');

      // 如果找到空格，分割成 scheme 和 token
      const scheme =
        firstSpaceIndex !== -1
          ? authString.substring(0, firstSpaceIndex)
          : authString;
      const token =
        firstSpaceIndex !== -1 ? authString.substring(firstSpaceIndex + 1) : '';

      form.setValue('kind', scheme as AuthKind);
      form.setValue('bearerValue', token);
    }
    // 如果是自定义token
    if (!isBearer && authConfig?.headers) {
      form.setValue('kind', 'Custom');
      // 将对象格式的 headers 转换为数组格式
      const headersArray = Object.entries(authConfig.headers).map(
        ([key, value], index) => ({
          id: Date.now() + index,
          key,
          value: value as string,
        }),
      );

      // 清空现有的 headers 并设置新的值
      form.setValue(
        'headers',
        headersArray.length > 0
          ? headersArray
          : [{ id: Date.now(), key: '', value: '' }],
      );
    }
  }, [JSON.stringify(authConfig)]);

  return (
    <Modal
      open={modal.visible}
      onCancel={() => {
        modal.resolve({});
        form.reset();
        modal.hide();
        modal.remove();
      }}
      title={t('authConfig.title')}
      okText={t('authConfig.save')}
      classNames={{
        content: 'w-[420px] max-w-none',
        body: 'flex flex-col flex-1 min-h-0 pb-0',
      }}
      isShowCancel={false}
      onOkBeforeFunction={() => form.trigger()}
      onOk={async () => form.handleSubmit(onSubmit)()}
    >
      <Form {...form}>
        <form className="space-y-4 flex flex-col flex-1 min-h-0">
          {/* 鉴权类型 - 必填 */}
          <FormField
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('authConfig.authType.label')}
                  <span className="text-destructive">
                    {t('authConfig.authType.required')}
                  </span>
                </FormLabel>
                <FormControl>
                  <Select
                    options={[
                      {
                        label: t('authConfig.authType.bearer'),
                        value: 'Bearer',
                      },
                      {
                        label: t('authConfig.authType.custom'),
                        value: 'Custom',
                      },
                    ]}
                    value={field.value}
                    onChange={(value) => field.onChange(value as AuthKind)}
                    placeholder={t('authConfig.authType.placeholder')}
                    searchable={false}
                    allowClear={false}
                    showCheck={false}
                    listHeight={88}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bearer 模式 - 值为必填 */}
          {kind === 'Bearer' ? (
            <FormField
              control={form.control}
              name="bearerValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('authConfig.bearer.value.label')}
                    <span className="text-destructive">
                      {t('authConfig.authType.required')}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('authConfig.bearer.value.placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {/* 自定义模式 - Header 键/值均必填 */}
          {kind === 'Custom' ? (
            <div className="space-y-3 flex flex-col flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <Label>
                  {t('authConfig.custom.key.label')}
                  <span className="text-destructive">
                    {t('authConfig.authType.required')}
                  </span>
                </Label>
                <Label>
                  {t('authConfig.custom.value.label')}
                  <span className="text-destructive">
                    {t('authConfig.authType.required')}
                  </span>
                </Label>
              </div>

              <div className="space-y-3 overflow-y-auto flex flex-col flex-1 min-h-0 p-1">
                {fields.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className="grid grid-cols-[1fr_1fr_auto] gap-4 items-baseline"
                  >
                    <FormField
                      control={form.control}
                      name={`headers.${index}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'authConfig.custom.key.placeholder',
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`headers.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'authConfig.custom.value.placeholder',
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Trash2
                      className={cn(
                        'w-4 h-4 text-destructive cursor-pointer hover:text-destructive/70',
                        index === 0 && fields.length === 1 ? 'invisible' : '',
                      )}
                      onClick={() => remove(index)}
                    />
                  </div>
                ))}
              </div>

              <EnhancedButton
                onClick={() => append({ id: Date.now(), key: '', value: '' })}
                type="link"
                className="p-0! w-fit"
              >
                <CirclePlus />
                {t('authConfig.custom.addHeader')}
              </EnhancedButton>
            </div>
          ) : null}
        </form>
      </Form>
    </Modal>
  );
};

const AuthConfigModal = NiceModal.create(AuthConfigDialog);

export const openAuthConfigDialog = (options?: {
  authConfig: AuthConfigResult | null;
}): Promise<AuthConfigResult> => {
  return NiceModal.show(AuthConfigModal, { ...options });
};

export default AuthConfigModal;
