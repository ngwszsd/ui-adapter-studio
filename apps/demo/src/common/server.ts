import { httpRequest } from '@/utils/request.ts';
import type { AxiosRequestConfig } from 'axios';
export interface UserDataDto {
  /**
   * 头像，用户头像的URL地址
   */
  avatar: string;
  /**
   * 团队id
   */
  team_id: number;
  /**
   * 团队名称
   */
  team_name: string;
  /**
   * 是否企业用户，标识用户是否为企业用户
   */
  enterprise_flag: boolean;
  /**
   * 手机号，用户手机号码
   */
  mobile: string;
  /**
   * 用户名，用户的显示名称
   */
  name: string;
  /**
   * 用户ID，用户的唯一标识符
   */
  user_id: number;
}
// 获取用户信息
export const getUserInfoApi = () => {
  return httpRequest.get<UserDataDto>({
    url: '/user/info',
  });
};

export interface RemoteFileParams {
  /**
   * 文件名
   */
  file_name: string;
  /**
   * 资源类型，上传资源的类型，如 avatar（头像）、knowledge（知识库文件）、resources（静态资源）等；用于决定存储路径、文件名格式及权限策略
   */
  type:
    | 'avatar' // （头像）
    | 'knowledge' // （知识库文件）
    | 'excel'
    | 'testqrcode'
    | 'qrcode'
    | 'resources' //（静态资源）
    | 'apiFileTmp'; //（api form-data上传文件临时资源）
}
export interface RemoteFileInfoDto {
  /**
   * 临时地址的有效时间（单位：秒）
   */
  expires_in: number;
  /**
   * 文件在云端的唯一标识或路径，可用于后续访问或展示
   */
  file_key: string;
  /**
   * 临时上传地址（POST 或 PUT 形式）
   */
  upload_url: string;
  /**
   * 预览地址（get）
   */
  preview_url: string;
}
// 获取文件上传地址
export const getRemotePreSignApi = (data: RemoteFileParams) => {
  return httpRequest.post<RemoteFileInfoDto>({
    url: '/upload/pre-sign',
    data,
  });
};

/**
 * 通过 PUT 方法上传文件到预签名 URL
 * @param uploadUrl 预签名的上传 URL
 * @param file 要上传的文件
 * @param onUploadProgress
 */
export const commonUploadByPut = (
  uploadUrl: string,
  file: File,
  onUploadProgress?: AxiosRequestConfig['onUploadProgress'],
) => {
  return httpRequest.putUploadToPreSignUrl(uploadUrl, file, onUploadProgress);
};

export interface UserListDto {
  /**
   * 手机号
   */
  mobile: string;
  /**
   * 用户头像url
   */
  user_avatar: string;
  /**
   * 用户id
   */
  user_id: number;
  /**
   * 用户名
   */
  user_name: string;
}
export interface UserListParams {
  /**
   * 检索关键字，手机号或者姓名
   */
  keyword?: string;
}
// 获取人员列表
export const getUserListApi = (data: UserListParams) => {
  return httpRequest.get<UserListDto[]>({
    url: '/teams/user/list',
    data,
  });
};

export interface UserTeamListDto {
  /**
   * 是否是管理员
   */
  admin_flag: boolean;
  /**
   * 团队数量
   */
  member_count: number;
  /**
   * 团队id
   */
  team_id: number;
  /**
   * 团队名称
   */
  team_name: string;
  /**
   * 总项目
   */
  total_projects: number;
  [property: string]: any;
}

export const fetchUserTeamListApi = () => {
  return httpRequest.get<UserTeamListDto[]>({
    url: `/teams/my_teams`,
  });
};

// 切换团队
export const switchTeamsApi = (team_id: number) => {
  return httpRequest.get<{
    /**
     * 过期时间，令牌过期时间，单位：毫秒
     */
    expire_time: number;
    /**
     * 令牌，身份验证令牌
     */
    token: string;
  }>({
    url: `/teams/switch`,
    data: { team_id },
  });
};

export interface IProjectPermissionVo {
  /**
   * 是否可编辑
   */
  editable: boolean;
  /**
   * 是否可读
   */
  readable: boolean;
}

/**
 * 查询项目权限（可读/可编辑）
 * @param projectId
 * @returns
 */
export const queryProjectPermissionApi = async (
  projectId: string | number | null,
) => {
  let result = {} as IProjectPermissionVo;

  try {
    const dtoResult = await httpRequest.get<IProjectPermissionVo>({
      url: `/projects/${projectId}/permission`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IApplicationPermissionVo {
  /**
   * 是否可编辑
   */
  editable: boolean;
  /**
   * 是否可读
   */
  readable: boolean;
}

/**
 * 查询应用权限（可读/可编辑）
 * @param appId
 * @returns
 */
export const queryApplicationPermissionApi = async (
  appId: string | number | null,
) => {
  let result = {} as IApplicationPermissionVo;

  try {
    const dtoResult = await httpRequest.get<IApplicationPermissionVo>({
      url: `/applications/${appId}/permission`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};
