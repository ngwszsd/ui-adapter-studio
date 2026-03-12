// src/locales/en.ts
const en = {
  'hello.m': 'Hello',
  welcome: 'Welcome, {{name}}!',
} as const;

export type EnKey = keyof typeof en;
export default en;
