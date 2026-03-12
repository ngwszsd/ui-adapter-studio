import { httpRequest } from '@/utils/request';

export interface ProjectDetailDto {
  /**
   * 项目描述
   */
  description: string;
  /**
   * 设计师人员列表
   */
  designers: ProjectDesigner[];
  /**
   * 项目名称
   */
  name: string;
  /**
   * 项目的唯一 ID
   */
  project_id: number;
}

export interface ProjectDesigner {
  /**
   * 设计师人员头像url
   */
  avatar: string;
  /**
   * 设计师人员编号
   */
  user_id: number;
  /**
   * 设计师人员名称
   */
  name: string;
  /**
   * 是否是所有者
   */
  owner: boolean;
}
// 获取项目详情
export const getProjectDetailApi = (project_id: number) => {
  return httpRequest.get<ProjectDetailDto>({
    url: `/projects/${project_id}`,
  });
};

//获取是否有应用更新
export const getAppUpdatedByProjectApi = (data: { project_id: number }) => {
  return httpRequest.get<boolean>({
    url: `/applications/prod/version/check`,
    data,
  });
};

export interface GroupedUsersDto {
  /**
   * 分组id
   */
  group_id: number;
  /**
   * 分组名称
   */
  group_name: string;
  member_count: number;
  /**
   * 用户列表
   */
  users: User[];
}

export interface User {
  /**
   * userid
   */
  user_id: number;
  /**
   * 用户名
   */
  user_name: string;
  account: string;
}
// 获取分组用户数据
export const fetchGroupedUsersApi = (data: { project_id: number }) => {
  return httpRequest.get<GroupedUsersDto[]>({
    url: `/applications/user/group/users`,
    data,
  });
};

//编辑设计师人员
export const editDesignerUserApi = (
  project_id: number,
  data: {
    /**
     * 要新增的设计师用户 ID 列表
     */
    add_designer_ids: number[];
    /**
     * 要剔除的设计师用户 ID 列表
     */
    remove_designer_ids: number[];
  },
) => {
  return httpRequest.post<boolean>({
    url: `/projects/${project_id}/designers`,
    data,
  });
};
