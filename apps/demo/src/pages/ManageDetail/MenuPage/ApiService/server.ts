import { httpRequest } from '@/utils/request';

export interface ApiGroupRowParams {
  /**
   * 分组名称
   */
  name: string;
  /**
   * api数据主键id
   */
  id?: number;
  /**
   * parent_id 父0 子 apiId
   */
  parent_id: number;
  /**
   * 项目id
   */
  project_id: number;
}
// 创建api分组
export const addApiGroup = (data: ApiGroupRowParams) => {
  return httpRequest.post<boolean>({
    url: `/third/api/save/group`,
    data,
  });
};

//修改api分组
export const editApiGroup = (data: Omit<ApiGroupRowParams, 'project_id'>) => {
  return httpRequest.post<boolean>({
    url: `/third/api/update/group`,
    data,
  });
};

//删除api分组
export const delApiGroup = (data: { group_id: number }) => {
  return httpRequest.get<boolean>({
    url: `/third/api/delete/group`,
    data,
  });
};
export interface ApiGroupDto {
  group_id: number;
  group_name: string;
  list: ApiGroupListDto[];
  parent_id: number;
}

export interface ApiGroupListDto {
  /**
   * id
   */
  id: number;
  /**
   * api方法
   */
  method: 1 | 2 | 3 | 4;
  /**
   * api名称
   */
  name: string;
  /**
   * url
   */
  url_template: string;
}
//获取api分组
export const getApiGroup = (data: {
  project_id: number;
  api_name?: string;
}) => {
  return httpRequest.get<ApiGroupDto[]>({
    url: `/third/api/list`,
    data,
  });
};

export interface OptionList {
  code: string;
  enable?: boolean;
  value: string;
  type?: 'text' | 'file'; // 用于body参数选择form-data时候判断
}
export interface ApiParams {
  id?: number;
  /**
   * 请求体模式枚举 (Body Mode)：
   * 1 = NONE
   * 2 = JSON: application/json (结构化数据)
   * 3 = application/x-www-form-urlencoded
   * 4= FORM_DATA: multipart/form-data (包含文件上传的复杂表单)
   */
  body_mode?: number;
  /**
   * 所属分组ID (t_third_api_group.id)
   */
  group_id?: number;
  /**
   * 固定请求头配置map
   */
  header_list?: OptionList[];
  /**
   * HTTP方法枚举编码：1=GET, 2=POST, 3=PUT, 4=DELETE
   */
  method: number;
  /**
   * 接口名称
   */
  name: string;
  /**
   * 参数映射配置map
   */
  param_list?: OptionList[];
  /**
   * 请求体的数据
   */
  body_param_list: OptionList[];
  /**
   * project_id
   */
  project_id: number;
  /**
   * 完整URL
   */
  url_template: string;
}

// 创建api
export const addApi = (data: ApiParams) => {
  return httpRequest.post<number>({
    url: `/third/api/save`,
    data,
  });
};

// 编辑api
export const editApi = (data: ApiParams) => {
  return httpRequest.post<boolean>({
    url: `/third/api/update`,
    data,
  });
};
//删除api
export const delApi = (data: { api_id: number }) => {
  return httpRequest.get<boolean>({
    url: `/third/api/delete`,
    data,
  });
};

export interface ApiDetailInfoDto {
  /**
   * 请求体模式枚举
   */
  body_mode: number;
  /**
   * 固定请求头配置map
   */
  header_list: OptionList[];
  /**
   * 编号 (主键)
   */
  id: string;
  /**
   * HTTP方法枚举编码
   */
  method: number;
  /**
   * 接口名称
   */
  name: string;
  /**
   * 参数映射配置map
   */
  param_list: OptionList[];
  /**
   * 请求体的数据
   */
  body_param_list: OptionList[];
  /**
   * URL模板
   */
  url_template: string;
}
// api详情
export const getApiDetail = (data: { api_id: number }) => {
  return httpRequest.get<ApiDetailInfoDto>({
    url: `/third/api/detail`,
    data,
  });
};

export interface CurlHttpInfoDto {
  /**
   * 基础域名 (从 cURL 解析)
   */
  base_url?: string;
  /**
   * 请求体模式 (从 cURL 解析)
   */
  body_mode?: string;
  /**
   * 请求体的数据
   */
  body_param_list?: OptionList[];
  /**
   * 请求头 (从 cURL 解析)
   */
  header_list?: OptionList[];
  /**
   * HTTP方法枚举编码：1=GET, 2=POST, 3=PUT, 4=DELETE
   */
  method: number;
  param_list: OptionList[];
  /**
   * 相对路径 (从 cURL 解析)
   */
  path: string;
}

// curl解析
export const importCurlInfoApi = (data: { curl: string }) => {
  return httpRequest.post<CurlHttpInfoDto>({
    url: `/third/api/curl`,
    data,
  });
};

export interface ExecuteApiParams {
  /**
   * 请求体模式枚举 (Body Mode)：
   * 1 = NONE: 无请求体 (通常用于 GET/DELETE)
   * 2 = JSON: application/json (结构化数据)
   * 3 = FORM_URLENCODED: application/x-www-form-urlencoded (普通表单键值对)
   * 4 = FORM_DATA: multipart/form-data (包含文件上传的复杂表单)
   * 5 = RAW: text/plain, application/xml 纯文本
   */
  body_mode?: number;

  body_param_list?: OptionList[];
  /**
   * 固定请求头配置 (JSON Object)。
   * 用于配置那些静态的、所有请求都一样的 Header，动态 Header 请配置在 params_mapping 中。
   * 示例：
   * {
   * "Content-Type": "application/json",
   * "X-Channel-Source": "WEB_ADMIN",
   * "Accept-Language": "zh-CN"
   * }
   */
  header_list?: OptionList[];
  /**
   * HTTP方法枚举编码：1=GET, 2=POST, 3=PUT, 4=DELETE
   */
  method: number;
  params_list?: OptionList[];
  /**
   * 完整URL模板，支持占位符，如 https://api.example.com/files/{category}/upload
   */
  url_template: string;
}

export interface GenerateCodeDto {
  /**
   * 响应体文本
   */
  body: string;
  /**
   * 本次请求耗时（毫秒）
   */
  duration_millis: number;
  response_header_list: ResponseHeaderList[];
  /**
   * 响应体大小
   */
  size_bytes: number;
  /**
   * statusCode
   */
  status_code: number;
}

/**
 * 响应头列表（多值使用逗号拼接）
 */
export interface ResponseHeaderList {
  code: string;
  value: string;
}
//执行api接口
export const executeApiInterface = (data: ExecuteApiParams) => {
  return httpRequest.post<GenerateCodeDto>({
    url: `/third/api/execute`,
    data,
  });
};
export interface GenerateCodeParams {
  body_mode: number;
  body_param_list: OptionList[];
  header_list: OptionList[];
  method: number;
  param_list: OptionList[];
  url_template: string;
  [property: string]: any;
}
// 生成代码
export const generateCodeApi = (data: GenerateCodeParams) => {
  return httpRequest.post<string>({
    url: `/third/api/generate/code`,
    data,
  });
};
