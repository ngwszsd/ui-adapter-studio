import ky, { type Options } from 'ky';

/* ---- 类型定义 ---- */

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export type ProgressHandler = (progress: {
  percent: number;
  transferred: number;
  total: number;
}) => void;

export interface RequestParams extends Omit<Options, 'json' | 'searchParams' | 'body'> {
  url: string;
  data?: Record<string, unknown> | unknown[] | null;
}

export interface UploadParams extends Omit<Options, 'json' | 'searchParams' | 'body' | 'method' | 'onUploadProgress'> {
  url: string;
  body: FormData | Blob | File;
  onUploadProgress?: ProgressHandler;
}

export interface DownloadParams extends Omit<Options, 'json' | 'searchParams' | 'body' | 'method' | 'onDownloadProgress'> {
  url: string;
  data?: Record<string, unknown> | null;
  onDownloadProgress?: ProgressHandler;
}

/* ---- ky 实例 ---- */

const normalizeUrl = (url: string) => url.replace(/^\//, '');

const api = ky.create({
  timeout: 30_000,
  retry: 1,
  hooks: {
    beforeRequest: [
      (request) => {
        // 请求拦截：可在此添加 token 等通用 headers
        const token = typeof localStorage !== 'undefined'
          ? localStorage.getItem('token')
          : null;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        // 响应拦截：可在此处理通用错误码
        if (!response.ok) {
          console.warn(`[http] ${response.status} ${response.url}`);
        }
        return response;
      },
    ],
  },
});

/* ---- 请求方法 ---- */

export const httpRequest = {
  async get<T = unknown>(params: RequestParams): Promise<ApiResponse<T>> {
    const { url, data, ...rest } = params;
    return api
      .get(normalizeUrl(url), {
        searchParams: data as Record<string, string | number | boolean> | undefined,
        ...rest,
      })
      .json<ApiResponse<T>>();
  },

  async post<T = unknown>(params: RequestParams): Promise<ApiResponse<T>> {
    const { url, data, ...rest } = params;
    return api
      .post(normalizeUrl(url), {
        json: data ?? undefined,
        ...rest,
      })
      .json<ApiResponse<T>>();
  },

  async put<T = unknown>(params: RequestParams): Promise<ApiResponse<T>> {
    const { url, data, ...rest } = params;
    return api
      .put(normalizeUrl(url), {
        json: data ?? undefined,
        ...rest,
      })
      .json<ApiResponse<T>>();
  },

  async delete<T = unknown>(params: RequestParams): Promise<ApiResponse<T>> {
    const { url, data, ...rest } = params;
    return api
      .delete(normalizeUrl(url), {
        searchParams: data as Record<string, string | number | boolean> | undefined,
        ...rest,
      })
      .json<ApiResponse<T>>();
  },

  async upload<T = unknown>(params: UploadParams): Promise<ApiResponse<T>> {
    const { url, body, onUploadProgress, ...rest } = params;
    return api
      .post(normalizeUrl(url), {
        body,
        onUploadProgress: onUploadProgress
          ? (progress) =>
              onUploadProgress({
                percent: progress.percent,
                transferred: progress.transferredBytes,
                total: progress.totalBytes,
              })
          : undefined,
        ...rest,
      })
      .json<ApiResponse<T>>();
  },

  async download(params: DownloadParams): Promise<Blob> {
    const { url, data, onDownloadProgress, ...rest } = params;
    return api
      .get(normalizeUrl(url), {
        searchParams: data as Record<string, string | number | boolean> | undefined,
        onDownloadProgress: onDownloadProgress
          ? (progress) =>
              onDownloadProgress({
                percent: progress.percent,
                transferred: progress.transferredBytes,
                total: progress.totalBytes,
              })
          : undefined,
        ...rest,
      })
      .blob();
  },
};

/* ---- 兼容导出（供现有代码直接使用 ky 实例） ---- */

export { api as http };
