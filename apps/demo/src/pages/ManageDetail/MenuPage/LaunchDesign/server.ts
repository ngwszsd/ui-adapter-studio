import { httpRequest } from '@/utils/request';

export interface TerminalSettingsDto {
  /**
   * 个性化终端安装包的下载地址 URL
   */
  custom_package_url: string;
  /**
   * 图标图片地址 URL
   */
  icon_url: string;
  /**
   * 源安装包的下载地址 URL
   */
  source_package_url: string;
  /**
   * 启动页图片 URL
   */
  splash_image_url: string;
}

//获取某个项目的终端自定义设置
export const getTerminalSettingsApi = (project_id: number) => {
  return httpRequest.get<TerminalSettingsDto>({
    url: `/projects/${project_id}/launcher/detail`,
  });
};

export interface TerminalSettingsParams {
  /**
   * 应用图标图片 URL，客户端上传后获得
   */
  icon_url?: string;
  /**
   * 启动页图片 URL，客户端上传后获得
   */
  splash_image_url?: string;
}
//保存某个项目的终端自定义设置
export const saveTerminalSettingsApi = (
  project_id: number,
  data: TerminalSettingsParams,
) => {
  return httpRequest.post<boolean>({
    url: `/projects/${project_id}/terminal_settings`,
    data,
  });
};

//获取下载终端包
export const getCustomPackageApi = (project_id: number) => {
  return httpRequest.get<string>({
    url: `/projects/${project_id}/launcher/custom`,
  });
};
