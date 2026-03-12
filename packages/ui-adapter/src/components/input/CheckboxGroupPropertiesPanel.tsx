import React, { useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Input,
  InputNumber,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  EnhancedSelect,
} from '@teamhelper/ui';
import TemplateInput from '../variable/TemplateInput';
import { useVariablePickerData } from '../variable/useVariablePickerData';
import {
  GripVertical,
  Minus,
  Plus,
  Trash2,
  X,
  Upload,
  FileImage,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { httpRequest } from '../../utils/http';
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
import { createId } from '../../utils/id';
import type {
  RadioOptionItem,
  RadioContentMode,
  RadioDisplayStyle,
  PositionType,
  SizeMode,
  SizeLimitItem,
  ContainerStyleConfig,
  FourSideValue,
  FourCornerValue,
  BlurType,
  BlurConfig,
} from '../../types';

/* ---- 常量 ---- */

const CONTENT_MODE_OPTIONS: { value: RadioContentMode; label: string }[] = [
  { value: 'static', label: '固定内容' },
  { value: 'dynamic', label: '动态内容' },
];

const BLUR_TYPE_OPTIONS: { value: BlurType; label: string }[] = [
  { value: 'layer', label: '图层模糊' },
  { value: 'background', label: '背景模糊' },
];

const DEFAULT_CONTAINER_STYLE: ContainerStyleConfig = {
  background: 'transparent',
  borderRadius: 8,
  padding: 8,
  margin: 0,
  border: null,
  shadow: null,
};

/* ---- 模拟上传 ---- */

const MOCK_IMAGE_URL = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';

const uploadImage = async (_file: File): Promise<string> => {
  await httpRequest.get({ url: 'https://httpbin.org/delay/1' }).catch(() => {});
  return MOCK_IMAGE_URL;
};

/* ---- 可排序选项（内嵌 Popover） ---- */

const SortableOptionItem = ({
  option,
  popoverOpen,
  onPopoverChange,
  onUpdate,
  onRemove,
}: {
  option: RadioOptionItem;
  popoverOpen: boolean;
  onPopoverChange: (open: boolean) => void;
  onUpdate: (updates: Partial<RadioOptionItem>) => void;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: option.id });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUpdate({ imageUrl: url });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 rounded py-0.5"
    >
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-slate-300 active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </div>

      {/* 点击打开 Popover */}
      <Popover open={popoverOpen} onOpenChange={onPopoverChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="min-w-0 flex-1 truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 text-left text-xs text-slate-600 hover:border-slate-300"
          >
            {option.label}
          </button>
        </PopoverTrigger>
        <PopoverContent side="left" align="start" className="w-[260px] space-y-3 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">编辑选项</span>
            <button
              type="button"
              onClick={() => onPopoverChange(false)}
              className="rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          </div>

          {/* 选项图片 */}
          <div className="space-y-1">
            <span className="text-xs text-slate-600">选项图片</span>
            {option.imageUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                  <FileImage size={14} className="shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
                    已上传图片
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdate({ imageUrl: null })}
                    className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                  >
                    <Minus size={12} />
                  </button>
                </div>
                <img
                  src={option.imageUrl}
                  alt=""
                  className="w-full rounded border border-slate-200"
                  style={{ maxHeight: 100, objectFit: 'cover' }}
                />
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.gif,.webp,.bmp"
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                >
                  <Upload size={14} />
                  {uploading ? '上传中...' : '点击上传图片'}
                </button>
              </>
            )}
          </div>

          {/* 标题 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600">标题</span>
              <InfoTip content="显示在界面上的标题文字，用户可见" />
            </div>
            <Input
              value={option.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-1">
            <span className="text-xs text-slate-600">描述</span>
            <Input
              value={option.description ?? ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="选项描述文字"
              className="h-7 text-xs"
            />
          </div>

          {/* 选项值 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600">选项值</span>
              <InfoTip content="提交时使用的值，用于后端识别，不对用户展示" />
            </div>
            <Input
              value={option.value}
              onChange={(e) => onUpdate({ value: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded p-0.5 text-slate-400 hover:text-rose-500"
      >
        <Minus size={10} />
      </button>
    </div>
  );
};

/* ---- 主面板 ---- */

export const CheckboxGroupPropertiesPanel = () => {
  const activeNode = useDesignerStore((s) => s.activeNode);
  const updateProp = useDesignerStore((s) => s.updateActiveNodeProp);
  const removeActiveNode = useDesignerStore((s) => s.removeActiveNode);
  const picker = useVariablePickerData();

  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  if (!activeNode) return null;

  const p = activeNode.props;

  // 常用设置
  const showLabel = (p.showLabel as boolean) ?? true;
  const label = String(p.label ?? '请选择');
  const required = (p.required as boolean) ?? false;
  const displayStyle = (p.displayStyle as RadioDisplayStyle) ?? 'horizontal';
  const contentMode = (p.contentMode as RadioContentMode) ?? 'static';
  const options = (p.options as RadioOptionItem[]) ?? [];
  const defaultValues = (p.defaultValues as string[]) ?? ['option1'];

  // 位置
  const positionType = (p.positionType as PositionType) ?? 'relative';
  const positionTop = Number(p.positionTop ?? 0);
  const positionRight = Number(p.positionRight ?? 0);
  const positionBottom = Number(p.positionBottom ?? 0);
  const positionLeft = Number(p.positionLeft ?? 0);

  // 尺寸
  const widthMode = (p.widthMode as SizeMode) ?? 'fixed';
  const heightMode = (p.heightMode as SizeMode) ?? 'fixed';
  const width = Number(p.width ?? 360);
  const height = Number(p.height ?? 400);
  const sizeLimits = (p.sizeLimits as SizeLimitItem[]) ?? [];

  // 容器样式
  const cs = (p.containerStyle as ContainerStyleConfig | null) ?? DEFAULT_CONTAINER_STYLE;

  // 模糊
  const blur = (p.blur as BlurConfig | null) ?? null;

  const updateCs = (field: keyof ContainerStyleConfig, value: unknown) => {
    updateProp('containerStyle', { ...cs, [field]: value });
  };

  const existingLimitTypes = new Set(sizeLimits.map((l) => l.type));

  /* 选项操作 */
  const addOption = () => {
    const newId = createId('opt');
    const idx = options.length + 1;
    updateProp('options', [
      ...options,
      { id: newId, label: `选项 ${idx}`, value: `option${idx}`, imageUrl: null, description: '' },
    ]);
  };

  const removeOption = (id: string) => {
    updateProp('options', options.filter((o) => o.id !== id));
    if (editingOptionId === id) setEditingOptionId(null);
  };

  const updateOption = (id: string, updates: Partial<RadioOptionItem>) => {
    updateProp(
      'options',
      options.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = options.findIndex((o) => o.id === active.id);
    const newIndex = options.findIndex((o) => o.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    updateProp('options', arrayMove(options, oldIndex, newIndex));
  };

  const defaultValueOptions = options.map((o) => ({
    label: o.label,
    value: o.value,
  }));

  return (
    <section className="space-y-0">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          多选属性
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
        {/* 标签 */}
        <SwitchRow
          label="标签"
          checked={showLabel}
          onChange={(v) => updateProp('showLabel', v)}
        />
        {showLabel && (
          <div className="flex items-center gap-2 py-1.5">
            <span className="w-14 shrink-0 text-xs text-slate-600">标签内容</span>
            <div className="flex-1">
              <TemplateInput
                value={label}
                onChange={(v) => updateProp('label', v)}
                placeholder="标签文字"
                picker={picker}
              />
            </div>
          </div>
        )}

        {/* 是否必填 */}
        <SwitchRow
          label="是否必填"
          checked={required}
          onChange={(v) => updateProp('required', v)}
        />

        {/* 选项样式 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">选项样式</span>
          <Select
            value={displayStyle}
            onValueChange={(v) => updateProp('displayStyle', v)}
          >
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal" className="text-xs">横向排列</SelectItem>
              <SelectItem value="vertical" className="text-xs">纵向排列</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 选项内容 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">选项内容</span>
          <div className="flex-1">
            <SegmentedControl
              options={CONTENT_MODE_OPTIONS}
              value={contentMode}
              onValueChange={(v) => updateProp('contentMode', v)}
              columns={2}
              disabledValues={['dynamic']}
            />
          </div>
        </div>

        {/* 选项设置 */}
        <div className="space-y-1 py-1.5">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-600">选项设置</span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={addOption}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Plus size={14} />
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={options.map((o) => o.id)}
              strategy={verticalListSortingStrategy}
            >
              {options.map((option) => (
                <SortableOptionItem
                  key={option.id}
                  option={option}
                  popoverOpen={editingOptionId === option.id}
                  onPopoverChange={(open) =>
                    setEditingOptionId(open ? option.id : null)
                  }
                  onUpdate={(updates) => updateOption(option.id, updates)}
                  onRemove={() => removeOption(option.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* 默认值（多选） */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">默认值</span>
          <EnhancedSelect
            mode="multiple"
            options={defaultValueOptions}
            value={defaultValues}
            onChange={(v) => updateProp('defaultValues', v ?? [])}
            placeholder="请选择默认值"
            searchable={false}
            allowClear
            maxTagCount={2}
            className="flex-1"
            inputClassName="h-7 text-xs"
          />
        </div>
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
            ).map(([lbl, key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-4 shrink-0 text-center text-xs text-slate-500">
                  {lbl}
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

        {/* 阴影 */}
        <ShadowEditorPopover
          value={cs.shadow ?? null}
          onChange={(v) => updateCs('shadow', v)}
        />

        {/* 模糊 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-10 shrink-0 text-xs text-slate-600">模糊</span>
          <div className="flex-1">
            {blur ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-7 rounded border border-slate-200 px-2 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      {BLUR_TYPE_OPTIONS.find((o) => o.value === blur.type)?.label ?? '图层模糊'}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {BLUR_TYPE_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        className="text-xs"
                        onSelect={() =>
                          updateProp('blur', { ...blur, type: opt.value })
                        }
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center">
                  <InputNumber
                    value={blur.value}
                    onChange={(v) =>
                      updateProp('blur', { ...blur, value: v ?? 0 })
                    }
                    size="small"
                    min={0}
                    className="w-16"
                  />
                  <span className="ml-1 shrink-0 text-xs text-slate-400">PX</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">无模糊</span>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              updateProp(
                'blur',
                blur ? null : { type: 'layer' as BlurType, value: 4 },
              )
            }
            className={`shrink-0 rounded p-1 ${
              blur
                ? 'text-rose-400 hover:bg-rose-50'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={blur ? '移除模糊' : '添加模糊'}
          >
            {blur ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        </div>
      </CollapsibleSection>
    </section>
  );
};
