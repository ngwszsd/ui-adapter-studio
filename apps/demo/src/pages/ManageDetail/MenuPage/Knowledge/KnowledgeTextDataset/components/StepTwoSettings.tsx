import React, { useEffect, useMemo } from 'react';
import { SquarePen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CollapsePanel, useCollapseState } from '@/components/Collapse';
import {
  EnhancedInput,
  EnhancedRadioGroup,
  EnhancedCheckbox,
  EnhancedSelect,
  EnhancedCheckboxGroup,
  EnhancedButton,
  InputNumber,
  EnhancedTextarea,
} from '@teamhelper/ui';
import { HelpPopover } from '@/components/common/HelpPopover';
import type { IDatasetConfig } from '../../KnowledgeDetail/server';
import { cn } from '@/lib/utils';
import {
  useKnowledgeTextDatasetStore,
  type IKnowledgeTextDatasetFileRow,
} from '../knowledgeTextDatasetStore';
import { useRequest } from 'ahooks';
import {
  getKnowledgeDatasetFileApi,
  knowledgeDatasetTrainingConfigApi,
} from '../server';
import { useSearchParams } from 'react-router';
import {
  PDF_HANDLE_TYPE,
  PDF_HANDLE_TYPE_LIST,
  Prompt_AgentQA,
} from '@/constants/knowledgeBase';
import { openCustomPromptModal } from './CustomPromptModal';

interface StepTwoSettingsProps {
  isShow: boolean;
  handleNext: () => void;
}

