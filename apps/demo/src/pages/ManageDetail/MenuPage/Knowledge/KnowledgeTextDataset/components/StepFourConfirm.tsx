import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  EnhancedButton,
  EnhancedTable as Table,
  type ColumnType,
} from '@teamhelper/ui';
import { cn } from '@/lib/utils.ts';
import {
  KnowledgeBaseIcon,
  type IKnowledgeBaseIconProps,
} from '@/components/knowledgeBase/KnowledgeBaseIcon';
import {
  useKnowledgeTextDatasetStore,
  type IKnowledgeTextDatasetFileRow,
} from '../knowledgeTextDatasetStore';
import type { ISaveKnowledgeBasesDatasetParams } from '../../KnowledgeDetail/server';
import { useSearchParams } from 'react-router';
import { getFileIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon/utils';

interface StepFourConfirmProps {
  isShow: boolean;
  onFinishedClick: (params: Partial<ISaveKnowledgeBasesDatasetParams>) => void;
}

const StepFourConfirm: React.FC<StepFourConfirmProps> = ({
  isShow = true,
  onFinishedClick,
}) => {
  const [searchParams] = useSearchParams();
  const kbSource = useMemo(() => {
    const source = searchParams?.get?.('source');
    return source as 'adjust';
  }, [searchParams]);

  const { fileRows, setFileRows, datasetParams } =
    useKnowledgeTextDatasetStore();
  const { t } = useTranslation('knowledge');
  const columns = useMemo<ColumnType<IKnowledgeTextDatasetFileRow>[]>(() => {
    return [
      {
        title: t('textDataset.col.source'),
        dataIndex: 'file',
        key: 'file',
        render: (_, record) => {
          const iconType = getFileIcon(
            record?.file?.name,
          ) as IKnowledgeBaseIconProps['type'];
          return (
            <div className="flex gap-1">
              <KnowledgeBaseIcon type={iconType} />

              <div>{record?.file?.name || '-'}</div>
            </div>
          );
        },
      },
      {
        title: t('textDataset.col.status'),
        dataIndex: 'status',
        key: 'status',
        width: 340,
        render: (_, _record) => {
          return (
            <Badge
              className={cn(
                'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
                'bg-background text-muted-foreground',
              )}
              variant="outline"
            >
              <div className="text-xs">{t('textDataset.status.waiting')}</div>
            </Badge>
          );
        },
      },
      {
        title: t('textDataset.col.action'),
        key: 'action',
        width: 200,
        render: (_, record) => {
          if (kbSource === 'adjust') return '-';

          return (
            <EnhancedButton
              className={cn(
                'border-0 shadow-none text-destructive bg-transparent',
                'hover:text-destructive/70 hover:bg-transparent',
                'px-0',
              )}
              onClick={() => {
                const list = fileRows?.filter?.(
                  (item) => item?.id !== record?.id,
                );
                setFileRows(list);
              }}
            >
              {t('textDataset.action.delete')}
            </EnhancedButton>
          );
        },
      },
    ];
  }, [fileRows, setFileRows]);

  const dataTotal = useMemo(() => {
    return fileRows?.length ?? 0;
  }, [fileRows]);

  return (
    <div className={cn('h-full flex flex-col', isShow ? 'flex' : 'hidden')}>
      <Table
        columns={columns}
        dataSource={fileRows}
        rowKey="id"
        className="flex-1 min-h-0"
      />

      <div className="flex justify-end">
        <EnhancedButton
          type="primary"
          disabled={!dataTotal}
          onClick={() => {
            onFinishedClick?.({
              ...datasetParams,
              files:
                fileRows?.map?.((item) => ({
                  name: item?.file?.name || '',
                  object_key: item?.file_object_key || '',
                })) || [],
            });
          }}
        >
          {t('textDataset.confirm.startUpload')}{' '}
          {dataTotal
            ? t('textDataset.confirm.count', { count: dataTotal })
            : ''}
        </EnhancedButton>
      </div>
    </div>
  );
};

export default StepFourConfirm;
