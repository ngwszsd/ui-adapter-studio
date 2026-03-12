import type { PaginationDataDto } from '@/types/pagination';
import { httpRequest } from '@/utils/request.ts';
import { message } from '@teamhelper/ui';
import i18n from '@/i18n';

export interface IApplicationsSigningCertListParams {
  project_id?: number | null;
  /**
   * 页码
   */
  page?: number;
  /**
   * 每页数量
   */
  size?: number;
}

export interface IApplicationsSigningCertListDto {
  /**
   * 证书别名
   */
  cert_alias?: string;
  /**
   * 证书ID
   */
  cert_id?: number;
  /**
   * 证书名称
   */
  cert_name?: string;
  /**
   * 创建时间
   */
  created_date?: string;
  /**
   * 是否默认，1=是，0=否
   */
  default_flag?: 1 | 0;
}

export type IApplicationsSigningCertListDtoList =
  IApplicationsSigningCertListDto[];

/**
 * 分页查询证书列表
 * @param params
 * @returns
 */
export const applicationsSigningCertListApi = async (
  params: IApplicationsSigningCertListParams,
) => {
  let result = [] as IApplicationsSigningCertListDtoList;

  try {
    const dtoResult = await httpRequest.get<
      PaginationDataDto<IApplicationsSigningCertListDto>
    >({
      url: `/applications/signing/cert/list`,
      data: params,
    });
    result = dtoResult?.data?.content || [];
  } catch (error) {}

  return result;
};

export interface IApplicationsSigningCertDetailDto {
  /**
   * 证书别名
   */
  cert_alias?: string;
  /**
   * 证书ID
   */
  cert_id?: number;
  /**
   * 证书名称
   */
  cert_name?: string;
  /**
   * 创建时间
   */
  created_date?: string;
  /**
   * 是否默认，1=是，0=否
   */
  default_flag?: 1 | 0;
  /**
   * 证书序列号
   */
  serial_number?: string;
  /**
   * 证书主题DN
   */
  subject_dn?: string;
  /**
   * 生效时间
   */
  valid_from?: string;
  /**
   * 备注
   */
  remarks?: string;
  /**
   * 证书文件对象键
   */
  cert_file_object_key?: string;
  /**
   * 证书库密码
   */
  store_password?: string;
  /**
   * 私钥密码
   */
  key_password?: string;
  /**
   * 失效时间
   */
  valid_to?: string;
}

/**
 * 查询证书详情
 * @param cert_id
 * @returns
 */
