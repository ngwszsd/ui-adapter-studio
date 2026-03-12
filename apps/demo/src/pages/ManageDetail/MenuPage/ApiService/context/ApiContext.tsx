import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { GenerateCodeDto } from '../server';
import { nanoid } from 'nanoid';
import i18n from '@/i18n';

/**
 * API 请求的授权配置。
 * 支持 'none' (无), 'bearer' (Token), 和 'basic' (用户名/密码)。
 */
export interface ApiAuth {
  type: 'none' | 'bearer' | 'basic';
  token: string;
  username: string;
  password: string;
}

/**
 * 表示参数或请求头的键值对。
 */
export interface ApiKeyValue {
  id?: string;
  key: string;
  value: string;
  enable: boolean;
}

/**
 * API 请求的请求体配置。
 */
export interface ApiFormDataItem {
  id?: string;
  key: string;
  value: string;
  fileNames?: string[];
  type: 'text' | 'file';
  enable: boolean;
}

/**
 * API 请求的请求体配置。
 */
export interface ApiBody {
  type:
    | 'none'
    | 'application/json'
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data';
  /** JSON 或其他文本请求体的原始内容字符串 */
  content: string;
  /** 用于 multipart 或 urlencoded 请求体的表单数据条目 */
  formData: ApiFormDataItem[];
}

/**
 * API 请求的主要结构。
 */
export interface ApiRequest {
  /** 请求的唯一标识符 */
  id: number;
  /**
   * 所属分组 ID
   */
  groupId?: number;
  /**
   * 请求状态
   * new: 新建的未保存请求
   * existing: 已存在于服务端的请求
   */
  status: 'new' | 'existing';
  /** 请求的显示名称 */
  name: string;
  /** HTTP 方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  /** 请求 URL */
  url: string;
  /** 请求详情视图中当前激活的标签页 */
  activeTab: 'params' | 'body' | 'headers' | 'auth';
  /** 授权设置 */
  auth: ApiAuth;
  /** 查询参数 */
  params: ApiKeyValue[];
  /** 请求头 */
  headers: ApiKeyValue[];
  /** 请求体配置 */
  body: ApiBody;
  /** 响应数据 */
  response?: GenerateCodeDto | null;
}

/**
 * API 管理上下文的全局状态。
 */
export interface ApiState {
  /** 所有打开的请求列表 */
  requests: ApiRequest[];
  /** 当前选中/激活的请求 ID */
  activeRequestId: number | null;
}

/**
 * API Reducer 的所有可能动作的联合类型。
 */
export type ApiAction =
  /** 添加一个新的 API 请求到列表中 */
  | { type: 'ADD_REQUEST'; payload: ApiRequest }
  /** 根据 ID 移除一个 API 请求 */
  | { type: 'REMOVE_REQUEST'; payload: number }
  /** 更新指定 ID 的请求字段 */
  | {
      type: 'UPDATE_REQUEST';
      payload: { id: number; updates: Partial<ApiRequest> };
    }
  /** 设置当前活跃的请求 ID */
  | { type: 'SET_ACTIVE_REQUEST'; payload: number }
  /** 设置当前活跃请求内部展示的标签页（参数/主体/请求头等） */
  | {
      type: 'SET_ACTIVE_TAB';
      payload: 'params' | 'body' | 'headers' | 'auth';
    }
  /** 复制现有的请求 */
  | { type: 'DUPLICATE_REQUEST'; payload: number }
  /** 关闭除了指定 ID 以外的所有其他请求 */
  | { type: 'CLOSE_OTHER_REQUESTS'; payload: number }
  /** 批量移除多个 API 请求（例如删除文件夹时使用） */
  | { type: 'REMOVE_MULTIPLE_REQUESTS'; payload: number[] }
  /** 关闭所有请求并恢复到初始默认状态 */
  | { type: 'CLOSE_ALL_REQUESTS' };

// 初始状态，包含一个默认的空请求
const initialState: ApiState = {
  requests: [
    {
      id: 1,
      status: 'new',
      name: i18n.t('manageDetail:apiService.createCollection.newRequest'),
      method: 'GET',
      url: '',
      activeTab: 'params',
      auth: {
        type: 'none',
        token: '',
        username: '',
        password: '',
      },
      params: [{ id: nanoid(), key: '', value: '', enable: true }],
      headers: [
        {
          id: nanoid(),
          key: 'Content-Type',
          value: 'application/json',
          enable: true,
        },
      ],
      body: {
        type: 'none',
        content: '',
        formData: [],
      },
      response: null,
    },
  ],
  activeRequestId: 1,
};

/**
 * 处理 API Context 状态更新的 Reducer 函数。
 * @param state 当前的 ApiState
 * @param action 分发的 ApiAction
 * @returns 新的 ApiState
 */
