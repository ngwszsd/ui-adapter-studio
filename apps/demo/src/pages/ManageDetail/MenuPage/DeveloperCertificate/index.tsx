import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import {
  EnhancedButton,
  EnhancedCard,
  Dropdown,
  Empty,
  openModalError,
} from '@teamhelper/ui';
import { MoreHorizontal, CheckCircle2, Circle, CirclePlus } from 'lucide-react';
import KeyIcon from '@/assets/icon/key.svg?react';
import { cn } from '@/lib/utils';
import { openCertificateDetailDialog } from './components/CertificateDetailDialog';
import { openCreateCertificateDialog } from './components/CreateCertificateDialog';
import { CertificateSkeleton } from './components/CertificateSkeleton';
import {
  applicationsSigningCertListApi,
  applicationsSigningCertDeleteApi,
  applicationsSigningCertSetDefaultApi,
  type IApplicationsSigningCertListDto,
} from './server';
import { format } from 'date-fns';

export const DeveloperCertificate: React.FC = () => {
  const { t } = useTranslation('manageDetail');
  const { project_id } = useParams<{ project_id: string }>();
  const [showSkeleton, setShowSkeleton] = useState(true);

  const {
    data: certificateList = [],
    refresh,
    loading,
  } = useRequest(
    async () => {
      if (!project_id) return [];
      return applicationsSigningCertListApi({
        project_id: Number(project_id),
        page: 0,
        size: 9999,
      });
    },
    {
      refreshDeps: [project_id],
    },
  );

  useEffect(() => {
    if (loading) {
      if (!certificateList?.length) {
        setShowSkeleton(true);
      }
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, certificateList.length]);

  const handleDelete = (id: number) => {
    openModalError({
      title: t('developerCertificate.deleteCertificate'),
      content: t('developerCertificate.deleteConfirm'),
      onOk: async () => {
        const result = await applicationsSigningCertDeleteApi(id);
        if (!result) return;

        refresh();
      },
    });
  };

  const handleSetDefault = async (id: number) => {
    const result = await applicationsSigningCertSetDefaultApi(id);
    if (!result) return;

    refresh();
  };

  const handleCreate = async (item?: IApplicationsSigningCertListDto) => {
    const success = await openCreateCertificateDialog({
      projectId: Number(project_id),
      certId: item?.cert_id,
    });
    if (success) {
      refresh();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-medium text-foreground mb-1">
            {t('developerCertificate.title')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('developerCertificate.description')}
          </p>
        </div>
        <EnhancedButton
          type="primary"
          icon={<CirclePlus />}
          onClick={() => handleCreate()}
        >
          {t('developerCertificate.addCertificate')}
        </EnhancedButton>
      </div>

      <div
        className={cn(
          'space-y-4',
          !certificateList.length && !showSkeleton
            ? 'flex-1 flex flex-col items-center justify-center pb-40'
            : 'flex-1 min-h-0 overflow-y-auto',
        )}
      >
        {showSkeleton ? (
          <CertificateSkeleton />
        ) : certificateList.length ? (
          <>
            {certificateList.map((item) => {
              return (
                <EnhancedCard
                  key={item.cert_id}
                  hoverable
                  className="w-full cursor-auto"
                  headerClassName="pb-4"
                  headerWrapperClassName="w-full"
                  titleWrapperClassName="min-w-0"
                  title={
                    <div className="font-medium text-base text-foreground truncate">
                      {item.cert_name}
                    </div>
                  }
                  extra={
                    <Dropdown
                      trigger={['click']}
                      placement="bottomRight"
                      menu={{
                        items: [
                          {
                            key: 'edit',
                            label: t('developerCertificate.edit'),
                          },
                          {
                            key: 'delete',
                            label: t('developerCertificate.delete'),
                            danger: true,
                          },
                          {
                            key: 'detail',
                            label: t('developerCertificate.viewDetail'),
                          },
                        ],
                        onClick: ({ key }) => {
                          if (!item?.cert_id) return;

                          if (key === 'delete') {
                            handleDelete(item.cert_id);
                          } else if (key === 'detail') {
                            openCertificateDetailDialog({
                              cert_id: item?.cert_id,
                            });
                          } else if (key === 'edit') {
                            handleCreate(item);
                          }
                        },
                      }}
                    >
                      <EnhancedButton className="rounded-full w-8 h-4.5 flex items-center justify-center bg-muted hover:bg-muted-foreground/10">
                        <MoreHorizontal className="h-4 w-4" />
                      </EnhancedButton>
                    </Dropdown>
                  }
                  contentClassName="pb-3"
                >
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-1.5">
                      <KeyIcon className="shrink-0" />

                      <div className="text-sm text-foreground truncate">
                        {t('developerCertificate.aliasPrefix')}
                        {item.cert_alias}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>
                          {t('developerCertificate.createdTimePrefix')}
                          {item?.created_date
                            ? format(
                                new Date(item.created_date),
                                'yyyy-MM-dd HH:mm:ss',
                              )
                            : '-'}
                        </span>
                      </div>

                      {item.default_flag === 1 ? (
                        <div
                          className={cn(
                            'flex items-center gap-2 select-none transition-colors cursor-default',
                          )}
                        >
                          <CheckCircle2 className="w-5 h-5 fill-primary text-primary-foreground" />
                          <span className="text-sm text-primary">
                            {t('developerCertificate.setAsDefaultAction')}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'flex items-center gap-2 cursor-pointer select-none transition-colors',
                          )}
                          onClick={(e) => {
                            e?.stopPropagation();
                            if (item?.default_flag === 1) return;

                            if (item?.cert_id) {
                              handleSetDefault(item.cert_id);
                            }
                          }}
                        >
                          <Circle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {t('developerCertificate.setAsDefaultAction')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </EnhancedCard>
              );
            })}
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_OPEN}
            title={t('developerCertificate.noCertificate')}
            description=""
            footer={
              <EnhancedButton
                icon={<CirclePlus />}
                className={cn(
                  'border border-primary text-primary bg-transparent',
                  'hover:border-primary/70 hover:text-primary/70 hover:bg-transparent',
                )}
                onClick={() => handleCreate()}
              >
                {t('developerCertificate.addCertificateAction')}
              </EnhancedButton>
            }
          />
        )}
      </div>
    </div>
  );
};
