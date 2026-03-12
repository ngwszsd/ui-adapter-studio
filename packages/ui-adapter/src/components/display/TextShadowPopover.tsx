import React from 'react';
import {
  InputNumber,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@teamhelper/ui';
import { Plus, Minus, X } from 'lucide-react';
import { ColorPickerPopover } from '../shared/ColorPickerPopover';
import type { TextShadowConfig } from '../../types';

const shadowSummary = (s: TextShadowConfig) =>
  `${s.x},${s.y} blur:${s.blur}`;

const resolveCss = (s: TextShadowConfig) =>
  `${s.x}px ${s.y}px ${s.blur}px ${s.color}`;

interface TextShadowPopoverProps {
  value: TextShadowConfig | null;
  onChange: (value: TextShadowConfig | null) => void;
}

export const TextShadowPopover = ({
  value,
  onChange,
}: TextShadowPopoverProps) => {
  const [open, setOpen] = React.useState(false);
  const hasShadow = value != null;

  const toggleShadow = () => {
    if (hasShadow) {
      onChange(null);
    } else {
      onChange({ x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.25)' });
    }
  };

  const updateField = <K extends keyof TextShadowConfig>(
    field: K,
    v: TextShadowConfig[K],
  ) => {
    if (!value) return;
    onChange({ ...value, [field]: v });
  };

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-14 shrink-0 text-xs text-slate-600">阴影</span>
      <div className="flex-1">
        {hasShadow ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-full items-center rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:bg-slate-50"
              >
                <span
                  className="mr-2 shrink-0 text-sm font-bold"
                  style={{ textShadow: resolveCss(value) }}
                >
                  T
                </span>
                <span className="flex-1 truncate text-left">
                  {shadowSummary(value)}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-0"
              align="start"
              onOpenAutoFocus={(e: Event) => e.preventDefault()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">文字阴影</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 px-3 py-3">
                {/* X偏移 */}
                <div className="flex items-center gap-2">
                  <label className="w-14 shrink-0 text-xs text-slate-500">X偏移</label>
                  <div className="flex-1">
                    <InputNumber
                      value={value.x}
                      onChange={(v) => updateField('x', v ?? 0)}
                      size="small"
                    />
                  </div>
                </div>
                {/* Y偏移 */}
                <div className="flex items-center gap-2">
                  <label className="w-14 shrink-0 text-xs text-slate-500">Y偏移</label>
                  <div className="flex-1">
                    <InputNumber
                      value={value.y}
                      onChange={(v) => updateField('y', v ?? 0)}
                      size="small"
                    />
                  </div>
                </div>
                {/* 模糊 */}
                <div className="flex items-center gap-2">
                  <label className="w-14 shrink-0 text-xs text-slate-500">模糊</label>
                  <div className="flex-1">
                    <InputNumber
                      value={value.blur}
                      onChange={(v) => {
                        if (v !== null && v >= 0) updateField('blur', v);
                      }}
                      min={0}
                      size="small"
                    />
                  </div>
                </div>
                {/* 颜色 */}
                <div className="flex items-center gap-2">
                  <label className="w-14 shrink-0 text-xs text-slate-500">颜色</label>
                  <div className="flex-1">
                    <ColorPickerPopover
                      value={value.color}
                      onChange={(c) => updateField('color', c)}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-xs text-slate-400">无阴影</span>
        )}
      </div>
      <button
        type="button"
        onClick={toggleShadow}
        className={`shrink-0 rounded p-1 ${
          hasShadow
            ? 'text-rose-400 hover:bg-rose-50'
            : 'text-slate-400 hover:bg-slate-100'
        }`}
        title={hasShadow ? '移除阴影' : '添加阴影'}
      >
        {hasShadow ? <Minus size={14} /> : <Plus size={14} />}
      </button>
    </div>
  );
};
