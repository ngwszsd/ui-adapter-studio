import React from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search } from 'lucide-react';
import {
  Modal,
  EnhancedButton as Button,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  Form,
  TreeSelect,
  type TreeNode,
} from '@teamhelper/ui';
import { useApiGroups } from '../store';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

type SaveAsRequestDialogProps = {
  defaultName?: string;
  project_id?: number;
};

type SaveAsResult = {
  name: string;
  folderKey: number;
} | null;

function SaveAsRequestDialog(props: SaveAsRequestDialogProps) {
  const { t } = useTranslation('manageDetail');
  const modal = useModal();
  const { project_id } = useParams<{ project_id: string }>();

  const apiGroups = useApiGroups();

  const { treeData, groupLookup } = React.useMemo(() => {
    const groupMap = new Map<number, TreeNode>();
    const lookup = new Map<string, any>();
    const roots: TreeNode[] = [];

    // First pass: create all nodes
    apiGroups.forEach((group) => {
      const key = `group-${group.group_id}`;
      const node: TreeNode = {
        key,
        title: group.group_name,
        children: [],
      };
      groupMap.set(group.group_id, node);
      lookup.set(key, group);
    });

    // Second pass: build hierarchy
    apiGroups.forEach((group) => {
      const node = groupMap.get(group.group_id);
      if (!node) return;

      if (
        group.parent_id &&
        group.parent_id !== 0 &&
        groupMap.has(group.parent_id)
      ) {
        const parent = groupMap.get(group.parent_id);
        parent?.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return { treeData: roots, groupLookup: lookup };
  }, [apiGroups]);

  const schema = z.object({
    name: z.string().min(1, t('apiService.saveAs.enterRequestName')),
    folderKey: z.string().min(1, t('apiService.saveAs.selectLocation')),
  });
  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: props.defaultName ?? '',
      folderKey: treeData[0]?.key?.toString() ?? '',
    },
  });

  const onCancel = async () => {
    form.reset();
    modal.resolve(null);
    modal.hide();
    modal.remove();
  };

  const onSubmit = async (data: FormData) => {
    // 通过 lookup map 找到原始数据中的真实 ID
    const selectedGroup = groupLookup.get(data.folderKey);
    const realId = selectedGroup ? selectedGroup.group_id : data.folderKey;
    form.reset();
    modal.resolve({ name: data.name, folderKey: realId });
    modal.hide();
    modal.remove();
  };

  return (
    <Modal
      open={modal.visible}
      onOpenChange={(open) => !open && modal.hide()}
      title={t('apiService.saveAs.title')}
      okText={t('apiService.saveAs.save')}
      onCancel={onCancel}
      onOkBeforeFunction={() => form.trigger()}
      onOk={async () => form.handleSubmit(onSubmit)()}
      classNames={{
        content: 'w-[500px] max-w-none',
        body: 'flex flex-col flex-1 min-h-0',
      }}
    >
      <Form {...form}>
        <form className="space-y-4 flex flex-col flex-1 min-h-0">
          {/* 请求名称 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('apiService.saveAs.requestName')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('apiService.saveAs.enterRequestName')}
                    {...field}
                    className={
                      form.formState.errors.name ? 'border-destructive' : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 选择位置 */}
          <FormField
            control={form.control}
            name="folderKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('apiService.saveAs.location')}</FormLabel>
                <FormControl>
                  <TreeSelect
                    allowClear={false}
                    treeData={treeData}
                    isDirectory
                    placeholder={t('apiService.saveAs.locationPlaceholder')}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    className={
                      form.formState.errors.folderKey
                        ? 'border-destructive'
                        : ''
                    }
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
}

const SaveAsRequestModal = NiceModal.create(SaveAsRequestDialog);

export const openSaveAsRequestDialog = (
  options?: SaveAsRequestDialogProps,
): Promise<SaveAsResult> => {
  return NiceModal.show(SaveAsRequestModal, options);
};

export default SaveAsRequestModal;
