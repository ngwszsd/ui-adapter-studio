import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  InputNumber,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@teamhelper/ui';
import TemplateInput from '../variable/TemplateInput';
import { useVariablePickerData } from '../variable/useVariablePickerData';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useDesignerStore } from '../../store/useDesignerStore';
import {
  CollapsibleSection,
  SwitchRow,
  InfoTip,
  SizeDimensionRow,
  POSITION_OPTIONS,
  SIZE_LIMIT_OPTIONS,
  WIDTH_TIPS,
  HEIGHT_TIPS,
  SIZE_LIMIT_TIPS,
} from '../shared/property-helpers';
import { ColorPickerPopover } from '../shared/ColorPickerPopover';
import { FourSideInput } from '../shared/FourSideInput';
import { BorderEditorPopover } from '../shared/BorderEditorPopover';
import { ShadowEditorPopover } from '../shared/ShadowEditorPopover';
import { IconPickerPopover } from '../shared/IconPickerPopover';
import type {
  ButtonVariant,
  PositionType,
  SizeMode,
  SizeLimitItem,
  ContainerStyleConfig,
  FourSideValue,
  FourCornerValue,
} from '../../types';

/* ---- 按钮样式常量 ---- */

const VARIANT_OPTIONS: {
  value: ButtonVariant;
  label: string;
  description: string;
  bg: string;
  text: string;
  border?: string;
}[] = [
  {
    value: 'primary',
    label: '主要',
    description: '主要操作按钮',
    bg: '#2563eb',
    text: '#fff',
  },
  {
    value: 'secondary',
    label: '次要',
    description: '次要操作按钮',
    bg: '#475569',
    text: '#fff',
  },
  {
    value: 'outline',
    label: '描边',
    description: '轮廓样式按钮',
    bg: 'transparent',
    text: '#334155',
    border: '#cbd5e1',
  },
  {
    value: 'warning',
    label: '警示',
    description: '警告/危险操作',
    bg: '#dc2626',
    text: '#fff',
  },
];

const DEFAULT_CONTAINER_STYLE: ContainerStyleConfig = {
  background: '#2563eb',
  borderRadius: 8,
  padding: { top: 8, right: 16, bottom: 8, left: 16 },
  margin: 0,
  border: null,
  shadow: null,
};

/* ---- 主面板 ---- */

