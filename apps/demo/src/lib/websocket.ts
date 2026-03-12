// src/lib/websocket.ts
/**
 * WebSocket 单例管理器
 *
 * 功能特性：
 * - 全局唯一实例（单例模式）
 * - 自动重连机制（可配置间隔与最大重试次数）
 * - 心跳保活（可选）
 * - 支持 onOpen / onMessage / onError / onClose 全生命周期监听
 * - 消息自动 JSON 序列化/反序列化（非 JSON 字符串原样透传）
 * - 内存安全：提供 offXXX 方法用于移除监听器，避免内存泄漏
 */

type MessageListener = (data: any) => void; // 消息监听回调类型
type ErrorListener = (error: Event) => void; // 错误监听回调类型
type OpenListener = () => void; // 连接成功监听回调类型
type CloseListener = (event: CloseEvent) => void; // 连接关闭监听回调类型（含关闭码和原因）

/**
 * WebSocket 初始化配置项
 */
type WsOptions = {
  /** 重连间隔（毫秒），默认 3000ms */
  reconnectInterval?: number;
  /** 最大重连尝试次数，-1 表示无限重试，默认 -1 */
  maxReconnectAttempts?: number;
  /** 心跳发送间隔（毫秒），<=0 表示不启用心跳，默认 0 */
  heartbeatInterval?: number;
  /** 心跳消息内容，可以是字符串或对象，默认 'ping' */
  heartbeatMessage?: any;
};

// ========== WebSocket 管理类 ==========
class WebSocketManager {
  // WebSocket 实例
  private socket: WebSocket | null = null;
  // WebSocket 连接地址
  private url: string = '';

  // 各类事件监听器列表
  private messageListeners: MessageListener[] = [];
  private errorListeners: ErrorListener[] = [];
  private openListeners: OpenListener[] = [];
  private closeListeners: CloseListener[] = [];

  // 重连相关状态
  private reconnectAttempts = 0; // 当前已重连次数
  private isManuallyClosed = false; // 是否由用户主动关闭（主动关闭时不重连）

  // 心跳定时器 ID
  private heartbeatTimer: number | null = null;

  // 合并后的配置（带默认值）
  private options: Required<WsOptions> = {
    reconnectInterval: 3000,
    maxReconnectAttempts: -1,
    heartbeatInterval: 0,
    heartbeatMessage: 'ping',
  };

  // 单例实例
  private static instance: WebSocketManager;

  /**
   * 私有构造函数，防止外部 new 实例
   */
  private constructor() {}

  /**
   * 获取 WebSocketManager 的单例实例
   */
  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * 初始化 WebSocket 连接
   * @param url WebSocket 服务端地址（如 wss://example.com/ws）
   * @param options 可选配置项
   */
  init(url: string, options: WsOptions = {}) {
    this.url = url;
    this.options = { ...this.options, ...options };
    this.isManuallyClosed = false; // 重置手动关闭标志
    this.connect(); // 尝试连接
  }

