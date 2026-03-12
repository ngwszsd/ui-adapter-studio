import { httpRequest } from '@/utils/request';
import type { PaginationDataDto } from '@/types/pagination.ts';

export interface ViewUserListParams {
  /**
   * 权限类型：1允许，0拒绝
   */
  allowed_flag: 1 | 0;
  /**
   * appId
   */
  app_id?: number;
}
export interface AppVersionUsers {
  /**
   * userid
   */
  user_id: number;
  /**
   * 用户名
   */
  user_name: string;
}

// 应用权限：查看用户列表
export const getAppsVersionUserListApi = (data: ViewUserListParams) => {
  return httpRequest.get<AppVersionUsers[]>({
    url: `/applications/permission/list`,
    data,
  });
};

export interface PublishedAppListDto {
  /**
   * 应用 ID
   */
  app_id?: number;
  create_icon_url?: string;
  create_user_id?: number;
  create_user_name?: string;
  /**
   * 当前线上版本ID
   */
  current_version_id?: number;
  current_version_code?: string;
  /**
   * 图标 URL
   */
  icon_url?: string;
  /**
   * 应用/项目名称
   */
  name?: string;
  /**
   * 发布时间
   */
  publish_time?: string;
}
// 应用权限：已发布应用列表 。
export const getPublishedAppListApi = (data: {
  /**
   * 页码（从 0 开始，非必填）
   */
  page?: number;
  /**
   * 项目id
   */
  project_id?: number;
  /**
   * 每页大小（1~100，非必填）
   */
  size?: number;
}) => {
  return httpRequest.get<PaginationDataDto<PublishedAppListDto>>({
    url: `/applications/permission/release/list`,
    data,
  });
};

export interface UserImportParams {
  /**
   * 应用ID（必填）
   */
  app_id: number;
  /**
   * 用户ID数组（必填；**可为空数组表示全部用户**）
   */
  user_ids_list: number[];
  /**
   * ONE("单个用户", 1),
   * ALL("所有用户", 2),
   */
  principal_type: 1 | 2;
}
// 应用权限：可用用户导入
export const userAvailableImportApi = (data: UserImportParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/permission/import/available`,
    data,
  });
};
// 应用权限：不可用用户导入
export const userNotAvailableImportApi = (data: UserImportParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/permission/import/unavailable`,
    data,
  });
};
