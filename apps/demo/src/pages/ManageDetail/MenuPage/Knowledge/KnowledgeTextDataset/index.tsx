import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import StepOneUpload from './components/StepOneUpload.tsx';
import StepTwoSettings from './components/StepTwoSettings.tsx';
import StepThreePreview from './components/StepThreePreview.tsx';
import StepFourConfirm from './components/StepFourConfirm.tsx';
import { Steps, type StepItem } from '@teamhelper/ui';
import { PageHeader } from '@/components/PageHeader';
import {
  saveKnowledgeBasesDatasetApi,
  type ISaveKnowledgeBasesDatasetParams,
} from '../KnowledgeDetail/server.ts';
import {
  checkKnowledgeDatasetNameApi,
  updateKnowledgeDatasetTrainingConfigApi,
  type IUpdateKnowledgeDatasetTrainingConfigParams,
} from './server.ts';
import { useKnowledgeTextDatasetStore } from './knowledgeTextDatasetStore';

type ISteps = 'upload' | 'settings' | 'preview' | 'confirm';
type IStepIndex = 0 | 1 | 2 | 3;

const KnowledgeTextDataset: React.FC = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('knowledge');
  const [searchParams] = useSearchParams();
  const [step, setStep] = React.useState<IStepIndex>(0);
  const [currentStep, setCurrentStep] = React.useState<ISteps>('upload');
  const { resetStore } = useKnowledgeTextDatasetStore();

  const knowledgeBaseId = useMemo(() => {
    const id = searchParams?.get?.('knowledgeBaseId');
    return Number(id) || null;
  }, [searchParams]);

  const knowledgeDatasetParentId = useMemo(() => {
    const id = searchParams?.get?.('parentId');
    return Number(id) || null;
  }, [searchParams]);

  const kbSource = useMemo(() => {
    const source = searchParams?.get?.('source');
    return source as 'adjust';
  }, [searchParams]);

  const kbDatasetId = useMemo(() => {
    const id = searchParams?.get?.('datasetId');
    return Number(id) || null;
  }, [searchParams]);

  useEffect(() => {
    setCurrentStep(kbSource === 'adjust' ? 'settings' : 'upload');
  }, [kbSource]);

  const stepArr = useMemo(() => {
    const list = ['settings', 'preview', 'confirm'];
    if (kbSource !== 'adjust') {
      list.unshift('upload');
    }

    return list;
  }, [kbSource]);

  const stepItems = useMemo(() => {
    const items = [
      {
        key: 'settings',
        title: t('textDataset.step.settings'),
      },
      {
        key: 'preview',
        title: t('textDataset.step.preview'),
      },
      {
        key: 'confirm',
        title: t('textDataset.step.confirm'),
      },
    ] as StepItem[];

    if (kbSource !== 'adjust') {
      items.unshift({
        key: 'upload',
        title: t('textDataset.step.select'),
      });
    }

    return items;
  }, [kbSource]);

  const onPrevClick = () => {
    if (step === 0) return;

    const index = step - 1;
    setStep(index as IStepIndex);
    setCurrentStep(stepArr[index] as ISteps);
  };

  const onNextClick = () => {
    if (step === 3) return;

    const index = step + 1;
    setStep(index as IStepIndex);
    setCurrentStep(stepArr[index] as ISteps);
  };

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [resetStore]);

  const checkKnowledgeDatasetNameFn = async (names: Array<string>) => {
    if (!Array.isArray(names) || !names.length) return [];

    const result = await checkKnowledgeDatasetNameApi({
      knowledge_base_id: knowledgeBaseId,
      parent_dataset_id: knowledgeDatasetParentId,
      dataset_names: names,
    });

    return result || [];
  };

  return (
    <div className="w-full h-full bg-card p-5 flex flex-col">
      <PageHeader
        subTitle={
          step > 0 ? t('textDataset.prev.simple') : t('imageDataset.exit')
        }
        classNames={{
          box: 'p-0 pb-7',
          subTitleBox: 'text-primary hover:text-primary/80',
        }}
        onBack={() => {
          if (step > 0) {
            onPrevClick();
          } else {
            navigate(-1);
          }
        }}
      />

      {/* 步骤条 */}
      <div className="bg-background p-5 rounded-[8px] mb-5">
        <Steps
          current={step}
          size="small"
          items={stepItems}
          className="w-8/12 mx-auto"
        />
      </div>

      {/* 主体内容区 */}
      <div className="flex-1 min-h-0 flex flex-col">
        <StepOneUpload
          isShow={currentStep === 'upload'}
          checkDatasetNameFn={(names) => {
            return checkKnowledgeDatasetNameFn(names);
          }}
          handleNext={onNextClick}
        />

        <StepTwoSettings
          isShow={currentStep === 'settings'}
          handleNext={onNextClick}
        />

        <StepThreePreview
          isShow={currentStep === 'preview'}
          handleNext={onNextClick}
        />

        <StepFourConfirm
          isShow={currentStep === 'confirm'}
          onFinishedClick={async (params) => {
            let result = false;
            if (kbSource !== 'adjust') {
              result = await saveKnowledgeBasesDatasetApi({
                knowledge_base_id: knowledgeBaseId,
                parent_id: knowledgeDatasetParentId || null,
                ...params,
              } as ISaveKnowledgeBasesDatasetParams);
            } else {
              result = await updateKnowledgeDatasetTrainingConfigApi(
                kbDatasetId,
                {
                  ...params?.config,
                } as IUpdateKnowledgeDatasetTrainingConfigParams,
              );
            }

            if (!result) return;

            if (kbSource !== 'adjust') {
              navigate(-1);
            } else {
              const text_pathname = routerLocation?.pathname?.replace?.(
                '/text-dataset',
                '/detail',
              );

              if (text_pathname) {
                navigate(`${text_pathname}?knowledgeBaseId=${knowledgeBaseId}`);
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default KnowledgeTextDataset;
