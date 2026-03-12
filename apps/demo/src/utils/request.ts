import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type AxiosProgressEvent,
} from 'axios';
import type { ApiResponse, RequestConfig } from '@/types/axios';
import { message } from '@teamhelper/ui';
import { useAuthStore } from '@/store';
import { INVITE_KEY, LS_KEYS, REDIRECT_WHITE_LIST_KEYS } from '@/constants';
import i18n from '@/i18n';
import { router } from '@/routes';
import { parse, isLosslessNumber } from 'lossless-json';

// 获取带重定向参数的登录地址
const getLoginUrl = () => {
  const { pathname, search } = window.location;

  // 如果已经在登录页，直接返回当前 URL，不再重新计算（防止多个并行请求导致 redirect 参数丢失）
  if (pathname === '/login') {
    return pathname + search;
  }

  const searchParams = new URLSearchParams(search);
  // 只有当 URL 包含白名单中的 Key 时，才记录重定向地址
  const shouldRedirect = REDIRECT_WHITE_LIST_KEYS.some((key) =>
    searchParams.has(key),
  );

  if (shouldRedirect) {
    const params = new URLSearchParams();
    REDIRECT_WHITE_LIST_KEYS.forEach((key) => {
      if (searchParams.has(key)) {
        params.set(key, searchParams.get(key) as string);
      }
    });
    return `/login?${params.toString()}`;
  }

  return '/login';
};

const SUCCESS_CODE = 0;

// 清除认证信息的辅助函数
const clearAuthData = () => {
  useAuthStore.getState().clearUserInfo();
  useAuthStore.getState().logout();
};

const messageHistory = new Set<string>();

