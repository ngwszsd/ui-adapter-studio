import React from 'react';
import {
  Input,
  InputNumber,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@teamhelper/ui';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useDesignerStore } from '../../store/useDesignerStore';
import { getEditorApi } from '../../store/editorRegistry';
import {
  CollapsibleSection,
  InfoTip,
  SizeDimensionRow,
  SwitchRow,
  POSITION_OPTIONS,
  WIDTH_TIPS,
  HEIGHT_TIPS,
} from '../shared/property-helpers';
import { SegmentedControl } from '../shared/SegmentedControl';
import { ColorPickerPopover } from '../shared/ColorPickerPopover';
import { FourSideInput } from '../shared/FourSideInput';
import { BorderEditorPopover } from '../shared/BorderEditorPopover';
import { ShadowEditorPopover } from '../shared/ShadowEditorPopover';
import type {
  BlurConfig,
  BlurType,
  ContainerStyleConfig,
  FourCornerValue,
  FourSideValue,
  LayoutConfig,
  OverflowMode,
  PositionType,
  SizeMode,
  VerticalListDataMode,
} from '../../types';

const DATA_MODE_OPTIONS: { value: VerticalListDataMode; label: string }[] = [
  { value: 'binding', label: '绑定数据' },
  { value: 'expression', label: '写表达式' },
];

const OVERFLOW_OPTIONS: { value: OverflowMode; label: string }[] = [
  { value: 'visible', label: '可见' },
  { value: 'hidden', label: '隐藏' },
  { value: 'scroll', label: '滚动' },
];

const OVERFLOW_TIPS = `可见：内容超出容器时仍然显示。
隐藏：超出容器的内容将被裁剪。
滚动：超出容器时显示滚动条。`;

const BLUR_TYPE_OPTIONS: { value: BlurType; label: string }[] = [
  { value: 'layer', label: '图层模糊' },
  { value: 'background', label: '背景模糊' },
];

const DEFAULT_CONTAINER_STYLE: ContainerStyleConfig = {
  background: 'transparent',
  borderRadius: 0,
  padding: 12,
  margin: 0,
  border: null,
  shadow: null,
};

const findChildByRole = (
  pageId: string,
  nodeId: string,
  role: string,
): string | null => {
  const editorApi = getEditorApi(pageId);
  if (!editorApi) return null;

  const childIds = editorApi.getChildNodeIds(nodeId);
  for (const childId of childIds) {
    const childProps = editorApi.getNodeProps(childId);
    if (childProps?.verticalListRole === role) {
      return childId;
    }
  }

  return null;
};

const findItemImageNodeIds = (pageId: string, nodeId: string): string[] => {
  const editorApi = getEditorApi(pageId);
  if (!editorApi) return [];

  const itemsNodeId = findChildByRole(pageId, nodeId, 'items');
  if (!itemsNodeId) return [];

  return editorApi
    .getChildNodeIds(itemsNodeId)
    .filter((childId) => editorApi.getNodeProps(childId)?.verticalListRole === 'item')
    .map((itemNodeId) =>
      editorApi
        .getChildNodeIds(itemNodeId)
        .find(
          (childId) => editorApi.getNodeProps(childId)?.verticalListRole === 'item-image'
        ) ?? null
    )
    .filter((childId): childId is string => Boolean(childId));
};

export const VerticalListPropertiesPanel = () => {
  const activeNode = useDesignerStore((state) => state.activeNode);
  const updateProp = useDesignerStore((state) => state.updateActiveNodeProp);
  const removeActiveNode = useDesignerStore((state) => state.removeActiveNode);

  if (!activeNode) return null;

  const props = activeNode.props;
  const title = String(props.title ?? '列表标题');
  const itemSpacing = Number(props.itemSpacing ?? 12);
  const showItemNumber = Boolean(props.showItemNumber ?? false);
  const dataMode = (props.dataMode as VerticalListDataMode) ?? 'expression';
  const expression = String(props.expression ?? '');
  const positionType = (props.positionType as PositionType) ?? 'relative';
  const positionTop = Number(props.positionTop ?? 0);
  const positionRight = Number(props.positionRight ?? 0);
  const positionBottom = Number(props.positionBottom ?? 0);
  const positionLeft = Number(props.positionLeft ?? 0);
  const widthMode = (props.widthMode as SizeMode) ?? 'fill';
  const heightMode = (props.heightMode as SizeMode) ?? 'fit-content';
  const width = Number(props.width ?? 520);
  const height = Number(props.height ?? 360);
  const cs = (props.containerStyle as ContainerStyleConfig | null) ?? DEFAULT_CONTAINER_STYLE;
  const overflow = (props.overflow as OverflowMode) ?? 'visible';
  const blur = (props.blur as BlurConfig | null) ?? null;

  const updateCs = (field: keyof ContainerStyleConfig, value: unknown) => {
    updateProp('containerStyle', { ...cs, [field]: value });
  };

  const syncTitleChild = (nextTitle: string) => {
    const editorApi = getEditorApi(activeNode.pageId);
    const titleNodeId = findChildByRole(activeNode.pageId, activeNode.nodeId, 'title');
    if (!editorApi || !titleNodeId) return;
    editorApi.updateNodeProp(titleNodeId, 'text', nextTitle);
  };

  const normalizeStructure = React.useCallback(() => {
    const editorApi = getEditorApi(activeNode.pageId);
    if (!editorApi) return;

    const rootShouldScroll = overflow === 'scroll';

    if (overflow !== 'scroll') {
      updateProp('overflow', 'scroll');
    }

    const titleNodeId = findChildByRole(activeNode.pageId, activeNode.nodeId, 'title');
    if (titleNodeId) {
      const titleProps = editorApi.getNodeProps(titleNodeId);
      if (titleProps?.overflow !== 'hidden') {
        editorApi.updateNodeProp(titleNodeId, 'overflow', 'hidden');
      }
    }

    if (rootShouldScroll && heightMode === 'fit-content') {
      updateProp('heightMode', 'fixed');
    }

    const itemsNodeId = findChildByRole(activeNode.pageId, activeNode.nodeId, 'items');
    if (!itemsNodeId) return;

    const itemsProps = editorApi.getNodeProps(itemsNodeId);
    const nextItemsOverflow = 'scroll';
    const nextItemsHeightMode = 'fixed';

    if (itemsProps?.overflow !== nextItemsOverflow) {
      editorApi.updateNodeProp(itemsNodeId, 'overflow', nextItemsOverflow);
    }
    if (itemsProps?.heightMode !== nextItemsHeightMode) {
      editorApi.updateNodeProp(itemsNodeId, 'heightMode', nextItemsHeightMode);
    }
    if (itemsProps?.flexShrink !== 0) {
      editorApi.updateNodeProp(itemsNodeId, 'flexShrink', 0);
    }

    editorApi.getChildNodeIds(itemsNodeId).forEach((itemNodeId) => {
      const itemProps = editorApi.getNodeProps(itemNodeId);
      if (itemProps?.verticalListRole !== 'item') return;
      if (itemProps?.overflow !== 'hidden') {
        editorApi.updateNodeProp(itemNodeId, 'overflow', 'hidden');
      }
    });
  }, [activeNode.nodeId, activeNode.pageId, heightMode, overflow, updateProp]);

  React.useEffect(() => {
    normalizeStructure();
  }, [normalizeStructure]);

  const syncItemSpacing = (nextSpacing: number) => {
    const editorApi = getEditorApi(activeNode.pageId);
    const itemsNodeId = findChildByRole(activeNode.pageId, activeNode.nodeId, 'items');
    if (!editorApi || !itemsNodeId) return;

    const itemsProps = editorApi.getNodeProps(itemsNodeId);
    const layout = (itemsProps?.layout as LayoutConfig | undefined) ?? {
      arrangement: 'vertical',
      spacingMode: 'fixed',
      spacing: nextSpacing,
      distribution: 'top-left',
      columnDistribution: 'left',
    };

    editorApi.updateNodeProp(itemsNodeId, 'layout', {
      ...layout,
      arrangement: 'vertical',
      spacingMode: 'fixed',
      spacing: nextSpacing,
    });
  };

  const syncItemNumberDisplay = (checked: boolean) => {
    const editorApi = getEditorApi(activeNode.pageId);
    if (!editorApi) return;

    const imageNodeIds = findItemImageNodeIds(activeNode.pageId, activeNode.nodeId);
    imageNodeIds.forEach((imageNodeId, index) => {
      editorApi.updateNodeProp(imageNodeId, 'forcePlaceholder', checked);
      editorApi.updateNodeProp(imageNodeId, 'placeholderMode', checked ? 'number' : 'image');
      editorApi.updateNodeProp(imageNodeId, 'placeholderText', checked ? String(index + 1) : '');
    });
  };

  return (
    <section className="space-y-0">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          纵向列表属性
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

      <CollapsibleSection title="常用设置">
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">标签</span>
          <Input
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              updateProp('title', nextTitle);
              syncTitleChild(nextTitle);
            }}
            className="h-7 flex-1 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">间距值</span>
          <div className="flex flex-1 items-center">
            <InputNumber
              value={itemSpacing}
              onChange={(value) => {
                const nextSpacing = value ?? itemSpacing;
                updateProp('itemSpacing', nextSpacing);
                syncItemSpacing(nextSpacing);
              }}
              size="small"
              min={0}
              className="flex-1"
            />
            <span className="ml-1 shrink-0 text-xs text-slate-400">px</span>
          </div>
        </div>

        <SwitchRow
          label="编号替图"
          checked={showItemNumber}
          onChange={(checked) => {
            updateProp('showItemNumber', checked);
            syncItemNumberDisplay(checked);
          }}
        />

        <div className="flex items-start gap-2 py-1.5">
          <span className="w-14 shrink-0 pt-1.5 text-xs text-slate-600">数据绑定</span>
          <div className="flex-1 space-y-2">
            <SegmentedControl
              options={DATA_MODE_OPTIONS}
              value={dataMode}
              onValueChange={(value) => updateProp('dataMode', value)}
              columns={2}
              disabledValues={['binding']}
            />
            {dataMode === 'expression' && (
              <Input
                value={expression}
                onChange={(event) => updateProp('expression', event.target.value)}
                placeholder="请输入表达式"
                className="h-7 text-xs"
              />
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="位置">
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-14 shrink-0 text-xs text-slate-600">类型</span>
          <Select value={positionType} onValueChange={(value) => updateProp('positionType', value)}>
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
                <span className="w-4 shrink-0 text-center text-xs text-slate-500">{label}</span>
                <InputNumber
                  value={val}
                  onChange={(value) => updateProp(key, value ?? 0)}
                  size="small"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="尺寸">
        <SizeDimensionRow
          label="宽度"
          tips={WIDTH_TIPS}
          mode={widthMode}
          value={width}
          onModeChange={(mode) => updateProp('widthMode', mode)}
          onValueChange={(value) => updateProp('width', value)}
        />
        <SizeDimensionRow
          label="高度"
          tips={HEIGHT_TIPS}
          mode={heightMode}
          value={height}
          onModeChange={(mode) => updateProp('heightMode', mode)}
          onValueChange={(value) => updateProp('height', value)}
        />
      </CollapsibleSection>

      <CollapsibleSection title="容器样式">
        <div className="flex items-center gap-2 py-1.5">
          <span className="w-10 shrink-0 text-xs text-slate-600">填充</span>
          <div className="flex-1">
            {cs.background && cs.background !== 'transparent' ? (
              <ColorPickerPopover value={cs.background} onChange={(color) => updateCs('background', color)} />
            ) : (
              <span className="text-xs text-slate-400">无填充</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => updateCs('background', cs.background && cs.background !== 'transparent' ? 'transparent' : '#ffffff')}
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

        <FourSideInput
          label="圆角"
          value={cs.borderRadius}
          sideKeys={{ a: 'tl', b: 'tr', c: 'bl', d: 'br' }}
          sideLabels={{ a: '左上', b: '右上', c: '左下', d: '右下' }}
          onChange={(value) => updateCs('borderRadius', value as FourCornerValue)}
        />

        <FourSideInput
          label="内边距"
          value={cs.padding}
          sideKeys={{ a: 'top', b: 'right', c: 'bottom', d: 'left' }}
          sideLabels={{ a: '上', b: '右', c: '下', d: '左' }}
          onChange={(value) => updateCs('padding', value as FourSideValue)}
        />

        <FourSideInput
          label="外边距"
          value={cs.margin}
          sideKeys={{ a: 'top', b: 'right', c: 'bottom', d: 'left' }}
          sideLabels={{ a: '上', b: '右', c: '下', d: '左' }}
          onChange={(value) => updateCs('margin', value as FourSideValue)}
        />

        <BorderEditorPopover value={cs.border ?? null} onChange={(value) => updateCs('border', value)} />
        <ShadowEditorPopover value={cs.shadow ?? null} onChange={(value) => updateCs('shadow', value)} />

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
                      {BLUR_TYPE_OPTIONS.find((opt) => opt.value === blur.type)?.label ?? '图层模糊'}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {BLUR_TYPE_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        className="text-xs"
                        onSelect={() => updateProp('blur', { ...blur, type: opt.value })}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <InputNumber
                  value={blur.value}
                  onChange={(value) => updateProp('blur', { ...blur, value: value ?? 0 })}
                  size="small"
                  min={0}
                  className="w-16"
                />
              </div>
            ) : (
              <span className="text-xs text-slate-400">无模糊</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => updateProp('blur', blur ? null : { type: 'layer' as BlurType, value: 4 })}
            className={`shrink-0 rounded p-1 ${
              blur ? 'text-rose-400 hover:bg-rose-50' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={blur ? '移除模糊' : '添加模糊'}
          >
            {blur ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        </div>

        <div className="flex items-center gap-2 py-1.5">
          <div className="flex w-14 shrink-0 items-center gap-1">
            <span className="text-xs text-slate-600">溢出</span>
            <InfoTip content={OVERFLOW_TIPS} />
          </div>
          <Select value={overflow} onValueChange={(value) => updateProp('overflow', value)}>
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
