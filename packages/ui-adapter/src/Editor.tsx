import React from 'react';
import { ChevronLeft, Download, Layers3, Settings } from 'lucide-react';
import { Canvas } from './Canvas';
import { Toolbox } from './Toolbox';
import { useDesignerStore } from './store/useDesignerStore';
import {
  DEFAULT_DESIGNER_PROJECT_ID,
  useDesignerPersistence,
} from './persistence';
import { useDesignerPortalContainer } from './utils/portal';

const LazyPropertyPanel = React.lazy(() =>
  import('./PropertyPanel').then((mod) => ({ default: mod.PropertyPanel }))
);

const HIDDEN_SCROLLBAR_STYLES = `
[data-scrollable] {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

[data-scrollable]::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
`;

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
};

export interface EditorProps {
  // 建议由宿主传入业务唯一标识（如 uiOrderId / projectId），用于隔离每份设计器数据
  projectId?: string;
}

export const Editor = ({
  projectId = DEFAULT_DESIGNER_PROJECT_ID,
}: EditorProps) => {
  const { portalRef, DesignerPortalProvider } = useDesignerPortalContainer();
  const { isLoading } = useDesignerPersistence(projectId);
  const pageCount = useDesignerStore((state) => state.pageOrder.length);
  const exportData = useDesignerStore((state) => state.exportData);
  const activeNode = useDesignerStore((state) => state.activeNode);
  const removeActiveNode = useDesignerStore((state) => state.removeActiveNode);

  const handleExport = React.useCallback(() => {
    // Keep the export action side-effect free for integrators.
    console.info(exportData());
  }, [exportData]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeNode) return;
      if (event.defaultPrevented || event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      removeActiveNode();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeNode, removeActiveNode]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center bg-[#eef1f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <span className="text-sm text-slate-500">加载设计数据...</span>
        </div>
      </div>
    );
  }

  return (
    <DesignerPortalProvider value={portalRef}>
      <style>{HIDDEN_SCROLLBAR_STYLES}</style>
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[#eef1f6]">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-blue-600 px-2 py-1 text-xs font-bold tracking-wide text-white">
                AR
              </div>
              <span className="text-sm font-semibold text-slate-900">
                AR UI 设计器
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                {pageCount} 页面
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Settings size={15} />
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Download size={14} />
              导出 JSON
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 overflow-hidden">
          <Toolbox />
          <section className="min-h-0 min-w-0 flex-1">
            <Canvas />
          </section>
          <React.Suspense
            fallback={<aside className="h-full w-[320px] shrink-0 border-l border-slate-200 bg-white" />}
          >
            <LazyPropertyPanel />
          </React.Suspense>
        </main>
      </div>
      <div ref={portalRef} />
    </DesignerPortalProvider>
  );
};
