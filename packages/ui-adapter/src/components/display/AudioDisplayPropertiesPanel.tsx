import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Input,
  InputNumber,
  Popover,
  PopoverTrigger,
  PopoverContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@teamhelper/ui';
import { Minus, Plus, Trash2, Upload, FileAudio } from 'lucide-react';
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
import type {
  AudioSourceType,
  AudioPlayerStyle,
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

const SOURCE_TYPE_OPTIONS: { value: AudioSourceType; label: string }[] = [
  { value: 'local', label: '本地上传' },
  { value: 'binding', label: '绑定数据' },
];

const PLAYER_STYLE_OPTIONS: { value: AudioPlayerStyle; label: string }[] = [
  { value: 'large', label: '大播放器' },
  { value: 'small', label: '小播放器' },
  { value: 'bar', label: '小播放条' },
];

const BLUR_TYPE_OPTIONS: { value: BlurType; label: string }[] = [
  { value: 'layer', label: '图层模糊' },
  { value: 'background', label: '背景模糊' },
];

const DEFAULT_CONTAINER_STYLE: ContainerStyleConfig = {
  background: 'transparent',
  borderRadius: 8,
  padding: 0,
  margin: 0,
  border: null,
  shadow: null,
};

const SOURCE_TIP = `支持本地上传或直接配置线上链接
上传限制: 音频大小：最大 100 MB, 超过 100 MB 的音频将无法上传`;

const LOOP_TIP = '控制音频播放完成后是否循环播放';
const PRELOAD_TIP = '开启后音频会在页面加载时预加载元数据，可加快播放响应';

/* ---- 模拟上传 ---- */

const MOCK_AUDIO_URL = 'https://www.w3schools.com/html/horse.mp3';

const uploadAudio = async (_file: File): Promise<string> => {
  await httpRequest.get({ url: 'https://httpbin.org/delay/1' }).catch(() => {});
  return MOCK_AUDIO_URL;
};

/* ---- 主面板 ---- */

export const AudioDisplayPropertiesPanel = () => {
  const activeNode = useDesignerStore((s) => s.activeNode);
  const updateProp = useDesignerStore((s) => s.updateActiveNodeProp);
  const removeActiveNode = useDesignerStore((s) => s.removeActiveNode);

  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!activeNode) return null;

  const p = activeNode.props;

  // 常用设置
  const sourceType = (p.sourceType as AudioSourceType) ?? 'local';
  const audioUrl = (p.audioUrl as string | null) ?? null;
  const bindingField = String(p.bindingField ?? '');
  const audioTitle = String(p.audioTitle ?? '音频标题');
  const playerStyle = (p.playerStyle as AudioPlayerStyle) ?? 'large';
  const loop = (p.loop as boolean) ?? false;
  const preloadAudio = (p.preload as boolean) ?? true;
  const controlColor = (p.controlColor as string | null) ?? null;

  // 位置
  const positionType = (p.positionType as PositionType) ?? 'relative';
  const positionTop = Number(p.positionTop ?? 0);
  const positionRight = Number(p.positionRight ?? 0);
  const positionBottom = Number(p.positionBottom ?? 0);
  const positionLeft = Number(p.positionLeft ?? 0);

  // 尺寸
  const widthMode = (p.widthMode as SizeMode) ?? 'fixed';
  const heightMode = (p.heightMode as SizeMode) ?? 'fixed';
  const width = Number(p.width ?? 280);
  const height = Number(p.height ?? 180);
  const sizeLimits = (p.sizeLimits as SizeLimitItem[]) ?? [];

  // 容器样式
  const cs = (p.containerStyle as ContainerStyleConfig | null) ?? DEFAULT_CONTAINER_STYLE;

  // 模糊
  const blur = (p.blur as BlurConfig | null) ?? null;

  const updateCs = (field: keyof ContainerStyleConfig, value: unknown) => {
    updateProp('containerStyle', { ...cs, [field]: value });
  };

  const existingLimitTypes = new Set(sizeLimits.map((l) => l.type));

  // 提取文件名
  const fileName = audioUrl
    ? decodeURIComponent(audioUrl.split('/').pop()?.split('?')[0] ?? '音频')
    : null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAudio(file);
      updateProp('audioUrl', url);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <section className="space-y-0">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          音频属性
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
        {/* 音频源 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="shrink-0 text-xs text-slate-600">音频源</span>
          <InfoTip content={SOURCE_TIP} />
          <div className="flex-1">
            <SegmentedControl
              options={SOURCE_TYPE_OPTIONS}
              value={sourceType}
              onValueChange={(v) => {
                updateProp('sourceType', v);
                if (v === 'local') updateProp('bindingField', '');
                if (v === 'binding') updateProp('audioUrl', null);
              }}
              columns={2}
            />
          </div>
        </div>

        {/* 本地上传 */}
        {sourceType === 'local' && (
          <div className="py-1.5">
            {audioUrl ? (
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                <FileAudio size={14} className="shrink-0 text-slate-400" />
                <Popover>
                  <PopoverTrigger asChild>
                    <span className="min-w-0 flex-1 cursor-pointer truncate text-xs text-slate-600 hover:text-blue-600">
                      {fileName}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="w-auto max-w-[280px] px-3 py-2">
                    <p className="break-all text-xs text-slate-600">{fileName}</p>
                  </PopoverContent>
                </Popover>
                <button
                  type="button"
                  onClick={() => updateProp('audioUrl', null)}
                  className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                >
                  <Minus size={12} />
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.ogg,.aac,.flac,.m4a,.wma"
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
                  {uploading ? '上传中...' : '点击上传音频'}
                </button>
              </>
            )}
          </div>
        )}

        {/* 绑定数据 */}
        {sourceType === 'binding' && (
          <div className="flex items-center gap-2 py-1.5">
            <span className="w-14 shrink-0 text-xs text-slate-600">绑定字段</span>
            <Input
              value={bindingField}
              onChange={(e) => updateProp('bindingField', e.target.value)}
              placeholder="请输入绑定字段"
              className="h-7 flex-1 text-xs"
            />
          </div>
        )}

        {/* 样式 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">样式</span>
          <Select
            value={playerStyle}
            onValueChange={(v) => {
              updateProp('playerStyle', v);
              // 切换样式时自动适配尺寸
              if (v === 'large') {
                updateProp('width', 280);
                updateProp('height', 180);
              } else if (v === 'small') {
                updateProp('width', 280);
                updateProp('height', 68);
              } else if (v === 'bar') {
                updateProp('width', 280);
                updateProp('height', 36);
              }
            }}
          >
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAYER_STYLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 音频标题 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">音频标题</span>
          <Input
            value={audioTitle}
            onChange={(e) => updateProp('audioTitle', e.target.value)}
            placeholder="请输入音频标题"
            className="h-7 flex-1 text-xs"
          />
        </div>

        {/* 循环播放 */}
        <SwitchRow
          label="循环播放"
          tip={LOOP_TIP}
          checked={loop}
          onChange={(v) => updateProp('loop', v)}
        />

        {/* 预加载 */}
        <SwitchRow
          label="预加载"
          tip={PRELOAD_TIP}
          checked={preloadAudio}
          onChange={(v) => updateProp('preload', v)}
        />

        {/* 播控颜色 */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">播控颜色</span>
          <div className="flex-1">
            {controlColor ? (
              <ColorPickerPopover
                value={controlColor}
                onChange={(c) => updateProp('controlColor', c)}
              />
            ) : (
              <span className="text-xs text-slate-400">默认颜色</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => updateProp('controlColor', controlColor ? null : '#3b82f6')}
            className={`shrink-0 rounded p-1 ${
              controlColor
                ? 'text-rose-400 hover:bg-rose-50'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={controlColor ? '移除颜色' : '添加颜色'}
          >
            {controlColor ? <Minus size={14} /> : <Plus size={14} />}
          </button>
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
