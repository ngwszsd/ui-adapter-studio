import { LS_KEYS } from '@/constants';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { type IQueryKnowledgeBasesDto } from '../server.ts';
import type { IKnowledgeBasesSearchParams } from './server.ts';

export interface IKnowledgeDetailState {
  knowledgeBasesInfo?: Partial<IQueryKnowledgeBasesDto>;
  knowledgeBasesInfoRefresh?: () => void;
  kbSearchConfigParams: Partial<IKnowledgeBasesSearchParams>;
  pollingStopped: boolean;
}

export interface IKnowledgeDetailActions {
  initKnowledgeBases: (params: Partial<IKnowledgeDetailState>) => void;
  setKbSearchConfigParams: (
    params: Partial<IKnowledgeBasesSearchParams>,
  ) => void;
  updateKbSearchConfigParams: (
    key: keyof IKnowledgeBasesSearchParams,
    value: IKnowledgeBasesSearchParams[keyof IKnowledgeBasesSearchParams],
  ) => void;
  setPollingStopped: (stopped: boolean) => void;
}

export const useKnowledgeDetailStore = create<
  IKnowledgeDetailState & IKnowledgeDetailActions
>()(
  persist(
    immer((set) => {
      const DEFAULT_STATE = {
        knowledgeBasesInfo: {},
        knowledgeBasesInfoRefresh: () => {},
        kbSearchConfigParams: {
          search_mode: '1',
          using_re_rank: true,
          embedding_weight: 0.5,
          rerank_weight: 0.5,
          limit: 5000,
          similarity: 0,
          dataset_search_using_extension_query: false,
        } as Partial<IKnowledgeBasesSearchParams>,
        pollingStopped: false,
      };

      return {
        ...DEFAULT_STATE,
        initKnowledgeBases: (params) => {
          set((state) => {
            state.knowledgeBasesInfo = params?.knowledgeBasesInfo || {};
            state.knowledgeBasesInfoRefresh = params?.knowledgeBasesInfoRefresh;
          });
        },
        setPollingStopped: (stopped) => {
          set((state) => {
            state.pollingStopped = stopped;
          });
        },
        setKbSearchConfigParams: (params) => {
          set((state) => {
            state.kbSearchConfigParams = params || {};
          });
        },
        updateKbSearchConfigParams: (key, value) => {
          set((state) => {
            if (!key) return;

            state.kbSearchConfigParams = {
              ...state.kbSearchConfigParams,
              [key]: value,
            };
          });
        },
      };
    }),
    {
      name: LS_KEYS?.KNOWLEDGE_DETAIL_STORE,
    },
  ),
);
