import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  EnhancedInput,
  EnhancedTextarea,
  EnhancedButton,
  EnhancedCheckbox,
} from '@teamhelper/ui';
import ThUpload from '@/components/common/ThUpload';
import FolderAddIcon from '@/assets/icon/folder-add.svg?react';
import {
  applicationsSigningCertCreateApi,
  applicationsSigningCertParseApi,
  applicationsSigningCertUpdateApi,
  applicationsSigningCertValidateKeyApi,
  applicationsSigningCertDetailApi,
  type IApplicationsSigningCertCreateParams,
  type IApplicationsSigningCertParseVo,
  type IApplicationsSigningCertUpdateParams,
} from '../server';
import { useEffect, useState } from 'react';
import { openCertificateInfoDialog } from './CertificateInfoDialog';

export interface CreateCertificateDialogProps {
  projectId: number;
  certId?: number | null;
}

const CreateCertificateDialog = NiceModal.create(
  ({ projectId, certId }: CreateCertificateDialogProps) => {
    const { t } = useTranslation('manageDetail');
    const modal = useModal();
    const [certInfo, setCertInfo] =
      useState<IApplicationsSigningCertParseVo | null>(null);

    const formSchema = z.object({
      cert_name: z.string().min(1, t('developerCertificate.pleaseUploadCert')),
      cert_file_object_key: z
        .string()
        .min(1, t('developerCertificate.pleaseUploadCert')),
      store_password: z
        .string()
        .min(1, t('developerCertificate.pleaseEnterCertPwd')),
      cert_alias: z.string().min(1, t('developerCertificate.pleaseEnterAlias')),
      key_password: z
        .string()
        .min(1, t('developerCertificate.pleaseEnterKeyPwd')),
      default_flag: z.boolean(),
      remarks: z.string().optional(),
    });
    type IFormSchema = z.infer<typeof formSchema>;

    const form = useForm<IFormSchema>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        cert_name: '',
        store_password: '',
        cert_alias: '',
        key_password: '',
        default_flag: true,
        remarks: '',
        cert_file_object_key: '',
      },
      mode: 'onChange',
    });

    useEffect(() => {
      if (certId && modal?.visible) {
        applicationsSigningCertDetailApi(certId).then((res) => {
          form.reset({
            ...res,
            default_flag: res?.default_flag === 1,
          });
        });
      }
    }, [form, certId, modal?.visible]);

    const handleParseCert = async () => {
      const { cert_file_object_key, store_password } =
        form?.getValues?.() || {};
      if (!cert_file_object_key || !store_password) return;

      const result = await applicationsSigningCertParseApi({
        cert_file_object_key,
        store_password,
      });

      setCertInfo(result);
      form.setValue('cert_alias', result?.cert_alias || '', {
        shouldValidate: true,
      });
    };

    const onSubmit = async (values: IFormSchema) => {
      const bool = await applicationsSigningCertValidateKeyApi({
        cert_alias: values?.cert_alias,
        cert_file_object_key: values?.cert_file_object_key,
        key_password: values?.key_password,
        store_password: values?.store_password,
      });
      if (!bool) return Promise.reject();

      let cert_id = certId;
      let result = false;
      if (cert_id) {
        result = await applicationsSigningCertUpdateApi({
          ...certInfo,
          cert_id,
          ...values,
          default_flag: values?.default_flag ? 1 : 0,
        } as IApplicationsSigningCertUpdateParams);
      } else {
        result = await applicationsSigningCertCreateApi(
          {
            ...certInfo,
            project_id: projectId,
            ...values,
            default_flag: values?.default_flag ? 1 : 0,
          } as IApplicationsSigningCertCreateParams,
          (id) => {
            cert_id = id;
          },
        );
      }

      if (!result) return Promise.reject();

      onCancel(true);
      openCertificateInfoDialog({
        cert_id,
      });
    };

    const onCancel = (result: boolean = false) => {
      modal.resolve(result);
      modal.hide();
    };

    return (
      <Modal
        open={Boolean(modal?.visible)}
        title={
          certId
            ? t('developerCertificate.editCertificate')
            : t('developerCertificate.addCertificate')
        }
        onCancel={() => onCancel(false)}
        onOkBeforeFunction={() => form.trigger()}
        onOk={async () => onSubmit(form.getValues() as IFormSchema)}
        classNames={{
          content: 'w-[488px] max-w-none',
        }}
        onOpenChange={(open) => {
          if (!open) {
            setTimeout(() => {
              modal.remove();
            }, 360);
          }
        }}
      >
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="cert_name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-[#0A0A0A]">
                    {t('developerCertificate.certFileLabel')}
                    <span className="text-destructive">*</span>
                  </FormLabel>

                  <div className="flex gap-2">
                    <FormControl>
                      <EnhancedInput
                        placeholder={t('developerCertificate.pleaseUploadCert')}
                        readOnly
                        {...field}
                      />
                    </FormControl>

                    <ThUpload
                      type="resources"
                      showUploadList={false}
                      onUploaded={(fileKey, file) => {
                        if (fileKey) {
                          form.setValue('cert_file_object_key', fileKey);
                          form.setValue('cert_name', file?.name, {
                            shouldValidate: true,
                          });
                          handleParseCert();
                        }
                      }}
                    >
                      <EnhancedButton className="shrink-0 bg-background">
                        <FolderAddIcon className="w-4 h-4" />
                        <span>{t('developerCertificate.uploadFile')}</span>
                      </EnhancedButton>
                    </ThUpload>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="store_password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-[#0A0A0A]">
                    {t('developerCertificate.certPwdLabel')}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <EnhancedInput
                      placeholder={t('developerCertificate.pleaseEnterCertPwd')}
                      {...field}
                      onBlur={() => {
                        field.onBlur();
                        handleParseCert();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cert_alias"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-[#0A0A0A]">
                    {t('developerCertificate.certAliasLabel')}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <EnhancedInput
                      placeholder={t('developerCertificate.pleaseEnterAlias')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key_password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-[#0A0A0A]">
                    {t('developerCertificate.keyPwdLabel')}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <EnhancedInput
                      placeholder={t('developerCertificate.pleaseEnterKeyPwd')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_flag"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <EnhancedCheckbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      label={t('developerCertificate.setDefault')}
                      labelClassName="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#2D3748]"
                    />
                    <span className="text-sm text-[#7D8592]">
                      {t('developerCertificate.setDefaultDesc')}
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-[#2D3748]">
                    {t('developerCertificate.remarksLabel')}
                  </FormLabel>
                  <FormControl>
                    <EnhancedTextarea
                      placeholder={t('developerCertificate.remarksPlaceholder')}
                      className="min-h-20"
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
  },
);

export const openCreateCertificateDialog = (
  options: CreateCertificateDialogProps,
): Promise<boolean> => {
  return NiceModal.show(CreateCertificateDialog, { ...options });
};

export default CreateCertificateDialog;
