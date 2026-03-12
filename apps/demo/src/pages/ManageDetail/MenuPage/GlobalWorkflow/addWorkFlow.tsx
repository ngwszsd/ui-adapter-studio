import React from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { httpRequest } from '@/utils/request.ts';
import {
  Modal,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  EnhancedInput as Input,
  FormMessage,
  Form,
} from '@teamhelper/ui';

const addWorkflowSchema = z.object({
  name: z
    .string()
    .min(1, i18n.t('manageDetail:errors.globalWorkflow.name.required')),
});
type AddWorkflowFormData = z.infer<typeof addWorkflowSchema>;

type CreateWorkflowResult = {
  id: string;
  name: string;
};

type AddWorkFlowProps = {
  projectId?: number;
};

const createWorkflow = async (
  payload: AddWorkflowFormData,
  projectId?: number,
): Promise<CreateWorkflowResult> => {
  const dtoResult = await httpRequest.post<{
    id: string | number;
    name: string;
  }>({
    url: '/workflows',
    data: {
      name: payload.name.trim(),
      iconUrl: null,
      dslVersion: '1.0.0',
      projectId,
      data: {
        globalConfig: {
          variables: [],
        },
        nodes: [],
        edges: [],
      },
    },
  });

  const data = dtoResult?.data;
  if (!data?.id) {
    throw new Error('create_workflow_failed');
  }

  return {
    id: String(data.id),
    name: data.name,
  };
};

const AddWorkFlow: React.FC<AddWorkFlowProps> = ({ projectId }) => {
  const { t } = useTranslation('manageDetail');
  const modal = useModal();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // 上传集成到 form，不再使用本地文件/错误状态

  const form = useForm<AddWorkflowFormData>({
    resolver: zodResolver(addWorkflowSchema),
    defaultValues: { name: '' },
    mode: 'onChange',
  });

  const onCancel = () => {
    form.reset();
    modal.hide();
    modal.resolve(false);
  };

  const onSubmit = async (data: AddWorkflowFormData) => {
    try {
      setIsSubmitting(true);
      const created = await createWorkflow(data, projectId);
      modal.resolve(created);
      form.reset();
      modal.hide();
    } catch (error) {
      console.error('Create workflow failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        open={modal.visible}
        onOpenChange={(open) => !open && modal.hide()}
        title={t('globalWorkflow.add.title')}
        onCancelBeforeFunction={() => true}
        onCancel={onCancel}
        okText={t('globalWorkflow.add.ok')}
        onOkBeforeFunction={async () => {
          if (isSubmitting) return false;
          const valid = await form.trigger();
          return valid;
        }}
        onOk={form.handleSubmit(onSubmit)}
      >
        <Form {...form}>
          <form>
            {/* 工作流名称 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field, formState }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-sm font-medium">
                    {t('globalWorkflow.add.name.label')}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('globalWorkflow.add.name.placeholder')}
                      {...field}
                      className={
                        formState.errors.name ? 'border-destructive' : ''
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </Modal>
    </>
  );
};

const BaseWorkFlow = NiceModal.create(AddWorkFlow);
export const OpenAddWorkFlow = (
  options?: AddWorkFlowProps,
): Promise<CreateWorkflowResult | false> => {
  return NiceModal.show(BaseWorkFlow, { ...options });
};
