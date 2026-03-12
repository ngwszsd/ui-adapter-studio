import React from 'react';
import { ChevronRight, Info } from 'lucide-react';
import {
  InputNumber,
  Switch,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@teamhelper/ui';
import type { PositionType, SizeMode, SizeLimitType } from '../../types';

/* ---- 通用小组件 ---- */

export const NumberInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <InputNumber
    value={value}
    onChange={(v) => onChange(v ?? value)}
    size="small"
  />
);

export const isHexColor = (value: string) =>
  /^#([0-9a-fA-F]{3}){1,2}$/.test(value.trim());

/* ---- 属性行 ---- */

/* ---- 信息提示图标 ---- */

export const InfoTip = ({ content }: { content: string }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="shrink-0 text-slate-400 hover:text-slate-600">
          <Info size={12} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-60 whitespace-pre-line text-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const SwitchRow = ({
  label,
  tip,
  checked,
  onChange,
}: {
  label: string;
  tip?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center gap-2 py-1.5">
    <span className="shrink-0 text-xs text-slate-600">{label}</span>
    {tip && <InfoTip content={tip} />}
    <div className="flex-1" />
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export const NumberRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <span className="shrink-0 text-xs text-slate-600">{label}</span>
    <div className="w-20">
      <NumberInput value={value} onChange={onChange} />
    </div>
  </div>
);

/** 布局属性行（label + 控件） */
export const LayoutRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-2 py-1.5">
    <span className="shrink-0 text-xs text-slate-600">{label}</span>
    {children}
  </div>
);

/* ---- 属性行 ---- */

export const POSITION_OPTIONS: { value: PositionType; label: string }[] = [
  { value: 'relative', label: '相对定位' },
  { value: 'absolute', label: '绝对定位' },
  { value: 'fixed', label: '固定定位' },
];

export const SIZE_MODE_OPTIONS: { value: SizeMode; label: string }[] = [
  { value: 'fixed', label: '固定' },
  { value: 'fill', label: '填充容器' },
  { value: 'percent', label: '百分比' },
  { value: 'fit-content', label: '适应内容' },
];

export const SIZE_LIMIT_OPTIONS: { value: SizeLimitType; label: string }[] = [
  { value: 'maxWidth', label: '最大宽度' },
  { value: 'maxHeight', label: '最大高度' },
  { value: 'minWidth', label: '最小宽度' },
  { value: 'minHeight', label: '最小高度' },
];

export const WIDTH_TIPS = `固定宽：
元素的宽度是固定的像素值，不会随容器大小变化。

填充容器：
元素宽度填满容器的可用空间。

百分比：
元素宽度是宽度/容器宽度的百分比。

适应内容：
元素的宽度会根据内容的大小自动调整。`;

export const HEIGHT_TIPS = `固定高：
元素的高度是固定的像素值，不会随容器大小变化。

填充容器：
元素高度填满容器的可用空间。

百分比：
元素高度是高度/容器高度的百分比。

适应内容：
元素的高度会根据内容的大小自动调整。`;

export const SIZE_LIMIT_TIPS = `最大宽度/高度：
即使元素内容或容器允许更大的宽度/高度，元素的宽度/高度也不会超过这个值。可用于防止图片或文本区域过宽。

最小宽度/高度：
即使元素内容或容器允许更小的宽度/高度，元素的宽度/高度也不会小于这个值。可用于防止按钮或输入框变得太窄。`;

/* ---- 尺寸维度行 ---- */

export const SizeDimensionRow = ({
  label,
  tips,
  mode,
  value,
  onModeChange,
  onValueChange,
}: {
  label: string;
  tips: string;
  mode: SizeMode;
  value: number;
  onModeChange: (mode: SizeMode) => void;
  onValueChange: (value: number) => void;
}) => (
  <div className="space-y-1 py-1.5">
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-600">{label}</span>
      <InfoTip content={tips} />
    </div>
    <div className="flex items-center gap-2">
      <Select value={mode} onValueChange={(v) => onModeChange(v as SizeMode)}>
        <SelectTrigger className="h-7 flex-1 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SIZE_MODE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {mode !== 'fit-content' && mode !== 'fill' && (
        <div className="flex w-24 items-center">
          <InputNumber
            value={value}
            onChange={(v) => onValueChange(v ?? value)}
            size="small"
            min={0}
            className="flex-1"
          />
          <span className="ml-1 shrink-0 text-xs text-slate-400">
            {mode === 'fixed' ? 'px' : '%'}
          </span>
        </div>
      )}
    </div>
  </div>
);

/* ---- 可折叠区块 ---- */

export const CollapsibleSection = ({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900"
      >
        {title}
        <ChevronRight
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && <div className="pb-2 pl-1">{children}</div>}
    </div>
  );
};
