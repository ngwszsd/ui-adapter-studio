import { httpRequest } from '@/utils/request';
import type { PaginationDataDto } from '@/types/pagination';
interface Page {
  /**
   * 页码（从 0 开始，非必填）
   */
  page?: number;
  /**
   * 每页大小（1~100，非必填）
   */
  size?: number;
}
export interface AppsTestListDto {
  /**
   * 应用 ID
   */
  app_id: number;
  create_icon_url: string;
  create_user_id: number;
  create_user_name: string;
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
  /**
   * 可发布版数量
   */
  publishable_version_count: number;
  /**
   * 标签
   */
  tag: string;
  /**
   * 可测试版数量
   */
  testable_version_count: number;
}
export interface AppsTestListParams extends Page {
  /**
   * 项目id
   */
  project_id?: number;
}
// 应用测试：获取某个项目下的测试app
export const getAppsTestListApi = (data: AppsTestListParams) => {
  return httpRequest.get<PaginationDataDto<AppsTestListDto>>({
    url: `/applications/test/list`,
    data,
  });
};
export interface AppsTestVersionsParams extends Page {
  /**
   * app id
   */
  app_id?: number;
}
export interface AppsTestVersionsDto {
  /**
   * 版本说明
   */
  description: string;
  /**
   * 发布时间（yyyy-MM-dd HH:mm:ss）
   */
  publish_time: string;
  /**
   * 操作人头像
   */
  publisher_icon_url: string;
  /**
   * 发布人姓名
   */
  publisher_name: string;
  /**
   * 发布人用户ID
   */
  publisher_user_id: number;
  /**
   * 测试状态 1：可不测试 2：不可测试 3:可发布
   */
  test_status: 1 | 2 | 3;
  /**
   * 显示用版本号
   */
  version_code: string;
  /**
   * id
   */
  version_id: number;
}
//应用测试：获取版本List
export const getAppsTestVersionsApi = (data: AppsTestVersionsParams) => {
  return httpRequest.get<PaginationDataDto<AppsTestVersionsDto>>({
    url: `/applications/version/test/list`,
    data,
  });
};

export interface TransferCanPubParams {
  /**
   * 发布版说明（弹窗“版本说明”）
   */
  description: string;
  /**
   * 发布版版本号（弹窗“版本号”）
   */
  version_code: string;
  /**
   * id
   */
  version_id: number;
}
// 应用测试：转为可发布版本
export const transCanPublishApi = (data: TransferCanPubParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/version/test/publishable`,
    data,
  });
};

// 应用测试：设为可测试
export const setCanTestApi = (data: TransferCanPubParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/version/test/testable`,
    data,
  });
};
//应用测试：撤销测试
export const revokeTestApi = (data: TransferCanPubParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/version/test/revoke-testable`,
    data,
  });
};
export interface AppTestUserListDto {
  /**
   * 账号状态 1: 启用 ，0:禁用
   */
  account_status: 1 | 2;
  /**
   * 添加时间（yyyy-MM-dd HH:mm:ss）
   */
  added_at: string;
  /**
   * 头像图片 URL（可为空）
   */
  avatar_url?: string;
  /**
   * 手机号
   */
  mobile: string;
  /**
   * 用户名 / 昵称
   */
  name: string;
  /**
   * 密码
   */
  password: string;
  /**
   * 用户唯一 ID（后端生成）
   */
  user_id: number;
  account: string;
}
export interface AppTestUserParams {
  /**
   * 搜索关键字（用户名 / 手机号），可选
   */
  keyword?: string;
  /**
   * 页码（从 0 开始），默认 0
   */
  page?: number;
  /**
   * 项目id
   */
  project_id?: number;
  /**
   * 每页条数（1~100），默认 20
   */
  size?: number;
}
//应用测试：用户列表
export const getAppTestUserListApi = (data: AppTestUserParams) => {
  return httpRequest.get<PaginationDataDto<AppTestUserListDto>>({
    url: `/applications/user/test/list`,
    data,
  });
};
//应用测试：删除用户
export const appTestDeleteUserApi = (data: TransferCanPubParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/test/delete`,
    data,
  });
};
// 应用测试：启用 / 禁用账号
export const appTestDeleteUserAp1i = (data: TransferCanPubParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/test/account/status`,
    data,
  });
};

// 应用测试：查看密码
export const queryUserPwdApi = (data: { id?: number }) => {
  return httpRequest.get<string>({
    url: `/applications/user/test/query/pwd`,
    data,
  });
};
// 应用测试：删除用户
export const delUserApi = (data: { user_id: number }) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/test/delete`,
    data,
  });
};
export interface ToggleUserStatusParams {
  /**
   * 目标状态（必填）
   */
  status: 1 | 2;
  /**
   * 用户ID（必填）
   */
  user_id: number;
}
export const toggleUserStatusApi = (data: ToggleUserStatusParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/test/account/status`,
    data,
  });
};
//
export const createQrCodeApi = (data: { user_id: number }) => {
  return httpRequest.post<{ qr_code_url: string; login_qr_code_key: string }>({
    url: `/applications/user/test/qrcode`,
    data,
  });
};
//// 应用测试：修改密码
export const modifyPwdApi = (data: {
  /**
   * 新密码（必填）
   */
  password: string;
  /**
   * 用户ID（必填）
   */
  user_id: number;
}) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/test/reset-password`,
    data,
  });
};
export interface AppTestAddUserParams {
  /**
   * 账号
   */
  account: string;
  /**
   * 用户名（必填）
   */
  name: string;
  /**
   * 登录密码（必填；明文/加密按后端协议）
   */
  password: string;
  /**
   * 项目id
   */
  project_id: number;
}
// 应用测试: 新增用户
export const addUserApi = (data: AppTestAddUserParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/test/create`,
    data,
  });
};
// 应用测试:编辑用户
export const editUserApi = (
  data: Pick<AppTestAddUserParams, 'name'> & {
    user_id: number;
  },
) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/test/update`,
    data,
  });
};

export interface VersionListDto {
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
}
//根据类型查询可发布列表/可测试列表
export const getAppTestVersionListApi = (data: {
  app_id?: number;
  /**
   * 1:可发布 2：可测试
   */
  type?: number;
}) => {
  return httpRequest.get<VersionListDto[]>({
    url: `/applications/version/test/type/list`,
    data,
  });
};
