import type { PaginationDataDto } from '@/types/pagination';
import { httpRequest } from '@/utils/request.ts';
import { message } from '@teamhelper/ui';

export interface IWorkflowsWorkspaceListParams {
  /**
   * 关键词搜索
   */
  keyword?: string;
  /**
   * 页码（从0开始）
   */
  pageNo?: number;
  /**
   * 每页大小
   */
  pageSize?: number;
  /**
   * 项目ID
   */
  projectId?: number | null;
  /**
   * 状态筛选（draft/published）
   */
  status?: 'draft' | 'published';
  /**
   * 用户ID列表
   */
  userIds?: number[];
}

export interface IWorkflowsWorkspaceVo {
  /**
   * 创建人用户ID
   */
  createdBy?: number | string | null;
  /**
   * 创建时间
   */
  createdDate?: null | string;
  /**
   * DSL版本号
   */
  dslVersion?: string;
  /**
   * 可编辑状态（editable/editing）
   */
  editable?: 'editable' | 'editing';
  /**
   * 图标URL
   */
  iconUrl?: null | string;
  /**
   * 工作流ID
   */
  id?: string;
  /**
   * 修改人ID
   */
  lastModifiedBy?: number | string | null;
  /**
   * 修改时间
   */
  lastModifiedDate?: null | string;
  /**
   * 工作流名称
   */
  name?: string;
  /**
   * 项目ID
   */
  projectId?: number | null;
  /**
   * 是否被其他工作流引用
   */
  referenced?: boolean;
  /**
   * 工作流状态（draft/published/editing）
   */
  status?: string;
  /**
   * 企业ID
   */
  teamId?: number | null;
}

const serializeQueryParams = (value: Record<string, unknown>) => {
  const search = new URLSearchParams();
  Object.entries(value).forEach(([key, rawValue]) => {
    if (rawValue == null || rawValue === '') return;

    if (Array.isArray(rawValue)) {
      rawValue.forEach((item) => {
        if (item == null || item === '') return;
        search.append(key, String(item));
      });
      return;
    }

    search.append(key, String(rawValue));
  });
  return search.toString();
};

/**
 * 工作台工作流列表（分页）
 * @param params
 * @returns
 */
export const getWorkflowsWorkspaceListApi = async (
  params: IWorkflowsWorkspaceListParams,
) => {
  let result = {} as PaginationDataDto<IWorkflowsWorkspaceVo>;

  try {
    const dtoResult = await httpRequest.get<
      PaginationDataDto<IWorkflowsWorkspaceVo>
    >({
      url: `/workflows/workspace/list`,
      data: params,
      paramsSerializer: serializeQueryParams,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IWorkflowsWorkspaceDetailVo extends IWorkflowsWorkspaceVo {
  data?: { [key: string]: any } | null;
  dsl?: { [key: string]: any } | string | null;
}

/**
 * 获取工作流详情
 * @param id
 * @returns
 */
export const getWorkflowDetailApi = async (id: string | null) => {
  let result = {} as IWorkflowsWorkspaceDetailVo;
  if (!id) return result;

  try {
    const dtoResult = await httpRequest.get<IWorkflowsWorkspaceDetailVo>({
      url: `/workflows/${id}`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IWorkflowsWorkspaceReferencesVo {
  /**
   * 创建人用户ID
   */
  createdBy?: number | null;
  /**
   * 创建时间
   */
  createdDate?: null | string;
  /**
   * DSL版本号
   */
  dslVersion?: string;
  /**
   * 图标URL
   */
  iconUrl?: null | string;
  /**
   * 工作流ID
   */
  id?: string;
  /**
   * 修改人ID
   */
  lastModifiedBy?: number | null;
  /**
   * 修改时间
   */
  lastModifiedDate?: null | string;
  /**
   * 工作流名称
   */
  name?: string;
  /**
   * 项目ID
   */
  projectId?: number | null;
  /**
   * 企业ID
   */
  teamId?: number | null;
}

/**
 * 查询工作流引用关系
 * @param id
 * @returns
 */
export const getWorkflowsWorkspaceReferencesApi = async (id: string | null) => {
  let result = {} as IWorkflowsWorkspaceReferencesVo;

  try {
    const dtoResult = await httpRequest.get<IWorkflowsWorkspaceReferencesVo>({
      url: `/workflows/${id}/references`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IWorkflowsWorkspaceCopyVo {
  /**
   * 创建人用户ID
   */
  createdBy?: number | null;
  /**
   * 创建时间
   */
  createdDate?: null | string;
  /**
   * 工作流DSL JSON数据
   */
  data?: { [key: string]: any };
  /**
   * DSL版本号
   */
  dslVersion?: string;
  /**
   * 图标URL
   */
  iconUrl?: null | string;
  /**
   * 工作流ID
   */
  id?: string;
  /**
   * 修改人ID
   */
  lastModifiedBy?: number | null;
  /**
   * 修改时间
   */
  lastModifiedDate?: null | string;
  /**
   * 工作流名称
   */
  name?: string;
  /**
   * 项目ID
   */
  projectId?: number | null;
  /**
   * 企业ID
   */
  teamId?: number | null;
}

/**
 * 复制工作流
 * @param id
 * @returns
 */
export const getWorkflowsWorkspaceCopyApi = async (id: string | null) => {
  let result = {} as IWorkflowsWorkspaceCopyVo;

  try {
    const dtoResult = await httpRequest.post<IWorkflowsWorkspaceCopyVo>({
      url: `/workflows/${id}/copy`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  if (result?.id) {
    message.success({
      content: '复制成功',
    });
  }

  return result;
};

/**
 * 删除工作流（工作台）
 * @param id
 * @returns
 */
export const deleteWorkflowsWorkspaceApi = async (id: string | null) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/workflows/${id}/delete`,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    message.success({
      content: '删除成功',
    });
  }

  return result;
};

export interface IWorkflowsWorkspaceEditStatusVo {
  /**
   * 当前是否有人正在编辑
   */
  editing?: boolean;
  /**
   * 编辑者用户 ID
   */
  editingBy?: number | null;
  /**
   * 编辑者显示名称（昵称 > 手机号 > 用户 ID）
   */
  editingByName?: null | string;
}

/**
 * 查询编辑锁状态
 * @param id
 * @returns
 */
export const getWorkflowsWorkspaceEditStatusApi = async (id: string | null) => {
  let result = {} as IWorkflowsWorkspaceEditStatusVo;

  try {
    const dtoResult = await httpRequest.get<IWorkflowsWorkspaceEditStatusVo>({
      url: `/workflows/${id}/edit/status`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

/**
 * 手动解锁编辑锁
 * @param id
 * @returns
 */
export const unlockWorkflowsWorkspaceEditStatusApi = async (
  id: string | null,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/workflows/${id}/edit/unlock`,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  return result;
};

/**
 * 导入工作流
 * @param id
 * @returns
 */
export const importWorkflowApi = async (id: string | null) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/workflows/import`,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  return result;
};

/**
 * 导出工作流
 * @param id
 * @returns
 */
export const exportWorkflowApi = async (id: string | null) => {
  let result = false;

  try {
    await httpRequest.download({
      url: `/workflows/${id}/export`,
      method: 'GET',
      showError: false,
    });
    result = true;
  } catch (error) {}

  if (result) {
    message.success({
      content: '导出成功',
    });
  }

  return result;
};
