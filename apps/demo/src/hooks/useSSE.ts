import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchEventSource } from '@fortaine/fetch-event-source';

export interface UseSSEOptions {
  autoStart?: boolean; // 是否自动启动
  once?: boolean; // 是否只接收一次消息
  onMessage?: (data: any) => void; // 每条消息回调
  onError?: (err: any) => void; // 错误回调
  retry?: number; // 重连间隔 ms
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: any;
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const {
    autoStart = false,
    once = false,
    onMessage,
    onError,
    retry = 3000,
    headers,
    method = 'GET',
    body,
  } = options;

  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    if (controllerRef.current) return; // 已有连接

    const controller = new AbortController();
    controllerRef.current = controller;

    fetchEventSource(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      async onopen(response) {
        if (!response.ok) {
          const err = new Error(`SSE connection failed: ${response.status}`);
          setError(err);
          onError?.(err);
        } else {
          setConnected(true);
        }
      },
      onmessage(event) {
        let parsed;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          parsed = event.data;
        }

        setData((prev) => [...prev, parsed]);
        onMessage?.(parsed);

        if (once) {
          stop();
        }
      },
      onerror(err) {
        setError(err);
        onError?.(err);

        // 自动重连（非 once 情况）
        if (!once) {
          setTimeout(() => {
            if (controllerRef.current) {
              controllerRef.current = null;
              start();
            }
          }, retry);
        }
      },
    });
  }, [url, method, headers, body, retry, onMessage, onError, once]);

  const stop = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (autoStart) start();
    return () => stop();
  }, [autoStart, start, stop]);

  const resetData = useCallback(() => setData([]), []);

  return {
    data,
    error,
    connected,
    start,
    stop,
    resetData, // 清空消息
  };
}
