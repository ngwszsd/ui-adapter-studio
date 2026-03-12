import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SquarePen } from 'lucide-react';
import { openEditKnowledgeDialog } from './components/EditKnowledgeDialog.tsx';
import DatasetsSection, {
  type IDatasetsSectionRef,
} from './components/DatasetsSection.tsx';
import SearchTest from './components/SearchTest.tsx';
import {
  EnhancedTabs as Tabs,
  EnhancedBreadcrumb,
  type Crumb,
  openModalError,
  EnhancedAvatar,
} from '@teamhelper/ui';
import { useRafInterval, useRequest } from 'ahooks';
import {
  getKnowledgeBasesPathApi,
  queryKnowledgeBasesApi,
  getModelsApi,
} from '../server.ts';
import { KnowledgeBaseIcon } from '@/components/knowledgeBase/KnowledgeBaseIcon';
import {
  getKBDatasetChunksTrainingCountApi,
  updateKnowledgeBasesModelsApi,
  type IUpdateKnowledgeBasesModelsParams,
} from './server.ts';
import { useKnowledgeDetailStore } from './knowledgeDetailStore.ts';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { AiModelSelect } from '@/components/knowledgeBase/AiModelSelect/index.tsx';
import KnowledgeIcon from '@/assets/icon/knowledge.svg?react';
import { useResponsiveBreadcrumb } from '@/hooks/useResponsiveBreadcrumb';

type IActiveTabKey = 'datasets' | 'test' | 'unknown';

