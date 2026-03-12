import React, { useEffect, useMemo } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EnhancedInput,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Modal,
  message,
} from '@teamhelper/ui';
import { addApi, addApiGroup, editApi, editApiGroup } from '../server';
import type { ApiNode } from './ApiDirectoryTree';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';

const createGroupSchema = z.object({
  field_name: z
    .string()
    .min(
      1,
      i18n.t('manageDetail:apiService.createCollection.enterName') ||
        '请输入集合名称',
    ),
});

type CreateCollectionFormData = z.infer<typeof createGroupSchema>;

interface CreateCollectionDialogProps {
  project_id: number;
  node?: ApiNode;
  openType: 'folder' | 'request' | 'editFolder' | 'editRequest'; // 新建文件夹 新建请求 编辑
}

const CreateCollectionDialog: React.FC<CreateCollectionDialogProps> = ({
  project_id,
  node,
  openType,
}) => {
  const { t } = useTranslation('manageDetail');
  const modal = useModal();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<CreateCollectionFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      field_name: '',
    },
    mode: 'onChange',
  });

  const onCancel = () => {
    form.reset();
    modal.resolve({ success: false, name: '' });
    modal.hide();
    modal.remove();
  };

  useEffect(() => {
    // 编辑初始化
    if (node) {
      const valueInit =
        openType === 'editFolder' ? node?.group_name : node?.name;
      form.setValue('field_name', valueInit as string);
    }
  }, [node, openType]);

  const title = useMemo(() => {
    switch (openType) {
      case 'folder':
        return t('apiService.createCollection.newFolder');
      case 'request':
        return t('apiService.createCollection.newRequest');
      case 'editFolder':
        return t('apiService.createCollection.editFolder');
      case 'editRequest':
        return t('apiService.createCollection.editRequest');
      default:
        return t('apiService.createCollection.newRequest');
    }
  }, [openType, t]);
  const onSubmit = async (data: CreateCollectionFormData) => {
    try {
      setIsSubmitting(true);
      // 新建文件夹
      if (openType === 'folder') {
        await addApiGroup({
          project_id,
          name: data.field_name,
          parent_id: node ? Number(node?.group_id) : 0,
        });
      }
      // 新建请求
      if (openType === 'request') {
        await addApi({
          project_id,
          name: data.field_name,
          group_id: Number(node?.group_id),
          method: 1,
          url_template: window.location.origin,
          body_param_list: [],
        });
      }
      // 编辑文件夹
      if (openType === 'editFolder') {
        await editApiGroup({
          parent_id: Number(node?.parent_id),
          id: Number(node?.group_id),
          name: data.field_name,
        });
      }
      // 编辑请求
      if (openType === 'editRequest') {
        await editApi({
          id: Number(node?.id),
          project_id,
          name: data.field_name,
          method: Number(node?.method),
          url_template: node?.url_template as string,
          body_param_list: [],
        });
      }
      message.success(t('apiService.createCollection.saved'));
      modal.resolve({ success: true, name: data.field_name });
      form.reset();
      modal.hide();
      modal.remove();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={modal.visible}
      title={title}
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
          <FormField
            control={form.control}
            name="field_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('apiService.createCollection.label')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <EnhancedInput
                    placeholder={t('apiService.createCollection.placeholder')}
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

const CreateCollectionModal = NiceModal.create(CreateCollectionDialog);

export const openCreateCollectionModal = (
  options?: CreateCollectionDialogProps,
): Promise<{ success: boolean; name?: string }> => {
  return NiceModal.show(CreateCollectionModal, { ...options });
};

export default CreateCollectionModal;
