import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { message, Modal } from '@teamhelper/ui';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import copy from 'copy-to-clipboard';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { applicationsSigningCertDetailApi } from '../server';
import { format } from 'date-fns';
import i18n from '@/i18n';

export interface CertificateDetailDialogProps {
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

const PasswordRow = ({ label, value }: { label: string; value: string }) => {
  const [visible, setVisible] = useState(false);

  return (
    <DetailRow
      label={label}
      value={visible ? value : '****************'}
      suffix={
        <div
          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setVisible(!visible)}
        >
          {visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </div>
      }
    />
  );
};

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

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <h3 className="text-base font-medium text-foreground leading-[1.625]">
      {title}
    </h3>
    <div className="bg-muted rounded-lg p-4 space-y-3">{children}</div>
  </div>
);

function CertificateDetailDialog({ cert_id }: CertificateDetailDialogProps) {
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
      title={t('developerCertificate.keystoreDetail')}
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
        <Section title={t('developerCertificate.keystoreConfig')}>
          <DetailRow
            label={t('developerCertificate.certFile')}
            value={detail?.cert_name || '-'}
          />
          <PasswordRow
            label={t('developerCertificate.keystorePassword')}
            value={detail?.key_password || ''}
          />
          <DetailRow
            label={t('developerCertificate.keyAlias')}
            value={detail?.cert_alias || '-'}
          />
          <DetailRow
            label={t('developerCertificate.setAsDefault')}
            value={
              detail?.default_flag === 1
                ? t('developerCertificate.yes')
                : t('developerCertificate.no')
            }
          />
          <DetailRow
            label={t('developerCertificate.remarks')}
            value={detail?.remarks || '-'}
          />
        </Section>

        <Section title={t('developerCertificate.certBasicInfo')}>
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
}

const CertificateDetailModal = NiceModal.create(CertificateDetailDialog);

export const openCertificateDetailDialog = (
  props: CertificateDetailDialogProps,
) => {
  return NiceModal.show(CertificateDetailModal, props);
};

export default CertificateDetailModal;
