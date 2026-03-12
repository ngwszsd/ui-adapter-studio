import { cn, formatFileSize } from '@/lib/utils.ts';
import { EnhancedButton, message } from '@teamhelper/ui';
import { useRequest } from 'ahooks';
import { Eye } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { knowledgeDatasetsMetaDataApi } from '../../server';
import type { IKnowledgeDatasetsDto } from '../../../KnowledgeDetail/server';
import {
  DATASET_TYPE,
  HANDLING_METHOD,
  PDF_HANDLE_TYPE,
} from '@/constants/knowledgeBase';
import { useKnowledgeDatasetDetailStore } from '../../knowledgeDatasetDetailStore';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export default function RightInfoSidebar() {
  const [searchParams] = useSearchParams();
  const { setMetaDataInfo } = useKnowledgeDatasetDetailStore();
  const { t } = useTranslation('knowledge');

  const datasetId = useMemo(() => {
    const n = searchParams?.get?.('datasetId');
    return Number(n);
  }, [searchParams]);

  const datasetType = useMemo(() => {
    const t = searchParams?.get?.('datasetType');
    return Number(t) as IKnowledgeDatasetsDto['data_type'];
  }, [searchParams]);

  const { data: metaInfo } = useRequest(
    () => {
      return knowledgeDatasetsMetaDataApi({
        dataset_id: datasetId,
      });
    },
    {
      manual: false,
      ready: Boolean(datasetId),
      refreshDeps: [datasetId],
    },
  );

  useEffect(() => {
    setMetaDataInfo(metaInfo || {});
  }, [metaInfo, setMetaDataInfo]);

  const metaList = useMemo(() => {
    const create_time = metaInfo?.create_time;
    const last_modified_time = metaInfo?.last_modified_time;
    const list = [
      {
        label: t('datasetDetail.meta.id'),
        key: 'dataset_id',
        value: metaInfo?.dataset_id ?? '-',
      },
      {
        label: t('datasetDetail.meta.source'),
        key: 'dataset_type',
        value:
          DATASET_TYPE?.[metaInfo?.dataset_type as keyof typeof DATASET_TYPE] ||
          '-',
      },
      {
        label: t('datasetDetail.meta.name'),
        key: 'name',
        value: metaInfo?.name || '-',
      },
      {
        label: t('datasetDetail.meta.createTime'),
        key: 'create_time',
        value: create_time
          ? format(new Date(create_time), 'yyyy-MM-dd HH:mm')
          : '-',
      },
      {
        label: t('datasetDetail.meta.updateTime'),
        key: 'last_modified_time',
        value: last_modified_time
          ? format(new Date(last_modified_time), 'yyyy-MM-dd HH:mm')
          : '-',
      },
      {
        label: t('datasetDetail.meta.processMode'),
        key: 'processing_mode',
        value:
          HANDLING_METHOD?.[
            metaInfo?.processing_mode as keyof typeof HANDLING_METHOD
          ] || '-',
      },
    ];

    if (datasetType === 1) {
      list.push(
        {
          label: t('datasetDetail.meta.pdfEnhance'),
          key: 'pdf_handle_type',
          value:
            PDF_HANDLE_TYPE?.[
              metaInfo?.pdf_handle_type as keyof typeof PDF_HANDLE_TYPE
            ] || '-',
        },
        {
          label: t('datasetDetail.meta.textSize'),
          key: 'text_size',
          value: metaInfo?.text_size || 0,
        },
        {
          label: t('datasetDetail.meta.titleIndex'),
          key: 'include_title_index',
          value: metaInfo?.include_title_index ? 'Yes' : 'No',
        },
        {
          label: t('datasetDetail.meta.imageIndex'),
          key: 'auto_image_index',
          value: metaInfo?.auto_image_index ? 'Yes' : 'No',
        },
        {
          label: t('datasetDetail.meta.autoExtendIndex'),
          key: 'auto_extend_index',
          value: metaInfo?.auto_extend_index ? 'Yes' : 'No',
        },
        {
          label: t('datasetDetail.meta.chunkSize'),
          key: 'chunk_size',
          value: metaInfo?.chunk_size || 0,
        },
        {
          label: t('datasetDetail.meta.indexSize'),
          key: 'index_size',
          value: metaInfo?.index_size || 0,
        },
        {
          label: t('datasetDetail.meta.sourceSize'),
          key: 'file_size',
          value: formatFileSize(metaInfo?.file_size || 0),
        },
      );
    }

    return list;
  }, [datasetType, metaInfo, t]);

  return (
    <div className={cn('w-[280px] shrink-0 border-l p-5 flex flex-col')}>
      <div className="text-base font-medium pb-5">
        {t('datasetDetail.meta.title')}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        <div className="space-y-3">
          {metaList.map((item) => {
            if (!item.key) return null;

            return (
              <div key={item?.key} className="text-xs space-y-1">
                <div className="text-muted-foreground">{item?.label}</div>
                <div className="text-foreground font-medium wrap-break-word">
                  {item?.value}
                </div>
              </div>
            );
          })}
        </div>

        {datasetType === 1 ? (
          <EnhancedButton
            onClick={() => {
              const url = metaInfo?.file_url;
              if (!url) {
                message.error(t('datasetDetail.meta.fileNotFound'));
                return;
              }

              window.open(url, '_blank');
            }}
          >
            <Eye />
            {t('datasetDetail.meta.viewContent')}
          </EnhancedButton>
        ) : null}
      </div>
    </div>
  );
}
