import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { IKnowledgeDatasetsMetaDataDto } from './server.ts';

export interface IKnowledgeDatasetDetailState {
  metaDataInfo?: Partial<IKnowledgeDatasetsMetaDataDto>;
}

export interface IKnowledgeDatasetDetailActions {
  setMetaDataInfo: (params: Partial<IKnowledgeDatasetsMetaDataDto>) => void;
}

export const useKnowledgeDatasetDetailStore = create<
  IKnowledgeDatasetDetailState & IKnowledgeDatasetDetailActions
>()(
  immer((set) => {
    const DEFAULT_STATE = {
      metaDataInfo: {},
    };

    return {
      ...DEFAULT_STATE,
      setMetaDataInfo: (params) => {
        set((state) => {
          state.metaDataInfo = params || {};
        });
      },
    };
  }),
);
