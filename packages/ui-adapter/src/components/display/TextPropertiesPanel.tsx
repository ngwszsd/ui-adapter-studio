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
import TemplateTextarea from '../variable/TemplateTextarea';
import { useVariablePickerData } from '../variable/useVariablePickerData';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  MdVerticalAlignTop,
  MdVerticalAlignCenter,
  MdVerticalAlignBottom,
} from 'react-icons/md';
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
import { SegmentedControl } from '../shared/SegmentedControl';
import { TextShadowPopover } from './TextShadowPopover';
import type {
  TextStyleMode,
  TextAlign,
  TextVerticalAlign,
  TextShadowConfig,
  OverflowMode,
  PositionType,
  SizeMode,
  SizeLimitItem,
  ContainerStyleConfig,
  FourSideValue,
  FourCornerValue,
} from '../../types';

/* ---- 常量 ---- */

const STYLE_MODE_OPTIONS: { value: TextStyleMode; label: React.ReactNode }[] = [
  { value: 'preset', label: '预设' },
  { value: 'custom', label: '自定义' },
];

const PRESET_STYLE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: '36', label: '标题1', description: '36px / 粗体' },
  { value: '32', label: '标题2', description: '32px / 粗体' },
  { value: '28', label: '标题3', description: '28px / 半粗' },
  { value: '24', label: '正文', description: '24px / 常规' },
  { value: '20', label: '注释', description: '20px / 细体' },
];

const FONT_WEIGHT_OPTIONS = [
  { value: '100', label: '100 - Thin' },
  { value: '200', label: '200 - ExtraLight' },
  { value: '300', label: '300 - Light' },
  { value: '400', label: '400 - Regular' },
  { value: '500', label: '500 - Medium' },
  { value: '600', label: '600 - SemiBold' },
  { value: '700', label: '700 - Bold' },
  { value: '800', label: '800 - ExtraBold' },
  { value: '900', label: '900 - Black' },
];

const TEXT_ALIGN_OPTIONS: { value: TextAlign; label: React.ReactNode }[] = [
  { value: 'left', label: <AlignLeft size={14} /> },
  { value: 'center', label: <AlignCenter size={14} /> },
  { value: 'right', label: <AlignRight size={14} /> },
  { value: 'justify', label: <AlignJustify size={14} /> },
];

const VERTICAL_ALIGN_OPTIONS: { value: TextVerticalAlign; label: React.ReactNode }[] = [
  { value: 'top', label: <MdVerticalAlignTop size={14} /> },
  { value: 'center', label: <MdVerticalAlignCenter size={14} /> },
  { value: 'bottom', label: <MdVerticalAlignBottom size={14} /> },
];

const OVERFLOW_OPTIONS: { value: OverflowMode; label: string }[] = [
  { value: 'visible', label: '可见' },
  { value: 'hidden', label: '隐藏' },
  { value: 'scroll', label: '滚动' },
];

const OVERFLOW_TIPS = `可见：内容超出容器时仍然显示。
隐藏：超出容器的内容将被裁剪。
滚动：超出容器时显示滚动条。`;

const DEFAULT_CONTAINER_STYLE: ContainerStyleConfig = {
  background: 'transparent',
  borderRadius: 8,
  padding: { top: 6, right: 8, bottom: 6, left: 8 },
  margin: 0,
  border: null,
  shadow: null,
};

/* ---- 主面板 ---- */

