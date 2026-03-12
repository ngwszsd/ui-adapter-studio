import React from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { FolderOpen } from 'lucide-react';
import { Modal, EnhancedAlert as Alert, Tree, message } from '@teamhelper/ui';
import { knowledgeBasesGroupListApi } from '../server';
import { cn } from '@/lib/utils';
import { useRequest } from 'ahooks';
import { knowledgeBasesFoldersApi } from '@/pages/ManageDetail/MenuPage/Knowledge/KnowledgeDetail/server';
import i18n from '@/i18n';
import { KnowledgeBaseIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon';

export interface MoveDialogProps {
  source?: 'list' | 'folder' | 'datasets';
  knowledgeBaseId?: number | null;
  onOk?: (selectedKeys: React.Key[]) => Promise<boolean>;
  moveResourceId?: number | undefined;
}

function MoveDialog({
  source = 'list',
  knowledgeBaseId,
  onOk,
  moveResourceId,
}: MoveDialogProps) {
  const modal = useModal();
  const [selectedKeys, setSelectedKeys] = React.useState<React.Key[]>();
  const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([]);

  const { data: treeData } = useRequest(
    () => {
      if (source === 'datasets') {
        return knowledgeBasesFoldersApi(moveResourceId, {
          knowledge_base_id: knowledgeBaseId || null,
        });
      }

      return knowledgeBasesGroupListApi(moveResourceId);
    },
    {
      manual: false,
      refreshDeps: [modal?.visible, source, knowledgeBaseId, moveResourceId],
      ready: Boolean(modal?.visible),
      onSuccess: (data) => {
        if (data?.length) {
          setExpandedKeys(data.map((node: any) => node.key));
        }
      },
    },
  );

  const onCancel = (result: boolean = false) => {
    modal.resolve(result);
    modal.hide();
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={
        source !== 'datasets'
          ? i18n.t('knowledge:action.move')
          : i18n.t('knowledge:top.rootDir')
      }
      onOkBeforeFunction={() => {
        if (source !== 'datasets') {
          if (!Array.isArray(selectedKeys) || !selectedKeys.length) {
            message.error(i18n.t('knowledge:dialog.move.select.folder'));
            return false;
          }
        }

        return true;
      }}
      onCancel={onCancel}
      onOk={async () => {
        const result = await onOk?.(selectedKeys || []);
        if (!result) return Promise.reject();

        onCancel(true);
      }}
      classNames={{
        content: 'w-[560px] max-w-none h-[80vh]',
        body: 'space-y-3 flex flex-col min-h-0 flex-1',
      }}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            modal.remove();
          }, 360);
        }
      }}
    >
      {source !== 'datasets' ? (
        <Alert
          description={i18n.t('knowledge:dialog.move.warning')}
          classNames={{
            body: 'border-0',
            description: 'font-medium',
          }}
          type="warning"
        />
      ) : null}

      <div className="flex-1 min-h-0">
        <Tree
          treeData={treeData || []}
          expandedKeys={expandedKeys}
          onExpandedKeysChange={(keys) => setExpandedKeys(keys)}
          selectedKeys={selectedKeys}
          onSelect={(keys) => {
            setSelectedKeys(keys);
          }}
          selectionMode="single"
          renderNodeContent={(node) => {
            return (
              <div className="flex items-center gap-2">
                <KnowledgeBaseIcon type="folder" className="h-4 w-4" />

                <div
                  className={cn(
                    'truncate text-foreground text-sm',
                    selectedKeys?.includes(String(node?.key)) && 'font-medium',
                  )}
                >
                  {node?.title}
                </div>
              </div>
            );
          }}
          containerHeight="100%"
        />
      </div>
    </Modal>
  );
}

const MoveDialogModal = NiceModal.create(MoveDialog);

export const openMoveDialog = (options?: MoveDialogProps): Promise<boolean> => {
  return NiceModal.show(MoveDialogModal, { ...options });
};

export default MoveDialogModal;
