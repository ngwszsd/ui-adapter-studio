import { httpRequest } from '@/utils/request';
import type { AuthConfigResult } from '@/pages/ManageDetail/MenuPage/McpService/AuthConfigDialog.tsx';
export interface McpListParams {
  /**
   * 名称
   */
  name?: string;
  user_id?: number;
  team_id?: number;
  project_id?: number;
}
export interface McpListDto {
  created_by?: number;
  created_name?: string;
  created_time?: string;
  /**
   * 服务简用途说明
   */
  description?: string;
  /**
   * 图片地址
   */
  icon_url?: string;
  /**
   * 编号 (主键)
   */
  id?: number;
  /**
   * 服务名称
   */
  name?: string;
  /**
   * 用户头像
   */
  user_icon_url?: string;
}
//mcp服务：获取列表
export const getMcpListApi = (data: McpListParams) => {
  return httpRequest.get<McpListDto[]>({
    url: `/third/mcp/list`,
    data,
  });
};
export interface McpInfoParams {
  project_id?: number;
  id?: number;
  /**
   * 服务地址
   */
  server_url?: string;

  /**
   * 鉴权配置JSON
   */
  auth_config?: Record<any, any>;
  /**
   * 服务简用途说明
   */
  description?: string;
  /**
   * 图标对象键
   */
  icon_object_key: string;
  /**
   * 服务名称
   */
  name: string;
  // 工具列表
  tools_list: ToolsList[];
  auth_type: number; // 1http 2:自定义
}

/**
 * MCP 服务创建请求
 */
export interface ToolsList {
  /**
   * 工具说明
   */
  description?: string;
  /**
   * 入参
   */
  param?: string;
  /**
   * 工具名称
   */
  tool_name?: string;
  /**
   * 是否必填的key数组 ，对应param字段parse后的key，例如["query"]
   */
  required?: string[];
}
// mcp服务：新增
export const addMcpListApi = (data: Omit<McpInfoParams, 'id'>) => {
  return httpRequest.post<boolean>({
    url: `/third/mcp/add`,
    data,
  });
};
type McpBasicInfoParams = {
  description: string;
  icon_object_key: string;
  id: number;
  name: string;
};
// mcp服务：修改mcp基础信息
export const editMcpBasicInfoApi = (data: McpBasicInfoParams) => {
  return httpRequest.post<boolean>({
    url: `/third/mcp/edit/basic`,
    data,
  });
};
// mcp服务：修改mcp全量信息-tools
export const editMcpAllInfoApi = (data: McpInfoParams) => {
  return httpRequest.post<boolean>({
    url: `/third/mcp/update`,
    data,
  });
};
// mcp服务：删除 MCP 服务
export const delMcpListApi = (id: number) => {
  return httpRequest.get<boolean>({
    url: `/third/mcp/delete`,
    data: { id },
  });
};

export interface McpInfoDetailDto {
  icon_object_key: string;
  auth_type: number; // 1http 2:自定义
  /**
   * 鉴权配置
   */
  auth_config: AuthConfigResult['headers'];
  /**
   * 服务描述/简介
   */
  description?: string;
  /**
   * 图标URL
   */
  icon_url: string;
  /**
   * 主键 ID
   */
  id: number;
  /**
   * 服务名称
   */
  name: string;
  /**
   * 服务地址
   */
  service_url: string;
  /**
   * 关联工具列表
   */
  tools: {
    /**
     * 工具描述
     */
    description?: string;
    /**
     * 工具 ID
     */
    id?: number;
    /**
     * mcp工具的参数 对象字符串
     * 例如 "{\"query\":{\"type\":\"string\",\"description\":\"搜索关键词\"},\"num_results\":{\"type\":\"number\",\"default\":5,\"description\":\"返回的结果数量，默认为5\"}}"
     */
    param?: string;
    /**
     * 是否必填的key数组 ，对应param字段parse后的key，例如["query"]
     */
    required?: string[];
    /**
     * 工具唯一标识
     */
    tool_name?: string;
  }[];
}
// mcp服务：获取 MCP 服务详情
export const getMcpDetailApi = (id: number) => {
  return httpRequest.get<McpInfoDetailDto>({
    url: `/third/mcp/detail`,
    data: { id },
  });
};
export interface McpParsedResultDto {
  id?: number;
  /**
   * 工具说明
   */
  description?: string;
  /**
   * mcp工具的参数 对象字符串
   * 例如 "{\"query\":{\"type\":\"string\",\"description\":\"搜索关键词\"},\"num_results\":{\"type\":\"number\",\"default\":5,\"description\":\"返回的结果数量，默认为5\"}}"
   */
  param?: string;
  /**
   * 工具名称
   */
  tool_name?: string;
  /**
   * 是否必填的key数组 ，对应param字段parse后的key，例如["query"]
   */
  required?: string[];
}
// mcp服务：解析mcp地址
export const parseMcpAddressApi = (data: {
  /**
   * map
   */
  headers: AuthConfigResult['headers'];
  /**
   * 服务地址
   */
  server_url: string;
}) => {
  return httpRequest.post<McpParsedResultDto[]>({
    url: `/third/mcp/parse`,
    data,
  });
};
/**
 * 响应数据
 */
export interface ExecutionData {
  contexts?: Context[];
  is_error?: boolean;
}

export interface Context {
  text?: string;
  type?: string;
}
// mcp服务：mcp插件执行
export const mcpPluginExecutionApi = (data: {
  headers?: AuthConfigResult['headers'];
  params?: Record<string, any>;
  /**
   * 服务地址
   */
  server_url: string;
  tools_name?: string;
}) => {
  return httpRequest.post<ExecutionData>({
    url: `/third/mcp/execute`,
    data,
  });
};
