import type { AxiosRequestConfig } from 'axios';

// 通用返回结果
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 扩展 axios 请求配置（可放 token 开关等）
export interface RequestConfig<T = any> extends AxiosRequestConfig {
  isAuth?: boolean; // 是否需要认证
  showError?: boolean; // 是否统一弹出错误
  returnFullError?: boolean; // 是否返回完整错误信息
  skipResponseCodeCheck?: boolean; // 是否跳过统一业务码校验
}
