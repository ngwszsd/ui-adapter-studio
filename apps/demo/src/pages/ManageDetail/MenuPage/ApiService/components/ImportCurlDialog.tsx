import React from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Trash2, Code2, Copy, Download } from 'lucide-react';
import {
  Modal,
  EnhancedButton as Button,
  EnhancedTooltip,
  message,
} from '@teamhelper/ui';
import { cn, downloadFile } from '@/lib/utils.ts';
import { ReactCodemirror } from '@/components/common/ReactCodemirror';
import { type CurlHttpInfoDto, importCurlInfoApi } from '../server';
import copy from 'copy-to-clipboard';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';

function ImportCurlDialog() {
  const { t } = useTranslation('manageDetail');
  const modal = useModal();
  const [curlText, setCurlText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const onImport = async () => {
    try {
      setIsSubmitting(true);
      const res = await importCurlInfoApi({ curl: curlText });
      setCurlText('');
      modal.resolve(res.data);
      modal.hide();
      modal.remove();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancel = () => {
    setCurlText('');
    modal.resolve(false);
    modal.hide();
    modal.remove();
  };

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      if (text) setCurlText(text);
    } catch (e) {
      console.error(e);
    }
  };

  const downText = () => {
    const content = curlText;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadFile(blob, `${nanoid(20)}.txt`);
  };
  return (
    <Modal
      open={modal.visible}
      title={t('apiService.importCurl.title')}
      okText={t('apiService.importCurl.import')}
      cancelText={t('apiService.importCurl.cancel')}
      onOkBeforeFunction={async () => {
        return !isSubmitting;
      }}
      onOk={onImport}
      onCancel={onCancel}
      closable
      className="w-[686px]"
      footerExtraContent={{
        left: (
          <Button onClick={onPaste} className="mr-auto">
            <Copy />
            {t('apiService.importCurl.paste')}
          </Button>
        ),
      }}
    >
      {/* 面板头：左标题 + 右侧操作图标 */}
      <div className="border rounded-[4px]">
        <div className="flex items-center justify-between pl-4 py-2 border-b">
          <div className="text-sm font-medium">cURL</div>
          <div className="flex items-center">
            <EnhancedTooltip title={t('apiService.importCurl.clear')}>
              <Button
                size="small"
                onClick={() => setCurlText('')}
                className={cn(
                  'border-0 shadow-none text-destructive bg-transparent',
                  'hover:text-destructive/70 hover:bg-transparent',
                )}
              >
                <Trash2 />
              </Button>
            </EnhancedTooltip>
            <EnhancedTooltip title={t('apiService.importCurl.download')}>
              <Button type="link" size="small" onClick={downText}>
                <Download />
              </Button>
            </EnhancedTooltip>
            <EnhancedTooltip title={t('apiService.importCurl.copy')}>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  copy(curlText);
                  message.success(t('apiService.importCurl.copied'));
                }}
              >
                <Copy />
              </Button>
            </EnhancedTooltip>
          </div>
        </div>

        <div className="h-70">
          <ReactCodemirror
            codemirrorType="javascript"
            value={curlText}
            onChange={(val) => setCurlText(val)}
            placeholder={t('apiService.importCurl.placeholder')}
          />
        </div>
      </div>
    </Modal>
  );
}

const ImportCurlModal = NiceModal.create(ImportCurlDialog);

export const openImportCurlDialog = (): Promise<CurlHttpInfoDto> => {
  return NiceModal.show(ImportCurlModal, {});
};

export default ImportCurlModal;
