import { useEffect, useCallback } from 'react';
import { eventBus } from '@/events';
import type { Events } from '@/events/types';
type EventKey = keyof Events;
type Callback<T> = (payload: T) => void;

interface Options {
  once?: boolean;
}

/**
 *  EventBus Hook
 */
export function useEventEmitter<K extends EventKey>(
  eventName: K | K[], //订阅的事件名称，可以是单个事件或者事件数组（批量订阅）
  callback?: Callback<Events[K]>, // 事件触发时的回调函数
  options?: Options, // 可选配置，once: true 表示只触发一次，触发后自动移除监听
) {
  useEffect(() => {
    if (!callback) return;

    const names = Array.isArray(eventName) ? eventName : [eventName];

    const handlers: Array<[EventKey, Callback<any>]> = [];

    names.forEach((name) => {
      if (options?.once) {
        const wrapper = (payload: Events[typeof name]) => {
          callback(payload);
          eventBus.off(name, wrapper);
        };
        eventBus.on(name, wrapper);
        handlers.push([name, wrapper]);
      } else {
        eventBus.on(name, callback);
        handlers.push([name, callback]);
      }
    });

    return () => {
      handlers.forEach(([name, handler]) => {
        eventBus.off(name, handler);
      });
    };
  }, [eventName, callback, options?.once]);

  const emit = useCallback(
    (payload?: Events[K]) => {
      const names = Array.isArray(eventName) ? eventName : [eventName];
      names.forEach((name) => eventBus.emit(name, payload as any));
    },
    [eventName],
  );

  return emit;
}
