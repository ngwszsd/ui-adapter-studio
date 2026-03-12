import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ISaveKnowledgeBasesDatasetParams } from '../KnowledgeDetail/server';

export type IKnowledgeTextDatasetFileRow = {
  id: string;
  file: File;
  progress: number;
  sizeText: string;
  status?: 'waiting' | 'uploading' | 'done';
  file_object_key?: string;
  isSameName?: boolean;
};

export interface IKnowledgeTextDatasetState {
  datasetParams: Partial<ISaveKnowledgeBasesDatasetParams>;
  fileRows: IKnowledgeTextDatasetFileRow[];
}

export interface IKnowledgeTextDatasetActions {
  setFileRows: (data?: IKnowledgeTextDatasetState['fileRows']) => void;
  setDatasetParams: (params: Partial<ISaveKnowledgeBasesDatasetParams>) => void;
  setDatasetParamsConfig: (
    params: Partial<ISaveKnowledgeBasesDatasetParams['config']>,
  ) => void;
  resetStore: () => void;
}

export const useKnowledgeTextDatasetStore = create<
  IKnowledgeTextDatasetState & IKnowledgeTextDatasetActions
>()(
  immer((set) => {
    const DEFAULT_STATE = {
      datasetParams: {
        dataset_type: 1 as ISaveKnowledgeBasesDatasetParams['dataset_type'],
      },
      fileRows: [],
    };

    return {
      ...DEFAULT_STATE,
      setDatasetParams: (params) => {
        set((state) => {
          state.datasetParams = {
            ...state.datasetParams,
            ...params,
          };
        });
      },
      setDatasetParamsConfig: (params) => {
        set((state) => {
          state.datasetParams = {
            ...state.datasetParams,
            config: {
              ...state.datasetParams?.config,
              ...params,
            },
          };
        });
      },
      setFileRows: (data) => {
        set((state) => {
          state.fileRows = data || [];
        });
      },
      resetStore: () => {
        set((state) => {
          state.datasetParams = DEFAULT_STATE.datasetParams;
          state.fileRows = DEFAULT_STATE.fileRows;
        });
      },
    };
  }),
);
