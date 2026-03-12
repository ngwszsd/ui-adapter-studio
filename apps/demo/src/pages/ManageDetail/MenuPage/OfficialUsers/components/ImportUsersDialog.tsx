import React from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useTranslation } from 'react-i18next';
import { message, Modal, Upload } from '@teamhelper/ui';
import { downloadFile } from '@/lib/utils.ts';
import { getUserImportTemplate, importUserApi } from '../server';

type ImportUsersDialogResult = {
  file: File;
};
interface ImportUsersDialogProps {
  activeGroupId: number;
  project_id: number;
  getUserList: () => void;
  getGroupList: () => void;
}
function ImportUsersDialog(props: ImportUsersDialogProps) {
  const modal = useModal();
  const { t } = useTranslation('manageDetail');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);

  const downloadTemplate = async () => {
    try {
      const res = await getUserImportTemplate();
      downloadFile(
        res.data.download_url as string,
        res.data.filename as string,
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal
      open={modal.visible}
      title={t('officialUsers.import.title')}
      okText={
        isSubmitting
          ? t('officialUsers.import.importing')
          : t('officialUsers.import.confirmImport')
      }
      onOkBeforeFunction={() => {
        if (isSubmitting) return false;
        if (!selectedFile) {
          setFileError(t('officialUsers.import.errors.noFile'));
          return false;
        }
        return true;
      }}
      onOk={async () => {
        setIsSubmitting(true);
        try {
          const formData = new FormData();
          formData.append('file', selectedFile as File);
          formData.append(
            'group_id',
            props.activeGroupId === -1 ? '0' : String(props.activeGroupId),
          );
          formData.append('project_id', String(props.project_id));
          await importUserApi(formData);
          message.success(t('importJson.importing.success'));
          props.getGroupList();
          props.getUserList();
          setSelectedFile(null);
          setFileError(null);
          modal.resolve(true);
          modal.hide();
          modal.remove();
        } finally {
          setIsSubmitting(false);
        }
      }}
      onCancel={() => {
        modal.resolve(false);
        modal.hide();
        modal.remove();
        setSelectedFile(null);
        setFileError(null);
      }}
      classNames={{
        content: 'w-[488px]',
        body: 'py-[2px]',
      }}
    >
      <div className="text-sm text-muted-foreground">
        {t('officialUsers.import.description')}
        <button
          type="button"
          onClick={downloadTemplate}
          className="ml-2 text-primary hover:opacity-80 cursor-pointer"
        >
          {t('officialUsers.import.downloadTemplate')}
        </button>
      </div>

      <div className="mt-4">
        <Upload.Dragger
          accept=".xlsx,.xls,.csv"
          multiple={false}
          parseAs="none"
          className="h-[160px]"
          description={
            <div className="text-sm">
              {t('officialUsers.import.dropText')}{' '}
              <span className="text-primary">
                {t('officialUsers.import.clickUpload')}
              </span>
            </div>
          }
          onChange={(files) => {
            const f = files?.[0] ?? null;
            setSelectedFile(f);
            setFileError(null);
          }}
          onError={(msg) => setFileError(msg)}
        />
        {fileError && (
          <div className="mt-2 text-[0.8rem] font-medium text-destructive">
            {fileError}
          </div>
        )}
      </div>
    </Modal>
  );
}

const ImportUsersModal = NiceModal.create(ImportUsersDialog);

export const openImportUsersModal = (
  options: ImportUsersDialogProps,
): Promise<ImportUsersDialogResult> => {
  return NiceModal.show(ImportUsersModal, { ...options });
};

export default ImportUsersModal;
