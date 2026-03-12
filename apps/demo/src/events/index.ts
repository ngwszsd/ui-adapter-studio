import mitt from 'mitt';
import type { Events } from './types';

type EventKey = keyof Events;

class EventBus {
  private emitter = mitt<Events>();
  private listeners = new Map<EventKey, Set<Function>>();

  on<K extends EventKey>(event: K, callback: (payload: Events[K]) => void) {
    this.emitter.on(event, callback);
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
  }

  off<K extends EventKey>(event: K, callback: (payload: Events[K]) => void) {
    this.emitter.off(event, callback);
    this.listeners.get(event)?.delete(callback);
  }

  once<K extends EventKey>(event: K, callback: (payload: Events[K]) => void) {
    const wrapper = (payload: Events[K]) => {
      callback(payload);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  emit<K extends EventKey>(event: K, payload: Events[K]) {
    this.emitter.emit(event, payload);
  }

  clear(event?: EventKey) {
    if (event) {
      this.listeners.get(event)?.forEach((cb) => this.off(event, cb as any));
    } else {
      // 清空所有事件
      this.listeners.forEach((set, evt) =>
        set.forEach((cb) => this.off(evt, cb as any)),
      );
      this.listeners.clear();
    }
  }

  getListeners(event: EventKey) {
    return this.listeners.get(event) ?? new Set();
  }
}

export const eventBus = new EventBus();
export default eventBus;
