export type Events = {
  'user-login': { name: string };
  'user-logout': void;
  'theme-change': 'light' | 'dark';
  'chat:message': { from: string; content: string };
  'chat:typing': { from: string; typing: boolean };
  /**
   * Todo 业务事件定义
   */
} & Record<string, any>;
