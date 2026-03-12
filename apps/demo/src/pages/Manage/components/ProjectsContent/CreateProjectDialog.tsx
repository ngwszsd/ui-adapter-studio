import React, { useEffect, useState, useMemo } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import i18n from '@/i18n';
import { pick } from 'es-toolkit';
import {
  addProjectApi,
  type ProjectInformation,
  editProjectApi,
} from '../../server.ts';
import { getUserListApi, type UserListDto } from '@/common/server.ts';
import {
  EnhancedTextarea,
  Checkbox,
  Label,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Modal,
  List,
  EnhancedInput as Input,
  EnhancedAvatar as Avatar,
  EnhancedButton as Button,
  message,
  Spinner,
  Empty,
  EnhancedButton,
} from '@teamhelper/ui';

import { useTranslation } from 'react-i18next';
import { cn, formatPhoneNumber } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { openInviteDesignerModal } from '../TeamsContent/InviteDesignerModal.tsx';
import { INVITE_KEY } from '@/constants/index.ts';
import copy from 'copy-to-clipboard';
import { useDebounceFn } from 'ahooks';

const createProjectSchemaFactory = () =>
  z.object({
    name: z
      .string()
      .min(1, i18n.t('manage:errors.projectName.required'))
      .max(12, i18n.t('manage:errors.projectName.maxLength')),
    description: z.string().optional(),
    designer_ids: z.array(z.number()).optional(),
  });

type CreateProjectFormValues = z.infer<
  ReturnType<typeof createProjectSchemaFactory>
>;

type CreateProjectProps = {
  project?: ProjectInformation;
};

