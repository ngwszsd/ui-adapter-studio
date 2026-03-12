import { httpRequest } from '@/utils/request';
import type { PaginationDataDto } from '@/types/pagination';

export interface UserGroupListDto {
  /**
   * 分组ID
   */
  group_id: number;
  /**
   * 分组名称
   */
  group_name: string;
  /**
   * 分组内成员数
   */
  member_count: number;
}

// 用户分组列表
export const getUserGroupListApi = (data: { project_id: number }) => {
  return httpRequest.get<{
    groups: UserGroupListDto[];
    total_count: number;
  }>({
    url: `/applications/user/group/list`,
    data,
  });
};
export interface UserListParams {
  /**
   * 分组ID
   */
  group_id?: number | null;
  /**
   * 搜索关键字（用户名 / 账号），可选
   */
  keyword?: string;
  /**
   * 页码，从 0 开始
   */
  page?: number;
  /**
   * 项目id
   */
  project_id?: number;
  /**
   * 每页条数（1~100）
   */
  size?: number;
  /**
   * 账号状态过滤（可选）1: 启用 ，0:禁用
   */
  status?: 0 | 1;
}

export interface UseListDto {
  /**
   * 用户ID
   */
  user_id: number;
  /**
   * 用户名
   */
  name: string;
  /**
   * 账号（手机号或邮箱）
   */
  account: string;
  /**
   * 所属分组
   */
  groups: {
    group_id: number;
    group_name: string;
  }[];
  /**
   * 密码
   */
  password: string;
  /**
   * 账号状态 1: 启用 ，2:禁用
   */
  status: 1 | 2;
  /**
   * 创建时间（yyyy-MM-dd HH:mm:ss）
   */
  created_at: string;
}
// 查询用户列表
export const getUserListByGroupApi = (data: UserListParams) => {
  return httpRequest.get<PaginationDataDto<UseListDto>>({
    url: `/applications/user/prod/list`,
    data,
  });
};
// 查看用户密码
export const queryUserPwdApi = (data: { id?: number }) => {
  return httpRequest.get<string>({
    url: `/applications/user/prod/query/pwd`,
    data,
  });
};

// 用户导入模板
export const getUserImportTemplate = () => {
  return httpRequest.get<{
    /**
     * 模板下载地址（带签名/一次性）
     */
    download_url?: string;
    /**
     * 下载地址过期时间（yyyy-MM-dd HH:mm:ss）
     */
    expires_at?: string;
    /**
     * 建议文件名
     */
    filename?: string;
  }>({
    url: `/applications/user/prod/import/template`,
  });
};
export interface AddUserParams {
  /**
   * 分组id
   */
  group_ids: number[];
  /**
   * 用户名
   */
  name: string;
  /**
   * 账号（手机号或邮箱）
   */
  account: string;
  /**
   * 登录密码
   */
  password: string;
  /**
   * 项目id
   */
  project_id: number;
}
// 导入用户
export const importUserApi = (formData: FormData) => {
  return httpRequest.upload<boolean>(
    `/applications/user/prod/import`,
    formData,
  );
};

export const createQrcodeApi = (data: { user_id: number }) => {
  return httpRequest.post<string>({
    url: `/applications/user/prod/login/qrcode`,
    data,
  });
};

//
export const batchDownLoadQrcodeApi = (data: { user_ids: number[] }) => {
  return httpRequest.post<string>({
    url: `/applications/user/prod/download/qrcode`,
    data,
  });
};
//转移用户分组
export const addUserToGroup = (data: {
  group_id: number;
  user_ids: number[];
  project_id: number;
}) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/group/move/members`,
    data,
  });
};
//添加组成员
export const addGroupUserApi = (data: {
  group_id: number | null;
  user_ids: number[];
  project_id?: number;
}) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/group/add/members`,
    data,
  });
};

// 新增用户
export const addUserApi = (data: AddUserParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/prod/create`,
    data,
  });
};
//编辑用户
export const editUserApi = (
  data: Pick<AddUserParams, 'name' | 'group_ids'> & {
    user_id: number;
  },
) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/prod/update`,
    data,
  });
};
//删除用户
export const delUserApi = (data: { user_id: number }) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/prod/delete`,
    data,
  });
};
export interface ToggleUserStatusParams {
  /**
   * 原因备注（可选）
   */
  reason?: string;
  /**
   * 目标状态（必填）
   */
  status: 1 | 2;
  /**
   * 用户ID（必填）
   */
  user_id: number;
}
//修改密码
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
    url: `/applications/user/prod/change/password`,
    data,
  });
};

//禁用用户
export const toggleUserStatusApi = (data: ToggleUserStatusParams) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/prod/setstatus`,
    data,
  });
};

// 新增用户分组
export const createUserGroupApi = (data: {
  group_name: string;
  project_id: number;
}) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/group/create`,
    data,
  });
};
//编辑用户分组
export const editUserGroupApi = (data: {
  group_name: string;
  group_id: number;
}) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/group/rename`,
    data,
  });
};
//删除用户分组
export const delUserGroupApi = (data: { group_id: number }) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/group/delete`,
    data,
  });
};

export const moveoutUserGroupApi = (data: {
  group_id: number;
  project_id: number;
  user_ids: number[];
}) => {
  return httpRequest.post<boolean>({
    url: `/applications/user/group/moveout/members`,
    data,
  });
};