export const TextPropertiesPanel = () => {
  const activeNode = useDesignerStore((s) => s.activeNode);
  const updateProp = useDesignerStore((s) => s.updateActiveNodeProp);
  const removeActiveNode = useDesignerStore((s) => s.removeActiveNode);
  const picker = useVariablePickerData();

  if (!activeNode) return null;

  const p = activeNode.props;

  // 常用设置
  const text = String(p.text ?? 'Text');
  const styleMode = (p.styleMode as TextStyleMode) ?? 'preset';
  const presetStyle = String(p.presetStyle ?? '22');
  const fontSize = Number(p.fontSize ?? 22);
  const fontWeight = Number(p.fontWeight ?? 500);
  const letterSpacing = Number(p.letterSpacing ?? 0);
  const lineHeight = p.lineHeight != null ? Number(p.lineHeight) : null;
  const textAlign = (p.textAlign as TextAlign) ?? 'left';
  const verticalAlign = (p.verticalAlign as TextVerticalAlign) ?? 'top';
  const color = (p.color as string | null) ?? null;
  const textShadow = (p.textShadow as TextShadowConfig | null) ?? null;
  const maxLines = p.maxLines != null ? Number(p.maxLines) : null;

  // 位置
  const positionType = (p.positionType as PositionType) ?? 'relative';
  const positionTop = Number(p.positionTop ?? 0);
  const positionRight = Number(p.positionRight ?? 0);
  const positionBottom = Number(p.positionBottom ?? 0);
  const positionLeft = Number(p.positionLeft ?? 0);

  // 尺寸
  const widthMode = (p.widthMode as SizeMode) ?? 'fixed';
  const heightMode = (p.heightMode as SizeMode) ?? 'fixed';
  const width = Number(p.width ?? 160);
  const height = Number(p.height ?? 44);
  const sizeLimits = (p.sizeLimits as SizeLimitItem[]) ?? [];

  // 容器样式
  const cs = (p.containerStyle as ContainerStyleConfig | null) ?? DEFAULT_CONTAINER_STYLE;
  const overflow = (p.overflow as OverflowMode) ?? 'visible';

  const updateCs = (field: keyof ContainerStyleConfig, value: unknown) => {
    updateProp('containerStyle', { ...cs, [field]: value });
  };

  const existingLimitTypes = new Set(sizeLimits.map((l) => l.type));

  return (
    <section className="space-y-0">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          文本属性
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
        {/* 内容 */}
        <div className="flex gap-2 py-1.5">
          <span className="w-14 shrink-0 pt-1.5 text-xs text-slate-600">内容</span>
          <div className="flex-1">
            <TemplateTextarea
              value={text}
              onChange={(v) => updateProp('text', v)}
              placeholder="文本内容"
              picker={picker}
              rows={2}
            />
          </div>
        </div>

        {/* 样式模式 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">样式</span>
          <div className="flex-1">
            <SegmentedControl
              options={STYLE_MODE_OPTIONS}
              value={styleMode}
              onValueChange={(v) => updateProp('styleMode', v)}
              columns={2}

            />
          </div>
        </div>

        {/* 预设样式 */}
        {styleMode === 'preset' && (
          <div className="flex items-center gap-2 py-1.5">
            <span className="w-14 shrink-0 text-xs text-slate-600">预设样式</span>
            <Select
              value={presetStyle}
              onValueChange={(v) => updateProp('presetStyle', v)}
            >
              <SelectTrigger className="h-7 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_STYLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    <span className="font-medium">{opt.label}</span>
                    <span className="ml-2 text-slate-400">{opt.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 自定义字体属性 */}
        {styleMode === 'custom' && (
          <>
            {/* 字号 */}
            <div className="flex items-center gap-2 py-1.5">
              <span className="w-14 shrink-0 text-xs text-slate-600">字号</span>
              <div className="flex flex-1 items-center">
                <InputNumber
                  value={fontSize}
                  onChange={(v) => updateProp('fontSize', v ?? 16)}
                  size="small"
                  min={1}
                  className="flex-1"
                />
                <span className="ml-1 shrink-0 text-xs text-slate-400">px</span>
              </div>
            </div>

            {/* 字重 */}
            <div className="flex items-center gap-2 py-1.5">
              <span className="w-14 shrink-0 text-xs text-slate-600">字重</span>
              <Select
                value={String(fontWeight)}
                onValueChange={(v) => updateProp('fontWeight', Number(v))}
              >
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 字间距 */}
            <div className="flex items-center gap-2 py-1.5">
              <span className="w-14 shrink-0 text-xs text-slate-600">字间距</span>
              <div className="flex flex-1 items-center">
                <InputNumber
                  value={letterSpacing}
                  onChange={(v) => updateProp('letterSpacing', v ?? 0)}
                  size="small"
                  className="flex-1"
                />
                <span className="ml-1 shrink-0 text-xs text-slate-400">px</span>
              </div>
            </div>

            {/* 行高 */}
            <div className="flex items-center gap-2 py-1.5">
              <span className="w-14 shrink-0 text-xs text-slate-600">行高</span>
              <div className="flex flex-1 items-center">
                <InputNumber
                  value={lineHeight ?? 0}
                  onChange={(v) => updateProp('lineHeight', v && v > 0 ? v : null)}
                  size="small"
                  min={0}
                  className="flex-1"
                />
                <span className="ml-1 shrink-0 text-xs text-slate-400">px</span>
              </div>
            </div>
          </>
        )}

        {/* 水平对齐 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">水平对齐</span>
          <div className="flex-1">
            <SegmentedControl
              options={TEXT_ALIGN_OPTIONS}
              value={textAlign}
              onValueChange={(v) => updateProp('textAlign', v)}
              columns={4}

            />
          </div>
        </div>

        {/* 垂直对齐 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">垂直对齐</span>
          <div className="flex-1">
            <SegmentedControl
              options={VERTICAL_ALIGN_OPTIONS}
              value={verticalAlign}
              onValueChange={(v) => updateProp('verticalAlign', v)}
              columns={3}

            />
          </div>
        </div>

        {/* 颜色 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">颜色</span>
          <div className="flex-1">
            {color ? (
              <ColorPickerPopover
                value={color}
                onChange={(c) => updateProp('color', c)}
              />
            ) : (
              <span className="text-xs text-slate-400">默认颜色</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => updateProp('color', color ? null : '#a5b4fc')}
            className={`shrink-0 rounded p-1 ${
              color
                ? 'text-rose-400 hover:bg-rose-50'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={color ? '移除颜色' : '添加颜色'}
          >
            {color ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        </div>

        {/* 文字阴影 */}
        <TextShadowPopover
          value={textShadow}
          onChange={(v) => updateProp('textShadow', v)}
        />

        {/* 最大行数 */}
        <SwitchRow
          label="最大行数"
          checked={maxLines != null}
          onChange={(v) => updateProp('maxLines', v ? 3 : null)}
        />
        {maxLines != null && (
          <div className="flex items-center gap-2 py-1.5">
            <span className="w-14 shrink-0 text-xs text-slate-600">行数</span>
            <InputNumber
              value={maxLines}
              onChange={(v) => updateProp('maxLines', v && v > 0 ? v : 1)}
              size="small"
              min={1}
              className="flex-1"
            />
          </div>
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
              (o) => o.value === item.type,
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
                      sizeLimits.filter((_, i) => i !== idx),
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

        {/* 容器阴影 */}
        <ShadowEditorPopover
          value={cs.shadow ?? null}
          onChange={(v) => updateCs('shadow', v)}
        />

        {/* 溢出 */}
        <div className="flex items-center gap-2 py-1.5">
          <div className="flex w-14 shrink-0 items-center gap-1">
            <span className="text-xs text-slate-600">溢出</span>
            <InfoTip content={OVERFLOW_TIPS} />
          </div>
          <Select
            value={overflow}
            onValueChange={(v) => updateProp('overflow', v)}
          >
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OVERFLOW_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CollapsibleSection>
    </section>
  );
};
