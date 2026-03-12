import { httpRequest } from '@/utils/request.ts';
import type { RequestConfig } from '@/types/axios';
import type { PaginationDataDto } from '@/types/pagination';

/*------------------项目管理-----------------*/
/**
 * 项目信息，单个项目的详细信息
 */
export interface ProjectInformation {
  /**
   * 应用数量，项目下的应用总数
   */
  app_count: number;
  /**
   * 项目描述，项目的详细描述信息
   */
  description: string;
  /**
   * 成员列表，项目成员信息列表
   */
  members: ProjectMemberInformation[];
  /**
   * 项目名称，项目的名称
   */
  name: string;
  /**
   * 项目ID，项目的唯一标识符
   */
  project_id: number;
  /**
   * 已发布应用数量，项目下的已发布应用总数
   */
  published_app_count: number;
}

/**
 * 成员信息，单个成员的基本信息
 */
export interface ProjectMemberInformation {
  /**
   * 头像，成员的头像URL地址
   */
  avatar: string;
  /**
   * 成员姓名，成员的姓名
   */
  name: string;
  /**
   * 是否是项目所有者，是否是项目所有者
   */
  owner: boolean;
  /**
   * 用户ID，成员的用户ID
   */
  user_id: number;
}

export interface ProjectDataParams {
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
}
// 获取项目列表
export const getProjectDataApi = (data: ProjectDataParams) => {
  return httpRequest.get<PaginationDataDto<ProjectInformation>>({
    url: '/projects',
    data,
  });
};

export interface AddProjectParams {
  /**
   * 项目描述
   */
  description: string;
  /**
   * 设计师人员编号列表
   */
  designer_ids: number[];
  /**
   * 项目名称
   */
  name: string;
}

// 新建项目
export const addProjectApi = (data: AddProjectParams) => {
  return httpRequest.post<boolean>({
    url: `/projects`,
    data,
  });
};

// 删除项目
export const deleteProjectApi = (project_id: number) => {
  return httpRequest.post<boolean>({
    url: `/projects/${project_id}/delete`,
  });
};

export interface EditProjectParams {
  /**
   * 新增设计师编号列表
   */
  add_designer_ids: number[];
  /**
   * 项目描述
   */
  description: string;
  /**
   * 项目名称
   */
  name: string;
  /**
   * 要剔除的设计师用户 ID 列表
   */
  remove_designer_ids: number[];
}

// 编辑项目
export const editProjectApi = (project_id: number, data: EditProjectParams) => {
  return httpRequest.post<boolean>({
    url: `/projects/${project_id}`,
    data,
  });
};

/*------------------团队管理-----------------*/

//退出团队
export const leaveTeamApi = (team_id: number) => {
  return httpRequest.post<{
    /**
     * 过期时间，令牌过期时间，单位：毫秒
     */
    expire_time: number;
    /**
     * 令牌，身份验证令牌
     */
    token: string;
  }>({
    url: `/teams/${team_id}/leave`,
  });
};

export interface DeleteTeamPersonParams {
  /**
   * 要删除的成员 ID
   */
  member_ids: number[];
  /**
   * 团队的唯一标识
   */
  team_id: number;
}
//团队所有者删除团队成员
export const deleteTeamerApi = (data: DeleteTeamPersonParams) => {
  return httpRequest.post<boolean>({
    url: `/teams/members/remove`,
    data,
  });
};

export interface MemberListParams {
  /**
   * 检索关键字，可以是姓名或者手机号码
   */
  keyword?: string;
  /**
   * 当前页码，默认0
   */
  page?: number;
  /**
   * 每页展示成员数量.默认10
   */
  size?: number;
}

export interface MemberInformation {
  /**
   * 账号名称（如用户名）
   */
  account_name: string;
  /**
   * 头像图片链接
   */
  avatar_url: string;
  /**
   * 创建时间
   */
  created_at: string;
  /**
   * 手机号
   */
  phone_number: string;
  /**
   * 成员角色枚举编码（1=ADMIN,2=MEMBER）
   */
  role: number;
  /**
   * 成员状态枚举编码（1=活跃，2=待激活）
   */
  status: number;
  /**
   * 用户编号（唯一标识）
   */
  user_id: number;
  /**
   * 团队id
   */
  id: number;
}
// 分页查询团队成员列表
export const fetchMemberListApi = (data: MemberListParams) => {
  return httpRequest.get<PaginationDataDto<MemberInformation>>({
    url: `/teams/members`,
    data,
  });
};