const KnowledgeDetail: React.FC = () => {
  const datasetsSectionRef = useRef<IDatasetsSectionRef>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTabKey, setActiveTabKey] = useState<IActiveTabKey>('unknown');
  const routerLocation = useLocation();
  const { t } = useTranslation('knowledge');
  const {
    initKnowledgeBases,
    kbSearchConfigParams,
    updateKbSearchConfigParams,
    setPollingStopped,
    pollingStopped,
  } = useKnowledgeDetailStore();
  const [trainingCount, setTrainingCount] = useState(0);
  const breadcrumbConfig = useResponsiveBreadcrumb();

  const currentTab = useMemo(() => {
    const tab = searchParams?.get?.('currentTab');
    return tab || '';
  }, [searchParams]);

  const knowledgeBaseId = useMemo(() => {
    const id = searchParams?.get?.('knowledgeBaseId');
    return Number(id) || null;
  }, [searchParams]);

  const { data: knowledgeBasesInfo, refresh: knowledgeBasesInfoRefresh } =
    useRequest(
      () => {
        return queryKnowledgeBasesApi(knowledgeBaseId);
      },
      {
        manual: false,
        ready: Boolean(knowledgeBaseId),
        refreshDeps: [knowledgeBaseId],
      },
    );

  useEffect(() => {
    const tab = currentTab || 'datasets';
    setActiveTabKey(tab as IActiveTabKey);
  }, [currentTab]);

  useEffect(() => {
    initKnowledgeBases({
      knowledgeBasesInfo,
      knowledgeBasesInfoRefresh,
    });
  }, [knowledgeBasesInfo, knowledgeBasesInfoRefresh]);

  useRequest(
    () => {
      return getModelsApi({ type: '4' });
    },
    {
      onSuccess: (data) => {
        if (Array.isArray(data) && data?.length) {
          updateKbSearchConfigParams(
            'rerank_model',
            String(data?.[0]?.id ?? ''),
          );
        }
      },
      ready: activeTabKey === 'test' && !kbSearchConfigParams?.rerank_model,
      refreshDeps: [activeTabKey, kbSearchConfigParams],
    },
  );

  const { data: knowledgeBasesPaths, refresh: knowledgeBasesPathsRefresh } =
    useRequest(
      () => {
        return getKnowledgeBasesPathApi({
          knowledge_id: knowledgeBaseId,
        });
      },
      {
        manual: false,
        ready: Boolean(knowledgeBaseId),
        refreshDeps: [knowledgeBaseId],
      },
    );

  const breadcrumbItems = useMemo(() => {
    const items = [{ key: 0, label: t('top.rootDir') }] as Crumb[];
    if (!Array.isArray(knowledgeBasesPaths) || !knowledgeBasesPaths.length)
      return items;

    knowledgeBasesPaths.forEach((item) => {
      items.push({
        key: item?.id,
        label: item?.name || '-',
      });
    });

    return items;
  }, [knowledgeBasesPaths]);

  const updateKnowledgeBasesModels = async (
    params: Omit<IUpdateKnowledgeBasesModelsParams, 'knowledge_id'>,
  ) => {
    const result = await updateKnowledgeBasesModelsApi({
      ...params,
      knowledge_id: knowledgeBasesInfo?.id || null,
    });
    if (!result) return false;

    knowledgeBasesInfoRefresh();
    return true;
  };

  const modeIds = useMemo(() => {
    return {
      embeddingModelId: knowledgeBasesInfo?.embedding_model_id,
      textModelId: knowledgeBasesInfo?.text_model_id,
      imageModelId: knowledgeBasesInfo?.image_model_id,
    };
  }, [
    knowledgeBasesInfo?.embedding_model_id,
    knowledgeBasesInfo?.text_model_id,
    knowledgeBasesInfo?.image_model_id,
  ]);

  useEffect(() => {
    setPollingStopped(false);
  }, [knowledgeBaseId]);

  const clearRafInterval = useRafInterval(
    async () => {
      if (!knowledgeBaseId || pollingStopped) return;
      const result = await getKBDatasetChunksTrainingCountApi(knowledgeBaseId);
      if ([-999].includes(result)) {
        clearRafInterval();
        setPollingStopped(true);
      }
      setTrainingCount(result ?? 0);
    },
    knowledgeBaseId && !pollingStopped ? 1000 * 6 : undefined,
    {
      immediate: true,
    },
  );

  return (
    <div className="w-full h-full flex bg-card">
      {/* 左侧主内容 */}
      <div className="flex-1 min-w-0 h-full flex">
        <Tabs
          underline
          tabBarExtraContent={{
            left: (
              <EnhancedBreadcrumb
                items={breadcrumbItems}
                onClick={(crumb) => {
                  const pathname = routerLocation?.pathname?.replace?.(
                    '/knowledge-base/detail',
                    '',
                  );

                  if (pathname) {
                    navigate(
                      `${pathname}?tab=knowledge-base${
                        crumb?.key ? `&parentId=${crumb?.key || ''}` : ''
                      }`,
                    );
                  }
                }}
                separator="/"
                className="text-base [&>ol]:flex-nowrap pl-4"
                contentClassName="max-w-20"
                maxItems={breadcrumbConfig.maxItems}
                itemsBefore={breadcrumbConfig.itemsBefore}
                itemsAfter={breadcrumbConfig.itemsAfter}
                lastItemClickable={breadcrumbItems?.length === 1}
              />
            ),
          }}
          items={[
            {
              key: 'datasets',
              label: t('detail.tab.datasets'),
              children: <DatasetsSection ref={datasetsSectionRef} />,
            },
            {
              key: 'test',
              label: t('detail.tab.search'),
              children: <SearchTest />,
            },
          ]}
          className="min-w-0 flex flex-col flex-1"
          listClassName="min-h-[60px] h-auto"
          triggerClassName="text-base"
          contentClassName="flex-1 flex mt-0 min-h-0"
          activeKey={activeTabKey}
          onChange={(key) => {
            const k = key as IActiveTabKey;
            setActiveTabKey(k);
            if (k === 'datasets') {
              setSearchParams({
                knowledgeBaseId: String(knowledgeBaseId ?? ''),
              });
            } else {
              setSearchParams((prev: URLSearchParams) => {
                prev.set('currentTab', String(k || ''));
                return prev;
              });
            }
          }}
        />
      </div>

      {/* 右侧设置面板 */}
      <div className="w-[280px] shrink-0 h-full border-l border-border p-5  overflow-y-auto">
        <div className="space-y-3 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            {knowledgeBasesInfo?.avatar ? (
              <EnhancedAvatar
                shape="square"
                className="w-[18px] h-[18px] shrink-0 bg-transparent"
                src={knowledgeBasesInfo?.avatar}
              />
            ) : (
              <KnowledgeBaseIcon
                type="default_knowledgeBase"
                className="w-[18px] h-[18px] shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="text-sm font-medium text-foreground truncate">
                  {knowledgeBasesInfo?.name || '-'}
                </div>

                <SquarePen
                  className="w-3 h-3 text-primary cursor-pointer hover:text-primary/70 shrink-0"
                  onClick={() => {
                    openEditKnowledgeDialog({
                      formValues: {
                        ...knowledgeBasesInfo,
                        id: knowledgeBasesInfo?.id || null,
                        name: knowledgeBasesInfo?.name || '',
                        description: knowledgeBasesInfo?.description || '',
                      },
                    }).then((result) => {
                      if (result) {
                        knowledgeBasesInfoRefresh();
                        knowledgeBasesPathsRefresh();
                      }
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-2.5 py-0.5 bg-background rounded-[6px] border border-border w-fit">
            <KnowledgeIcon />
            <div className="text-xs text-muted-foreground scale-[0.83] origin-left">
              {t('detail.info.general')}
            </div>
          </div>

          <div className="text-xs text-muted-foreground wrap-break-word">
            {knowledgeBasesInfo?.description || t('detail.info.desc')}
          </div>
        </div>

        {/* 知识库基础信息 */}
        <div className="mt-5 mb-[18px]">
          <div className="text-xs font-medium text-foreground">
            {t('detail.info.id')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {knowledgeBasesInfo?.id || '-'}
          </div>
        </div>

        {knowledgeBasesInfo?.id ? (
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium text-foreground">
                  {t('detail.model.index')}
                </div>
              </div>

              <AiModelSelect
                modelParams={{
                  type: '3',
                }}
                value={modeIds?.embeddingModelId}
                onChange={(val: number | undefined) => {
                  if (!modeIds?.embeddingModelId) return;
                  if (modeIds?.embeddingModelId === val) return;

                  openModalError({
                    title: t('detail.model.confirmSwitch.title'),
                    content: (
                      <div className="space-y-6">
                        <div>
                          <div>{t('detail.model.confirmSwitch.content1')}</div>
                          <div>{t('detail.model.confirmSwitch.content2')}</div>
                        </div>

                        <div>{t('detail.model.confirmSwitch.content3')}</div>
                      </div>
                    ),
                    options: {
                      countdown: 10,
                    },
                    onOk() {
                      updateKnowledgeBasesModels({
                        model_id: Number(val),
                        model_type: 3,
                      }).then((result) => {
                        if (result) {
                          if (activeTabKey === 'datasets') {
                            datasetsSectionRef?.current?.refreshKnowledgeDatasetsList?.();
                            setTrainingCount(999);
                          }
                        }
                      });
                    },
                  });
                }}
                disabled={Boolean(trainingCount)}
              />
            </div>

            <div>
              <div className="text-xs font-medium mb-2">
                {t('detail.model.text')}
              </div>

              <AiModelSelect
                modelParams={{
                  type: '1',
                }}
                value={modeIds?.textModelId}
                onChange={(val: number | undefined) => {
                  if (!modeIds?.textModelId) return;
                  if (modeIds?.textModelId === val) return;

                  updateKnowledgeBasesModels({
                    model_id: Number(val),
                    model_type: 1,
                  });
                }}
              />
            </div>

            <div>
              <div className="text-xs font-medium mb-2">
                {t('detail.model.image')}
              </div>

              <AiModelSelect
                modelParams={{
                  type: '2',
                }}
                value={modeIds?.imageModelId}
                onChange={(val: number | undefined) => {
                  if (!modeIds?.imageModelId) return;
                  if (modeIds?.imageModelId === val) return;

                  updateKnowledgeBasesModels({
                    model_id: Number(val),
                    model_type: 2,
                  });
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default KnowledgeDetail;
