import { cn } from '@/lib/utils';
import {
  getModelsApi,
  type IGetModelsParams,
} from '@/pages/ManageDetail/MenuPage/Knowledge/server';
import {
  EnhancedSelect,
  type EnhancedSelectOption,
  type EnhancedSelectProps,
} from '@teamhelper/ui';
import { useRequest } from 'ahooks';
import i18n from '@/i18n';
import { memo, useEffect, useMemo } from 'react';

export interface IAiModelSelectProps extends Omit<
  EnhancedSelectProps<number>,
  'options' | 'onChange' | 'value' | 'mode'
> {
  modelParams: IGetModelsParams;
  value?: number;
  /**
   * When the passed value is not in the options, whether to default select the first option
   * @default false
   */
  fallbackToFirstWhenInvalid?: boolean;
  onChange?: (
    value: number | undefined,
    option?: EnhancedSelectOption<number> | null,
  ) => void;
}

export const AiModelSelect: React.FC<IAiModelSelectProps> = memo(
  ({
    modelParams,
    className,
    value,
    onChange,
    fallbackToFirstWhenInvalid = false,
    ...props
  }) => {
    const { data: modelList } = useRequest(
      () => {
        return getModelsApi({ type: modelParams?.type });
      },
      {
        manual: false,
        ready: Boolean(modelParams?.type),
        refreshDeps: [modelParams?.type],
      },
    );

    const modelOptions = useMemo<EnhancedSelectOption<number>[]>(() => {
      if (!Array.isArray(modelList) || !modelList.length) return [];

      return modelList.map((item) => {
        return {
          label: item?.name,
          value: Number(item?.id),
        };
      });
    }, [modelList]);

    useEffect(() => {
      if (!modelOptions?.length || !modelOptions[0]?.value) return;

      const firstOption = modelOptions[0];

      // If value is empty, select the first option (Existing logic)
      if (!value) {
        onChange?.(firstOption.value, firstOption);
        return;
      }

      // If value is provided but not in options, check if fallback is enabled
      if (fallbackToFirstWhenInvalid) {
        const isValueExist = modelOptions.some((item) => item.value === value);
        if (!isValueExist) {
          onChange?.(firstOption.value, firstOption);
        }
      }
    }, [modelOptions, value, fallbackToFirstWhenInvalid]);

    return (
      <EnhancedSelect
        value={value}
        mode="single"
        options={modelOptions}
        onChange={onChange || (() => {})}
        placeholder={i18n.t('components:select')}
        searchable={false}
        allowClear={false}
        showCheck={false}
        listHeight="auto"
        className={cn(className)}
        {...props}
      />
    );
  },
);
