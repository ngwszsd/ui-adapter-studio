/**
 * 通过 Blob URL 创建内联 Web Worker，使用原生 IndexedDB API。
 * 不依赖任何外部模块，因此不需要宿主 bundler 做 Worker 打包支持。
 */

const DB_NAME = 'teamhelper-designer';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

/**
 * Worker 入口函数 — 会被 toString() 后注入 Blob。
 * ⚠️ 此函数内部不能引用外部变量或 import，必须完全自包含。
 */
function workerEntry() {
  const _DB_NAME = 'teamhelper-designer';
  const _DB_VERSION = 1;
  const _STORE_NAME = 'projects';

  let db: IDBDatabase | null = null;

  function openDB(): Promise<IDBDatabase> {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(_DB_NAME, _DB_VERSION);

      req.onupgradeneeded = () => {
        const database = req.result;
        if (!database.objectStoreNames.contains(_STORE_NAME)) {
          database.createObjectStore(_STORE_NAME, { keyPath: 'id' });
        }
      };

      req.onsuccess = () => {
        db = req.result;
        resolve(db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  function txGet(database: IDBDatabase, key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const tx = database.transaction(_STORE_NAME, 'readonly');
      const store = tx.objectStore(_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  function txPut(database: IDBDatabase, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = database.transaction(_STORE_NAME, 'readwrite');
      const store = tx.objectStore(_STORE_NAME);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function txDelete(database: IDBDatabase, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = database.transaction(_STORE_NAME, 'readwrite');
      const store = tx.objectStore(_STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  self.onmessage = async (e: MessageEvent) => {
    const { type, requestId, projectId, payload } = e.data;

    try {
      const database = await openDB();

      switch (type) {
        case 'save': {
          const record = {
            ...payload,
            id: projectId,
            updatedAt: Date.now(),
          };
          await txPut(database, record);
          self.postMessage({ type: 'save:done', requestId });
          break;
        }

        case 'load': {
          const data = await txGet(database, projectId);
          self.postMessage({ type: 'load:done', requestId, data });
          break;
        }

        case 'delete': {
          await txDelete(database, projectId);
          self.postMessage({ type: 'delete:done', requestId });
          break;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: 'error', requestId, message });
    }
  };
}

let cachedUrl: string | null = null;

export function createDesignerWorker(): Worker {
  if (!cachedUrl) {
    const blob = new Blob([`(${workerEntry.toString()})()`], {
      type: 'application/javascript',
    });
    cachedUrl = URL.createObjectURL(blob);
  }
  return new Worker(cachedUrl);
}

/** 数据库名与版本信息，用于外部调试 */
export const DESIGNER_DB = {
  name: DB_NAME,
  version: DB_VERSION,
  store: STORE_NAME,
} as const;
