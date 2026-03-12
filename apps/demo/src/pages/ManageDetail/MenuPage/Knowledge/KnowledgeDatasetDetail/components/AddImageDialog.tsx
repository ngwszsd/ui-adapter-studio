import React, { useCallback, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  message,
  Modal,
} from '@teamhelper/ui';
import {
  KnowledgeBaseUploadDragger,
  type IFileObjectKeys,
} from '@/components/knowledgeBase/KnowledgeBaseUploadDragger';
import { knowledgeDatasetsChunkImagesApi } from '../server';
import { useTranslation } from 'react-i18next';

export interface IAddImageDialogProps {
  datasetId: number | null;
}

const AddImageDialog: React.FC<IAddImageDialogProps> = ({ datasetId }) => {
  const modal = useModal();
  const [fileObjectKeys, setFileObjectKeys] = useState<
    Array<Partial<IFileObjectKeys>>
  >([]);
  const { t } = useTranslation('knowledge');
  const [dataTotal, setDataTotal] = useState<number>(0);

  const formSchema = z.object({
    files: z
      .array(z.instanceof(File))
      .min(1, t('imageDataset.upload.required')),
  });
  type IFormSchema = z.infer<typeof formSchema>;

  const form = useForm<IFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
    },
    mode: 'onChange',
  });

  const onCancel = (result: boolean = false) => {
    modal.resolve(result);
    modal.hide();
  };

  const onSubmit = async () => {
    if (fileObjectKeys?.length !== dataTotal) {
      message.warning(t('imageDataset.upload.uploading'));
      return Promise.reject();
    }
    const file_object_key = fileObjectKeys
      .map((item) => String(item?.fileKey || ''))
      .filter(Boolean);

    const result = await knowledgeDatasetsChunkImagesApi(datasetId, {
      chunk_id: null,
      images: file_object_key,
    });
    if (!result) return Promise.reject();

    onCancel(true);
  };

  const handleUploadChange = useCallback((keys: Partial<IFileObjectKeys>[]) => {
    setFileObjectKeys(keys);
  }, []);

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={t('datasetDetail.addImageDialog.title')}
      onCancel={onCancel}
      onOkBeforeFunction={() => form.trigger()}
      onOk={async () => onSubmit()}
      classNames={{
        content: 'w-[530px] max-w-none',
      }}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            modal.remove();
          }, 360);
        }
      }}
    >
      <Form {...form}>
        <form>
          <FormField
            control={form.control}
            name="files"
            render={() => (
              <FormItem>
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
        </form>
      </Form>
    </Modal>
  );
};

const AddImageModal = NiceModal.create(AddImageDialog);

export const openAddImageDialog = (
  options?: IAddImageDialogProps,
): Promise<boolean> => {
  return NiceModal.show(AddImageModal, { ...options });
};

export default AddImageModal;
