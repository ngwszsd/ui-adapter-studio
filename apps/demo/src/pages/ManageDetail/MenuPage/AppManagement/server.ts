import { httpRequest } from '@/utils/request';
import type { PaginationDataDto } from '@/types/pagination';

export interface ProjectDetailDesignsAppsDto {
  /**
   * 应用唯一 ID
   */
  app_id: number;
  /**
   * 创建人头像url
   */
  avatar_url: string;
  /**
   * 是否有人正在编辑中
   */
  editing: boolean;
  /**
   * 应用图标链接地址
   */
  icon_url: string;
  /**
   * 最后编辑时间
   */
  last_edited_time: string;
  /**
   * 应用名称
   */
  name: string;
  /**
   * userId
   */
  user_id: number;
  /**
   * 创建人名称
   */
  user_name: string;
  latest_version?: string;
  [property: string]: any;
}
export interface ProjectAppsParams {
  /**
   * 项目名称模糊搜索
   */
  name?: string;
  /**
   * 页码，从 0 开始（默认 0）
   */
  page?: number;
  /**
   * 每页条目数量（默认 10），建议最大 100
   */
  size?: number;
  [property: string]: any;
}

// 获取某个项目下的所有应用
export const getProjectAppsApi = (
  project_id: number,
  data: ProjectAppsParams,
) => {
  return httpRequest.get<PaginationDataDto<ProjectDetailDesignsAppsDto>>({
    url: `/projects/${project_id}/applications`,
    data,
  });
};

// 删除应用
export const deleteAppApi = (app_id: number) => {
  return httpRequest.post<boolean>({
    url: `/applications/${app_id}/delete`,
  });
};

export interface AppHistoryDto {
  /**
   * 版本创建时间
   */
  created_at: string;
  /**
   * 创建人头像图片地址，可用于前端展示头像
   */
  creator_avatar_url: string;
  /**
   * 创建该版本的用户 ID
   */
  creator_id: number;
  /**
   * 创建人的姓名或昵称
   */
  creator_name: string;
  /**
   * 版本号
   */
  version: string;
  /**
   * 版本描述
   */
  version_description: string;
  [property: string]: any;
}
// 查询某个应用的历史草稿版本信息
export const getAppsHistoryApi = (application_id: number) => {
  return httpRequest.get<AppHistoryDto[]>({
    url: `/applications/${application_id}/versions`,
  });
};

// 修改应用名称
export const modifyAppNameApi = (
  application_id: number,
  data: { name: string },
) => {
  return httpRequest.post<boolean>({
    url: `/applications/${application_id}/name`,
    data,
  });
};

// 修改应用图标
export const modifyAppIconApi = (
  application_id: number,
  data: { icon_object_key: string },
) => {
  return httpRequest.post<boolean>({
    url: `/applications/${application_id}/icon`,
    data,
  });
};

// 导入应用配置
export const importAppConfigApi = (project_id: number, formData: FormData) => {
  return httpRequest.upload<boolean>(
    `/projects/${project_id}/applications/import`,
    formData,
  );
};

// 创建副本应用
export const createCopyAppApi = (app_id: number) => {
  return httpRequest.post<boolean>({
    url: `/applications/${app_id}/copy`,
  });
};

export interface AppInfoParams {
  /**
   * 应用介绍
   */
  description?: string;
  /**
   * 应用图标链接地址
   */
  icon_object_key?: string | null;
  /**
   * 应用名称
   */
  name: string;
}
// 编辑保存
export const editAppInfoApi = (
  app_id: number,
  data: Omit<AppInfoParams, 'icon_url'> & { icon_object_key?: string | null },
) => {
  return httpRequest.post<boolean>({
    url: `/applications/${app_id}`,
    data,
  });
};

// 创建应用
export const createAppInfoApi = (project_id: number, data: AppInfoParams) => {
  return httpRequest.post<boolean>({
    url: `/projects/${project_id}/applications`,
    data,
  });
};

export interface AppDetailDto {
  /**
   * 应用id
   */
  app_id: number;
  /**
   * 应用描述
   */
  description: string;
  /**
   * 应用图标
   */
  icon_url: string;
  /**
   * 应用名称
   */
  name: string;
  /**
   * 所属项目ID
   */
  project_id: string;
}
// 获取某个项目下的所有应用
export const getAppDetailApi = (app_id: number) => {
  return httpRequest.get<AppDetailDto>({
    url: `/applications/${app_id}`,
  });
};
