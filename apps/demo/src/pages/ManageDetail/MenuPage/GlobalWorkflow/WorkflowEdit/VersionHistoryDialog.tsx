import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  EnhancedSelect,
  Timeline,
  EnhancedButton,
  EnhancedAvatar,
  message,
  openTipsModal,
} from '@teamhelper/ui';
import { Loader2 } from 'lucide-react';
import {
  loadWorkflowVersionListApi,
  loadWorkflowVersionApi,
  type ILoadWorkflowVersionListVo,
} from './server';
import { format } from 'date-fns';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  onLoadVersion: (version: ILoadWorkflowVersionListVo) => void;
}

export const VersionHistoryDialog: React.FC<VersionHistoryDialogProps> = ({
  open,
  onOpenChange,
  workflowId,
  onLoadVersion,
}) => {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<'all' | 'archive' | 'release'>(
    'all',
  );
  const [list, setList] = useState<ILoadWorkflowVersionListVo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVersionId, setLoadingVersionId] = useState<number | null>(null);

  useEffect(() => {
    if (open && workflowId) {
      loadData();
    }
  }, [open, workflowId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await loadWorkflowVersionListApi(workflowId);
      const dataList = Array.isArray(data) ? data : [];
      setList(dataList);
    } catch (error) {
      console.error(error);
      message.error(t('common.loadFailed', '加载失败'));
    } finally {
      setLoading(false);
    }
  };

  const getVersionType = (item: ILoadWorkflowVersionListVo) => {
    return Number(
      item.versionType ??
        (item as { version_type?: number }).version_type ??
        -1,
    );
  };

  const getCreatorName = (item: ILoadWorkflowVersionListVo) => {
    return (
      String(item.createdByName || '').trim() ||
      String(item.creatorName || '').trim()
    );
  };

  const getCreatedDate = (item: ILoadWorkflowVersionListVo) => {
    return (
      String(item.createdDate || '').trim() ||
      String(
        (item as { created_date?: string | null }).created_date || '',
      ).trim()
    );
  };

  const filteredList = useMemo(() => {
    if (filterType === 'all') return list;
    if (filterType === 'archive')
      return list.filter((item) => getVersionType(item) === 0);
    if (filterType === 'release')
      return list.filter((item) => getVersionType(item) === 1);
    return list;
  }, [list, filterType]);

  const handleLoadVersion = (item: ILoadWorkflowVersionListVo) => {
    openTipsModal(
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-[#FF7D00] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-base">!</span>
        </div>
        <span className="text-[#667085] text-sm">
          {t(
            'versionHistory.loadVersionConfirm.desc',
            '当前工作流内容将被替换',
          )}
        </span>
      </div>,
      {
        title: t(
          'versionHistory.loadVersionConfirm.title',
          '将此版本加载至工作流？',
        ),
        onOkBeforeFunction: async () => {
          setLoadingVersionId(item.id);
          try {
            const fullData = await loadWorkflowVersionApi(workflowId, item.id);
            if (fullData && fullData.id) {
              const normalizedVersionData: ILoadWorkflowVersionListVo = {
                ...item,
                id: fullData.id,
                workflowId: String(
                  fullData.workflow_id || item.workflowId || '',
                ).trim(),
                version:
                  String(fullData.version || item.version || '').trim() ||
                  item.version,
                description:
                  String(
                    fullData.description || item.description || '',
                  ).trim() || item.description,
                versionType: fullData.version_type ?? item.versionType,
                graphData: fullData.graph_data ?? item.graphData,
                workflowData: fullData.workflow_data ?? item.workflowData,
                createdDate:
                  String(
                    fullData.created_date || item.createdDate || '',
                  ).trim() || item.createdDate,
              };
              onLoadVersion(normalizedVersionData);
              onOpenChange(false);
              message.success(t('versionHistory.loadSuccess', '版本加载成功'));
              return true;
            } else {
              message.error(t('versionHistory.loadFailed', '版本加载失败'));
              return false;
            }
          } catch (error) {
            console.error(error);
            message.error(t('versionHistory.loadFailed', '版本加载失败'));
            return false;
          } finally {
            setLoadingVersionId(null);
          }
        },
      },
    );
  };

  const renderItem = (item: ILoadWorkflowVersionListVo) => {
    const versionType = getVersionType(item);
    const versionText = String(item.version || '').trim() || `#${item.id}`;
    const creatorName = getCreatorName(item);
    const createdDate = getCreatedDate(item);

    let tag;
    if (versionType === 1) {
      tag = (
        <div className="rounded-[4px] bg-[#E6FFFA] px-2 flex items-center justify-center w-fit py-0.5">
          <div className="text-xs text-[#00A071]">
            {t('versionHistory.release', '发布')} v{versionText}
          </div>
        </div>
      );
    } else {
      if (item?.current && filterType === 'all') {
        tag = (
          <div className="rounded-[4px] bg-[#EBF4FF] px-2 flex items-center justify-center w-fit py-0.5">
            <div className="text-xs text-[#165DFF]">
              {t('versionHistory.current', '当前')}
            </div>
          </div>
        );
      } else {
        tag = (
          <div className="rounded-[4px] bg-[#FFF7E6] px-2 flex items-center justify-center w-fit py-0.5">
            <div className="text-xs text-[#FA8C16]">
              {t('versionHistory.archive', '存档')}
            </div>
          </div>
        );
      }
    }

    return {
      label: tag,
      children: (
        <div className="mt-2 p-3 bg-gray-50/50 hover:bg-gray-100/80 rounded-lg transition-colors group relative border border-transparent hover:border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[#1D2939] text-sm font-medium">
                {item?.description}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <EnhancedAvatar
                  size={20}
                  src={item.creatorAvatarUrl}
                  className="w-5 h-5"
                >
                  {creatorName?.[0]?.toUpperCase()}
                </EnhancedAvatar>
                <span className="text-xs text-[#667085]">
                  {creatorName || t('common.unknownUser', '未知用户')}
                </span>
              </div>
              <div className="mt-1 text-xs text-[#98A2B3]">
                {createdDate
                  ? format(new Date(createdDate), 'yyyy-MM-dd HH:mm')
                  : '-'}
              </div>
            </div>

            {(versionType === 1 || !item?.current) && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 flex gap-2">
                <EnhancedButton
                  size="small"
                  className="h-7 text-xs bg-white border-gray-200 hover:bg-gray-50 text-[#344054]"
                  onClick={() => handleLoadVersion(item)}
                  loading={loadingVersionId === item.id}
                >
                  {t('versionHistory.loadVersion', '加载此版本')}
                </EnhancedButton>
              </div>
            )}
          </div>
        </div>
      ),
      color: item?.current ? '#165DFF' : '#D3D3D8',
    };
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('versionHistory.title', '版本记录')}
      isShowFooter={false}
      classNames={{
        content: 'w-[400px] h-[600px] flex flex-col',
        body: 'flex-1 overflow-hidden flex flex-col p-0',
      }}
    >
      <div className="px-6 py-4 border-b border-gray-100">
        <EnhancedSelect
          value={filterType}
          onChange={(val) => setFilterType(val as any)}
          options={[
            { label: t('versionHistory.filter.all', '全部'), value: 'all' },
            {
              label: t('versionHistory.filter.archive', '存档'),
              value: 'archive',
            },
            {
              label: t('versionHistory.filter.release', '发布'),
              value: 'release',
            },
          ]}
          className="w-full"
          placeholder="请选择"
          searchable={false}
          allowClear={false}
          showCheck={false}
          listHeight="auto"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <Timeline
            items={filteredList.map((item) => renderItem(item))}
            lineLeft={18}
          />
        )}
      </div>
    </Modal>
  );
};