export const ButtonPropertiesPanel = () => {
  const activeNode = useDesignerStore((s) => s.activeNode);
  const updateProp = useDesignerStore((s) => s.updateActiveNodeProp);
  const removeActiveNode = useDesignerStore((s) => s.removeActiveNode);
  const picker = useVariablePickerData();

  if (!activeNode) return null;

  const p = activeNode.props;

  const variant = (p.variant as ButtonVariant) ?? 'primary';
  const showText = (p.showText as boolean) ?? true;
  const text = String(p.children ?? '点击操作');
  const showIcon = (p.showIcon as boolean) ?? false;
  const iconName = String(p.iconName ?? '');
  const iconColor = String(p.iconColor ?? '#ffffff');

  const positionType = (p.positionType as PositionType) ?? 'relative';
  const positionTop = Number(p.positionTop ?? 0);
  const positionRight = Number(p.positionRight ?? 0);
  const positionBottom = Number(p.positionBottom ?? 0);
  const positionLeft = Number(p.positionLeft ?? 0);

  const widthMode = (p.widthMode as SizeMode) ?? 'fixed';
  const heightMode = (p.heightMode as SizeMode) ?? 'fixed';
  const width = Number(p.width ?? 132);
  const height = Number(p.height ?? 42);
  const sizeLimits = (p.sizeLimits as SizeLimitItem[]) ?? [];

  const cs = (p.containerStyle as ContainerStyleConfig | null) ?? DEFAULT_CONTAINER_STYLE;

  const updateCs = (field: keyof ContainerStyleConfig, value: unknown) => {
    updateProp('containerStyle', { ...cs, [field]: value });
  };

  const existingLimitTypes = new Set(sizeLimits.map((l) => l.type));

  return (
    <section className="space-y-0">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          按钮属性
        </p>
        <button
          type="button"
          onClick={removeActiveNode}
          className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
        >
          <Trash2 size={12} />
          删除
        </button>
      </div>

      {/* ===== 常用设置 ===== */}
      <CollapsibleSection title="常用设置">
        {/* 按钮样式 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">按钮样式</span>
          <Select
            value={variant}
            onValueChange={(v) => updateProp('variant', v)}
          >
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VARIANT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-10 rounded text-center text-[10px] leading-5"
                      style={{
                        backgroundColor: opt.bg,
                        color: opt.text,
                        border: opt.border
                          ? `1px solid ${opt.border}`
                          : 'none',
                      }}
                    >
                      {opt.label}
                    </div>
                    <span className="text-xs text-slate-500">
                      {opt.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 按钮文案 */}
        <SwitchRow
          label="按钮文案"
          checked={showText}
          onChange={(v) => updateProp('showText', v)}
        />

        {/* 内容 */}
        {showText && (
          <div className="flex items-center gap-2 py-1.5">
            <span className="w-14 shrink-0 text-xs text-slate-600">内容</span>
            <div className="flex-1">
              <TemplateInput
                value={text}
                onChange={(v) => updateProp('children', v)}
                placeholder="按钮文案"
                picker={picker}
              />
            </div>
          </div>
        )}

        {/* 图标 */}
        <SwitchRow
          label="图标"
          checked={showIcon}
          onChange={(v) => updateProp('showIcon', v)}
        />

        {/* 图标来源 */}
        {showIcon && (
          <>
            <div className="flex items-center gap-2 py-1.5">
              <span className="w-14 shrink-0 text-xs text-slate-600">来源</span>
              <div className="flex-1">
                <IconPickerPopover
                  value={iconName}
                  onChange={(v) => updateProp('iconName', v)}
                />
              </div>
            </div>

            {/* 图标颜色 */}
            <div className="flex items-center gap-2 py-1.5">
              <span className="w-14 shrink-0 text-xs text-slate-600">图标颜色</span>
              <div className="flex-1">
                <ColorPickerPopover
                  value={iconColor}
                  onChange={(c) => updateProp('iconColor', c)}
                />
              </div>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* ===== 位置 ===== */}
      <CollapsibleSection title="位置">
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">类型</span>
          <Select
            value={positionType}
            onValueChange={(v) => updateProp('positionType', v)}
          >
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {positionType !== 'relative' && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
            {(
              [
                ['上', 'positionTop', positionTop],
                ['右', 'positionRight', positionRight],
                ['下', 'positionBottom', positionBottom],
                ['左', 'positionLeft', positionLeft],
              ] as const
            ).map(([label, key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-4 shrink-0 text-center text-xs text-slate-500">
                  {label}
                </span>
                <InputNumber
                  value={val}
                  onChange={(v) => updateProp(key, v ?? 0)}
                  size="small"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* ===== 尺寸 ===== */}
      <CollapsibleSection title="尺寸">
        <SizeDimensionRow
          label="宽度"
          tips={WIDTH_TIPS}
          mode={widthMode}
          value={width}
          onModeChange={(m) => updateProp('widthMode', m)}
          onValueChange={(v) => updateProp('width', v)}
        />
        <SizeDimensionRow
          label="高度"
          tips={HEIGHT_TIPS}
          mode={heightMode}
          value={height}
          onModeChange={(m) => updateProp('heightMode', m)}
          onValueChange={(v) => updateProp('height', v)}
        />

        {/* 尺寸限制 */}
        <div className="space-y-1.5 py-1.5">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-600">尺寸限制</span>
            <InfoTip content={SIZE_LIMIT_TIPS} />
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Plus size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SIZE_LIMIT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    disabled={existingLimitTypes.has(opt.value)}
                    className="text-xs"
                    onSelect={() => {
                      updateProp('sizeLimits', [
                        ...sizeLimits,
                        { type: opt.value, value: 0 },
                      ]);
                    }}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {sizeLimits.map((item, idx) => {
            const opt = SIZE_LIMIT_OPTIONS.find(
              (o) => o.value === item.type
            );
            return (
              <div
                key={item.type}
                className="flex items-center gap-2"
              >
                <span className="w-14 shrink-0 text-xs text-slate-500">
                  {opt?.label ?? item.type}
                </span>
                <InputNumber
                  value={item.value}
                  onChange={(v) => {
                    const next = [...sizeLimits];
                    next[idx] = { ...item, value: v ?? 0 };
                    updateProp('sizeLimits', next);
                  }}
                  size="small"
                  min={0}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateProp(
                      'sizeLimits',
                      sizeLimits.filter((_, i) => i !== idx)
                    );
                  }}
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                >
                  <Minus size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* ===== 容器样式 ===== */}
      <CollapsibleSection title="容器样式">
        {/* 填充 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">填充</span>
          <div className="flex-1">
            {cs.background && cs.background !== 'transparent' ? (
              <ColorPickerPopover
                value={cs.background}
                onChange={(color) => updateCs('background', color)}
              />
            ) : (
              <span className="text-xs text-slate-400">无填充</span>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              updateCs('background', cs.background && cs.background !== 'transparent' ? 'transparent' : '#ffffff')
            }
            className={`shrink-0 rounded p-1 ${
              cs.background && cs.background !== 'transparent'
                ? 'text-rose-400 hover:bg-rose-50'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={cs.background && cs.background !== 'transparent' ? '移除填充' : '添加填充'}
          >
            {cs.background && cs.background !== 'transparent' ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        </div>

        {/* 圆角 */}
        <FourSideInput
          label="圆角"
          value={cs.borderRadius}
          sideKeys={{ a: 'tl', b: 'tr', c: 'bl', d: 'br' }}
          sideLabels={{ a: '左上', b: '右上', c: '左下', d: '右下' }}
          onChange={(v) => updateCs('borderRadius', v as FourCornerValue)}
        />

        {/* 内边距 */}
        <FourSideInput
          label="内边距"
          value={cs.padding}
          sideKeys={{ a: 'top', b: 'right', c: 'bottom', d: 'left' }}
          sideLabels={{ a: '上', b: '右', c: '下', d: '左' }}
          onChange={(v) => updateCs('padding', v as FourSideValue)}
        />

        {/* 外边距 */}
        <FourSideInput
          label="外边距"
          value={cs.margin}
          sideKeys={{ a: 'top', b: 'right', c: 'bottom', d: 'left' }}
          sideLabels={{ a: '上', b: '右', c: '下', d: '左' }}
          onChange={(v) => updateCs('margin', v as FourSideValue)}
        />

        {/* 边框 */}
        <BorderEditorPopover
          value={cs.border ?? null}
          onChange={(v) => updateCs('border', v)}
        />

        {/* 阴影 */}
        <ShadowEditorPopover
          value={cs.shadow ?? null}
          onChange={(v) => updateCs('shadow', v)}
        />
      </CollapsibleSection>

      {/* 变换/状态/可见性 数据层保留，UI 暂不展示 */}
    </section>
  );
};