  /**
   * 创建 WebSocket 连接
   */
  private connect() {
    try {
      this.socket = new WebSocket(this.url);

      // 连接成功
      this.socket.onopen = () => {
        console.log('[WebSocket] 连接已建立');
        this.reconnectAttempts = 0; // 重置重连计数
        this.startHeartbeat(); // 启动心跳
        // 通知所有 onOpen 监听器
        this.openListeners.forEach((cb) => cb());
      };

      // 收到消息
      this.socket.onmessage = (event) => {
        let data: any;
        // 尝试解析 JSON，失败则保留原始字符串
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          data = event.data;
        }
        // 分发给所有消息监听器
        this.messageListeners.forEach((listener) => listener(data));
      };

      // 连接错误（如网络不通、证书错误等）
      this.socket.onerror = (error) => {
        console.error('[WebSocket] 连接发生错误:', error);
        // 通知所有错误监听器
        this.errorListeners.forEach((listener) => listener(error));
      };

      // 连接关闭（包括正常关闭和异常断开）
      this.socket.onclose = (event) => {
        console.log(
          `[WebSocket] 连接已关闭 (code: ${event.code}, reason: "${event.reason}")`,
        );
        this.stopHeartbeat(); // 停止心跳
        // 通知所有关闭监听器
        this.closeListeners.forEach((cb) => cb(event));
        // 如果不是用户主动关闭，则尝试重连
        if (!this.isManuallyClosed) {
          this.tryReconnect();
        }
      };
    } catch (error) {
      // new WebSocket() 时可能抛出 JS 异常（如 URL 格式错误）
      console.error('[WebSocket] 创建连接时发生异常:', error);
      // 构造一个虚拟错误事件供业务层处理
      const fakeError = new Event('ws-create-failed');
      this.errorListeners.forEach((listener) => listener(fakeError));
      this.tryReconnect();
    }
  }

  /**
   * 尝试重新连接
   */
  private tryReconnect() {
    // 检查是否达到最大重连次数限制
    if (
      this.options.maxReconnectAttempts > 0 &&
      this.reconnectAttempts >= this.options.maxReconnectAttempts
    ) {
      console.warn('[WebSocket] 已达到最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WebSocket] 第 ${this.reconnectAttempts} 次重连，将在 ${this.options.reconnectInterval}ms 后尝试...`,
    );
    setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * 启动心跳定时器
   */
  private startHeartbeat() {
    // 若未配置心跳或已启动，则不重复启动
    if (this.options.heartbeatInterval <= 0) return;
    this.stopHeartbeat(); // 先清除旧定时器

    this.heartbeatTimer = window.setInterval(() => {
      // 仅在连接就绪时发送心跳
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send(this.options.heartbeatMessage);
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 停止心跳定时器
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 发送消息
   * @param data 要发送的数据（对象会自动转为 JSON 字符串）
   */
  send(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(payload);
    } else {
      console.warn(
        '[WebSocket] 连接未就绪（当前状态:',
        this.socket?.readyState,
        '），无法发送消息',
      );
    }
  }

  // ========== 对外暴露的监听/取消监听方法 ==========

  onMessage(listener: MessageListener) {
    this.messageListeners.push(listener);
  }

  offMessage(listener: MessageListener) {
    const index = this.messageListeners.indexOf(listener);
    if (index > -1) this.messageListeners.splice(index, 1);
  }

  onError(listener: ErrorListener) {
    this.errorListeners.push(listener);
  }

  offError(listener: ErrorListener) {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) this.errorListeners.splice(index, 1);
  }

  onOpen(listener: OpenListener) {
    this.openListeners.push(listener);
  }

  offOpen(listener: OpenListener) {
    const index = this.openListeners.indexOf(listener);
    if (index > -1) this.openListeners.splice(index, 1);
  }

  onClose(listener: CloseListener) {
    this.closeListeners.push(listener);
  }

  offClose(listener: CloseListener) {
    const index = this.closeListeners.indexOf(listener);
    if (index > -1) this.closeListeners.splice(index, 1);
  }

  /**
   * 主动关闭连接（关闭后不会自动重连）
   */
  close() {
    this.isManuallyClosed = true;
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close(); // 可扩展：支持传入 code 和 reason
      this.socket = null;
    }
  }

  /**
   * 获取当前 WebSocket 连接状态
   * @returns WebSocket.readyState 常量（0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED）或 null
   */
  get readyState(): number | null {
    return this.socket?.readyState ?? null;
  }
}

const ws = WebSocketManager.getInstance();
export default ws;
export { ws };

// todo 使用方式示例
// import ws from '@/lib/websocket';
//
// // 初始化
// ws.init('wss://api.example.com/ws', {
//   heartbeatInterval: 30000,
//   reconnectInterval: 5000,
// });
//
// // 连接成功
// ws.onOpen(() => {
//   console.log('✅ WebSocket 连接成功！');
//   // 发送鉴权 token
//   ws.send({ type: 'auth', token: localStorage.getItem('token') });
// });
//
// // 收到消息
// ws.onMessage((data) => {
//   console.log('📨 收到消息:', data);
// });
//
// // 连接错误
// ws.onError((error) => {
//   console.error('❌ WebSocket 错误:', error);
//   // 显示提示、上报监控等
// });
//
// // 连接关闭
// ws.onClose((event) => {
//   console.log(`🔌 连接关闭: code=${event.code}, reason="${event.reason}"`);
//   if (event.code === 1008) {
//     // 1008: 策略违规（比如 token 过期）
//     alert('登录已过期，请重新登录');
//     // 跳转登录页...
//   }
// });
//
// // 手动关闭（例如用户退出登录）
// ws.close();

// todo 组件内需要手动移除监听器 ！！！！！
// import React, { useState, useEffect } from 'react';
// import ws from '../lib/websocket';
//
// export default function ChatRoom() {
//   const [messages, setMessages] = useState([]);
//
//   useEffect(() => {
//     const handleMessage = (data) => {
//       setMessages(prev => [...prev, data]);
//     };
//
//     // 添加监听
//     ws.onMessage(handleMessage);
//
//     // ✅ 返回清理函数：组件卸载时自动移除监听器
//     return () => {
//       ws.offMessage(handleMessage);
//     };
//   }, []);
//
//   return (
//     <div>
//       <h2>聊天室</h2>
//   {messages.map((msg, i) => (
//     <p key={i}>{msg.text}</p>
//   ))}
//   </div>
// );
// }
