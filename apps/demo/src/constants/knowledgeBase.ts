import i18n from '@/i18n';

/** 处理模式 */
export const PROCESSING_MODE = {
  image: i18n.t('knowledgeBase.processingMode.image'),
  file: i18n.t('knowledgeBase.processingMode.file'),
  th: i18n.t('knowledgeBase.common.unknown'),
} as const;

/** 处理方式 */
export const HANDLING_METHOD = {
  1: i18n.t('knowledgeBase.handlingMethod.chunk'),
  2: i18n.t('knowledgeBase.handlingMethod.qa'),
  3: i18n.t('knowledgeBase.handlingMethod.image'),
  th: i18n.t('knowledgeBase.common.unknown'),
} as const;

/** 数据集状态 */
export const DATASET_STATUS = {
  0: i18n.t('knowledgeBase.datasetStatus.unindexed'),
  1: i18n.t('knowledgeBase.datasetStatus.indexing'),
  2: i18n.t('knowledgeBase.datasetStatus.ready'),
  3: i18n.t('knowledgeBase.datasetStatus.error'),
  th: i18n.t('knowledgeBase.common.unknown'),
} as const;

/** 数据集状态 - 类样式 */
export const DATASET_STATUS_CLASS_NAME = {
  0: 'bg-muted text-muted-foreground hover:bg-foreground/10',
  1: 'bg-primary/10 text-primary hover:bg-primary/20',
  2: 'bg-green-100 text-green-600 hover:bg-green-200',
  3: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  th: '',
} as const;

/** 图标类型 */
export const ICON_TYPE = {
  0: 'folder',
  1: 'text',
  2: 'kbImage',
  th: '',
} as const;

/** 训练状态 */
export const TRAINING_STATUS = {
  1: i18n.t('knowledgeBase.trainingStatus.fail'),
  2: i18n.t('knowledgeBase.trainingStatus.retrying'),
  3: i18n.t('knowledgeBase.trainingStatus.retrySuccess'),
  4: i18n.t('knowledgeBase.trainingStatus.retryFailed'),
  th: '',
} as const;

/** 数据来源 */
export const DATASET_TYPE = {
  0: '',
  1: i18n.t('knowledgeBase.datasetType.text'),
  2: i18n.t('knowledgeBase.datasetType.image'),
  3: '',
  th: '',
} as const;

/** 搜索方式 - 列表 */
export const SEARCH_MODE_LIST = [
  {
    key: '1',
    label: i18n.t('knowledgeBase.searchMode.semantic.label'),
    description: i18n.t('knowledgeBase.searchMode.semantic.desc'),
  },
  {
    key: '2',
    label: i18n.t('knowledgeBase.searchMode.fulltext.label'),
    description: i18n.t('knowledgeBase.searchMode.fulltext.desc'),
  },
  {
    key: '3',
    label: i18n.t('knowledgeBase.searchMode.hybrid.label'),
    description: i18n.t('knowledgeBase.searchMode.hybrid.desc'),
  },
];

type ISearchModeItem = (typeof SEARCH_MODE_LIST)[number];

/** 搜索方式 */
export const SEARCH_MODE = SEARCH_MODE_LIST.reduce(
  (res, item) => {
    res[item?.key] = item?.label;
    return res;
  },
  {
    th: '',
  } as Record<ISearchModeItem['key'], ISearchModeItem['label']>,
);

/** 得分类型 */
export const SCORE_TYPE = {
  '1': i18n.t('knowledgeBase.scoreType.comprehensive'),
  '2': i18n.t('knowledgeBase.scoreType.rerank'),
  '3': i18n.t('knowledgeBase.scoreType.semantic'),
  '4': i18n.t('knowledgeBase.scoreType.fulltext'),
} as const;

export type SEARCH_SCORE_TYPE = keyof typeof SCORE_TYPE;

/** 检索得分类型描述 */
export const SEARCH_SCORE_TYPE_MAP = {
  1: {
    label: SCORE_TYPE['1'],
    desc: i18n.t('knowledgeBase.scoreTypeDesc.comprehensive'),
    showScore: false,
  },
  2: {
    label: SCORE_TYPE['2'],
    desc: i18n.t('knowledgeBase.scoreTypeDesc.rerank'),
    showScore: true,
  },
  3: {
    label: SCORE_TYPE['3'],
    desc: i18n.t('knowledgeBase.scoreTypeDesc.semantic'),
    showScore: true,
  },
  4: {
    label: SCORE_TYPE['4'],
    desc: i18n.t('knowledgeBase.scoreTypeDesc.fulltext'),
    showScore: false,
  },
};

export const KB_SCORE_THEME: Record<
  string,
  {
    color: string;
    bg: string;
    borderColor: string;
    colorScheme: string;
  }
> = {
  '0': {
    color: '#6F5DD7',
    bg: '#F0EEFF',
    borderColor: '#D3CAFF',
    colorScheme: 'bg-[#805AD5]',
  },
  '1': {
    color: '#9E53C1',
    bg: '#FAF1FF',
    borderColor: '#ECF',
    colorScheme: 'bg-[#D53F8C]',
  },
  '2': {
    color: '#0884DD',
    bg: '#F0FBFF',
    borderColor: '#BCE7FF',
    colorScheme: 'bg-[#487FFF]',
  },
};

export const KB_VECTOR_TYPE = {
  1: i18n.t('knowledgeBase.vectorType.default'),
  2: i18n.t('knowledgeBase.vectorType.custom'),
  3: i18n.t('knowledgeBase.vectorType.summary'),
  4: i18n.t('knowledgeBase.vectorType.question'),
  5: i18n.t('knowledgeBase.vectorType.image'),
} as const;

export const PDF_HANDLE_TYPE_LIST = [
  {
    key: 300,
    label: i18n.t('knowledgeBase.handleType.native'),
  },
  {
    key: 200,
    label: i18n.t('knowledgeBase.handleType.deepdoc'),
  },
  {
    key: 400,
    label: i18n.t('knowledgeBase.handleType.mineru'),
  },
  {
    key: 500,
    label: i18n.t('knowledgeBase.handleType.vlm'),
  },
  {
    key: 100,
    label: i18n.t('knowledgeBase.handleType.doc2x'),
  },
  {
    key: 600,
    label: i18n.t('knowledgeBase.handleType.textIn'),
  },
];

export const PDF_HANDLE_TYPE = PDF_HANDLE_TYPE_LIST.reduce(
  (res, item) => {
    res[item?.key] = item?.label;
    return res;
  },
  {} as Record<
    (typeof PDF_HANDLE_TYPE_LIST)[number]['key'],
    (typeof PDF_HANDLE_TYPE_LIST)[number]['label']
  >,
);

export const Prompt_AgentQA = {
  description: i18n.t('knowledgeBase.promptAgentQA.description'),
  fixedText: i18n.t('knowledgeBase.promptAgentQA.fixedText'),
};
