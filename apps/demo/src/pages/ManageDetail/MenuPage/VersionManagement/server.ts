import { httpRequest } from '@/utils/request';
import type { PaginationDataDto } from '@/types/pagination';
export type Page = {
  /**
   * 每页大小（1~100，非必填）
   */
  size?: number;
  /**
   * 页码（从 0 开始，非必填）
   */
  page?: number;
};
export interface AppsListForVersionDto {
  /**
   * 应用 ID
   */
  app_id: number;
  /**
   * 当前线上版本ID
   */
  current_version_id: number;
  current_version_code: number;
  /**
   * 图标 URL
   */
  icon_url?: string;
  /**
   * 应用/项目名称
   */
  name: string;
  /**
   * 是否有新的版本 ：0无 1有
   */
  new_flag: number;
}

export interface AppsListForVersionParams extends Page {
  /**
   * 项目id
   */
  project_id?: number;
}

// 版本管理:应用列表
export const getProjectAppsForVersionApi = (data: AppsListForVersionParams) => {
  return httpRequest.get<PaginationDataDto<AppsListForVersionDto>>({
    url: `/applications/prod/list`,
    data,
  });
};

export interface AppsVersionsForVersionParams extends Page {
  /**
   * 应用ID（必填）
   */
  app_id: number;
}
export interface AppVersionsListForVersionDto {
  id: number;
  /**
   * 是否当前生产环境版本：1是，0否
   */
  current_prod_flag: number;
  /**
   * 版本说明
   */
  description: string;
  /**
   * 发布时间（yyyy-MM-dd HH:mm:ss）
   */
  publish_time: string;
  /**
   * 发布人头像
   */
  publisher_icon: string;
  /**
   * 发布人姓名
   */
  publisher_name: string;
  /**
   * 发布人用户ID
   */
  publisher_user_id: number;
  /**
   * 显示用版本号
   */
  version_code: string;
}
// 版本管理:应用版本列表
export const getProjectAppsVersionsForVersionApi = (
  data: AppsVersionsForVersionParams,
) => {
  return httpRequest.get<PaginationDataDto<AppVersionsListForVersionDto>>({
    url: `/applications/version/prod/list`,
    data,
  });
};

// 版本管理：使用当前版本
export const useCurrentVersionApi = (data: { version_id: number }) => {
  return httpRequest.post<boolean>({
    url: `/applications/version/prod/usecurrent`,
    data,
  });
};

// 版本管理：退回测试环境
export const rollbackTestApi = (data: { version_id: number }) => {
  return httpRequest.post<boolean>({
    url: `/applications/version/prod/rollbacktest`,
    data,
  });
};

// 版本管理：撤回当前版本
export const revokeCurrentApi = (data: { version_id: number }) => {
  return httpRequest.post<boolean>({
    url: `/applications/version/prod/revokecurrent`,
    data,
  });
};
