import React, { useEffect, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import {
  Modal,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  Form,
  message,
} from '@teamhelper/ui';
import { createUserGroupApi, editUserGroupApi } from '../server';
import { isNumber } from 'es-toolkit/compat';

const createGroupSchema = z.object({
  group_name: z
    .string()
    .min(
      1,
      i18n.t(
        'manageDetail:officialUsers.createGroup.errors.groupName.required',
      ),
    ),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

interface CreateGroupDialogProps {
  group_id?: number;
  group_name?: string;
  project_id: number;
  getGroupList: () => void;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  group_id,
  group_name,
  project_id,
  getGroupList,
}) => {
  const modal = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation('manageDetail');
  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      group_name: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (group_id && group_name) {
      form.setValue('group_name', group_name);
    }
  }, [group_id, group_name]);
  const onCancel = () => {
    form.reset();
    modal.resolve(true);
    modal.hide();
    modal.remove();
  };

  const onSubmit = async (data: CreateGroupFormData) => {
    try {
      setIsSubmitting(true);
      // 编辑
      if (group_id) {
        await editUserGroupApi({
          group_id,
          group_name: data.group_name,
        });
        getGroupList();
        message.success(t('officialUsers.edit.group.success'));
      } else {
        await createUserGroupApi({
          group_name: data.group_name,
          project_id: Number(project_id),
        });
        getGroupList();
        message.success(t('officialUsers.create.group.success'));
      }
      modal.resolve(true);
      form.reset();
      modal.hide();
      modal.remove();
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={modal.visible}
      title={
        !isNumber(group_id)
          ? t('officialUsers.createGroup.title')
          : t('officialUsers.createGroup.title.edit')
      }
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
            name="group_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('officialUsers.createGroup.form.groupName.label')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    maxLength={20}
                    className={
                      form.formState.errors.group_name
                        ? 'border-destructive'
                        : ''
                    }
                    placeholder={t(
                      'officialUsers.createGroup.form.groupName.placeholder',
                    )}
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

const CreateGroupModal = NiceModal.create(CreateGroupDialog);

export const openCreateGroupModal = (
  options?: CreateGroupDialogProps,
): Promise<CreateGroupFormData> => {
  return NiceModal.show(CreateGroupModal, { ...options });
};

export default CreateGroupModal;
