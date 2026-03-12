import React, { useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  Modal,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Select,
  Form,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  message,
  EnhancedAvatar,
} from '@teamhelper/ui';
import {
  addUserToGroup,
  type UseListDto,
  type UserGroupListDto,
} from '@/pages/ManageDetail/MenuPage/OfficialUsers/server.ts';
import i18n from '@/i18n';

type UserItem = { id: React.Key; name: string };

interface AddToGroupDialogProps {
  /** 初始被选中的用户（用于展示） */
  users: UseListDto[];
  /** 可选的分组列表 */
  groups: UserGroupListDto[];
  /** 默认选中的分组 key */
  defaultGroupKey?: number;
  project_id: number;
}
const schema = z.object({
  group_id: z.number({
    message: i18n.t('manageDetail:officialUsers.addToGroup.errors.selectGroup'),
  }),
});
type FormData = z.infer<typeof schema>;

const AddToGroupDialog: React.FC<AddToGroupDialogProps> = ({
  users,
  groups,
  defaultGroupKey,
  project_id,
}) => {
  const modal = useModal();
  const { t } = useTranslation('manageDetail');
  const [selectedUsers, setSelectedUsers] = React.useState<UseListDto[]>(users);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      group_id: defaultGroupKey,
    },
    mode: 'onChange',
  });

  const onCancel = () => {
    // 恢复初始状态
    setSelectedUsers(users);
    form.reset();
    modal.resolve(false);
    modal.hide();
    modal.remove();
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await addUserToGroup({
        user_ids: selectedUsers.map((u) => u.user_id),
        group_id: data.group_id,
        project_id,
      });
      message.success(t('officialUsers.group.transfer.success'));
      modal.resolve(true);
      modal.hide();
      modal.remove();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeUser = (id: React.Key) => {
    setSelectedUsers((prev) => prev.filter((u) => u.user_id !== id));
  };

  return (
    <Modal
      open={modal.visible}
      title={t('officialUsers.addToGroup.title')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        if (selectedUsers.length === 0) {
          message.warning(t('officialUsers.group.transfer.tips'));
          return false;
        }
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
      <div className="space-y-6">
        {/* 选中用户统计与列表 */}
        <div className="space-y-3">
          <div className="text-sm">
            {t('officialUsers.addToGroup.selectedCount', {
              count: selectedUsers.length,
            })}
          </div>

          <div className="">
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedUsers.map((u) => (
                <div
                  key={u.user_id}
                  className="flex items-center justify-between w-full bg-background p-2 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <EnhancedAvatar initialOnly>{u.name}</EnhancedAvatar>
                    <span className="text-sm text-foreground">{u.name}</span>
                  </div>

                  <button
                    onClick={() => removeUser(u.user_id)}
                    className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={t('officialUsers.common.remove')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {selectedUsers.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {t('officialUsers.common.noneSelected')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 选择分组 */}
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('officialUsers.addToGroup.selectGroup')}
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t(
                            'officialUsers.addToGroup.selectGroup',
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {groups
                          .filter((v) => v.group_id !== 0)
                          .map((g) => (
                            <SelectItem key={g.group_id} value={g.group_id}>
                              {g.group_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </Modal>
  );
};

const AddToGroupModal = NiceModal.create(AddToGroupDialog);

export const openAddToGroupModal = (
  options?: AddToGroupDialogProps,
): Promise<{ group_id: string; users: UserItem[] }> => {
  return NiceModal.show(AddToGroupModal, { ...options });
};

export default AddToGroupModal;
