import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Modal } from '@teamhelper/ui';
import type { ColumnType } from '@teamhelper/ui';
import { ProTable } from '@/components/ProTable';

export const SupportedHardwareDialog = NiceModal.create(() => {
  const modal = useModal();

  const onCancel = () => {
    modal.resolve();
    modal.hide();
  };

  const hardwareList = [
    {
      manufacturer: 'ARGOOZ',
      alias: '闪亮视觉',
      model: 'ARGOOZ R700',
    },
    {
      manufacturer: 'SUPERHEXA',
      alias: '蜂巢世纪',
      model: 'VISION-SV1G',
    },
    {
      manufacturer: 'VUZIX',
      alias: '-',
      model: 'M400',
    },
    {
      manufacturer: 'VUZIX',
      alias: '-',
      model: 'M4000',
    },
    {
      manufacturer: 'ROKID',
      alias: '-',
      model: 'Glass2',
    },
    {
      manufacturer: 'ROKID',
      alias: '-',
      model: 'Xcraft',
    },
    {
      manufacturer: 'GOOTTON',
      alias: '谷东科技',
      model: 'C2000s',
    },
  ];

  const columns: ColumnType<(typeof hardwareList)[0]>[] = [
    {
      title: '厂商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
    },
    {
      title: '别名',
      dataIndex: 'alias',
      key: 'alias',
    },
    {
      title: '设备型号',
      dataIndex: 'model',
      key: 'model',
    },
  ];

  return (
    <Modal
      open={Boolean(modal.visible)}
      title="支持硬件"
      onCancel={onCancel}
      isShowCancel={false}
      classNames={{
        content: 'w-[460px] max-w-none',
      }}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            modal.remove();
          }, 360);
        }
      }}
      onOk={async () => onCancel()}
    >
      <ProTable
        columns={columns}
        dataSource={hardwareList}
        pagination={false}
        rowKey="model"
      />
    </Modal>
  );
});

export const openSupportedHardwareDialog = () => {
  return NiceModal.show(SupportedHardwareDialog);
};
