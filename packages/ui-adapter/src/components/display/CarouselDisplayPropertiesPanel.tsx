import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  InputNumber,
  Popover,
  PopoverTrigger,
  PopoverContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@teamhelper/ui';
import TemplateInput from '../variable/TemplateInput';
import { useVariablePickerData } from '../variable/useVariablePickerData';
import {
  GripVertical,
  Minus,
  Plus,
  Trash2,
  Upload,
  FileImage,
  X,
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
import { createId } from '../../utils/id';
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
import type {
  CarouselContentMode,
  CarouselImageItem,
  CarouselImageSourceType,
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

const CONTENT_MODE_OPTIONS: { value: CarouselContentMode; label: string }[] = [
  { value: 'static', label: '固定内容' },
  { value: 'dynamic', label: '动态内容' },
];

const DISABLED_CONTENT_MODES: CarouselContentMode[] = ['dynamic'];

const IMAGE_SOURCE_OPTIONS: { value: CarouselImageSourceType; label: string }[] = [
  { value: 'local', label: '本地上传' },
  { value: 'binding', label: '绑定数据' },
];

const BLUR_TYPE_OPTIONS: { value: BlurType; label: string }[] = [
  { value: 'layer', label: '图层模糊' },
  { value: 'background', label: '背景模糊' },
];

const DEFAULT_CONTAINER_STYLE: ContainerStyleConfig = {
  background: 'transparent',
  borderRadius: 10,
  padding: 0,
  margin: 0,
  border: null,
  shadow: null,
};

const CONTENT_TIP = '选项内容支持「固定内容」和「动态内容」两种模式。\n固定内容：手动添加图片列表，适合内容不经常变化的场景。\n动态内容：通过 workflow 绑定数据源，适合内容需要动态更新的场景（开发中）。';
const IMAGE_SOURCE_TIP = '可本地上传也可通过 workflow 绑定数据。本地上传支持 .png .jpg 等格式，不支持 .svg 格式。';

/* ---- 模拟上传 ---- */

const MOCK_IMAGE_URL = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';

const uploadImage = async (_file: File): Promise<string> => {
  await httpRequest.get({ url: 'https://httpbin.org/delay/1' }).catch(() => {});
  return MOCK_IMAGE_URL;
};

/* ---- 可排序列表项 ---- */

interface SortableImageItemProps {
  item: CarouselImageItem;
  onRemove: () => void;
  onUpdate: (updates: Partial<CarouselImageItem>) => void;
}

const SortableImageItem = ({ item, onRemove, onUpdate }: SortableImageItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: sortTransform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const picker = useVariablePickerData();
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(sortTransform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = item.sourceType === 'binding'
    ? (item.bindingField || '未绑定')
    : (item.fileName || (item.imageUrl ? '已上传图片' : '未上传'));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUpdate({ imageUrl: url, fileName: file.name });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-1.5 py-1"
    >
      {/* 拖拽手柄 */}
      <button
        type="button"
        className="shrink-0 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      {/* 文件名（点击打开配置 Popover） */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="min-w-0 flex-1 cursor-pointer truncate rounded border border-slate-100 bg-slate-50 px-2 py-1 text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50">
            {displayName}
          </div>
        </PopoverTrigger>
        <PopoverContent side="left" align="start" className="w-[260px] p-3">
          {/* Popover 头部 */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">图片设置</span>
            <button
              type="button"
              onClick={() => setPopoverOpen(false)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>

          {/* 来源 */}
          <div className="mb-2 flex items-center gap-2">
            <span className="shrink-0 text-xs text-slate-600">来源</span>
            <InfoTip content={IMAGE_SOURCE_TIP} />
            <div className="flex-1">
              <SegmentedControl
                options={IMAGE_SOURCE_OPTIONS}
                value={item.sourceType}
                onValueChange={(v) => {
                  if (v === 'local') {
                    onUpdate({ sourceType: 'local', bindingField: '' });
                  } else {
                    onUpdate({ sourceType: 'binding', imageUrl: null, fileName: '' });
                  }
                }}
                columns={2}
              />
            </div>
          </div>

          {/* 本地上传 */}
          {item.sourceType === 'local' && (
            <div className="mb-2">
              {item.imageUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <FileImage size={14} className="shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
                      {item.fileName || '已上传图片'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdate({ imageUrl: null, fileName: '' })}
                      className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                  {/* 预览 */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full rounded border border-slate-200"
                    style={{ maxHeight: 120, objectFit: 'cover' }}
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
          )}

          {/* 绑定数据 */}
          {item.sourceType === 'binding' && (
            <div className="mb-2 flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs text-slate-600">绑定字段</span>
              <div className="flex-1">
                <TemplateInput
                  value={item.bindingField}
                  onChange={(v) => onUpdate({ bindingField: v })}
                  placeholder="请输入绑定字段"
                  picker={picker}
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* 删除 */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500"
      >
        <Minus size={12} />
      </button>
    </div>
  );
};

/* ---- 主面板 ---- */

export const CarouselDisplayPropertiesPanel = () => {
  const activeNode = useDesignerStore((s) => s.activeNode);
  const updateProp = useDesignerStore((s) => s.updateActiveNodeProp);
  const removeActiveNode = useDesignerStore((s) => s.removeActiveNode);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  if (!activeNode) return null;

  const p = activeNode.props;

  // 常用设置
  const contentMode = (p.contentMode as CarouselContentMode) ?? 'static';
  const images = (p.images as CarouselImageItem[]) ?? [];
  const autoPlay = (p.autoPlay as boolean) ?? true;
  const autoPlayInterval = Number(p.autoPlayInterval ?? 2);

  // 位置
  const positionType = (p.positionType as PositionType) ?? 'relative';
  const positionTop = Number(p.positionTop ?? 0);
  const positionRight = Number(p.positionRight ?? 0);
  const positionBottom = Number(p.positionBottom ?? 0);
  const positionLeft = Number(p.positionLeft ?? 0);

  // 尺寸
  const widthMode = (p.widthMode as SizeMode) ?? 'fixed';
  const heightMode = (p.heightMode as SizeMode) ?? 'fixed';
  const width = Number(p.width ?? 240);
  const height = Number(p.height ?? 132);
  const sizeLimits = (p.sizeLimits as SizeLimitItem[]) ?? [];

  // 容器样式
  const cs = (p.containerStyle as ContainerStyleConfig | null) ?? DEFAULT_CONTAINER_STYLE;

  // 模糊
  const blur = (p.blur as BlurConfig | null) ?? null;

  const updateCs = (field: keyof ContainerStyleConfig, value: unknown) => {
    updateProp('containerStyle', { ...cs, [field]: value });
  };

  const existingLimitTypes = new Set(sizeLimits.map((l) => l.type));

  /* ---- 图片列表操作 ---- */

  const addImage = () => {
    const newItem: CarouselImageItem = {
      id: createId('img'),
      sourceType: 'local',
      imageUrl: null,
      bindingField: '',
      fileName: '',
    };
    updateProp('images', [...images, newItem]);
  };

  const removeImage = (id: string) => {
    updateProp('images', images.filter((img) => img.id !== id));
  };

  const updateImage = (id: string, updates: Partial<CarouselImageItem>) => {
    updateProp(
      'images',
      images.map((img) => (img.id === id ? { ...img, ...updates } : img)),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      updateProp('images', arrayMove(images, oldIndex, newIndex));
    }
  };

  return (
    <section className="space-y-0">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          轮播属性
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
        {/* 选项内容 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="shrink-0 text-xs text-slate-600">选项内容</span>
          <InfoTip content={CONTENT_TIP} />
          <div className="flex-1">
            <SegmentedControl
              options={CONTENT_MODE_OPTIONS}
              value={contentMode}
              onValueChange={(v) => updateProp('contentMode', v)}
              columns={2}
              disabledValues={DISABLED_CONTENT_MODES}
            />
          </div>
        </div>

        {/* 固定内容 - 图片列表 */}
        {contentMode === 'static' && (
          <div className="space-y-1.5 py-1.5">
            <div className="flex items-center">
              <span className="text-xs text-slate-600">图片列表</span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={addImage}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Plus size={14} />
              </button>
            </div>

            {images.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {images.map((img) => (
                      <SortableImageItem
                        key={img.id}
                        item={img}
                        onRemove={() => removeImage(img.id)}
                        onUpdate={(updates) => updateImage(img.id, updates)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {images.length === 0 && (
              <p className="py-2 text-center text-xs text-slate-400">
                暂无图片，点击 + 添加
              </p>
            )}
          </div>
        )}

        {/* 自动轮播 */}
        <SwitchRow
          label="自动轮播"
          checked={autoPlay}
          onChange={(v) => updateProp('autoPlay', v)}
        />

        {/* 轮播时长 */}
        {autoPlay && (
          <div className="flex items-center gap-2 py-1.5">
            <span className="w-14 shrink-0 text-xs text-slate-600">轮播时长</span>
            <InputNumber
              value={autoPlayInterval}
              onChange={(v) => updateProp('autoPlayInterval', v ?? 2)}
              size="small"
              min={1}
              max={60}
              className="flex-1"
            />
            <span className="shrink-0 text-xs text-slate-400">s</span>
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
