import type { PersistedDesignerState } from '../types';

/* ------------------------------------------------------------------ */
/*  Worker 消息协议                                                     */
/* ------------------------------------------------------------------ */

interface WorkerRequest {
  type: 'save' | 'load' | 'delete';
  requestId: string;
  projectId: string;
  payload?: unknown;
}

interface WorkerResponse {
  type: 'save:done' | 'load:done' | 'delete:done' | 'error';
  requestId: string;
  data?: unknown;
  message?: string;
}

/* ------------------------------------------------------------------ */
/*  DesignerDBClient                                                   */
/* ------------------------------------------------------------------ */

let counter = 0;
const nextId = () => `req_${++counter}_${Date.now()}`;

export class DesignerDBClient {
  private worker: Worker;
  private pending = new Map<
    string,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { requestId, type, data, message } = e.data;
      const entry = this.pending.get(requestId);
      if (!entry) return;
      this.pending.delete(requestId);

      if (type === 'error') {
        entry.reject(new Error(message ?? 'Worker error'));
      } else {
        entry.resolve(data);
      }
    };
  }

  private request(msg: Omit<WorkerRequest, 'requestId'>): Promise<unknown> {
    const requestId = nextId();
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.worker.postMessage({ ...msg, requestId } satisfies WorkerRequest);
    });
  }

  save(projectId: string, state: PersistedDesignerState): Promise<void> {
    return this.request({
      type: 'save',
      projectId,
      payload: state,
    }) as Promise<void>;
  }

  load(projectId: string): Promise<PersistedDesignerState | null> {
    return this.request({
      type: 'load',
      projectId,
    }) as Promise<PersistedDesignerState | null>;
  }

  delete(projectId: string): Promise<void> {
    return this.request({
      type: 'delete',
      projectId,
    }) as Promise<void>;
  }

  dispose() {
    this.worker.terminate();
    for (const [, entry] of this.pending) {
      entry.reject(new Error('Worker terminated'));
    }
    this.pending.clear();
  }
}
