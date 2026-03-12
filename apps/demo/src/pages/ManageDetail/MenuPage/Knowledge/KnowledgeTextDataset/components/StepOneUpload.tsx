import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type ColumnType,
  Progress,
  EnhancedButton,
  EnhancedTable as Table,
  Badge,
  EnhancedTooltip,
  message,
  Empty,
} from '@teamhelper/ui';
import ThUploadDragger, {
  type IThUploadDraggerRef,
} from '@/components/common/ThUploadDragger';
import {
  KnowledgeBaseIcon,
  type IKnowledgeBaseIconProps,
} from '@/components/knowledgeBase/KnowledgeBaseIcon';
import { cn, formatFileSize } from '@/lib/utils';
import {
  useKnowledgeTextDatasetStore,
  type IKnowledgeTextDatasetFileRow,
} from '../knowledgeTextDatasetStore';
import { cloneDeep } from 'es-toolkit/object';
import { getFileIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon/utils';

interface StepOneUploadProps {
  isShow: boolean;
  checkDatasetNameFn: (names: Array<string>) => Promise<Array<string>>;
  handleNext: () => void;
}

const StepOneUpload: React.FC<StepOneUploadProps> = ({
  isShow = true,
  checkDatasetNameFn,
  handleNext,
}) => {
  const thUploadDraggerRef = useRef<IThUploadDraggerRef>(null);
  const { fileRows, setFileRows } = useKnowledgeTextDatasetStore();
  const [loading, setLoading] = useState(false);
  const fileRowsRef = useRef(fileRows);

  useEffect(() => {
    fileRowsRef.current = fileRows;
  }, [fileRows]);

  const { t } = useTranslation('knowledge');

  const columns = useMemo<ColumnType<IKnowledgeTextDatasetFileRow>[]>(() => {
    return [
      {
        title: t('textDataset.col.name'),
        dataIndex: 'file',
        key: 'file',
        width: 600,
        render: (_, record) => {
          const isSameName = record?.isSameName;
          const isNameTooLong = (record?.file?.name?.length || 0) > 100;
          const iconType = getFileIcon(
            record?.file?.name,
          ) as IKnowledgeBaseIconProps['type'];
          return (
            <div className="flex gap-1 items-center">
              <div className="flex gap-1 flex-1 min-w-0 items-center">
                <KnowledgeBaseIcon type={iconType} />

                <div className="truncate" title={record?.file?.name}>
                  {record?.file?.name || '-'}
                </div>
              </div>

              {isNameTooLong ? (
                <EnhancedTooltip
                  title={t('textDataset.upload.nameTooLongTooltip')}
                  overlayClassName="max-w-[280px]"
                >
                  <Badge
                    className={cn(
                      'px-3 min-h-[26px] rounded-full flex items-center justify-center w-fit border-0 cursor-pointer shrink-0',
                      'bg-destructive/10 text-destructive hover:bg-destructive/20',
                    )}
                    variant="outline"
                  >
                    {t('textDataset.upload.nameTooLongBadge')}
                  </Badge>
                </EnhancedTooltip>
              ) : null}

              {isSameName ? (
                <EnhancedTooltip
                  title={t('textDataset.upload.sameNameTooltip')}
                  overlayClassName="max-w-[280px]"
                >
                  <Badge
                    className={cn(
                      'px-3 min-h-[26px] rounded-full flex items-center justify-center w-fit border-0 cursor-pointer shrink-0',
                      'bg-destructive/10 text-destructive hover:bg-destructive/20',
                    )}
                    variant="outline"
                  >
                    {t('textDataset.upload.sameNameBadge')}
                  </Badge>
                </EnhancedTooltip>
              ) : null}
            </div>
          );
        },
      },
      {
        title: t('textDataset.col.progress'),
        dataIndex: 'progress',
        key: 'progress',
        width: 340,
        render: (_, record) => {
          const value = record?.progress || 0;
          return (
            <div className="flex items-center flex-wrap gap-2">
              <Progress
                value={value}
                className="w-8/12 bg-background"
                indicatorClassName="bg-green-500"
              />
              <div className="text-xs text-muted-foreground font-medium">
                {value}%
              </div>
            </div>
          );
        },
      },
      {
        title: t('textDataset.col.size'),
        dataIndex: 'sizeText',
        key: 'sizeText',
        width: 200,
        render: (_, record) => record?.sizeText || '-',
      },
      {
        title: t('textDataset.col.action'),
        key: 'action',
        width: 100,
        fixed: 'right',
        render: (_, record) => {
          const value = record?.progress || 0;
          return (
            <EnhancedButton
              className={cn(
                'border-0 shadow-none text-destructive bg-transparent',
                'hover:text-destructive/70 hover:bg-transparent',
                'px-0',
              )}
              onClick={() => {
                const list = fileRows.filter((item) => item?.id !== record?.id);
                setFileRows(list);
                thUploadDraggerRef.current?.updateFileCountFn?.(list?.length);
              }}
              disabled={value < 100}
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

  const isUploading = useMemo(() => {
    return fileRows?.some((item) => item?.progress < 100);
  }, [fileRows]);

  const hasError = useMemo(() => {
    return fileRows?.some((item) => (item?.file?.name?.length || 0) > 100);
  }, [fileRows]);

  return (
    <div
      className={cn(
        'flex-col gap-4 flex-1 min-h-0',
        isShow ? 'flex' : 'hidden',
      )}
    >
      <ThUploadDragger
        isCustomClick
        ref={thUploadDraggerRef}
        type="knowledge"
        accept=".txt,.docx,.csv,.xlsx,.pdf,.md,.html,.pptx"
        maxSizeMB={100}
        onChange={(files) => {
          const nextRows: IKnowledgeTextDatasetFileRow[] = files.map((f, i) => {
            const f_size = f?.size || 0;
            const id = `${Date.now() + i}`;
            (f as any).uid = id;
            return {
              id,
              file: f,
              progress: 0,
              sizeText: formatFileSize(f_size),
              status: 'done',
            };
          });

          const newFileNames = new Set(nextRows.map((item) => item.file.name));
          const filteredFileRows = fileRows.filter(
            (item) => !newFileNames.has(item.file.name),
          );

          setFileRows([...nextRows, ...filteredFileRows]);
        }}
        onUploaded={(fileKey, file) => {
          const currentRows = useKnowledgeTextDatasetStore.getState().fileRows;
          const newRows = cloneDeep(currentRows);
          const uid = (file as any).uid;
          const row = newRows.find((item) => item.id === uid);
          if (row) {
            row.file_object_key = fileKey;
            setFileRows(newRows);
          }
        }}
        onUploadProgress={(progressEvent, file) => {
          const currentFileRows = fileRowsRef.current;
          if (Array.isArray(currentFileRows)) {
            const p = Number(progressEvent?.progress) || 0;

            const newFileRows = cloneDeep(currentFileRows);
            const uid = (file as any).uid;
            const obj = newFileRows.find((item) => item.id === uid);
            if (!obj) return;

            Object.assign(obj, {
              progress: Math.ceil(p * 100),
            });

            setFileRows(newFileRows);
          }
        }}
      />

      <Table
        columns={columns}
        dataSource={fileRows}
        rowKey="id"
        className="flex-1 min-h-0"
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_OPEN}
              description={t('dataset.empty.data')}
              classNames={{
                root: 'py-12',
              }}
            />
          ),
        }}
      />

      <div className="flex justify-end">
        <EnhancedButton
          type="primary"
          loading={loading}
          disabled={!dataTotal || isUploading}
          onClick={async () => {
            setLoading(true);

            const names =
              fileRows
                ?.map?.((item) => item?.file?.name || '')
                ?.filter(Boolean) || [];
            const datasetNames = await checkDatasetNameFn?.(names);

            let errorMsgs = [] as Array<string>;
            if (Array.isArray(datasetNames) && datasetNames.length) {
              errorMsgs.push(t('textDataset.upload.sameNameError'));

              const fileRows_new = cloneDeep(fileRows);
              fileRows_new.forEach((item) => {
                Object.assign(item, {
                  isSameName: datasetNames.includes(item?.file?.name || ''),
                });
              });

              setFileRows(fileRows_new);
            }

            if (hasError) {
              errorMsgs.push(t('textDataset.upload.nameTooLongError'));
            }

            if (errorMsgs.length) {
              setLoading(false);
              return message.error(
                <ul className="space-y-1">
                  {errorMsgs.map((item, index) => {
                    if (!item) return null;

                    return (
                      <li key={index}>
                        {index + 1}、{item}
                      </li>
                    );
                  })}
                </ul>,
              );
            }

            setTimeout(() => {
              setLoading(false);
              handleNext?.();
            }, 1000);
          }}
        >
          {t('textDataset.next.simple')}{' '}
          {dataTotal ? t('textDataset.next.count', { count: dataTotal }) : ''}
        </EnhancedButton>
      </div>
    </div>
  );
};

export default StepOneUpload;
