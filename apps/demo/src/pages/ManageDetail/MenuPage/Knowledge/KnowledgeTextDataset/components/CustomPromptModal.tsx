import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Modal,
  FormField,
  FormItem,
  FormControl,
  EnhancedTextarea,
  FormMessage,
  Form,
} from '@teamhelper/ui';
import { Prompt_AgentQA } from '@/constants/knowledgeBase';
import { useEffect } from 'react';

export interface CustomPromptModalProps {
  qaPromptValue?: string;
}

export interface CustomPromptModalResult {
  qa_prompt?: string;
}

function CustomPromptModal({ qaPromptValue }: CustomPromptModalProps) {
  const modal = useModal();
  const { t } = useTranslation('knowledge');
  const formSchema = z.object({
    qa_prompt: z.string().optional(),
  });
  type IFormSchema = z.infer<typeof formSchema>;

  const form = useForm<IFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qa_prompt: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!modal.visible) return;
    form.reset({
      qa_prompt: qaPromptValue || Prompt_AgentQA?.description,
    });
  }, [modal?.visible, qaPromptValue]);

  const onCancel = (result: CustomPromptModalResult = {}) => {
    modal.resolve(result);
    modal.hide();
  };

  const onSubmit = async (values: IFormSchema) => {
    let qa_prompt_value = values?.qa_prompt;
    const qaPrompt = String(values?.qa_prompt).trim();
    if (!qaPrompt) {
      qa_prompt_value = qaPromptValue || Prompt_AgentQA?.description;
    }
    onCancel({
      ...values,
      qa_prompt: qa_prompt_value,
    });
  };

  return (
    <Modal
      open={Boolean(modal?.visible)}
      title={t('textDataset.settings.customPrompt')}
      onCancel={onCancel}
      onOkBeforeFunction={async () => form.trigger()}
      onOk={async () => onSubmit(form.getValues() as IFormSchema)}
      classNames={{
        content: 'w-[600px] max-w-none',
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
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="qa_prompt"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <EnhancedTextarea
                    placeholder={t(
                      'textDataset.settings.customPrompt.placeholder',
                    )}
                    rows={8}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-sm whitespace-pre-wrap">
            {Prompt_AgentQA?.fixedText}
          </div>
        </form>
      </Form>
    </Modal>
  );
}

const CustomPromptModalModal = NiceModal.create(CustomPromptModal);

export const openCustomPromptModal = (
  options?: CustomPromptModalProps,
): Promise<CustomPromptModalResult> => {
  return NiceModal.show(CustomPromptModalModal, { ...options });
};

export default CustomPromptModalModal;