function apiReducer(state: ApiState, action: ApiAction): ApiState {
  switch (action.type) {
    case 'ADD_REQUEST':
      // 添加新请求到列表并将其设为激活状态
      return {
        ...state,
        requests: [...state.requests, action.payload],
        activeRequestId: action.payload.id,
      };

    case 'REMOVE_REQUEST':
      // 根据 ID 移除请求。
      const indexToRemove = state.requests.findIndex(
        (req) => req.id === action.payload,
      );
      if (indexToRemove === -1) return state;

      const filteredRequests = state.requests.filter(
        (req) => req.id !== action.payload,
      );

      let newActiveId = state.activeRequestId;

      // 如果移除的是当前激活的请求
      if (state.activeRequestId === action.payload) {
        if (filteredRequests.length === 0) {
          newActiveId = null;
        } else {
          // 尝试选中前一个，如果不存在（即移除的是第一个），则选中当前位置的新的第一个
          const newIndex = indexToRemove > 0 ? indexToRemove - 1 : 0;
          newActiveId = filteredRequests[newIndex].id;
        }
      }

      return {
        ...state,
        requests: filteredRequests,
        activeRequestId: newActiveId,
      };

    case 'UPDATE_REQUEST':
      // 更新由 ID 标识的请求的特定字段
      return {
        ...state,
        requests: state.requests.map((req) =>
          req.id === action.payload.id
            ? { ...req, ...action.payload.updates }
            : req,
        ),
      };

    case 'SET_ACTIVE_REQUEST':
      // 更改当前激活的请求 ID
      return {
        ...state,
        activeRequestId: action.payload,
      };

    case 'SET_ACTIVE_TAB':
      // 更改 *当前激活* 请求的激活标签页 (params/body/headers/auth)
      return {
        ...state,
        requests: state.requests.map((req) =>
          req.id === state.activeRequestId
            ? { ...req, activeTab: action.payload }
            : req,
        ),
      };

    case 'DUPLICATE_REQUEST':
      // 克隆现有请求，赋予新的 ID/名称，并添加到列表中
      const requestToDuplicate = state.requests.find(
        (req) => req.id === action.payload,
      );
      if (!requestToDuplicate) return state;

      const duplicatedRequest: ApiRequest = {
        ...requestToDuplicate,
        id: Date.now(),
        status: 'new',
        name: `${requestToDuplicate.name} ${i18n.t('manageDetail:apiService.tree.copySuffix')}`,
      };

      return {
        ...state,
        requests: [...state.requests, duplicatedRequest],
        activeRequestId: duplicatedRequest.id,
      };

    case 'CLOSE_OTHER_REQUESTS':
      const requestToKeep = state.requests.find(
        (req) => req.id === action.payload,
      );
      if (!requestToKeep) return state;

      return {
        ...state,
        requests: [requestToKeep],
        activeRequestId: requestToKeep.id,
      };

    case 'REMOVE_MULTIPLE_REQUESTS':
      const idsToRemove = action.payload;
      const remainingRequests = state.requests.filter(
        (req) => !idsToRemove.includes(req.id),
      );

      let nextActiveId = state.activeRequestId;

      // 如果当前激活的请求被移除了
      if (
        state.activeRequestId &&
        idsToRemove.includes(state.activeRequestId)
      ) {
        if (remainingRequests.length === 0) {
          nextActiveId = null;
        } else {
          // 选中第一个剩余的请求
          nextActiveId = remainingRequests[0].id;
        }
      }

      return {
        ...state,
        requests: remainingRequests,
        activeRequestId: nextActiveId,
      };

    case 'CLOSE_ALL_REQUESTS':
      const newDefaultRequest = createNewRequest();
      return {
        ...state,
        requests: [newDefaultRequest],
        activeRequestId: newDefaultRequest.id,
      };

    default:
      return state;
  }
}

/**
 * Context 值接口，包含状态、dispatch 函数和当前激活请求的便捷访问对象。
 */
interface ApiContextType {
  state: ApiState;
  dispatch: React.Dispatch<ApiAction>;
  /** 当前激活请求对象的便捷访问器 */
  activeRequest: ApiRequest | null;
}

// 创建 Context
const ApiContext = createContext<ApiContextType | undefined>(undefined);

/**
 * ApiProvider 组件，包裹需要 API 管理状态的应用程序或部分。
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(apiReducer, initialState);

  const activeRequest =
    state.requests.find((req) => req.id === state.activeRequestId) || null;

  return (
    <ApiContext.Provider value={{ state, dispatch, activeRequest }}>
      {children}
    </ApiContext.Provider>
  );
}

/**
 * 访问 API Context 的自定义 Hook。
 * 必须在 ApiProvider 内部使用。
 */
export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi 必须在 ApiProvider 内部使用');
  }
  return context;
}

/**
 * 创建新的默认 API 请求对象的辅助函数。
 * @returns 具有默认值的新 ApiRequest 对象。
 */
export function createNewRequest(): ApiRequest {
  return {
    id: Date.now(),
    status: 'new',
    name: i18n.t('manageDetail:apiService.createCollection.newRequest'),
    method: 'GET',
    url: '',
    activeTab: 'params',
    auth: {
      type: 'none',
      token: '',
      username: '',
      password: '',
    },
    params: [{ id: nanoid(), key: '', value: '', enable: true }],
    headers: [
      {
        id: nanoid(),
        key: 'Content-Type',
        value: 'application/json',
        enable: true,
      },
    ],
    body: {
      type: 'none',
      content: '',
      formData: [],
    },
    response: null,
  };
}