const parseFilenameFromContentDisposition = (
  contentDisposition?: string,
): string => {
  const value = String(contentDisposition || '').trim();
  if (!value) return '';

  const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).trim();
    } catch (error) {
      return utf8Match[1].trim();
    }
  }

  const quotedMatch = value.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].trim();
  }

  const rawMatch = value.match(/filename\s*=\s*([^;]+)/i);
  if (rawMatch?.[1]) {
    return rawMatch[1].replace(/^['"]|['"]$/g, '').trim();
  }

  return '';
};

// 使用 Antd message 的通知函数
const showToast = (
  msg: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
) => {
  if (!msg) return;
  // 防止短时间内重复提示
  const key = `${type}:${msg}`;
  if (messageHistory.has(key)) {
    return;
  }

  messageHistory.add(key);
  message[type](msg);

  setTimeout(() => {
    messageHistory.delete(key);
  }, 2000);
};

class HttpRequest {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: '/api',
      timeout: 20 * 1000,
      headers: { 'Content-Type': 'application/json' },
      transformResponse: [
        (data) => {
          if (typeof data === 'string' && data.length > 0) {
            try {
              return parse(data, (key, value) => {
                if (isLosslessNumber(value)) {
                  const numStr = value.toString();
                  const num = Number(numStr);
                  if (Number.isSafeInteger(num)) {
                    return num;
                  }
                  return numStr;
                }
                return value;
              });
            } catch (e) {
              return data;
            }
          }
          return data;
        },
      ],
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig & RequestConfig) => {
        // 参数归一化：如果 method 是 GET 且传入了 data，则自动将其转换为 params
        if (config.method?.toUpperCase() === 'GET' && config.data) {
          config.params = config.data;
          config.data = undefined;
        }

        // 添加国际化语言请求头
        const language = localStorage.getItem(LS_KEYS.LANGUAGE) || 'zh';

        if (config.headers) {
          config.headers['Accept-Language'] =
            language === 'zh' ? 'zh-CN' : 'en-US';
        }

        // 默认为 true，如果 explicitly 设置为 false 则不带 token
        const isAuth = config.isAuth !== false;

        if (isAuth) {
          const token = localStorage.getItem(LS_KEYS.TOKEN);

          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestConfig = response.config as RequestConfig;
        if (requestConfig.skipResponseCodeCheck) {
          return response;
        }

        const res = response.data as ApiResponse<any>;

        // 业务成功
        if (res.code === SUCCESS_CODE) {
          return response;
        }

        // 业务失败处理
        const msg = res.message || i18n.t('network.requestFailed');
        const showError =
          (response.config as RequestConfig).showError !== false;

        if (showError) {
          showToast(msg, 'error');
        }

        // 处理特定的业务错误码
        if (res.code === 401) {
          // Token 过期或未授权
          clearAuthData();
          router.navigate(getLoginUrl());
        }

        const returnFullError = (response?.config as RequestConfig)
          ?.returnFullError;
        if (returnFullError) {
          return Promise.reject(new Error(JSON.stringify(res)));
        }
        return Promise.reject(new Error(msg));
      },
      (error) => {
        let msg = i18n.t('network.unknownError');
        const showError = error.config?.showError !== false;

        if (error.response) {
          const status = error.response.status;
          switch (status) {
            case 400:
              msg = i18n.t('network.invalidParams');
              break;
            case 401:
              msg = i18n.t('network.unauthorized');
              clearAuthData();
              router.navigate(getLoginUrl());
              break;
            case 403:
              msg = '';
              router.navigate(getLoginUrl());
              break;
            case 404:
              msg = i18n.t('network.notFound');
              break;
            case 500:
              msg = i18n.t('network.serverError');
              break;
            default:
              msg = `${i18n.t('network.requestFailed')}: ${status}`;
          }
        } else if (error.request) {
          msg = i18n.t('network.noResponse');
        } else {
          msg = error.message;
        }

        if (showError) {
          showToast(msg, 'error');
        }

        return Promise.reject(error);
      },
    );
  }

  public httpRequest<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    return this.instance(config).then((res) => res.data as ApiResponse<T>);
  }

  public get<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    return this.httpRequest<T>({ ...config, method: 'GET' });
  }

  public post<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    return this.httpRequest<T>({ ...config, method: 'POST' });
  }

  public put<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    return this.httpRequest<T>({ ...config, method: 'PUT' });
  }

  public delete<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    return this.httpRequest<T>({ ...config, method: 'DELETE' });
  }

  /** 上传文件（支持进度条） */
  public upload<T = any>(
    url: string,
    data: FormData,
    config?: RequestConfig,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  ): Promise<ApiResponse<T>> {
    return this.instance
      .post(url, data, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
        onUploadProgress,
      })
      .then((res) => res.data as ApiResponse<T>);
  }

  /**
   * 上传文件到预签名 URL（不经过拦截器）
   * 用于直接上传到云存储的预签名地址
   */
  public putUploadToPreSignUrl(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  ): Promise<AxiosResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': encodeURIComponent(
        `attachment; filename="${file.name}"`,
      ),
    };

    // 创建独立的 axios 实例，不使用拦截器
    return axios({
      method: 'put',
      url,
      data: file,
      headers,
      onUploadProgress,
    });
  }
  public async download(config: RequestConfig & { filename?: string }) {
    try {
      const requestConfig: RequestConfig = {
        ...config,
        skipResponseCodeCheck: true,
        responseType: 'blob',
      };
      const res = await this.instance(requestConfig);

      const contentDisposition =
        (res.headers?.['content-disposition'] as string | undefined) ||
        (res.headers?.['Content-Disposition'] as string | undefined);
      const fileNameFromHeader =
        parseFilenameFromContentDisposition(contentDisposition);
      const filename = config.filename || fileNameFromHeader || 'download';
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      const showError = config.showError !== false;
      if (showError) {
        showToast(i18n.t('network.downloadFailed'), 'error');
      }
      return await Promise.reject(err);
    }
  }

  public getInstance(): AxiosInstance {
    return this.instance;
  }
}

// 创建实例
const httpInstance = new HttpRequest();

// 函数形式导出
const httpRequest = <T = any>(config: RequestConfig): Promise<ApiResponse<T>> =>
  httpInstance.httpRequest<T>(config);

// 挂载方法
httpRequest.get = httpInstance.get.bind(httpInstance);
httpRequest.post = httpInstance.post.bind(httpInstance);
httpRequest.upload = httpInstance.upload.bind(httpInstance);
httpRequest.putUploadToPreSignUrl =
  httpInstance.putUploadToPreSignUrl.bind(httpInstance);
httpRequest.download = httpInstance.download.bind(httpInstance);
const requestInstance = httpInstance.getInstance();
export { httpRequest };
export default requestInstance;
