import { httpRequest } from '@/utils/request.ts';

const normalizeDraftVersion = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value).trim();
  if (!value || typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;

  const directKeys = ['draftVersion'] as const;

  for (const key of directKeys) {
    const normalized = normalizeDraftVersion(record[key]);
    if (normalized) return normalized;
  }

  const nestedKeys = ['result', 'data'] as const;
  for (const key of nestedKeys) {
    const normalized = normalizeDraftVersion(record[key]);
    if (normalized) return normalized;
  }

  return '';
};

export interface IArchiveWorkflowVo {
  /**
   * 创建人用户ID
   */
  created_by?: number | null;
  /**
   * 创建时间
   */
  created_date?: null | string;
  /**
   * 版本描述
   */
  description?: null | string;
  /**
   * UI设计器节点数据（JSONB）
   */
  graph_data?: { [key: string]: any } | null;
  /**
   * 版本记录ID（自增主键）
   */
  id: number;
  /**
   * 版本号，如 v0.0.1
   */
  version?: null | string;
  /**
   * 版本类型：0=存档，1=发布
   */
  version_type: number;
  /**
   * 工作流完整数据（JSONB）
   */
  workflow_data?: { [key: string]: any } | null;
  /**
   * 工作流ID
   */
  workflow_id: string;
}

export interface IArchiveWorkflowParams {
  description: string;
}

/**
 * 草稿存档
 * @param id
 * @returns
 */
export const archiveWorkflowApi = async (
  id: string | null,
  data?: IArchiveWorkflowParams,
) => {
  let result = {} as IArchiveWorkflowVo;

  try {
    const dtoResult = await httpRequest.post<IArchiveWorkflowVo>({
      url: `/workflows/${id}/archive`,
      data,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IPublishWorkflowVo {
  /**
   * 发布描述
   */
  description?: null | string;
  /**
   * 指定发布版本号（如 v1.0.0），不传则自动递增patch版本
   */
  version?: null | string;
}

export interface IPublishWorkflowParams {
  description: string;
  version: string;
}

/**
 * 应用发布
 * @param id
 * @returns
 */
export const publishWorkflowApi = async (
  id: string | null,
  data?: IPublishWorkflowParams,
) => {
  let result = {} as IPublishWorkflowVo;

  try {
    const dtoResult = await httpRequest.post<IPublishWorkflowVo>({
      url: `/workflows/${id}/publish`,
      data,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface ILoadWorkflowVersionVo {
  /**
   * 创建人用户ID
   */
  created_by?: number | null;
  /**
   * 创建时间
   */
  created_date?: null | string;
  /**
   * 版本描述
   */
  description?: null | string;
  /**
   * UI设计器节点数据（JSONB）
   */
  graph_data?: { [key: string]: any } | null;
  /**
   * 版本记录ID（自增主键）
   */
  id: number;
  /**
   * 版本号，如 v0.0.1
   */
  version?: null | string;
  /**
   * 版本类型：0=存档，1=发布
   */
  version_type: number;
  /**
   * 工作流完整数据（JSONB）
   */
  workflow_data?: { [key: string]: any } | null;
  /**
   * 工作流ID
   */
  workflow_id: string;
}

/**
 * 加载版本
 * @param id
 * @param versionId
 * @returns
 */
export const loadWorkflowVersionApi = async (
  id: string | null,
  versionId: number | null,
) => {
  let result = {} as ILoadWorkflowVersionVo;

  try {
    const dtoResult = await httpRequest.post<ILoadWorkflowVersionVo>({
      url: `/workflows/${id}/versions/${versionId}/load`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface ILoadWorkflowVersionListVo {
  /**
   * 创建人用户ID
   */
  createdBy?: number | null;
  createdByName?: string;
  /**
   * 创建人姓名
   */
  creatorName?: string;
  /**
   * 创建人头像
   */
  creatorAvatarUrl?: string;
  /**
   * 创建时间
   */
  createdDate?: null | string;
  /**
   * 版本描述
   */
  description?: null | string;
  /**
   * UI设计器节点数据（JSONB）
   */
  graphData?: { [key: string]: any } | null;
  /**
   * 版本记录ID（自增主键）
   */
  id: number;
  /**
   * 版本号，如 v0.0.1
   */
  version?: null | string;
  /**
   * 版本类型：0=存档，1=发布
   */
  versionType: number;
  /**
   * 工作流完整数据（JSONB）
   */
  workflowData?: { [key: string]: any } | null;
  /**
   * 工作流ID
   */
  workflowId: string;
  workflowName: string;
  current: boolean;
}

/**
 * 版本记录查询
 * @param id
 * @returns
 */
export const loadWorkflowVersionListApi = async (id: string | null) => {
  let result = [] as ILoadWorkflowVersionListVo[];

  try {
    const dtoResult = await httpRequest.get<ILoadWorkflowVersionListVo[]>({
      url: `/workflows/${id}/versions`,
    });
    result = dtoResult?.data || [];
  } catch (error) {}

  return result;
};

/**
 * 查询当前发布版本号
 * @param id
 * @returns
 */
export const loadWorkflowDraftVersionApi = async (id: string | null) => {
  let result = '';

  try {
    const dtoResult = await httpRequest.get<unknown>({
      url: `/workflows/${id}/draft-version`,
    });
    result = normalizeDraftVersion(dtoResult?.data);
  } catch (error) {}

  return result;
};
