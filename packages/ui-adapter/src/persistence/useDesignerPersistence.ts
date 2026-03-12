import { useEffect, useMemo, useRef, useState } from 'react';
import { useDesignerStore } from '../store/useDesignerStore';
import { createDesignerWorker } from './createWorker';
import { DesignerDBClient } from './client';

const SAVE_DEBOUNCE_MS = 1000;
export const DEFAULT_DESIGNER_PROJECT_ID = 'default';

/**
 * 画布设计器 IndexedDB 持久化 Hook
 *
 * - mount 时从 IndexedDB（Web Worker 线程）加载数据并 hydrate store
 * - store 变更时 debounce 1s 后通过 Web Worker 写入 IndexedDB
 * - 页面隐藏/关闭时立即触发保存
 * - projectId 变化时会切换到对应的数据分区
 */
export function useDesignerPersistence(
  projectId = DEFAULT_DESIGNER_PROJECT_ID
) {
  const [isLoading, setIsLoading] = useState(true);
  const clientRef = useRef<DesignerDBClient | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalizedProjectId = useMemo(() => {
    const trimmed = projectId.trim();
    return trimmed || DEFAULT_DESIGNER_PROJECT_ID;
  }, [projectId]);

  useEffect(() => {
    let disposed = false;
    setIsLoading(true);

    // 切换不同业务 projectId 时先重置本地 store，
    // 避免上一个单子的页面/节点短暂闪到当前编辑器里。
    useDesignerStore.getState().resetState();

    const worker = createDesignerWorker();
    const client = new DesignerDBClient(worker);
    clientRef.current = client;

    // -------- 加载 --------
    client
      .load(normalizedProjectId)
      .then((data) => {
        if (disposed) return;

        if (data) {
          useDesignerStore.getState().hydrateState(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('[DesignerPersistence] 加载失败:', err);
        if (!disposed) setIsLoading(false);
      });

    // -------- 保存 (debounced subscribe) --------
    const flushSave = () => {
      if (!clientRef.current) return;
      const state = useDesignerStore.getState().getPersistedState();
      clientRef.current.save(normalizedProjectId, state).catch((err) => {
        console.warn('[DesignerPersistence] 保存失败:', err);
      });
    };

    const debouncedSave = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
    };

    // 订阅 store 变更
    let skipFirst = true;
    const unsubscribe = useDesignerStore.subscribe(() => {
      if (skipFirst) {
        skipFirst = false;
        return;
      }
      debouncedSave();
    });

    // -------- 紧急保存：页面隐藏/关闭 --------
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        flushSave();
      }
    };

    const onBeforeUnload = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flushSave();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    // -------- 清理 --------
    return () => {
      disposed = true;
      unsubscribe();

      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);

      if (timerRef.current) clearTimeout(timerRef.current);

      // unmount / projectId 切换前做最后一次保存，延迟 dispose 给 worker 处理时间
      flushSave();
      setTimeout(() => client.dispose(), 500);
    };
  }, [normalizedProjectId]);

  return { isLoading, projectId: normalizedProjectId };
}
