import React from 'react';
import { GripVertical, Code2, Copy, Check } from 'lucide-react';
import { KeepScale } from 'react-zoom-pan-pinch';
import { Popover, PopoverTrigger, PopoverContent } from '@teamhelper/ui';

import type { ARPageConfig } from '../types';
import { AR_VIEWPORT_HEIGHT, AR_VIEWPORT_WIDTH } from '../types';
import { ARPageHeader } from './ARPageHeader';
import { useDesignerStore } from '../store/useDesignerStore';

/* ---- Dev-only JSON 预览按钮 ---- */

const DevJsonPreview = ({ pageId }: { pageId: string }) => {
  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // 页面完整 JSON 仅在弹窗打开时才读取，避免页面头部按钮长期订阅整页数据
  const json = React.useMemo(() => {
    if (!open) return '{}';
    const page = useDesignerStore.getState().pages[pageId];
    if (!page) return '{}';
    return JSON.stringify(page, null, 2);
  }, [open, pageId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="pointer-events-auto rounded bg-slate-100 p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          title="预览页面完整 JSON"
        >
          <Code2 size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-[420px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-semibold text-slate-700">页面完整 JSON</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre className="max-h-[360px] overflow-auto p-3 font-mono text-[11px] leading-relaxed text-slate-600">
          {json}
        </pre>
      </PopoverContent>
    </Popover>
  );
};

interface ViewportProps {
  pageId: string;
  title: string;
  isActive: boolean;
  onActivate: () => void;
  onStartDrag: (event: React.PointerEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  pageConfig?: ARPageConfig;
}

export const Viewport = ({
  pageId,
  title,
  isActive,
  onActivate,
  onStartDrag,
  children,
  pageConfig,
}: ViewportProps) => {
  return (
    <div className="flex select-none flex-col items-start">
      <KeepScale
        style={{ display: 'inline-block' }}
        className="origin-bottom-left pointer-events-none"
      >
        <div
          onPointerDown={onStartDrag}
          className="page-drag-handle pointer-events-auto inline-flex w-fit cursor-grab items-center gap-2 rounded px-0 py-1.5 text-slate-500 active:cursor-grabbing"
        >
          <div className="rounded bg-slate-100 p-1">
            <GripVertical size={14} />
          </div>
          <span className="whitespace-nowrap text-sm font-medium text-slate-700">
            {title}
          </span>
          <span className="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            {AR_VIEWPORT_WIDTH} x {AR_VIEWPORT_HEIGHT}
          </span>
          <DevJsonPreview pageId={pageId} />
        </div>
      </KeepScale>

      <div
        className="relative flex flex-col overflow-hidden rounded-xl border shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
        onPointerDown={onActivate}
        style={{
          width: AR_VIEWPORT_WIDTH,
          height: AR_VIEWPORT_HEIGHT,
          background: '#0f172a',
          borderColor: isActive ? '#2563eb' : '#cbd5e1',
          boxShadow: isActive
            ? '0 0 0 2px rgba(37,99,235,0.65), 0 14px 30px rgba(15,23,42,0.12)'
            : '0 14px 30px rgba(15,23,42,0.12)',
        }}
      >
        <ARPageHeader config={pageConfig} />
        <div className="relative min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
};
