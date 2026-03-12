import React, { useEffect, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CirclePlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import {
  Modal,
  EnhancedTabs,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedTextarea,
  FormMessage,
  Form,
  EnhancedButton,
  type ModalProps,
} from '@teamhelper/ui';
import {
  knowledgeBasesDatasetsChunksApi,
  knowledgeDatasetsChunkImagesApi,
  knowledgeDatasetsChunkTextsApi,
  type IKnowledgeDatasetsChunkImagesParams,
  type IKnowledgeDatasetsChunkTextsParams,
} from '../server';
import { cloneDeep } from 'es-toolkit';
import { useRequest } from 'ahooks';
import type { IKnowledgeDatasetsDto } from '../../KnowledgeDetail/server';
import { useTranslation } from 'react-i18next';
import { KB_VECTOR_TYPE } from '@/constants/knowledgeBase';

type ITabMode = 'chunk' | 'qa';

export interface InsertDatasetDialogProps extends Pick<ModalProps, 'title'> {
  datasetId: number | null;
  chunk_id?: number | null;
  datasetType: IKnowledgeDatasetsDto['data_type'];
}

const InsertDatasetDialog: React.FC<InsertDatasetDialogProps> = ({
  title,
  datasetId,
  chunk_id,
  datasetType,
}) => {
  const modal = useModal();
  const { t } = useTranslation('knowledge');
  const [removeIds, setRemoveIds] = useState<number[]>([]);

  const indexSchema = z.object({
    id: z.string(),
    type: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
    value: z.string().min(1, t('insertDialog.index.placeholder')),
  });

  const formSchema = z.discriminatedUnion('chunkMode', [
    z.object({
      chunkMode: z.literal('chunk'),
      content: z.string().min(1, t('common.placeholder')),
      question: z.string().optional(),
      answer: z.string().optional(),
      indexes: z.array(indexSchema),
    }),
    z.object({
      chunkMode: z.literal('qa'),
      content: z.string().optional(),
      question: z.string().min(1, t('common.placeholder')),
      answer: z.string().min(1, t('common.placeholder')),
      indexes: z.array(indexSchema),
    }),
  ]);

  type IFormSchema = z.infer<typeof formSchema>;

  const form = useForm<IFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chunkMode: 'chunk',
      content: '',
      question: '',
      answer: '',
      indexes: [],
    },
    mode: 'onChange',
  });

  const { fields, prepend, remove } = useFieldArray({
    control: form.control,
    name: 'indexes',
  });

  const chunkMode = form.watch('chunkMode');

  const { data: kbDatasetsChunksInfo } = useRequest(
    () => {
      return knowledgeBasesDatasetsChunksApi(chunk_id ?? null);
    },
    {
      manual: false,
      ready: Boolean(chunk_id && modal?.visible),
      refreshDeps: [chunk_id, modal?.visible],
    },
  );

  useEffect(() => {
    if (modal?.visible && datasetType) {
      setRemoveIds([]);
      const mode = kbDatasetsChunksInfo?.mode;
      const vectors = kbDatasetsChunksInfo?.vectors || [];
      const indexes =
        vectors
          ?.map?.((item) => {
            return {
              id: String(item?.vector_id ?? ''),
              type: item?.type || 1,
              value: item?.content || '',
            };
          })
          ?.sort((a, b) => {
            return b?.type - a?.type;
          }) || [];

      let chunk_mode = 'chunk' as ITabMode;
      if (datasetType === 1) {
        chunk_mode = mode === 2 ? 'qa' : 'chunk';
      } else {
        chunk_mode = 'qa';
      }

      let q = '';
      switch (mode) {
        case 3:
          q = kbDatasetsChunksInfo?.image_preview_url || '';
          break;
        default:
          q = kbDatasetsChunksInfo?.question || '';
      }

      form.reset({
        chunkMode: chunk_mode,
        content: kbDatasetsChunksInfo?.content || '',
        question: q,
        answer: kbDatasetsChunksInfo?.answer || '',
        indexes,
      });
    }
  }, [kbDatasetsChunksInfo, modal?.visible, form, datasetType]);

  const onCancel = (result: boolean = false) => {
    modal.resolve(result);
    modal.hide();
  };

  const onSubmit = async (values: IFormSchema) => {
    const formValues = cloneDeep(values || {}) as Record<string, any>;
    delete formValues?.chunkMode;
    delete formValues?.indexes;

    const custom_vectors = values?.indexes
      ?.filter?.((item) => item?.type > 1 && item?.value)
      .map((item) => {
        return {
          id: item?.id?.includes?.('index-') ? null : Number(item?.id),
          content: item?.value || '',
        };
      });

    let result = false;
    if (datasetType === 1) {
      result = await knowledgeDatasetsChunkTextsApi(datasetId, {
        chunk_id: chunk_id ?? null,
        process_mode: values?.chunkMode === 'chunk' ? 1 : 2,
        custom_vectors,
        remove_ids: removeIds,
        ...formValues,
      } as IKnowledgeDatasetsChunkTextsParams);
    } else {
      result = await knowledgeDatasetsChunkImagesApi(datasetId, {
        chunk_id: chunk_id ?? null,
        image_desc: values?.answer || '',
        custom_vectors,
        remove_ids: removeIds,
      } as IKnowledgeDatasetsChunkImagesParams);
    }

    if (!result) return Promise.reject();

    onCancel(true);
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={title}
      onCancel={onCancel}
      onOkBeforeFunction={() => form.trigger()}
      onOk={async () => onSubmit(form.getValues() as IFormSchema)}
      classNames={{
        content: 'w-[90vw] max-w-[1024px] h-[90vh]',
        body: 'flex flex-col flex-1 min-h-0',
      }}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            modal.remove();
          }, 360);
        }
      }}
    >
      {datasetType === 1 ? (
        <EnhancedTabs
          type="card"
          activeKey={chunkMode}
          onChange={(key) => {
            const mode = key as ITabMode;
            if (mode === 'qa') {
              form.setValue('question', form.getValues('content'));
            } else {
              form.setValue('content', form.getValues('question'));
            }
            form.setValue('chunkMode', mode);
          }}
          items={[
            { key: 'chunk', label: t('insertDialog.mode.chunk') },
            { key: 'qa', label: t('insertDialog.mode.qa') },
          ]}
          listClassName="h-12 p-[5px] w-fit"
          triggerClassName="focus-visible:ring-0 focus-visible:ring-offset-0"
          className="mb-7"
        />
      ) : null}

      <Form {...form}>
        <form className="flex gap-4 flex-1 min-h-0">
          {/* 左侧内容区 */}
          <div className="w-[354px] shrink-0 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
            {datasetType === 1 ? (
              <>
                {chunkMode === 'chunk' ? (
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-h-0 flex flex-col">
                        <FormLabel className="text-sm font-medium">
                          {t('insertDialog.content')}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <EnhancedTextarea
                            placeholder={t('common.placeholder')}
                            className="h-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {chunkMode === 'qa' ? (
                  <>
                    <FormField
                      control={form.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem className="flex-1 min-h-0 flex flex-col">
                          <FormLabel className="text-sm font-medium">
                            {t('insertDialog.question')}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <EnhancedTextarea
                              placeholder={t('common.placeholder')}
                              className="h-full"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem className="flex-1 min-h-0 flex flex-col">
                          <FormLabel className="text-sm font-medium">
                            {t('insertDialog.answer')}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <EnhancedTextarea
                              placeholder={t('common.placeholder')}
                              className="h-full"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : null}
              </>
            ) : null}

            {datasetType === 2 ? (
              <>
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-h-0 flex flex-col">
                      <FormLabel className="text-sm font-medium">
                        {t('insertDialog.image')}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="min-h-20 flex-1 flex flex-col justify-center">
                          {field?.value ? (
                            <img
                              src={field?.value || ''}
                              className="object-contain cursor-pointer h-full"
                              draggable={false}
                              onClick={() => {
                                const src = field?.value || '';
                                if (!src) return;

                                window.open(src, '_blank');
                              }}
                            />
                          ) : null}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-h-0 flex flex-col">
                      <FormLabel className="text-sm font-medium">
                        {t('insertDialog.imageDesc')}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <EnhancedTextarea
                          placeholder={t('common.placeholder')}
                          className="h-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}
          </div>

          {/* 右侧索引区 */}
          <div className="flex flex-col flex-1 min-h-0 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium flex items-center gap-1">
                <div className="text-foreground">
                  {t('insertDialog.dataIndex')}
                </div>

                <div className="text-muted-foreground">({fields.length})</div>
              </div>

              <EnhancedButton
                type="link"
                size="small"
                className="h-auto"
                onClick={() => {
                  prepend({
                    id: `index-${Date.now()}`,
                    type: 2,
                    value: '',
                  });
                }}
              >
                <CirclePlus />
                {t('common.add')}
              </EnhancedButton>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
              {fields.map((field, index) => {
                return (
                  <div
                    key={field.id}
                    className={cn(
                      'border border-border rounded-lg px-3 py-2.5',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-foreground font-medium">
                        {KB_VECTOR_TYPE?.[field?.type] || '-'}
                      </div>

                      {field?.type > 1 ? (
                        <EnhancedButton
                          className={cn(
                            'border-0 shadow-none text-destructive bg-transparent',
                            'hover:text-destructive/70 hover:bg-transparent',
                            'py-0! h-auto',
                          )}
                          size="small"
                          onClick={() => {
                            const currentIds = form.getValues('indexes') || [];
                            const item = currentIds[index];
                            if (
                              item?.id &&
                              !String(item.id).startsWith('index-')
                            ) {
                              setRemoveIds((prev) => [
                                ...prev,
                                Number(item.id),
                              ]);
                            }
                            remove(index);
                          }}
                        >
                          <Trash2 />
                        </EnhancedButton>
                      ) : null}
                    </div>

                    <FormField
                      control={form.control}
                      name={`indexes.${index}.value`}
                      disabled={field?.type === 1}
                      render={({ field: fieldProps }) => (
                        <FormItem>
                          <FormControl>
                            <EnhancedTextarea
                              placeholder={t('insertDialog.index.placeholder')}
                              className="text-xs! placeholder:text-xs h-44"
                              {...fieldProps}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Form>
    </Modal>
  );
};

const InsertDatasetModal = NiceModal.create(InsertDatasetDialog);

export const openInsertDatasetDialog = (
  options?: InsertDatasetDialogProps,
): Promise<boolean> => {
  return NiceModal.show(InsertDatasetModal, { ...options });
};

export default InsertDatasetModal;