export const CreateProjectDialog: React.FC<CreateProjectProps> = (props) => {
  const { t } = useTranslation('manage');
  const modal = useModal();
  const [userListLoading, setUserListLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = React.useState('');
  const [members, setMembers] = useState<UserListDto[]>([]);
  const [memberMap, setMemberMap] = useState<Record<number, UserListDto>>({});
  const { userInfo } = useAuthStore();
  const createProjectSchema = React.useMemo(
    () => createProjectSchemaFactory(),
    [t],
  );

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      designer_ids: [],
    },
  });

  async function initData(query?: string) {
    try {
      setUserListLoading(true);
      const res = await getUserListApi({
        keyword: typeof query === 'string' ? query : memberSearchQuery,
      });
      const newMembers =
        res.data?.filter((m) => m.user_id !== userInfo?.user_id) || [];
      setMembers(newMembers);
      setMemberMap((prev) => {
        const next = { ...prev };
        newMembers.forEach((m) => {
          next[m.user_id] = m;
        });
        return next;
      });
    } catch (e) {
    } finally {
      setUserListLoading(false);
    }
  }

  useEffect(() => {
    initData();
  }, []);

  const { run: searchMembersRun } = useDebounceFn(
    (val: string) => {
      initData(val);
    },
    {
      wait: 666,
    },
  );

  const projectStatus = useMemo(() => {
    return {
      isEdit: !!props?.project,
      projectId: props?.project?.project_id,
      designer_ids: props?.project?.members?.map((m) => m.user_id) || [],
    };
  }, [props?.project]);

  // 编辑回显
  useEffect(() => {
    if (props?.project) {
      const detailData = {
        ...pick(props.project, ['name', 'description']),
        designer_ids: props.project.members?.map((m) => m.user_id) || [],
      };
      (Object.keys(detailData) as Array<keyof typeof detailData>).forEach(
        (key) => {
          form.setValue(key, detailData[key]);
        },
      );

      if (props.project.members) {
        setMemberMap((prev) => {
          const next = { ...prev };
          props?.project?.members?.forEach?.((m) => {
            if (!next[m.user_id] && m?.user_id !== userInfo?.user_id) {
              next[m.user_id] = {
                user_id: m.user_id,
                user_name: m.name,
                user_avatar: m.avatar,
                mobile: '',
              };
            }
          });
          return next;
        });
      }
    }
  }, [props?.project]);

  const filteredMembers = React.useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.user_name.toLowerCase().includes(q) || m.mobile.includes(q),
    );
  }, [memberSearchQuery, members]);

  const onSubmit = async (data: CreateProjectFormValues) => {
    try {
      setIsSubmitting(true);
      if (projectStatus.isEdit) {
        const originalIds = projectStatus.designer_ids;
        const currentIds = data.designer_ids || [];

        const add_designer_ids = currentIds.filter(
          (id) => !originalIds.includes(id),
        );
        const remove_designer_ids = originalIds.filter(
          (id) => !currentIds.includes(id),
        );

        await editProjectApi(projectStatus.projectId as number, {
          description: data.description ?? '',
          name: data.name,
          add_designer_ids,
          remove_designer_ids,
        });
        message.success(t('tips.edit.project.success'));
      } else {
        await addProjectApi({
          description: data.description ?? '',
          name: data.name,
          designer_ids: data.designer_ids ?? [],
        });
        message.success(t('tips.add.project.success'));
      }
      form.reset();
      modal.resolve(true);
      modal.hide();
      modal.remove();
    } catch (error) {
      console.error('Submit project error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  function onCancel() {
    form.reset();
    modal.hide();
    modal.remove();
    modal.resolve(false);
  }

  // 处理邀请设计师
  const handleInviteDesigner = async () => {
    try {
      const result = await openInviteDesignerModal({
        onInvite: async (inviteCode) => {
          const url = new URL(window.location.href);
          url.searchParams.set(INVITE_KEY, inviteCode);
          copy(url.toString());
          message.success(t('copy.invite.url.success'));
        },
      });

      if (result) {
        console.log('invite designer success');
        // 可以在这里刷新成员列表或显示成功提示
      }
    } catch (error) {
      console.error('invite designer failed:', error);
    }
  };

  return (
    <Modal
      open={modal.visible}
      title={t('createProject.title')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => {
        if (isSubmitting) return false;
        const valid = await form.trigger();
        return valid;
      }}
      onOk={form.handleSubmit(onSubmit)}
      classNames={{
        content: 'w-[632px] max-w-none',
      }}
    >
      <Form {...form}>
        <form className="space-y-4">
          {/* 项目名称 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>
                  {t('createProject.projectName.label')} {''}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('createProject.projectName.placeholder')}
                    {...field}
                    className={
                      formState.errors.name ? 'border-destructive' : ''
                    }
                    maxLength={12}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 成员选择区域集成到表单 */}
          <FormField
            control={form.control}
            name="designer_ids"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex gap-5">
                    {/* 左侧：成员搜索与勾选 */}
                    <div className="w-[286px]">
                      <div className="pb-3 flex items-center justify-between">
                        <div className="text-sm text-foreground">
                          {t('team.inviteDesigner')}
                        </div>

                        {userInfo?.enterprise_flag ? (
                          <EnhancedButton
                            type="primary"
                            size="small"
                            className="h-6 text-xs"
                            onClick={handleInviteDesigner}
                          >
                            {t('team.inviteLink')}
                          </EnhancedButton>
                        ) : null}
                      </div>
                      <Spinner
                        className={cn(
                          'h-[238px]',
                          userListLoading ? '' : 'hidden',
                        )}
                      />
                      <div
                        className={cn(
                          'border border-border overflow-hidden rounded-[6px] h-[238px] flex flex-col',
                          userListLoading ? 'hidden' : '',
                        )}
                      >
                        <Input.Search
                          placeholder={t('team.search.placeholder')}
                          value={memberSearchQuery}
                          onChange={(e) => {
                            setMemberSearchQuery(e.target.value);
                            searchMembersRun(e?.target?.value || '');
                          }}
                          inputClassName="border-0 rounded-none border-b border-border [&:focus-visible]:border-border shrink-0"
                        />

                        <div className="flex-1">
                          {Array.isArray(filteredMembers) &&
                          filteredMembers.length ? (
                            <List
                              dataSource={filteredMembers}
                              itemKey={(member) => member.user_id}
                              estimatedItemSize={58}
                              containerHeight={203}
                              itemGap={0}
                              renderItem={(member, index) => {
                                const checked = (field.value || []).includes(
                                  member.user_id,
                                );
                                return (
                                  <Label
                                    key={index}
                                    className="flex items-center justify-between h-[58px] border-b border-border px-3"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar
                                        initialOnly
                                        className="w-[34px] h-[34px]"
                                        src={member?.user_avatar}
                                      >
                                        {member?.user_name}
                                      </Avatar>

                                      <div className="space-y-1">
                                        <div className="font-medium text-sm text-foreground">
                                          {member.user_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {formatPhoneNumber(member.mobile)}
                                        </div>
                                      </div>
                                    </div>

                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(next: boolean) => {
                                        const curr = field.value || [];
                                        if (next) {
                                          field.onChange([
                                            ...curr,
                                            member.user_id,
                                          ]);
                                        } else {
                                          field.onChange(
                                            curr.filter(
                                              (id) => id !== member.user_id,
                                            ),
                                          );
                                        }
                                      }}
                                    />
                                  </Label>
                                );
                              }}
                            />
                          ) : (
                            <Empty
                              description={t('team.no.designer')}
                              classNames={{ title: 'h-unset' }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：已选成员列表 */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between pb-3">
                        <div className="text-sm text-foreground font-normal">
                          {t('team.designer.selected')}
                        </div>

                        <Button
                          type="link"
                          danger
                          className="hover:text-destructive/70 p-0 h-auto"
                          onClick={() => field.onChange([])}
                        >
                          {t('team.clear')}
                        </Button>
                      </div>

                      <div className="flex-1">
                        {Array.isArray(field.value) &&
                        field.value.length > 0 ? (
                          <List
                            dataSource={field.value}
                            itemKey={(memberId) => memberId}
                            estimatedItemSize={58}
                            containerHeight={238}
                            itemGap={8}
                            className="py-3 border border-border rounded-[6px]"
                            renderItem={(memberId: number) => {
                              const member =
                                memberMap[memberId] ||
                                members.find((m) => m.user_id === memberId);
                              if (!member) return null;

                              return (
                                <div className="flex items-center justify-between rounded-[6px] p-3 h-[58px] bg-background mx-3">
                                  <div className="flex items-center gap-2">
                                    <Avatar
                                      initialOnly
                                      className="w-[34px] h-[34px]"
                                      src={member?.user_avatar}
                                    >
                                      {member?.user_name}
                                    </Avatar>

                                    <div className="space-y-1">
                                      <div className="text-sm font-medium text-foreground">
                                        {member?.user_name}
                                      </div>

                                      <div className="text-xs text-muted-foreground">
                                        {member?.mobile}
                                      </div>
                                    </div>
                                  </div>

                                  <X
                                    className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
                                    onClick={() => {
                                      field.onChange(
                                        (field.value || []).filter(
                                          (id: number) => id !== memberId,
                                        ),
                                      );
                                    }}
                                  />
                                </div>
                              );
                            }}
                          />
                        ) : (
                          <div className="p-3 border border-border rounded-[6px] h-full">
                            <div className="text-muted-foreground text-xs">
                              {t('team.no.selected')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 项目描述 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('createProject.projectDescription.label')}
                </FormLabel>
                <FormControl>
                  <EnhancedTextarea
                    placeholder={t(
                      'createProject.projectDescription.placeholder',
                    )}
                    className="min-h-[100px] shadow-none"
                    maxLength={200}
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

const CreateProjectDialogModal = NiceModal.create(CreateProjectDialog);
export const openCreateProjectDialog = (
  options?: CreateProjectProps,
): Promise<boolean> => {
  return NiceModal.show(CreateProjectDialogModal, {
    ...options,
  });
};

export default CreateProjectDialogModal;
