// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入全局语言资源
import en from './locales/en.json';
import zh from './locales/zh.json';

// 导入页面级语言资源
import forgetPasswordEn from '../pages/ForgetPassword/locales/en.json';
import forgetPasswordZh from '../pages/ForgetPassword/locales/zh.json';
import manageZh from '../pages/Manage/locales/zh.json';
import manageEn from '../pages/Manage/locales/en.json';
import manageDetailZh from '../pages/ManageDetail/locales/zh.json';
import manageDetailEn from '../pages/ManageDetail/locales/en.json';
import knowledgeZh from '../pages/ManageDetail/locales/knowledge/zh.json';
import knowledgeEn from '../pages/ManageDetail/locales/knowledge/en.json';

import useInfoZh from '../pages/UserInfo/locales/zh.json';
import useInfoEn from '../pages/UserInfo/locales/en.json';
// 组件命名空间
import componentsEn from '../components/locales/en.json';
import componentsZh from '../components/locales/zh.json';
// 其他页面命名空间
import notFoundEn from '../pages/NotFound/locales/en.json';
import notFoundZh from '../pages/NotFound/locales/zh.json';
import loginEn from '../pages/Login/locales/en.json';
import loginZh from '../pages/Login/locales/zh.json';
import { LS_KEYS } from '@/constants';

// 从localStorage获取保存的语言，如果没有则使用默认语言
const savedLanguage = localStorage.getItem(LS_KEYS.LANGUAGE) || 'zh';

// 统一导出默认命名空间（保持运行时与类型一致）
export const DEFAULT_NS = 'translation' as const;

// 导出 resources，并使用 as const 保持命名空间键为字面量类型
export const resources = {
  en: {
    translation: en,
    forgetPassword: forgetPasswordEn,
    manage: manageEn,
    manageDetail: manageDetailEn,
    components: componentsEn,
    notFound: notFoundEn,
    login: loginEn,
    userInfo: useInfoEn,
    knowledge: knowledgeEn,
  },
  zh: {
    translation: zh,
    forgetPassword: forgetPasswordZh,
    manage: manageZh,
    manageDetail: manageDetailZh,
    components: componentsZh,
    notFound: notFoundZh,
    login: loginZh,
    userInfo: useInfoZh,
    knowledge: knowledgeZh,
  },
} as const;

i18n
  .use(initReactI18next) // 绑定 React
  .init({
    lng: savedLanguage, // 使用保存的语言
    resources,
    ns: Object.keys(resources.en), // 指定命名空间
    defaultNS: DEFAULT_NS, // 默认命名空间
    fallbackLng: 'zh', // 找不到语言时默认使用
    interpolation: {
      escapeValue: false, // React 已经安全处理
    },
  });

export default i18n;
