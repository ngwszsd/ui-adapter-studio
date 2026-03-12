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
} from '@teamhelper/ui';
import { Plus, Minus, X } from 'lucide-react';
import { ColorPickerPopover } from './ColorPickerPopover';
import type { ShadowValue, ShadowType } from '../../types';

/* ---- 预设 ---- */

const SHADOW_PRESETS: {
  label: string;
  value: ShadowValue;
  css: string;
}[] = [
  {
    label: '轻柔',
    value: {
      type: 'outer',
      x: 0,
      y: 1,
      blur: 3,
      spread: 0,
      color: 'rgba(0,0,0,0.12)',
    },
    css: '0 1px 3px 0 rgba(0,0,0,0.12)',
  },
  {
    label: '中等',
    value: {
      type: 'outer',
      x: 0,
      y: 4,
      blur: 6,
      spread: -1,
      color: 'rgba(0,0,0,0.15)',
    },
    css: '0 4px 6px -1px rgba(0,0,0,0.15)',
  },
  {
    label: '强烈',
    value: {
      type: 'outer',
      x: 0,
      y: 10,
      blur: 15,
      spread: -3,
      color: 'rgba(0,0,0,0.2)',
    },
    css: '0 10px 15px -3px rgba(0,0,0,0.2)',
  },
  {
    label: '上浮',
    value: {
      type: 'outer',
      x: 0,
      y: 20,
      blur: 25,
      spread: -5,
      color: 'rgba(0,0,0,0.15)',
    },
    css: '0 20px 25px -5px rgba(0,0,0,0.15)',
  },
  {
    label: '内凹',
    value: {
      type: 'inset',
      x: 0,
      y: 2,
      blur: 4,
      spread: 0,
      color: 'rgba(0,0,0,0.15)',
    },
    css: 'inset 0 2px 4px 0 rgba(0,0,0,0.15)',
  },
  {
    label: '发光',
    value: {
      type: 'outer',
      x: 0,
      y: 0,
      blur: 12,
      spread: 2,
      color: 'rgba(59,130,246,0.5)',
    },
    css: '0 0 12px 2px rgba(59,130,246,0.5)',
  },
];

const TYPE_LABEL_MAP: Record<ShadowType, string> = {
  outer: '投影',
  inset: '内阴影',
};

const shadowSummary = (s: ShadowValue) =>
  `${TYPE_LABEL_MAP[s.type]} ${s.x},${s.y} ${s.blur}/${s.spread}`;

const isPresetMatch = (a: ShadowValue, b: ShadowValue) =>
  a.type === b.type &&
  a.x === b.x &&
  a.y === b.y &&
  a.blur === b.blur &&
  a.spread === b.spread &&
  a.color === b.color;

const resolveShadowCss = (v: ShadowValue): string =>
  `${v.type === 'inset' ? 'inset ' : ''}${v.x}px ${v.y}px ${v.blur}px ${v.spread}px ${v.color}`;

/* ---- 组件 ---- */

interface ShadowEditorPopoverProps {
  value: ShadowValue | null;
  onChange: (value: ShadowValue | null) => void;
}

export const ShadowEditorPopover = ({
  value,
  onChange,
}: ShadowEditorPopoverProps) => {
  const [open, setOpen] = React.useState(false);
  const hasShadow = value != null;

  const toggleShadow = () => {
    if (hasShadow) {
      onChange(null);
    } else {
      onChange({
        type: 'outer',
        x: 0,
        y: 1,
        blur: 3,
        spread: 0,
        color: 'rgba(0,0,0,0.12)',
      });
    }
  };

  const updateField = <K extends keyof ShadowValue>(
    field: K,
    v: ShadowValue[K]
  ) => {
    if (!value) return;
    onChange({ ...value, [field]: v });
  };

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-10 shrink-0 text-xs text-slate-600">阴影</span>
      <div className="flex-1">
        {hasShadow ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-full items-center rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:bg-slate-50"
              >
                <span
                  className="mr-2 h-4 w-4 shrink-0 rounded-sm bg-white"
                  style={{ boxShadow: resolveShadowCss(value) }}
                />
                <span className="flex-1 truncate text-left">
                  {shadowSummary(value)}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-0"
              align="start"
              onOpenAutoFocus={(e: Event) => e.preventDefault()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">阴影</span>
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
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {SHADOW_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          onChange(preset.value);
                          setOpen(false);
                        }}
                        className={`rounded-lg border-2 p-2 text-center transition-colors ${
                          isPresetMatch(value, preset.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="mx-auto mb-1 h-6 w-6 rounded bg-white"
                          style={{ boxShadow: preset.css }}
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
                    {/* 样式 */}
                    <div className="flex items-center gap-2">
                      <label className="w-14 shrink-0 text-xs text-slate-500">
                        样式
                      </label>
                      <div className="flex-1">
                        <Tabs
                          value={value.type}
                          onValueChange={(v) =>
                            updateField('type', v as ShadowType)
                          }
                          className="w-full"
                        >
                          <TabsList className="w-full">
                            <TabsTrigger
                              value="outer"
                              className="flex-1 text-xs"
                            >
                              投影阴影
                            </TabsTrigger>
                            <TabsTrigger
                              value="inset"
                              className="flex-1 text-xs"
                            >
                              内阴影
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>
                    {/* X偏移 */}
                    <div className="flex items-center gap-2">
                      <label className="w-14 shrink-0 text-xs text-slate-500">
                        X偏移
                      </label>
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
                      <label className="w-14 shrink-0 text-xs text-slate-500">
                        Y偏移
                      </label>
                      <div className="flex-1">
                        <InputNumber
                          value={value.y}
                          onChange={(v) => updateField('y', v ?? 0)}
                          size="small"
                        />
                      </div>
                    </div>
                    {/* 模糊半径 */}
                    <div className="flex items-center gap-2">
                      <label className="w-14 shrink-0 text-xs text-slate-500">
                        模糊
                      </label>
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
                    {/* 扩展半径 */}
                    <div className="flex items-center gap-2">
                      <label className="w-14 shrink-0 text-xs text-slate-500">
                        扩展
                      </label>
                      <div className="flex-1">
                        <InputNumber
                          value={value.spread}
                          onChange={(v) => updateField('spread', v ?? 0)}
                          size="small"
                        />
                      </div>
                    </div>
                    {/* 颜色 */}
                    <div className="flex items-center gap-2">
                      <label className="w-14 shrink-0 text-xs text-slate-500">
                        颜色
                      </label>
                      <div className="flex-1">
                        <ColorPickerPopover
                          value={value.color}
                          onChange={(c) => updateField('color', c)}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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
