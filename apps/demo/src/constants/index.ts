export const LS_NAMESPACE_PREFIX = 'TEAMHELPER';

// LocalStorage Keys - 统一管理所有 localStorage 的 key
export const LS_KEYS = {
  // 认证相关
  AUTH_STORAGE: `${LS_NAMESPACE_PREFIX}_AUTH_STORAGE`,
  TOKEN: `${LS_NAMESPACE_PREFIX}_TOKEN`,

  // 用户相关
  USER_STORAGE: `${LS_NAMESPACE_PREFIX}_USER_STORAGE`,

  // 整体Layout
  THEME: `${LS_NAMESPACE_PREFIX}_THEME`,
  LANGUAGE: `${LS_NAMESPACE_PREFIX}_LANGUAGE`,

  // 临时存储
  REGISTER_INFO: `${LS_NAMESPACE_PREFIX}_REGISTER_INFO`,

  // zustand
  MANAGE_DETAIL_STORE: `${LS_NAMESPACE_PREFIX}_manage_detail_store`,
  KNOWLEDGE_DETAIL_STORE: `${LS_NAMESPACE_PREFIX}_knowledge_detail_store`,
} as const;

/** 默认当前页码 */
export const DEFAULT_PAGE_NUM = 0;
/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 10;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;

// 密码验证规则常量
export const PASSWORD_VALIDATION = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 12,
  // 密码必须包含大小写字母、数字和符号
  REGEX: passwordRegex,
} as const;

export const INVITE_KEY = 'invite-code';

// 允许记录重定向的 Key 列表
export const REDIRECT_WHITE_LIST_KEYS = [INVITE_KEY];
