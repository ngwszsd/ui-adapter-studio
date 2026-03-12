import React, { useEffect, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { PackageOpen, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  EnhancedButton as Button,
  EnhancedInput as Input,
  EnhancedAvatar as Avatar,
  List,
  EnhancedCheckbox,
  Empty,
  EnhancedSpinner,
} from '@teamhelper/ui';
import { cn } from '@/lib/utils.ts';
import { getUserListApi, type UserListDto } from '@/common/server';
import { editDesignerUserApi, type ProjectDesigner } from '../server';
import { useAuthStore } from '@/store';
type AddDesignersDialogProps = {
  designers: ProjectDesigner[];
  project_id: number;
};

const AddDesignersDialog: React.FC<AddDesignersDialogProps> = ({
  designers,
  project_id,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const modal = useModal();
  const { t } = useTranslation('manageDetail');
  const { userInfo } = useAuthStore();
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [userListLoading, setUserListLoading] = React.useState(false);
  const [members, setMembers] = useState<UserListDto[]>([]);
  async function initData() {
    try {
      setUserListLoading(true);
      const res = await getUserListApi({});
      setMembers(res.data?.filter((m) => m.user_id !== userInfo?.user_id));
    } catch (e) {
      console.error(e);
    } finally {
      setUserListLoading(false);
    }
  }
  useEffect(() => {
    if (designers) {
      setSelectedIds(designers.map((d) => d.user_id));
    }
  }, [designers]);

  useEffect(() => {
    initData();
  }, [designers]);

  const allDesigners = React.useMemo(() => members, [members]);

  const filtered = React.useMemo(() => {
    const kw = search.trim();
    return allDesigners.filter((m) =>
      kw ? m.user_name.includes(kw) || (m.mobile?.includes(kw) ?? false) : true,
    );
  }, [search, allDesigners]);

  const selectedDesigners = React.useMemo(
    () =>
      selectedIds
        .map((id) => allDesigners.find((m) => m.user_id === id))
        .filter(Boolean) as UserListDto[],
    [selectedIds, allDesigners],
  );

  const handleClear = () => setSelectedIds([]);

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const handleOk = async () => {
    try {
      setIsSubmitting(true);
      const initialIds = designers?.map((d) => d.user_id) || [];
      const add_designer_ids = selectedIds.filter(
        (id) => !initialIds.includes(id),
      );
      const remove_designer_ids = initialIds.filter(
        (id) => !selectedIds.includes(id),
      );

      await editDesignerUserApi(project_id, {
        /**
         * 要新增的设计师用户 ID 列表
         */
        add_designer_ids,
        /**
         * 要剔除的设计师用户 ID 列表
         */
        remove_designer_ids,
      });
      modal.resolve(true);
      modal.hide();
      modal.remove();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    modal.resolve(false);
    modal.hide();
    modal.remove();
  };

  return (
    <Modal
      open={modal.visible}
      title={t('app.add.designer')}
      onOk={handleOk}
      onCancel={() => handleCancel()}
      classNames={{
        content: 'w-[768px] max-w-none',
        body: 'flex',
      }}
      onOkBeforeFunction={() => {
        return !isSubmitting;
      }}
    >
      <div className="w-1/2 pr-5">
        <div className="text-sm text-foreground mb-3">
          {t('addDesigners.modal.invite')}
        </div>

        <Input.Search
          placeholder={t('addDesigners.modal.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="rounded-[8px] border border-border mt-2">
          {userListLoading ? (
            <EnhancedSpinner />
          ) : Array.isArray(filtered) && filtered.length ? (
            <List
              dataSource={filtered}
              itemKey={(m) => m.user_id}
              estimatedItemSize={58}
              className="flex-1"
              itemGap={0}
              containerHeight={360}
              renderItem={(m, index) => {
                return (
                  <div
                    className={cn(
                      'flex items-center justify-between px-3 h-[58px]',
                      'border-b border-border',
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Avatar src={m.user_avatar} initialOnly={!m.user_avatar}>
                        {m.user_name}
                      </Avatar>
                      <div className="space-y-1 overflow-hidden">
                        <div className="text-sm font-medium text-foreground truncate">
                          {m.user_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {m.mobile}
                        </div>
                      </div>
                    </div>

                    <EnhancedCheckbox
                      checked={selectedIds.includes(m?.user_id)}
                      onChange={(e) =>
                        toggleSelect(m.user_id, Boolean(e?.target?.checked))
                      }
                    />
                  </div>
                );
              }}
            />
          ) : (
            <div className="py-20">
              <Empty
                image={
                  <div className="flex items-center justify-center w-9 h-9 bg-muted rounded-xl">
                    <PackageOpen className="w-6 h-6 text-foreground" />
                  </div>
                }
                title={
                  <div className="text-sm font-medium text-foreground">
                    {t('addDesigners.modal.noOther')}
                  </div>
                }
                description={
                  <div className="text-xs text-muted-foreground">
                    {t('addDesigners.modal.inviteFirst')}
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="w-1/2 pl-5 border-l border-border flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-foreground font-normal">
            {t('addDesigners.modal.selected')}({selectedDesigners.length})
          </div>
          <Button
            type="link"
            danger
            className="hover:no-underline hover:text-destructive/70 p-0 h-auto"
            onClick={handleClear}
          >
            {t('officialUsers.addMembers.clear')}
          </Button>
        </div>

        <div className="flex-1">
          {selectedDesigners.length === 0 ? (
            <div className="text-muted-foreground text-xs">
              {t('officialUsers.addMembers.noneSelected')}
            </div>
          ) : (
            <List
              dataSource={selectedDesigners}
              itemKey={(m) => m.user_id}
              estimatedItemSize={52}
              className="flex-1"
              itemGap={8}
              containerHeight={404}
              renderItem={(m) => (
                <div className="flex items-center justify-between rounded-[6px] p-3 h-[58px] bg-background">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={m.user_avatar}
                      initialOnly={!m.user_avatar}
                      size="large"
                    >
                      {m.user_name}
                    </Avatar>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">
                        {m.user_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.mobile}
                      </div>
                    </div>
                  </div>
                  <X
                    className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => toggleSelect(m.user_id, false)}
                  />
                </div>
              )}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

const AddDesignersModal = NiceModal.create(AddDesignersDialog);

export const openAddDesignersModal = (
  options?: AddDesignersDialogProps,
): Promise<boolean> => {
  return NiceModal.show(AddDesignersModal, {
    ...options,
  });
};

export default AddDesignersModal;
