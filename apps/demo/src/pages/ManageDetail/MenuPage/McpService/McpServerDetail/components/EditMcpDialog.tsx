import React, { useEffect, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import {
  Modal,
  Label,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  EnhancedTextarea,
  Form,
} from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import {
  editMcpBasicInfoApi,
  type McpInfoDetailDto,
} from '@/pages/ManageDetail/MenuPage/McpService/server.ts';
import ThUpload from '@/components/common/ThUpload';

type FormData = {
  name: string;
  description?: string;
};
interface EditMcpBasicProps {
  mcpDetailInfo?: McpInfoDetailDto;
}
const EditMcpDialog: React.FC<EditMcpBasicProps> = ({ mcpDetailInfo }) => {
  const modal = useModal();
  const { t } = useTranslation('manageDetail');

  const schema = z.object({
    name: z.string().min(1, t('createMcp.name.required')),
    description: z.string().optional(),
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
    },
    mode: 'onChange',
  });

  const onCancel = () => {
    form.reset();
    modal.resolve(false);
    modal.hide();
    modal.remove();
  };

  const [avatarInfo, setAvatarInfo] = useState<{
    icon_object_key: string;
    icon_url: string;
  }>({
    icon_object_key: '',
    icon_url: '',
  });
  useEffect(() => {
    if (mcpDetailInfo) {
      form.setValue('name', mcpDetailInfo.name);
      form.setValue('description', mcpDetailInfo.description);
      setAvatarInfo({
        icon_url: mcpDetailInfo.icon_url,
        icon_object_key: mcpDetailInfo.icon_object_key,
      });
    }
  }, [mcpDetailInfo]);
  const onSubmit = async (data: FormData) => {
    try {
      await editMcpBasicInfoApi({
        name: data.name,
        description: data.description as string,
        icon_object_key: avatarInfo?.icon_object_key,
        id: mcpDetailInfo?.id as number,
      });
      form.reset();
      modal.resolve(true);
      modal.hide();
      modal.remove();
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <Modal
      open={modal.visible}
      title={t('editMcp.title')}
      okText={t('editMcp.save')}
      cancelText={t('editMcp.cancel')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        const valid = await form.trigger();
        return valid;
      }}
      onOk={async () => form.handleSubmit(onSubmit)()}
      classNames={{
        content: 'w-[488px] py-0',
      }}
    >
      <Form {...form}>
        <form className="space-y-6">
          {/* 头像 */}
          <div className="space-y-3">
            <Label>{t('editMcp.avatar.label')}</Label>
            <div className="flex items-center gap-4">
              <ThUpload
                type="avatar"
                accept=".jpg,.jpeg,.png"
                multiple={false}
                maxCount={1}
                showUploadList={false}
                crop
                maxSizeMB={5}
                onChange={({ file }) => {
                  const f = file?.originFileObj;
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setAvatarInfo((prev) => ({
                      ...prev,
                      icon_url: url,
                    }));
                  }
                }}
                onUploaded={(fileKey) => {
                  setAvatarInfo((prev) => ({
                    ...prev,
                    icon_object_key: fileKey,
                  }));
                }}
              >
                <div
                  className="w-[46px] h-[46px] rounded-md border border-dashed border-muted-foreground/40 bg-muted/10 flex items-center justify-center overflow-hidden"
                  aria-label={t('editMcp.avatar.upload')}
                >
                  {avatarInfo?.icon_url ? (
                    <img
                      src={avatarInfo.icon_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </ThUpload>
            </div>
          </div>
          {/* 名称 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('editMcp.name.label')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('editMcp.name.placeholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 应用介绍 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('editMcp.description.label')}</FormLabel>
                <FormControl>
                  <EnhancedTextarea
                    className="min-h-[120px] shadow-none"
                    placeholder={t('editMcp.description.placeholder')}
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

const EditMcpDialogModal = NiceModal.create(EditMcpDialog);

export const openEditMcpDialog = (
  options: EditMcpBasicProps,
): Promise<boolean> => {
  return NiceModal.show(EditMcpDialogModal, options);
};

export default EditMcpDialogModal;
