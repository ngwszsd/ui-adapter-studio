import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import {
  Timeline,
  EnhancedButton,
  Modal,
  EnhancedTabs as Tabs,
  EnhancedTable as Table,
  Empty,
  type ColumnType,
  Badge,
  openModalError,
} from '@teamhelper/ui';
import { useRequest } from 'ahooks';
import {
  deleteKnowledgeBasesDatasetErrorsApi,
  getKBDatasetErrorCountApi,
  knowledgeBasesDatasetErrorsApi,
  knowledgeBasesDatasetTrainingStepsApi,
  retryKnowledgeBasesDatasetErrorsApi,
  type IKnowledgeBasesDatasetErrorsDto,
  type IKnowledgeDatasetsDto,
} from '../server.ts';
import { TRAINING_STATUS } from '@/constants/knowledgeBase.ts';
import i18n from '@/i18n/index.ts';
import { useKnowledgeDetailStore } from '../knowledgeDetailStore.ts';

export interface TrainingStatusDialogProps {
  datasetInfo?: IKnowledgeDatasetsDto;
}

type IActiveTab = 'states' | 'errors';

function TrainingStatusDialog({ datasetInfo }: TrainingStatusDialogProps) {
  const modal = useModal();
  const { t } = useTranslation('knowledge');
  const [activeTab, setActiveTab] = useState<IActiveTab>('states');
  const [isRetry, setIsRetry] = useState<boolean>(false);
  const { pollingStopped } = useKnowledgeDetailStore();
  const {
    data: datasetTrainingSteps,
    cancel: cancelTraining,
    refresh: trainingStepsRefresh,
  } = useRequest(
    () => {
      return knowledgeBasesDatasetTrainingStepsApi({
        dataset_id: datasetInfo?.id || null,
      });
    },
    {
      manual: false,
      ready: Boolean(datasetInfo?.id),
      refreshDeps: [datasetInfo?.id, pollingStopped],
      pollingInterval: pollingStopped ? 0 : 1000 * 6,
    },
  );

  useEffect(() => {
    if (!datasetTrainingSteps) return;

    const isTraining = datasetTrainingSteps.some((item) =>
      [0, 1, null, undefined].includes(item?.step_status),
    );
    const hasError = datasetTrainingSteps.some(
      (item) => item?.step_status === 3,
    );

    if (!isTraining || hasError) {
      cancelTraining();
    }
  }, [datasetTrainingSteps, cancelTraining]);

  const hasStepError = useMemo(() => {
    return (
      datasetTrainingSteps?.some((item) => item?.step_status === 3) ?? false
    );
  }, [datasetTrainingSteps]);

  const { data: kBDatasetErrorCount, mutate: mutateKBDatasetErrorCount } =
    useRequest(
      () => {
        return getKBDatasetErrorCountApi(datasetInfo?.id || null);
      },
      {
        manual: false,
        ready:
          Boolean(datasetInfo?.id) &&
          activeTab === 'states' &&
          !!datasetTrainingSteps,
        refreshDeps: [datasetInfo?.id, activeTab, hasStepError, pollingStopped],
        pollingInterval: hasStepError && !pollingStopped ? 1000 * 6 : 0,
      },
    );

  const { data: datasetTrainingErrors, refresh: datasetErrorsRefresh } =
    useRequest(
      () => {
        return knowledgeBasesDatasetErrorsApi({
          dataset_id: datasetInfo?.id || null,
        });
      },
      {
        manual: false,
        ready: Boolean(datasetInfo?.id) && activeTab === 'errors',
        refreshDeps: [datasetInfo?.id, activeTab, pollingStopped],
        pollingInterval:
          activeTab === 'errors' &&
          (kBDatasetErrorCount || 0) > 0 &&
          !pollingStopped
            ? 1000 * 6
            : 0,
      },
    );

  useEffect(() => {
    if (activeTab === 'errors' && datasetTrainingErrors) {
      mutateKBDatasetErrorCount(datasetTrainingErrors.length);
    }
  }, [activeTab, datasetTrainingErrors, mutateKBDatasetErrorCount]);

  const datasetTrainingErrorTotal = useMemo(() => {
    if (activeTab === 'errors' && datasetTrainingErrors) {
      return datasetTrainingErrors.length;
    }
    return kBDatasetErrorCount || 0;
  }, [kBDatasetErrorCount, datasetTrainingErrors, activeTab]);

  const columns = useMemo<ColumnType<IKnowledgeBasesDatasetErrorsDto>[]>(() => {
    return [
      {
        title: t('training.col.chunkId'),
        dataIndex: 'trunk_id',
        key: 'trunk_id',
        width: 200,
        render: (_, record) => record?.trunk_id || '-',
      },
      {
        title: t('training.col.stepName'),
        dataIndex: 'step_name',
        key: 'step_name',
        width: i18n?.language === 'zh' ? 120 : 160,
        render: (_, record) => record?.step_name || '-',
      },
      {
        title: t('training.col.statusText'),
        dataIndex: 'status',
        key: 'status',
        width: i18n?.language === 'zh' ? 120 : 140,
        render: (_, record) => {
          const s = Number(record?.status);
          const statusText = TRAINING_STATUS[s as keyof typeof TRAINING_STATUS];
          if (!statusText) return '-';

          return (
            <Badge
              className={cn(
                'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
                'bg-background text-muted-foreground',
                s === 2 && 'bg-primary/5 text-primary',
                [1, 4].includes(s) && 'bg-destructive/6 text-destructive',
              )}
              variant="outline"
            >
              <div className="text-xs">{statusText}</div>
            </Badge>
          );
        },
      },
      {
        title: t('training.col.message'),
        dataIndex: 'message',
        key: 'message',
        width: 300,
        ellipsis: true,
        render: (_, record) => record?.message || '-',
      },
      {
        title: t('training.col.action'),
        key: 'action',
        width: i18n?.language === 'zh' ? 100 : 120,
        fixed: 'right',
        render: (_, record) => {
          return (
            <div className="flex justify-between">
              {[1, 4].includes(Number(record?.status)) &&
              String(record?.trunk_id) !== '-1' ? (
                <EnhancedButton
                  type="link"
                  className={cn('p-0')}
                  size="small"
                  onClick={async () => {
                    setIsRetry(true);

                    const result = await retryKnowledgeBasesDatasetErrorsApi(
                      record?.id ?? null,
                    );
                    if (!result) return;

                    datasetErrorsRefresh();
                    trainingStepsRefresh();
                  }}
                >
                  {t('training.action.retry')}
                </EnhancedButton>
              ) : null}

              <EnhancedButton
                className={cn(
                  'border-0 shadow-none text-destructive bg-transparent',
                  'hover:text-destructive/70 hover:bg-transparent',
                  'p-0',
                )}
                size="small"
                onClick={async () => {
                  openModalError({
                    title: t('training.action.deleteTitle'),
                    content: t('training.action.deleteContent'),
                    onOk: async () => {
                      const result = await deleteKnowledgeBasesDatasetErrorsApi(
                        record?.id ?? null,
                      );
                      if (!result) return;

                      datasetErrorsRefresh();
                    },
                  });
                }}
              >
                {t('training.action.delete')}
              </EnhancedButton>
            </div>
          );
        },
      },
    ];
  }, []);

  const onCancel = () => {
    modal.resolve({
      isRetry,
    });
    modal.hide();
  };

  const onOk = () => {
    onCancel();
  };

  const renderStatusTab = () => {
    if (!Array.isArray(datasetTrainingSteps) || !datasetTrainingSteps.length)
      return null;

    const items = datasetTrainingSteps.map((item) => {
      const status = item?.step_status;
      const step_name = item?.step_name;

      return {
        label: (
          <div
            className={cn(
              'h-9 rounded-md flex items-center justify-between px-4',
              'bg-muted',
              status === 1 && 'bg-primary/10',
              status === 2 && 'bg-green-100',
              status === 3 && 'bg-destructive/10',
            )}
          >
            <div
              className={cn(
                'text-sm font-medium',
                'text-muted-foreground',
                status === 1 && 'text-primary',
                status === 2 && 'text-green-600',
                status === 3 && 'text-destructive',
              )}
            >
              {step_name || '-'}
            </div>
          </div>
        ),
        dot: (
          <div
            className={cn(
              'relative w-3 h-3 rounded-full flex items-center justify-center',
              'bg-foreground/10',
              status === 1 && 'bg-primary',
              status === 2 && 'bg-green-500',
              status === 3 && 'bg-destructive',
            )}
          >
            <Check className={cn('w-2.5 h-2.5', 'text-white')} />
          </div>
        ),
      };
    });

    return (
      <Timeline
        items={items}
        lineTop={26}
        itemClassName="mb-[18px]"
        isShowLastLine={false}
      />
    );
  };

  const renderErrorsTab = () => {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <Table
          columns={columns}
          dataSource={datasetTrainingErrors}
          rowKey="id"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_OPEN}
                description={t('training.empty')}
                classNames={{
                  root: 'p-5',
                }}
              />
            ),
          }}
          scroll={{ y: 360 }}
          virtualScrollThreshold={36}
        />
      </div>
    );
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={t('training.title')}
      onCancel={onCancel}
      onOk={onOk}
      classNames={{
        content: 'w-[700px] max-w-none h-[80vh]',
        body: 'flex flex-col min-h-0 flex-1 pb-5',
      }}
      isShowFooter={false}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            modal.remove();
          }, 360);
        }
      }}
    >
      <Tabs
        type="card"
        activeKey={activeTab}
        onChange={(v) => {
          setActiveTab(v as IActiveTab);
        }}
        items={[
          {
            key: 'states',
            label: t('training.tab.status'),
            children: renderStatusTab(),
          },
          {
            key: 'errors',
            label: `${t('training.tab.errors')} (${datasetTrainingErrorTotal})`,
            children: renderErrorsTab(),
          },
        ]}
        listClassName="h-12 p-[5px] w-fit shrink-0"
        contentClassName="min-h-50 flex flex-col"
        className="flex-1 min-h-0 flex flex-col"
      />
    </Modal>
  );
}

const TrainingStatusDialogModal = NiceModal.create(TrainingStatusDialog);

export const openTrainingStatusDialog = (
  options?: TrainingStatusDialogProps,
): Promise<{ isRetry: boolean }> => {
  return NiceModal.show(TrainingStatusDialogModal, options);
};

export default TrainingStatusDialogModal;
