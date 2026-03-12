import React from 'react';
import {
  InputNumber,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@teamhelper/ui';
import { Plus, Minus, X } from 'lucide-react';
import { ColorPickerPopover } from './ColorPickerPopover';
import type { BorderValue } from '../../types';

/* ---- 预设 ---- */

const BORDER_PRESETS: {
  label: string;
  value: BorderValue;
  preview: React.CSSProperties;
}[] = [
  {
    label: '细实线',
    value: { width: 1, color: '#e2e8f0', style: 'solid' },
    preview: { border: '1px solid #e2e8f0' },
  },
  {
    label: '中实线',
    value: { width: 2, color: '#94a3b8', style: 'solid' },
    preview: { border: '2px solid #94a3b8' },
  },
  {
    label: '粗虚线',
    value: { width: 3, color: '#64748b', style: 'dashed' },
    preview: { border: '3px dashed #64748b' },
  },
];

const STYLE_OPTIONS = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '斑点', value: 'dotted' },
] as const;

const STYLE_LABEL_MAP: Record<string, string> = {
  solid: '实线',
  dashed: '虚线',
  dotted: '斑点',
};

const borderSummary = (b: BorderValue) =>
  `${b.width}px ${STYLE_LABEL_MAP[b.style] ?? b.style} ${b.color}`;

const isPresetMatch = (a: BorderValue, b: BorderValue) =>
  a.width === b.width && a.style === b.style && a.color === b.color;

/* ---- 组件 ---- */

interface BorderEditorPopoverProps {
  value: BorderValue | null;
  onChange: (value: BorderValue | null) => void;
}

export const BorderEditorPopover = ({
  value,
  onChange,
}: BorderEditorPopoverProps) => {
  const [open, setOpen] = React.useState(false);
  const hasBorder = value != null;

  const toggleBorder = () => {
    if (hasBorder) {
      onChange(null);
    } else {
      onChange({ width: 1, color: '#e2e8f0', style: 'solid' });
    }
  };

  const updateField = <K extends keyof BorderValue>(
    field: K,
    v: BorderValue[K]
  ) => {
    if (!value) return;
    onChange({ ...value, [field]: v });
  };

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-10 shrink-0 text-xs text-slate-600">边框</span>
      <div className="flex-1">
        {hasBorder ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-full items-center rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:bg-slate-50"
              >
                <span
                  className="mr-2 h-4 w-4 shrink-0 rounded-sm"
                  style={{
                    border: `${value.width}px ${value.style} ${value.color}`,
                  }}
                />
                <span className="flex-1 truncate text-left">
                  {borderSummary(value)}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-0"
              align="start"
              onOpenAutoFocus={(e: Event) => e.preventDefault()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">边框</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="presets" className="w-full">
                <TabsList className="mx-3 mt-2 w-[calc(100%-24px)]">
                  <TabsTrigger value="presets" className="flex-1 text-xs">
                    预设样式
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1 text-xs">
                    自定义
                  </TabsTrigger>
                </TabsList>

                {/* 预设样式 */}
                <TabsContent value="presets" className="mt-0 px-3 pb-3">
                  <div className="flex gap-2 pt-2">
                    {BORDER_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          onChange(preset.value);
                          setOpen(false);
                        }}
                        className={`flex-1 rounded-lg border-2 p-2 text-center transition-colors ${
                          isPresetMatch(value, preset.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="mb-1 h-5 rounded"
                          style={preset.preview}
                        />
                        <span className="text-[11px] text-slate-600">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                {/* 自定义 */}
                <TabsContent value="custom" className="mt-0 px-3 pb-3">
                  <div className="space-y-2 pt-2">
                    {/* 颜色 */}
                    <div className="flex items-center gap-2">
                      <label className="w-10 shrink-0 text-xs text-slate-500">
                        颜色
                      </label>
                      <div className="flex-1">
                        <ColorPickerPopover
                          value={value.color}
                          onChange={(c) => updateField('color', c)}
                        />
                      </div>
                    </div>
                    {/* 粗细 */}
                    <div className="flex items-center gap-2">
                      <label className="w-10 shrink-0 text-xs text-slate-500">
                        粗细
                      </label>
                      <div className="flex-1">
                        <InputNumber
                          value={value.width}
                          onChange={(v) => {
                            if (v !== null && v >= 0) updateField('width', v);
                          }}
                          min={0}
                          size="small"
                        />
                      </div>
                    </div>
                    {/* 样式 */}
                    <div className="flex items-center gap-2">
                      <label className="w-10 shrink-0 text-xs text-slate-500">
                        样式
                      </label>
                      <div className="flex-1">
                        <Select
                          value={value.style}
                          onValueChange={(v) =>
                            updateField('style', v as BorderValue['style'])
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STYLE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-xs text-slate-400">无边框</span>
        )}
      </div>
      <button
        type="button"
        onClick={toggleBorder}
        className={`shrink-0 rounded p-1 ${
          hasBorder
            ? 'text-rose-400 hover:bg-rose-50'
            : 'text-slate-400 hover:bg-slate-100'
        }`}
        title={hasBorder ? '移除边框' : '添加边框'}
      >
        {hasBorder ? <Minus size={14} /> : <Plus size={14} />}
      </button>
    </div>
  );
};
