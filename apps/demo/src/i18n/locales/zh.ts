// src/locales/zh.ts
const zh = {
  'hello.m': '你好',
  welcome: '欢迎, {{name}}！',
} as const;

export type ZhKey = keyof typeof zh;
export default zh;
