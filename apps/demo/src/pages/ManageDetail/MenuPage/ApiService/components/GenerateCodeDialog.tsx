import React, { useEffect } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import type { ApiRequest } from '../context/ApiContext';
import { Copy, Download } from 'lucide-react';
import {
  Modal,
  EnhancedButton as Button,
  EnhancedSelect as Select,
  message,
  EnhancedTooltip,
  EnhancedSpinner,
} from '@teamhelper/ui';
import copy from 'copy-to-clipboard';
import { ReactSyntaxHighlighter } from '@/components/common/ReactSyntaxHighlighter';
import { isNumber } from 'es-toolkit/compat';
import { generateCodeApi } from '../server';
import { jsonToBodyParamList, METHOD_MAP, BODY_MODE_MAP } from '../utils';
import { downloadFile } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';

/** 语言选项定义（与设计稿一致，默认 Shell-cURL） */
const LANGUAGE_OPTIONS = [
  { key: 'curl', label: 'Shell-cURL', prismLang: 'javascript' },
] as const;
type LangKey = (typeof LANGUAGE_OPTIONS)[number]['key'];

type GenerateCodeDialogProps = {
  request: ApiRequest;
};
function GenerateCodeDialog({ request }: GenerateCodeDialogProps) {
  const { t } = useTranslation('manageDetail');
  const modal = useModal();
  const [lang, setLang] = React.useState<LangKey>('curl');

  const [loading, setLoading] = React.useState(false);
  const [code, setCode] = React.useState('');

  const prismLanguage =
    LANGUAGE_OPTIONS.find((l) => l.key === lang)?.prismLang ?? 'javascript';

  // 忽略
  const onOk = async () => {
    modal.resolve(false);
    modal.hide();
    modal.remove();
  };

  useEffect(() => {
    const fetchCode = async () => {
      try {
        setLoading(true);
        const params: any = {
          method: METHOD_MAP[request.method] || 1,
          url_template: request.url || '',
          body_mode: BODY_MODE_MAP[request.body.type] || 1,
          param_list:
            request.params?.map((p) => ({
              code: p.key,
              value: p.value,
              enable: p.enable,
            })) || [],
          header_list:
            request.headers?.map((h) => ({
              code: h.key,
              value: h.value,
              enable: h.enable,
            })) || [],
          body_param_list:
            request.body.type === 'application/json'
              ? jsonToBodyParamList(request.body.content || '')
              : request.body.formData?.map((f) => ({
                  code: f.key,
                  value: f.value,
                  enable: f.enable,
                })) || [],
        };
        const res = await generateCodeApi(params);
        setCode(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCode();
  }, [request, lang]);

  const downText = () => {
    const content = code;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadFile(blob, `${nanoid(20)}.txt`);
  };

  return (
    <Modal
      open={modal.visible}
      onOpenChange={(open) => !open && modal.hide()}
      title={t('apiService.generateCode.title')}
      okText={t('apiService.generateCode.ignore')}
      className="w-[488px]"
      onCancel={onOk}
      onOkBeforeFunction={async () => true}
      onOk={onOk}
      isShowCancel={false}
      classNames={{
        body: 'flex flex-col flex-1 min-h-0',
      }}
    >
      <div className="space-y-4 flex flex-col flex-1 min-h-0">
        {/* 选择语言 */}
        <div className="space-y-3">
          <div className="text-sm font-medium">
            {t('apiService.generateCode.selectLanguage')}
          </div>

          <Select
            options={LANGUAGE_OPTIONS.map((l) => ({
              label: l.label,
              value: l.key,
            }))}
            value={lang}
            onChange={(v) => setLang(v as LangKey)}
            searchable={false}
            allowClear={false}
            showCheck={false}
            listHeight="auto"
            inputClassName="h-9"
          />
        </div>

        {/* 已生成代码 */}
        <div className="space-y-1 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-center">
            <div className="text-sm font-medium">
              {t('apiService.generateCode.generatedCode')}
            </div>

            <div className="flex items-center ml-auto">
              <EnhancedTooltip title={t('apiService.generateCode.download')}>
                <Button type="link" size="small" onClick={downText}>
                  <Download />
                </Button>
              </EnhancedTooltip>
              <EnhancedTooltip title={t('apiService.generateCode.copy')}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    copy(code);
                    message.success(t('apiService.generateCode.copied'));
                  }}
                >
                  <Copy />
                </Button>
              </EnhancedTooltip>
            </div>
          </div>

          <div className="border border-border rounded-[4px] flex-1 min-h-0 flex flex-col">
            {loading ? (
              <EnhancedSpinner className="min-h-30"></EnhancedSpinner>
            ) : (
              <ReactSyntaxHighlighter
                language={prismLanguage}
                customStyle={{
                  minHeight: 0,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {code}
              </ReactSyntaxHighlighter>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

const GenerateCodeModal = NiceModal.create(GenerateCodeDialog);

/** 便捷打开方法：openGenerateCodeDialog({ request }).then(code => ...) */
export const openGenerateCodeDialog = (
  options: GenerateCodeDialogProps,
): Promise<boolean> => {
  return NiceModal.show(GenerateCodeModal, options);
};

export default GenerateCodeModal;