const StepTwoSettings: React.FC<StepTwoSettingsProps> = ({
  isShow = true,
  handleNext,
}) => {
  const [searchParams] = useSearchParams();
  const { setDatasetParamsConfig, setFileRows } =
    useKnowledgeTextDatasetStore();
  const [datasetConfig, setDatasetConfig] = React.useState<
    Partial<IDatasetConfig>
  >({
    pdf_handle_type: 300,
    process_mode: 1,
    split_condition_type: 1,
    split_condition_length: 1000,
    process_strategy: 1,
    custom_chunk_mode: 1,
    paragraph_max_depth: 5,
    paragraph_max_chunk_size: 1000,
    paragraph_model_paragraph_detect: 2,
    paragraph_index_size: 512,
    length_index_size: 512,
    separator_index_size: 512,
    length_chunk_size: 1000,
    separator_separator_type: 1,
    separator_custom_separator: '',
    paragraph_qa_prompt: Prompt_AgentQA?.description,
    length_qa_prompt: Prompt_AgentQA?.description,
    separator_qa_prompt: Prompt_AgentQA?.description,
  });
  const { t } = useTranslation('knowledge');
  const { isOpen, togglePanel } = useCollapseState([
    'parser',
    'process',
    'chunk',
  ]);

  const datasetId = useMemo(() => {
    const n = searchParams?.get?.('datasetId');
    return Number(n);
  }, [searchParams]);

  const kbSource = useMemo(() => {
    const source = searchParams?.get?.('source');
    return source as 'adjust';
  }, [searchParams]);

  useRequest(
    () => {
      return knowledgeDatasetTrainingConfigApi(datasetId);
    },
    {
      manual: false,
      ready: Boolean(datasetId && kbSource === 'adjust'),
      refreshDeps: [datasetId, kbSource],
      onSuccess: (result) => {
        setDatasetConfig(result || {});
      },
    },
  );

  const { data: datasetFileInfo } = useRequest(
    () => {
      return getKnowledgeDatasetFileApi(datasetId);
    },
    {
      manual: false,
      ready: Boolean(isShow && datasetId && kbSource === 'adjust'),
      refreshDeps: [datasetId, isShow, kbSource],
    },
  );

  useEffect(() => {
    if (isShow) {
      const fileName = datasetFileInfo?.file_name || '';
      if (fileName) {
        setFileRows([
          {
            id: `${Date.now()}`,
            file: {
              name: fileName,
            },
            progress: 100,
            sizeText: '',
            status: 'done',
            file_object_key: datasetFileInfo?.file_object_key || '',
          } as IKnowledgeTextDatasetFileRow,
        ]);
      }
    }
  }, [datasetFileInfo, setFileRows, isShow]);

  const indexEnhancementValue = useMemo(() => {
    const list = [];
    if (datasetConfig?.index_add_title) {
      list.push(0);
    }

    if (datasetConfig?.index_auto_fill) {
      list.push(1);
    }

    if (datasetConfig?.index_auto_image) {
      list.push(2);
    }

    return list;
  }, [datasetConfig]);

  return (
    <div
      className={cn(
        'space-y-4 w-[666px] mx-auto flex-1 flex-col min-h-0',
        isShow ? 'flex' : 'hidden',
      )}
    >
      <div className="flex-1 overflow-y-auto">
        {/* 文件解析设置 */}
        <CollapsePanel
          title={t('textDataset.settings.parser')}
          isOpen={isOpen('parser')}
          onToggle={() => togglePanel('parser')}
          className="border-0 border-b border-border pb-3 mb-2"
          headerClassName="hover:bg-transparent"
          childrenClassName="overflow-y-visible max-h-auto"
        >
          <div className="border border-border p-3 rounded-[6px] space-y-7">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1 text-sm text-foreground">
                <div>{t('textDataset.settings.pdf')}</div>
                <HelpPopover content={t('textDataset.settings.pdf.help')} />
              </div>
              <div className="flex items-center gap-5">
                <EnhancedSelect
                  options={PDF_HANDLE_TYPE_LIST.map((item) => ({
                    label: item?.label,
                    value: item?.key,
                  }))}
                  value={datasetConfig?.pdf_handle_type}
                  onChange={(value) => {
                    setDatasetConfig((prev) => {
                      return {
                        ...prev,
                        pdf_handle_type:
                          value as IDatasetConfig['pdf_handle_type'],
                      };
                    });
                  }}
                  placeholder={t('textDataset.settings.select')}
                  searchable={false}
                  allowClear={false}
                  showCheck={false}
                  listHeight="auto"
                />
              </div>
            </div>
          </div>
        </CollapsePanel>

        {/* 数据处理方式设置 */}
        <CollapsePanel
          title={t('textDataset.settings.process')}
          isOpen={isOpen('process')}
          onToggle={() => togglePanel('process')}
          className="border-none mb-0"
          headerClassName="hover:bg-transparent pb-4"
          contentClassName="max-h-auto"
          childrenClassName="overflow-y-visible max-h-auto"
        >
          <div className="space-y-7">
            {/* 处理方式 */}
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-sm">
                {t('textDataset.settings.method')}
              </div>

              <div className="flex items-center gap-5">
                <EnhancedRadioGroup
                  options={[
                    {
                      label: (
                        <div className="flex items-center gap-1">
                          {t('textDataset.settings.chunk')}
                          <HelpPopover
                            content={t('textDataset.settings.chunk.help')}
                          />
                        </div>
                      ),
                      value: '1',
                      className: 'flex-1',
                    },
                    {
                      label: (
                        <div className="flex items-center gap-1">
                          {t('textDataset.settings.qa')}
                          <HelpPopover
                            content={t('textDataset.settings.qa.help')}
                          />
                        </div>
                      ),
                      value: '2',
                      className: 'flex-1',
                    },
                  ]}
                  value={String(datasetConfig?.process_mode)}
                  onChange={(value) => {
                    setDatasetConfig((prev) => {
                      return {
                        ...prev,
                        process_mode: Number(
                          value,
                        ) as IDatasetConfig['process_mode'],
                      };
                    });
                  }}
                  className="w-full"
                  name="kw_process_mode"
                />
              </div>
            </div>

            {/* 分块条件 */}
            {datasetConfig?.process_mode === 1 ? (
              <div className="flex flex-col gap-3">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  {t('textDataset.settings.condition')}
                  <HelpPopover
                    content={t('textDataset.settings.condition.help')}
                  />
                </div>

                <div className="flex items-center gap-5">
                  <EnhancedSelect
                    options={[
                      { label: t('textDataset.settings.gt'), value: 1 },
                      {
                        label: t('textDataset.settings.gt.context'),
                        value: 2,
                      },
                      {
                        label: t('textDataset.settings.forceChunk'),
                        value: 3,
                      },
                    ]}
                    value={datasetConfig?.split_condition_type}
                    onChange={(value) => {
                      setDatasetConfig((prev) => {
                        return {
                          ...prev,
                          split_condition_type: value,
                        };
                      });
                    }}
                    placeholder={t('textDataset.settings.select')}
                    searchable={false}
                    allowClear={false}
                    showCheck={false}
                    listHeight="auto"
                    className="flex-2"
                  />

                  {datasetConfig?.split_condition_type === 1 ? (
                    <InputNumber
                      className="flex-1"
                      min={100}
                      max={100000}
                      step={100}
                      precision={0}
                      value={datasetConfig?.split_condition_length}
                      onChange={(value) => {
                        const val = value;
                        setDatasetConfig((prev) => {
                          return {
                            ...prev,
                            split_condition_length:
                              val as IDatasetConfig['split_condition_length'],
                          };
                        });
                      }}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* 索引增强 */}
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-sm">
                {t('textDataset.settings.index')}
              </div>

              <div className="flex items-center gap-8">
                <EnhancedCheckboxGroup
                  options={[
                    {
                      label: (
                        <div className="flex items-center gap-1">
                          {t('textDataset.settings.index.title')}
                          <HelpPopover
                            content={t('textDataset.settings.index.title.help')}
                          />
                        </div>
                      ),
                      value: 0,
                    },
                    {
                      label: (
                        <div className="flex items-center gap-1">
                          {t('textDataset.settings.index.auto')}
                          <HelpPopover
                            content={t('textDataset.settings.index.auto.help')}
                          />
                        </div>
                      ),
                      value: 1,
                    },
                    {
                      label: (
                        <div className="flex items-center gap-1">
                          {t('textDataset.settings.index.image')}
                          <HelpPopover
                            content={t('textDataset.settings.index.image.help')}
                          />
                        </div>
                      ),
                      value: 2,
                    },
                  ].filter((item) => {
                    if (datasetConfig?.process_mode === 2) {
                      return [0].includes(item?.value);
                    }

                    return true;
                  })}
                  value={indexEnhancementValue}
                  onChange={(value) => {
                    setDatasetConfig((prev) => {
                      return {
                        ...prev,
                        index_add_title: value.includes(0),
                        index_auto_fill: value.includes(1),
                        index_auto_image: value.includes(2),
                      };
                    });
                  }}
                  gap={32}
                />
              </div>
            </div>

            {/* 分块处理参数 */}
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-sm">
                {t('textDataset.settings.params')}
              </div>

              <EnhancedRadioGroup
                options={[
                  {
                    label: (
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {t('textDataset.settings.default')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('textDataset.settings.default.desc')}
                        </div>
                      </div>
                    ),
                    value: '1',
                    className:
                      'flex items-center gap-3 px-3 py-[10px] rounded-[6px] border border-border w-full',
                  },
                  {
                    label: (
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {t('textDataset.settings.custom')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('textDataset.settings.custom.desc')}
                        </div>
                      </div>
                    ),
                    value: '2',
                    className:
                      'flex items-center gap-3 px-3 py-[10px] rounded-[6px] border border-border w-full',
                  },
                ]}
                direction="vertical"
                value={String(datasetConfig?.process_strategy)}
                onChange={(value) => {
                  setDatasetConfig((prev) => {
                    return {
                      ...prev,
                      process_strategy: Number(
                        value,
                      ) as IDatasetConfig['process_strategy'],
                    };
                  });
                }}
                name="kw_process_strategy"
              />

              {datasetConfig?.process_strategy === 2 ? (
                <div className="px-3 space-y-5 mt-1">
                  <EnhancedRadioGroup
                    options={[
                      {
                        label: (
                          <span className="flex items-center gap-1">
                            {t('textDataset.settings.byParagraph')}
                            <HelpPopover
                              content={t(
                                'textDataset.settings.byParagraph.help',
                              )}
                            />
                          </span>
                        ),
                        value: '1',
                      },
                      {
                        label: (
                          <span className="flex items-center gap-1">
                            {t('textDataset.settings.byLength')}
                          </span>
                        ),
                        value: '2',
                      },
                      {
                        label: (
                          <span className="flex items-center gap-1">
                            {t('textDataset.settings.bySeparator')}
                            <HelpPopover
                              content={t(
                                'textDataset.settings.bySeparator.help',
                              )}
                            />
                          </span>
                        ),
                        value: '3',
                      },
                    ]}
                    value={String(datasetConfig?.custom_chunk_mode)}
                    onChange={(value) => {
                      setDatasetConfig((prev) => {
                        return {
                          ...prev,
                          custom_chunk_mode: Number(
                            value,
                          ) as IDatasetConfig['custom_chunk_mode'],
                        };
                      });
                    }}
                    name="kw_custom_chunk_mode"
                    className="gap-8"
                  />

                  <div className="space-y-3">
                    {datasetConfig?.custom_chunk_mode === 1 ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-muted-foreground text-sm">
                          {t('textDataset.settings.model')}
                        </div>

                        <EnhancedSelect
                          options={[
                            {
                              label: t('textDataset.settings.auto'),
                              value: 1,
                            },
                            {
                              label: t('textDataset.settings.disabled'),
                              value: 2,
                            },
                            {
                              label: t('textDataset.settings.force'),
                              value: 3,
                            },
                          ]}
                          value={
                            datasetConfig?.paragraph_model_paragraph_detect
                          }
                          onChange={(value) => {
                            setDatasetConfig((prev) => {
                              return {
                                ...prev,
                                paragraph_model_paragraph_detect: value,
                              };
                            });
                          }}
                          placeholder={t('textDataset.settings.select')}
                          renderLabel={(option) => {
                            const value = option?.value;
                            const labelInfo = {
                              1: {
                                title: t('textDataset.settings.auto'),
                                des: t('textDataset.settings.auto.desc'),
                              },
                              2: {
                                title: t('textDataset.settings.disabled'),
                                des: t('textDataset.settings.disabled.desc'),
                              },
                              3: {
                                title: t('textDataset.settings.force'),
                                des: t('textDataset.settings.force.desc'),
                              },
                            }[value];
                            if (!labelInfo) return null;

                            return (
                              <div>
                                {labelInfo?.title ? (
                                  <div className="text-sm text-foreground">
                                    {labelInfo?.title}
                                  </div>
                                ) : null}
                                {labelInfo?.des ? (
                                  <div className="text-sm text-muted-foreground font-normal">
                                    {labelInfo?.des}
                                  </div>
                                ) : null}
                              </div>
                            );
                          }}
                          searchable={false}
                          allowClear={false}
                          showCheck={false}
                          listHeight="auto"
                        />
                      </div>
                    ) : null}

                    {datasetConfig?.custom_chunk_mode === 1 ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-muted-foreground text-sm">
                          {t('textDataset.settings.maxDepth')}
                        </div>

                        <InputNumber
                          min={1}
                          max={8}
                          precision={0}
                          value={datasetConfig?.paragraph_max_depth}
                          onChange={(value) => {
                            const val = value;
                            setDatasetConfig((prev) => {
                              return {
                                ...prev,
                                paragraph_max_depth:
                                  val as IDatasetConfig['paragraph_max_depth'],
                              };
                            });
                          }}
                        />
                      </div>
                    ) : null}

                    {datasetConfig?.custom_chunk_mode === 1 ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-muted-foreground text-sm">
                          {t('textDataset.settings.maxChunk')}
                        </div>

                        <InputNumber
                          min={64}
                          max={24000}
                          step={100}
                          precision={0}
                          value={datasetConfig?.paragraph_max_chunk_size}
                          onChange={(value) => {
                            const val = value;
                            setDatasetConfig((prev) => {
                              return {
                                ...prev,
                                paragraph_max_chunk_size:
                                  val as IDatasetConfig['paragraph_max_chunk_size'],
                              };
                            });
                          }}
                        />
                      </div>
                    ) : null}

                    {datasetConfig?.process_mode === 1 ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-muted-foreground text-sm flex items-center gap-1">
                          {t('textDataset.settings.indexSize')}
                          <HelpPopover
                            content={t('textDataset.settings.indexSize.help')}
                          />
                        </div>

                        <EnhancedSelect
                          options={[
                            { label: '64', value: 64 },
                            { label: '128', value: 128 },
                            { label: '256', value: 256 },
                            { label: '512', value: 512 },
                            { label: '1024', value: 1024 },
                            { label: '1536', value: 1536 },
                            { label: '2048', value: 2048 },
                            { label: '3072', value: 3072 },
                          ]}
                          value={datasetConfig?.paragraph_index_size}
                          onChange={(value) => {
                            setDatasetConfig((prev) => {
                              return {
                                ...prev,
                                paragraph_index_size: value,
                                length_index_size: value,
                                separator_index_size: value,
                              };
                            });
                          }}
                          placeholder={t('textDataset.settings.select')}
                          searchable={false}
                          allowClear={false}
                          showCheck={false}
                          listHeight="auto"
                        />
                      </div>
                    ) : null}

                    {datasetConfig?.custom_chunk_mode === 2 ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-muted-foreground text-sm">
                          {t('textDataset.settings.chunkSize')}
                        </div>

                        <InputNumber
                          min={64}
                          max={24000}
                          step={100}
                          precision={0}
                          value={datasetConfig?.length_chunk_size}
                          onChange={(value) => {
                            const val = value;
                            setDatasetConfig((prev) => {
                              return {
                                ...prev,
                                length_chunk_size:
                                  val as IDatasetConfig['length_chunk_size'],
                              };
                            });
                          }}
                        />
                      </div>
                    ) : null}

                    {datasetConfig?.custom_chunk_mode === 3 ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-muted-foreground text-sm">
                          {t('textDataset.settings.separator')}
                        </div>

                        <div className="flex items-center gap-3">
                          <EnhancedSelect
                            options={[
                              {
                                label: t('textDataset.settings.noSet'),
                                value: 1,
                              },
                              {
                                label: t('textDataset.settings.separator.1n'),
                                value: 2,
                              },
                              {
                                label: t('textDataset.settings.separator.2n'),
                                value: 3,
                              },
                              {
                                label: t(
                                  'textDataset.settings.separator.period',
                                ),
                                value: 4,
                              },
                              {
                                label: t(
                                  'textDataset.settings.separator.exclamation',
                                ),
                                value: 5,
                              },
                              {
                                label: t(
                                  'textDataset.settings.separator.question',
                                ),
                                value: 6,
                              },
                              {
                                label: t(
                                  'textDataset.settings.separator.semicolon',
                                ),
                                value: 7,
                              },
                              { label: '=====', value: 8 },
                              {
                                label: t('textDataset.settings.custom'),
                                value: 9,
                              },
                            ]}
                            value={datasetConfig?.separator_separator_type}
                            onChange={(value) => {
                              setDatasetConfig((prev) => {
                                return {
                                  ...prev,
                                  separator_separator_type: value,
                                };
                              });
                            }}
                            placeholder={t('textDataset.settings.select')}
                            searchable={false}
                            allowClear={false}
                            showCheck={false}
                            listHeight="auto"
                          />

                          {datasetConfig?.separator_separator_type === 9 ? (
                            <EnhancedInput
                              placeholder="\n;======;==SPLIT=="
                              value={datasetConfig?.separator_custom_separator}
                              onChange={(e) => {
                                const value = String(
                                  e?.target?.value || '',
                                ).trim();
                                setDatasetConfig((prev) => {
                                  return {
                                    ...prev,
                                    separator_custom_separator: value,
                                  };
                                });
                              }}
                            />
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {datasetConfig?.process_mode === 2 ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-muted-foreground text-sm">
                          {t('textDataset.settings.qaPrompt')}
                        </div>

                        <div className="relative group">
                          <div className="whitespace-pre-wrap leading-relaxed">
                            <EnhancedTextarea
                              rows={8}
                              readOnly
                              value={
                                datasetConfig?.paragraph_qa_prompt ||
                                Prompt_AgentQA?.description
                              }
                            />
                          </div>

                          <div
                            className={cn(
                              'absolute left-0 right-0 top-0 bottom-0',
                              'bg-white/50',
                              'hidden group-hover:block',
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <EnhancedButton
                              className="text-xs absolute right-3 bottom-3"
                              size="small"
                              onClick={async () => {
                                const result = await openCustomPromptModal({
                                  qaPromptValue:
                                    datasetConfig?.paragraph_qa_prompt ||
                                    Prompt_AgentQA?.description,
                                });

                                if (!result?.qa_prompt) return;

                                setDatasetConfig((prev) => {
                                  return {
                                    ...prev,
                                    paragraph_qa_prompt: result?.qa_prompt,
                                    length_qa_prompt: result?.qa_prompt,
                                    separator_qa_prompt: result?.qa_prompt,
                                  };
                                });
                              }}
                            >
                              <SquarePen className="w-3.5! h-3.5!" />
                              {t('textDataset.settings.customPrompt')}
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CollapsePanel>
      </div>

      <div className="flex justify-end">
        <EnhancedButton
          type="primary"
          onClick={() => {
            setDatasetParamsConfig({ ...datasetConfig });
            handleNext?.();
          }}
        >
          {t('textDataset.next.simple')}
        </EnhancedButton>
      </div>
    </div>
  );
};

export default StepTwoSettings;
