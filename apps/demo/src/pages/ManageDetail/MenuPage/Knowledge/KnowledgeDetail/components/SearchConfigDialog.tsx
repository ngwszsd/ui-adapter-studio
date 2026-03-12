import React, { Activity, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { cn, generateMarks } from '@/lib/utils.ts';
import {
  EnhancedRadioGroup,
  EnhancedSlider as Slider,
  Switch,
  Modal,
  EnhancedTabs as Tabs,
  EnhancedTextarea,
  InputNumber,
} from '@teamhelper/ui';
import SliderBlockIcon from '@/assets/icon/slider-block.svg?react';
import { SEARCH_MODE_LIST } from '@/constants/knowledgeBase';
import type { IKnowledgeBasesSearchParams } from '../server';
import { HelpPopover } from '@/components/common/HelpPopover';
import { AiModelSelect } from '@/components/knowledgeBase/AiModelSelect';
import { useKnowledgeDetailStore } from '../knowledgeDetailStore';

type IActiveTab = 'searchMode' | 'limit' | 'queryExtension';
export type SearchConfigDialogOptions = {
  initialValues?: Partial<IKnowledgeBasesSearchParams>;
  isolated?: boolean;
};
export type SearchConfigDialogResult =
  Partial<IKnowledgeBasesSearchParams> | null;

const SearchConfigDialog: React.FC<SearchConfigDialogOptions> = (props) => {
  const modal = useModal();
  const isolated = Boolean(props?.isolated);
  const { kbSearchConfigParams, setKbSearchConfigParams } =
    useKnowledgeDetailStore();
  const { t } = useTranslation('knowledge');
  const [activeTab, setActiveTab] = useState<IActiveTab>('searchMode');
  const [knowledgeSearchParams, setKnowledgeSearchParams] = useState<
    Partial<IKnowledgeBasesSearchParams>
  >({
    ...kbSearchConfigParams,
    ...(props?.initialValues || {}),
  });

  const rerankEnabled = useMemo(() => {
    return Boolean(knowledgeSearchParams?.using_re_rank);
  }, [knowledgeSearchParams]);

  const questionOptimizeEnabled = useMemo(() => {
    return Boolean(knowledgeSearchParams?.dataset_search_using_extension_query);
  }, [knowledgeSearchParams]);

  const embeddingWeight = useMemo(() => {
    return knowledgeSearchParams?.embedding_weight ?? 0;
  }, [knowledgeSearchParams]);

  const renderMethodTab = () => {
    return (
      <div className="space-y-4">
        <EnhancedRadioGroup
          direction="vertical"
          options={SEARCH_MODE_LIST.map((item) => {
            const search_mode = knowledgeSearchParams?.search_mode;

            return {
              value: item?.key,
              label: (
                <>
                  <div>
                    <div className="text-sm font-medium">{item?.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item?.description}
                    </div>
                  </div>

                  {item?.key === '3' && search_mode === item?.key ? (
                    <div className="pt-3 pb-5 border-t border-under-line space-y-2.5 mt-3">
                      <div className="text-sm font-medium text-foreground flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div>{t('searchConfig.hybrid.semantic')}</div>
                          <div className="text-muted-foreground">
                            {embeddingWeight.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <div>{t('searchConfig.hybrid.fulltext')}</div>
                          <div className="text-muted-foreground">
                            {(1 - Number(embeddingWeight)).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <Slider
                        value={[embeddingWeight]}
                        onChange={(val) => {
                          setKnowledgeSearchParams((prev) => {
                            return {
                              ...prev,
                              embedding_weight: Number(val[0] || 0),
                            };
                          });
                        }}
                        min={0.1}
                        max={0.9}
                        step={0.01}
                        trackClassName="h-1 bg-[#F7548D]"
                        rangeClassName="bg-primary"
                        thumbClassName={cn(
                          'w-auto h-auto border-0 bg-transparent rounded-none shadow-none',
                        )}
                        thumbChildren={
                          <div className="absolute top-1.5 left-1/2 -translate-x-1/2">
                            <SliderBlockIcon className="w-[19px]" />
                          </div>
                        }
                      />
                    </div>
                  ) : null}
                </>
              ),
              className: cn(
                'px-3 py-2.5 rounded-[6px] border w-full',
                search_mode === item?.key
                  ? 'bg-primary/5 border-primary'
                  : 'bg-background border-border',
              ),
            };
          })}
          optionClassName="w-full"
          labelClassName="flex-1"
          value={knowledgeSearchParams?.search_mode}
          onChange={(value) => {
            setKnowledgeSearchParams((prev) => {
              return {
                ...prev,
                search_mode:
                  value as (typeof knowledgeSearchParams)['search_mode'],
              };
            });
          }}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="text-sm font-medium text-foreground">
                {t('searchConfig.rerank.title')}
              </div>

              <HelpPopover content={t('searchConfig.rerank.desc')} />
            </div>

            <Switch
              checked={rerankEnabled}
              onCheckedChange={(checked) => {
                setKnowledgeSearchParams((prev) => {
                  return {
                    ...prev,
                    using_re_rank: Boolean(checked),
                  };
                });
              }}
            />
          </div>

          <Activity mode={rerankEnabled ? 'visible' : 'hidden'}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-foreground">
                {t('searchConfig.rerank.weight')}
              </div>

              <div className="flex items-center justify-end gap-5 w-100">
                <Slider
                  value={[knowledgeSearchParams?.rerank_weight || 0.1]}
                  onChange={(val) => {
                    setKnowledgeSearchParams((prev) => {
                      return {
                        ...prev,
                        rerank_weight: Number(val[0] || 0.1),
                      };
                    });
                  }}
                  min={0.1}
                  max={1}
                  step={0.01}
                  className="flex-1"
                  marks={generateMarks(0.1, 1, 6)}
                  trackClassName="h-1 bg-[#F7F8FA]"
                  thumbClassName="bg-primary w-[14px] h-[14px] border-0 ring-6 ring-primary/10"
                  showMarkDot
                />

                <InputNumber
                  className="w-[88px]"
                  min={0.1}
                  max={1}
                  step={0.01}
                  precision={2}
                  value={knowledgeSearchParams?.rerank_weight || 0.1}
                  onChange={(value) => {
                    const val = value;
                    setKnowledgeSearchParams((prev) => {
                      return {
                        ...prev,
                        rerank_weight: Number(val),
                      };
                    });
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-foreground">
                {t('searchConfig.rerank.model')}
              </div>

              <AiModelSelect
                modelParams={{
                  type: '4',
                }}
                className="w-100"
                value={Number(knowledgeSearchParams?.rerank_model)}
                onChange={(val: number | undefined) => {
                  setKnowledgeSearchParams((prev) => {
                    return {
                      ...prev,
                      rerank_model: String(val ?? ''),
                    };
                  });
                }}
                fallbackToFirstWhenInvalid
              />
            </div>
          </Activity>
        </div>
      </div>
    );
  };

  const renderFilterTab = () => {
    return (
      <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="text-sm font-medium text-foreground">
              {t('searchConfig.filter.quote')}
            </div>

            <HelpPopover content={t('searchConfig.token.limit')} />
          </div>

          <div className="flex items-center justify-end gap-5 w-100">
            <Slider
              value={[knowledgeSearchParams?.limit || 100]}
              onChange={(val) => {
                setKnowledgeSearchParams((prev) => {
                  return {
                    ...prev,
                    limit: Number(val[0] || 100),
                  };
                });
              }}
              min={100}
              max={20000}
              step={300}
              className="flex-1"
              marks={generateMarks(100, 20000, 6)}
              trackClassName="h-1 bg-[#F7F8FA]"
              thumbClassName="bg-primary w-[14px] h-[14px] border-0 ring-6 ring-primary/10"
              showMarkDot
            />

            <InputNumber
              className="w-25"
              min={100}
              max={20000}
              step={300}
              precision={0}
              value={knowledgeSearchParams?.limit || 100}
              onChange={(value) => {
                const val = value;
                setKnowledgeSearchParams((prev) => {
                  return {
                    ...prev,
                    limit: Number(val),
                  };
                });
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="text-sm font-medium text-foreground">
              {t('searchConfig.filter.minRel')}
            </div>

            <HelpPopover content={t('searchConfig.similarity.desc')} />
          </div>

          <div className="flex items-center justify-end gap-5 w-100">
            <Slider
              value={[knowledgeSearchParams?.similarity ?? 0]}
              onChange={(val) => {
                setKnowledgeSearchParams((prev) => {
                  return {
                    ...prev,
                    similarity: Number(val?.[0] ?? 0),
                  };
                });
              }}
              min={0}
              max={1}
              step={0.01}
              className="flex-1"
              marks={generateMarks(0, 1, 6)}
              trackClassName="h-1 bg-[#F7F8FA]"
              thumbClassName="bg-primary w-[14px] h-[14px] border-0 ring-6 ring-primary/10"
              showMarkDot
            />

            <InputNumber
              className="w-25"
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={knowledgeSearchParams?.similarity ?? 0}
              onChange={(value) => {
                const val = value;
                setKnowledgeSearchParams((prev) => {
                  return {
                    ...prev,
                    similarity: Number(val),
                  };
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderQoptTab = () => {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {t('searchConfig.qopt.desc')}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {t('searchConfig.qopt.switch')}
          </div>

          <Switch
            checked={questionOptimizeEnabled}
            onCheckedChange={(checked) => {
              setKnowledgeSearchParams((prev) => {
                return {
                  ...prev,
                  dataset_search_using_extension_query: Boolean(checked),
                };
              });
            }}
          />
        </div>

        <Activity mode={questionOptimizeEnabled ? 'visible' : 'hidden'}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">
              {t('searchConfig.ai.model')}
            </div>

            <AiModelSelect
              modelParams={{
                type: '1',
              }}
              className="w-100"
              value={
                Number(knowledgeSearchParams?.dataset_search_extension_model) ||
                undefined
              }
              onChange={(val: number | undefined) => {
                setKnowledgeSearchParams((prev) => {
                  return {
                    ...prev,
                    dataset_search_extension_model: Number(val) || null,
                  };
                });
              }}
              fallbackToFirstWhenInvalid
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <div className="text-sm font-medium text-foreground">
                {t('searchConfig.desc')}
              </div>

              <HelpPopover content={t('searchConfig.desc.tooltip')} />
            </div>

            <EnhancedTextarea
              value={knowledgeSearchParams?.dataset_search_extension_bg || ''}
              onChange={(e) => {
                setKnowledgeSearchParams((prev) => {
                  return {
                    ...prev,
                    dataset_search_extension_bg: String(e?.target?.value || ''),
                  };
                });
              }}
              placeholder={t('searchConfig.desc.placeholder')}
              className="min-h-40"
            />
          </div>
        </Activity>
      </div>
    );
  };

  const onCancel = () => {
    modal.resolve(null);
    modal.hide();
  };

  const onOk = async () => {
    if (!isolated) {
      setKbSearchConfigParams(knowledgeSearchParams);
    }
    modal.resolve(knowledgeSearchParams);
    modal.hide();
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={t('searchConfig.title')}
      onCancel={onCancel}
      onOk={onOk}
      classNames={{
        content: 'w-[590px] max-w-none h-[80vh]',
        body: 'flex flex-col min-h-0 flex-1',
      }}
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
        onChange={(key) => setActiveTab(key as IActiveTab)}
        items={[
          {
            key: 'searchMode',
            label: t('searchConfig.tab.method'),
            children: renderMethodTab(),
          },
          {
            key: 'limit',
            label: t('searchConfig.tab.filter'),
            children: renderFilterTab(),
          },
          {
            key: 'queryExtension',
            label: t('searchConfig.tab.qopt'),
            children: renderQoptTab(),
          },
        ]}
        listClassName="h-12 p-[5px] w-fit"
        contentClassName="min-h-50 flex flex-col flex-1 overflow-y-auto"
        className="flex-1 min-h-0 flex flex-col"
      />
    </Modal>
  );
};

const SearchConfigDialogModal = NiceModal.create(SearchConfigDialog);

export const openSearchConfigDialog = (options?: SearchConfigDialogOptions) => {
  return NiceModal.show(
    SearchConfigDialogModal,
    options,
  ) as Promise<SearchConfigDialogResult>;
};

export default SearchConfigDialogModal;