export const applicationsSigningCertDetailApi = async (
  cert_id: number | null,
) => {
  let result = {} as IApplicationsSigningCertDetailDto;

  try {
    const dtoResult = await httpRequest.get<IApplicationsSigningCertDetailDto>({
      url: `/applications/signing/cert/detail`,
      data: { cert_id },
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IApplicationsSigningCertCreateParams {
  /**
   * 证书别名
   */
  cert_alias: string;
  /**
   * 证书文件对象键（OSS对象路径）
   */
  cert_file_object_key: string;
  /**
   * 证书名称
   */
  cert_name: string;
  /**
   * 是否默认，1=是，0=否
   */
  default_flag: 1 | 0;
  /**
   * 私钥密码
   */
  key_password: string;
  /**
   * 项目ID
   */
  project_id: number;
  /**
   * 备注，最大500字符
   */
  remarks?: string;
  /**
   * 证书序列号（当前服务端会自行校验解析，但该字段仍为必填）
   */
  serial_number: string;
  /**
   * 证书库密码
   */
  store_password: string;
  /**
   * 证书主题DN（当前服务端会自行校验解析，但该字段仍为必填）
   */
  subject_dn: string;
  /**
   * 生效时间（当前服务端会自行校验解析，但该字段仍为必填）
   */
  valid_from: string;
  /**
   * 失效时间（当前服务端会自行校验解析，但该字段仍为必填）
   */
  valid_to: string;
}

/**
 * 新增证书
 * @param params
 * @returns
 */
export const applicationsSigningCertCreateApi = async (
  params: IApplicationsSigningCertCreateParams,
  callBack?: (cert_id: number | null) => void,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<number | null>({
      url: `/applications/signing/cert/create`,
      data: params,
    });
    result = Boolean(dtoResult?.data);
    callBack?.(dtoResult?.data);
  } catch (error) {}

  if (result) {
    message.success({
      content: i18n.t('manageDetail:toast.create.success'),
    });
  }

  return result;
};

export interface IApplicationsSigningCertUpdateParams {
  /**
   * 证书别名
   */
  cert_alias: string;
  /**
   * 证书文件对象键（OSS对象路径）
   */
  cert_file_object_key: string;
  /**
   * 证书ID
   */
  cert_id: number;
  /**
   * 证书名称
   */
  cert_name: string;
  /**
   * 是否默认，1=是，0=否
   */
  default_flag?: 1 | 0;
  /**
   * 私钥密码
   */
  key_password: string;
  /**
   * 证书库密码
   */
  store_password: string;
  /**
   * 备注
   */
  remarks?: string;
}

/**
 * 更新证书
 * @param params
 * @returns
 */
export const applicationsSigningCertUpdateApi = async (
  params: IApplicationsSigningCertUpdateParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/applications/signing/cert/update`,
      data: params,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    message.success({
      content: i18n.t('manageDetail:toast.update.success'),
    });
  }

  return result;
};

/**
 * 删除证书
 * @param cert_id
 * @returns
 */
export const applicationsSigningCertDeleteApi = async (
  cert_id: number | null,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/applications/signing/cert/delete`,
      data: { cert_id },
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    message.success({
      content: i18n.t('manageDetail:toast.delete.success'),
    });
  }

  return result;
};

/**
 * 设为默认
 * @param cert_id
 * @returns
 */
export const applicationsSigningCertSetDefaultApi = async (
  cert_id: number | null,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/applications/signing/cert/setdefault`,
      params: { cert_id },
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    message.success({
      content: i18n.t('manageDetail:toast.op.success'),
    });
  }

  return result;
};

export interface IApplicationsSigningCertParseParams {
  /**
   * 证书文件对象键（OSS对象路径）
   */
  cert_file_object_key: string;
  /**
   * 证书库密码
   */
  store_password: string;
}

export interface IApplicationsSigningCertParseVo {
  /**
   * 证书别名（后端自动识别）
   */
  cert_alias: string;
  /**
   * 证书序列号（16进制字符串）
   */
  serial_number: string;
  /**
   * 证书主题DN
   */
  subject_dn: string;
  /**
   * 生效时间
   */
  valid_from: string;
  /**
   * 失效时间
   */
  valid_to: string;
}

/**
 * 解析证书元数据
 * @param params
 * @returns
 */
export const applicationsSigningCertParseApi = async (
  params: IApplicationsSigningCertParseParams,
) => {
  let result = {} as IApplicationsSigningCertParseVo;

  try {
    const dtoResult = await httpRequest.post<IApplicationsSigningCertParseVo>({
      url: `/applications/signing/cert/parse`,
      data: params,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IApplicationsSigningCertValidateKeyParams {
  /**
   * 证书别名
   */
  cert_alias: string;
  /**
   * 证书文件对象键（OSS对象路径）
   */
  cert_file_object_key: string;
  /**
   * 私钥密码
   */
  key_password: string;
  /**
   * 证书库密码
   */
  store_password: string;
}

/**
 * 校验密钥密码
 * @param params
 * @returns
 */
export const applicationsSigningCertValidateKeyApi = async (
  params: IApplicationsSigningCertValidateKeyParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/applications/signing/cert/validatekey`,
      data: params,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (!result) {
    message.error({
      content: i18n.t('manageDetail:developerCertificate.keyPasswordError'),
    });
  }

  return result;
};