export interface UserSourceDataDto {
  /**
   * api数量
   */
  api_count: number;
  /**
   * 应用草稿数
   */
  application_draft_count: number;
  /**
   * 知识库数量
   */
  knowledge_base_count: number;
  /**
   * mcp数量
   */
  mcp_count: number;
  /**
   * 项目文件数
   */
  project_resource_count: number;
  /**
   * 工作流数量
   */
  workflow_count: number;
}

// 获取某个成员在某个团队下的资源数
export const getSourceByUserApi = (data: {
  /**
   * 团队成员唯一标识
   */
  member_id: number;
  /**
   * 团队唯一标识
   */
  team_id: number;
}) => {
  return httpRequest.get<UserSourceDataDto>({
    url: `/teams/${data.team_id}/members/${data.member_id}/resource_count`,
    data,
  });
};

export interface UpdateEnterpriseParams {
  /**
   * 升级为企业版的公司名称
   */
  company_name: string;
  /**
   * 企业联系手机号（默认带入登录人手机号）
   */
  phone_number: string;
  /**
   * 统一社会信用代码（18位）
   */
  social_credit_code: string;
  /**
   * 当前团队人数范围，枚举格式，请参考下文
   * 1：1-10人
   * 2：11-50人
   * 3：51-100人
   * 4：101-500人
   * 5：500人以上
   */
  team_size: number;
  [property: string]: any;
}
// 升级企业版本
export const updateEnterpriseApi = ({
  team_id,
  data,
}: {
  team_id: number;
  data: UpdateEnterpriseParams;
}) => {
  return httpRequest.post<boolean>({
    url: `/teams/${team_id}/upgrade_enterprise`,
    data,
  });
};
export interface InviteDesignerParams {
  /**
   * 邀请链接过期时间类型
   * 可选范围：1-39分钟；2-7天；3-1年
   */
  expire_type: number;
  /**
   * 邀请语
   */
  invite_describe: string;
  /**
   * 邀请链接使用次数限制类型
   * 可选范围：1-1人；2-无限制
   */
  use_limit_type: number;
}

// 邀请设计师
export const inviteDesignerApi = ({
  team_id,
  data,
}: {
  team_id: number;
  data: InviteDesignerParams;
}) => {
  return httpRequest.post<string>({
    url: `/teams/invites/${team_id}/designer_invite`,
    data,
  });
};

export interface InviteInfoDto {
  /**
   * 是否在团队
   */
  in_team: boolean;
  /**
   * 邀请创建时间
   */
  invite_time: string;
  /**
   * 邀请人头像 URL
   */
  inviter_avatar: string;
  /**
   * 邀请人姓名
   */
  inviter_name: string;
  /**
   * 邀请信息
   */
  inviter_messages: string;
  /**
   * 被邀请加入的团队名称
   */
  team_name: string;
  expired_time: string;
}

// 获取是否有团队邀请
export const getInviteInfoApi = (invite_code: string) => {
  return httpRequest.get<InviteInfoDto>({
    url: `/teams/invites/${invite_code}`,
  });
};

/**
 * 团队邀请处理
 * @param invite_code
 * @param data approval_type审批类型 1：同意 2：reject
 */
export const handleInviteApi = (
  invite_code: string,
  data: { approval_type: number },
  config?: RequestConfig,
) => {
  return httpRequest.post<boolean>({
    url: `/teams/invites/${invite_code}/approval`,
    data,
    ...config,
  });
};

export interface IUpgradeEnterprisePendingInfoVo {
  /**
   * 申请状态（1=待审核,2=已通过,3=已驳回）
   */
  apply_status: 1 | 2 | 3;
  /**
   * 企业名称
   */
  company_name: string;
  /**
   * 联系手机号
   */
  phone_number: string;
}

/**
 * 查询团队升级状态
 * @param teamId
 * @returns
 */
export const getUpgradeEnterprisePendingInfoApi = async (
  teamId: number | null,
) => {
  let result = {} as IUpgradeEnterprisePendingInfoVo;

  try {
    const dtoResult = await httpRequest.get<IUpgradeEnterprisePendingInfoVo>({
      url: `/teams/${teamId}/upgrade_enterprise/pending_info`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};
