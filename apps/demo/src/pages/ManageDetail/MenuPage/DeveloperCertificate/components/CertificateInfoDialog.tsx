import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Modal, message } from '@teamhelper/ui';
import copy from 'copy-to-clipboard';
import { Copy } from 'lucide-react';
import { applicationsSigningCertDetailApi } from '../server';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import i18n from '@/i18n';

export interface CertificateInfoDialogProps {
  cert_id?: number | null;
}

const DetailRow = ({
  label,
  value,
  className,
  suffix,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  suffix?: React.ReactNode;
}) => (
  <div className={cn('flex text-sm leading-[1.5]', className)}>
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span
      className={cn(
        'text-foreground break-all flex-1',
        i18n.language !== 'zh' && 'ml-1.5',
      )}
    >
      {value}
    </span>
    {suffix && <div className="ml-2 shrink-0">{suffix}</div>}
  </div>
);

const CopyableRow = ({ label, value }: { label: string; value: string }) => {
  const { t } = useTranslation('manageDetail');
  const handleCopy = () => {
    copy(value);
    message.success(t('developerCertificate.copySuccess'));
  };

  return (
    <DetailRow
      label={label}
      value={value}
      suffix={
        <div
          className="cursor-pointer text-primary hover:text-primary/70 transition-colors"
          onClick={handleCopy}
        >
          <Copy className="w-4 h-4" />
        </div>
      }
    />
  );
};

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="bg-muted rounded-lg p-4 space-y-3">{children}</div>
  </div>
);

const CertificateInfoDialog = NiceModal.create(
  ({ cert_id }: CertificateInfoDialogProps) => {
    const { t } = useTranslation('manageDetail');
    const modal = useModal();

    const { data: detail } = useRequest(
      () => {
        return applicationsSigningCertDetailApi(cert_id ?? null);
      },
      {
        refreshDeps: [cert_id],
        ready: Boolean(cert_id),
      },
    );

    const onCancel = () => {
      modal.resolve();
      modal.hide();
    };

    return (
      <Modal
        open={Boolean(modal.visible)}
        title={t('developerCertificate.certBasicInfo')}
        onCancel={onCancel}
        isShowCancel={false}
        classNames={{
          content: 'w-[488px] max-w-none',
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
        <div className="space-y-5">
          <Section>
            <CopyableRow
              label={t('developerCertificate.certSerialNumber')}
              value={detail?.serial_number || '-'}
            />
            <DetailRow
              label={t('developerCertificate.subjectInfo')}
              value={detail?.subject_dn || '-'}
            />
            <DetailRow
              label={t('developerCertificate.validFrom')}
              value={
                detail?.valid_from
                  ? format(new Date(detail?.valid_from), 'yyyy-MM-dd HH:mm:ss')
                  : '-'
              }
            />
            <DetailRow
              label={t('developerCertificate.validTo')}
              value={
                detail?.valid_to
                  ? format(new Date(detail?.valid_to), 'yyyy-MM-dd HH:mm:ss')
                  : '-'
              }
            />
          </Section>
        </div>
      </Modal>
    );
  },
);

export const openCertificateInfoDialog = (
  props: CertificateInfoDialogProps,
) => {
  return NiceModal.show(CertificateInfoDialog, props);
};

export default CertificateInfoDialog;
