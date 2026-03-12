import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  EnhancedInput as Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  EnhancedButton,
} from '@teamhelper/ui';
import { PageHeader } from '@/components/PageHeader.tsx';
import { saveKnowledgeBasesDatasetApi } from '../KnowledgeDetail/server';
import {
  KnowledgeBaseUploadDragger,
  type IFileObjectKeys,
} from '@/components/knowledgeBase/KnowledgeBaseUploadDragger';

const KnowledgeImageDataset: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('knowledge');
  const [searchParams] = useSearchParams();
  const [dataTotal, setDataTotal] = useState<number>(0);
  const [uploadedTotal, setUploadedTotal] = useState<number>(0);
  const [fileObjectKeys, setFileObjectKeys] = useState<
    Partial<IFileObjectKeys>[]
  >([]);

  const knowledgeBaseId = useMemo(() => {
    const id = searchParams?.get?.('knowledgeBaseId');
    return Number(id) || null;
  }, [searchParams]);

  const knowledgeDatasetParentId = useMemo(() => {
    const id = searchParams?.get?.('parentId');
    return Number(id) || null;
  }, [searchParams]);

  const formSchema = z.object({
    name: z.string().min(1, t('common.placeholder')),
    files: z
      .array(z.instanceof(File))
      .min(1, t('imageDataset.upload.required')),
  });
  type IFormSchema = z.infer<typeof formSchema>;

  const form = useForm<IFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      files: [],
    },
    mode: 'onChange',
  });

  const handleUploadChange = useCallback((keys: Partial<IFileObjectKeys>[]) => {
    setUploadedTotal(keys.length);
    setFileObjectKeys(keys);
  }, []);

  const onSubmit = async (params: IFormSchema) => {
    const file_object_key = fileObjectKeys
      .map((item) => item?.fileKey)
      .filter(Boolean)
      .join(';');

    const result = await saveKnowledgeBasesDatasetApi({
      knowledge_base_id: knowledgeBaseId,
      parent_id: knowledgeDatasetParentId,
      dataset_type: 2,
      files: [
        {
          name: params?.name,
          object_key: file_object_key,
        },
      ],
    });

    if (!result) return;

    navigate(-1);
  };

  return (
    <div className="w-full bg-card p-5 flex flex-col">
      <PageHeader
        subTitle={t('imageDataset.exit')}
        classNames={{
          box: 'p-0 pb-7',
          subTitleBox: 'text-primary hover:text-primary/80',
        }}
      />

      <div className="w-[592px] mx-auto flex-1 min-h-0 overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel>
                    <span className="text-red-500">*</span>
                    {t('imageDataset.name.label')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('imageDataset.name.placeholder')}
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="files"
              render={() => (
                <FormItem>
                  <FormLabel>
                    <span className="text-red-500">*</span>
                    {t('imageDataset.upload.label')}
                  </FormLabel>
                  <FormControl>
                    <KnowledgeBaseUploadDragger
                      type="knowledge"
                      onChange={(files) => {
                        setDataTotal(files?.length ?? 0);
                        form.setValue('files', files, { shouldValidate: true });
                      }}
                      onDeleteFileClick={(files) => {
                        setDataTotal(files?.length ?? 0);
                        form.setValue('files', files, { shouldValidate: true });
                      }}
                      onUploadChange={handleUploadChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-5 flex justify-end">
              <EnhancedButton
                type="primary"
                htmlType="submit"
                loading={dataTotal !== uploadedTotal}
              >
                {dataTotal
                  ? t('imageDataset.confirm', { count: dataTotal })
                  : t('imageDataset.confirmCreate')}
              </EnhancedButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default KnowledgeImageDataset;
