import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  CirclePlay,
  GripVertical,
  Minus,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import { Resizable } from 're-resizable';
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
import { Input, InputNumber, Switch, Tabs, TabsContent } from '@teamhelper/ui';
import { useDesignerStore } from './store/useDesignerStore';
import { getDefaultPageConfig } from './store/useDesignerStore';
import type {
  ARPageConfig,
  ContainerStyleConfig,
  I18nEntry,
  CustomMenuChild,
  CustomMenuGroup,
  FourCornerValue,
  FourSideValue,
  LayoutConfig,
} from './types';
import { createId } from './utils/id';
import { ColorPickerPopover } from './components/shared/ColorPickerPopover';
import { FourSideInput } from './components/shared/FourSideInput';
import { BorderEditorPopover } from './components/shared/BorderEditorPopover';
import { ShadowEditorPopover } from './components/shared/ShadowEditorPopover';
import { SegmentedControl } from './components/shared/SegmentedControl';
import {
  NumberInput,
  isHexColor,
  SwitchRow,
  NumberRow,
  CollapsibleSection,
} from './components/shared/property-helpers';
import type { ResolverComponentName } from './types';
import { ButtonPropertiesPanel } from './components/input/ButtonPropertiesPanel';
import { TextPropertiesPanel } from './components/display/TextPropertiesPanel';
import { InputFieldPropertiesPanel } from './components/input/InputFieldPropertiesPanel';
import { RadioGroupPropertiesPanel } from './components/input/RadioGroupPropertiesPanel';
import { CheckboxGroupPropertiesPanel } from './components/input/CheckboxGroupPropertiesPanel';
import { NumberInputPropertiesPanel } from './components/input/NumberInputPropertiesPanel';
import { ImageDisplayPropertiesPanel } from './components/display/ImageDisplayPropertiesPanel';
import { VideoDisplayPropertiesPanel } from './components/display/VideoDisplayPropertiesPanel';
import { MarkdownDisplayPropertiesPanel } from './components/display/MarkdownDisplayPropertiesPanel';
import { AudioDisplayPropertiesPanel } from './components/display/AudioDisplayPropertiesPanel';
import { CarouselDisplayPropertiesPanel } from './components/display/CarouselDisplayPropertiesPanel';
import { AudioRecorderPropertiesPanel } from './components/input/AudioRecorderPropertiesPanel';
import { VideoRecorderPropertiesPanel } from './components/input/VideoRecorderPropertiesPanel';
import { ContainerPropertiesPanel } from './components/container/ContainerPropertiesPanel';
import { FormPropertiesPanel } from './components/container/FormPropertiesPanel';
import { HorizontalListPropertiesPanel } from './components/container/HorizontalListPropertiesPanel';
import { VerticalListPropertiesPanel } from './components/container/VerticalListPropertiesPanel';
import { GridListPropertiesPanel } from './components/container/GridListPropertiesPanel';
import { LayoutEditor } from './components/shared/LayoutEditor';

/** 组件名 → 属性面板的注册表，新增组件只需在此添加一行 */
const COMPONENT_PANEL_MAP: Partial<Record<ResolverComponentName, React.ComponentType>> = {
  Button: ButtonPropertiesPanel,
  Text: TextPropertiesPanel,
  InputField: InputFieldPropertiesPanel,
  RadioGroup: RadioGroupPropertiesPanel,
  CheckboxGroup: CheckboxGroupPropertiesPanel,
  NumberInput: NumberInputPropertiesPanel,
  ImageDisplay: ImageDisplayPropertiesPanel,
  VideoDisplay: VideoDisplayPropertiesPanel,
  MarkdownDisplay: MarkdownDisplayPropertiesPanel,
  AudioDisplay: AudioDisplayPropertiesPanel,
  CarouselDisplay: CarouselDisplayPropertiesPanel,
  AudioRecorder: AudioRecorderPropertiesPanel,
  VideoRecorder: VideoRecorderPropertiesPanel,
  Container: ContainerPropertiesPanel,
  Form: FormPropertiesPanel,
  HorizontalList: HorizontalListPropertiesPanel,
  VerticalList: VerticalListPropertiesPanel,
  GridList: GridListPropertiesPanel,
};

const RIGHT_PANEL_DEFAULT_WIDTH = 320;
const RIGHT_PANEL_MIN_WIDTH = 280;
const RIGHT_PANEL_MAX_WIDTH = 520;
type PropertyTabKey = 'properties' | 'events' | 'i18n';
const PROPERTY_PANEL_TABS = [
  { label: '属性', value: 'properties' },
  { label: '事件', value: 'events' },
  { label: '国际化', value: 'i18n' },
] as const satisfies ReadonlyArray<{ label: string; value: PropertyTabKey }>;

/* ---- 通用小组件 / 属性行 / 可折叠区块 ---- */
/* 已提取到 ./components/property-helpers.tsx */

/* ---- 自定义菜单编辑器（dnd-kit 动画排序） ---- */

/** 可排序子菜单项 */
const SortableChildItem = ({
  child,
  groupId,
  onRename,
  onRemove,
}: {
  child: CustomMenuChild;
  groupId: string;
  onRename: (groupId: string, childId: string, name: string) => void;
  onRemove: (groupId: string, childId: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: child.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 rounded py-0.5 pl-4"
    >
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-slate-300 active:cursor-grabbing"
      >
        <GripVertical size={10} />
      </div>
      <input
        value={child.name}
        onChange={(e) => onRename(groupId, child.id, e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-xs text-slate-600 outline-none"
      />
      <button
        type="button"
        onClick={() => onRemove(groupId, child.id)}
        className="shrink-0 rounded p-0.5 text-slate-400 hover:text-rose-500"
      >
        <Minus size={10} />
      </button>
    </div>
  );
};

/** 可排序菜单组 */
const SortableGroupItem = ({
  group,
  expanded,
  onToggleExpand,
  onRenameGroup,
  onAddChild,
  onRemoveGroup,
  onRenameChild,
  onRemoveChild,
  onReorderChildren,
}: {
  group: CustomMenuGroup;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onAddChild: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onRenameChild: (groupId: string, childId: string, name: string) => void;
  onRemoveChild: (groupId: string, childId: string) => void;
  onReorderChildren: (
    groupId: string,
    activeId: string,
    overId: string
  ) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: group.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 子项排序独立 DndContext + sensor，避免与组排序冲突
  const childSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const childIds = React.useMemo(
    () => group.children.map((c) => c.id),
    [group.children]
  );

  const handleChildDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        onReorderChildren(group.id, String(active.id), String(over.id));
      }
    },
    [group.id, onReorderChildren]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border border-slate-200 bg-slate-50"
    >
      {/* 组头部 */}
      <div className="flex items-center gap-1 px-1.5 py-1">
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-slate-300 active:cursor-grabbing"
        >
          <GripVertical size={12} />
        </div>
        <button
          type="button"
          onClick={() => onToggleExpand(group.id)}
          className="shrink-0 text-slate-400"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <input
          value={group.name}
          onChange={(e) => onRenameGroup(group.id, e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none"
        />
        <button
          type="button"
          onClick={() => onAddChild(group.id)}
          className="shrink-0 rounded p-0.5 text-slate-400 hover:text-blue-500"
        >
          <Plus size={12} />
        </button>
        <button
          type="button"
          onClick={() => onRemoveGroup(group.id)}
          className="shrink-0 rounded p-0.5 text-slate-400 hover:text-rose-500"
        >
          <Minus size={12} />
        </button>
      </div>

      {/* 子项列表（独立 DndContext） */}
      {expanded && group.children.length > 0 && (
        <div className="space-y-0.5 border-t border-slate-200 px-1.5 py-1">
          <DndContext
            sensors={childSensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleChildDragEnd}
          >
            <SortableContext
              items={childIds}
              strategy={verticalListSortingStrategy}
            >
              {group.children.map((child) => (
                <SortableChildItem
                  key={child.id}
                  child={child}
                  groupId={group.id}
                  onRename={onRenameChild}
                  onRemove={onRemoveChild}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

/** 自定义菜单编辑器入口 */
const CustomMenuEditor = ({
  menus,
  onChange,
}: {
  menus: CustomMenuGroup[];
  onChange: (menus: CustomMenuGroup[]) => void;
}) => {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(menus.map((m) => m.id))
  );

  // 组排序 sensor：需要 5px 位移才激活，避免误触按钮/输入框
  const groupSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const groupIds = React.useMemo(() => menus.map((g) => g.id), [menus]);

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addGroup = () => {
    const id = createId('menu');
    onChange([...menus, { id, name: `菜单${menus.length + 1}`, children: [] }]);
    setExpandedIds((prev) => new Set(prev).add(id));
  };

  const removeGroup = (groupId: string) =>
    onChange(menus.filter((g) => g.id !== groupId));

  const renameGroup = (groupId: string, name: string) =>
    onChange(menus.map((g) => (g.id === groupId ? { ...g, name } : g)));

  const addChild = (groupId: string) => {
    const group = menus.find((g) => g.id === groupId);
    if (!group) return;
    const childId = createId('sub');
    onChange(
      menus.map((g) =>
        g.id === groupId
          ? {
              ...g,
              children: [
                ...g.children,
                { id: childId, name: `默认名称${g.children.length + 1}` },
              ],
            }
          : g
      )
    );
    setExpandedIds((prev) => new Set(prev).add(groupId));
  };

  const removeChild = (groupId: string, childId: string) =>
    onChange(
      menus.map((g) =>
        g.id === groupId
          ? { ...g, children: g.children.filter((c) => c.id !== childId) }
          : g
      )
    );

  const renameChild = (groupId: string, childId: string, name: string) =>
    onChange(
      menus.map((g) =>
        g.id === groupId
          ? {
              ...g,
              children: g.children.map((c) =>
                c.id === childId ? { ...c, name } : c
              ),
            }
          : g
      )
    );

  const reorderChildren = React.useCallback(
    (groupId: string, activeId: string, overId: string) => {
      onChange(
        menus.map((g) => {
          if (g.id !== groupId) return g;
          const oldIdx = g.children.findIndex((c) => c.id === activeId);
          const newIdx = g.children.findIndex((c) => c.id === overId);
          if (oldIdx < 0 || newIdx < 0) return g;
          return { ...g, children: arrayMove(g.children, oldIdx, newIdx) };
        })
      );
    },
    [menus, onChange]
  );

  const handleGroupDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = menus.findIndex((g) => g.id === active.id);
      const newIdx = menus.findIndex((g) => g.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return;
      onChange(arrayMove(menus, oldIdx, newIdx));
    },
    [menus, onChange]
  );

  return (
    <div className="space-y-1 py-1.5">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600">自定义菜单</span>
        <button
          type="button"
          onClick={addGroup}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* 菜单组列表（DndContext 动画排序） */}
      <DndContext
        sensors={groupSensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleGroupDragEnd}
      >
        <SortableContext
          items={groupIds}
          strategy={verticalListSortingStrategy}
        >
          {menus.map((group) => (
            <SortableGroupItem
              key={group.id}
              group={group}
              expanded={expandedIds.has(group.id)}
              onToggleExpand={toggleExpand}
              onRenameGroup={renameGroup}
              onAddChild={addChild}
              onRemoveGroup={removeGroup}
              onRenameChild={renameChild}
              onRemoveChild={removeChild}
              onReorderChildren={reorderChildren}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

/* ---- 布局属性子组件已提取到 ./components/shared/LayoutEditor.tsx ---- */

/* ---- 页面属性配置（属性 Tab） ---- */

const PagePropertiesTab = ({
  pageId,
  config,
}: {
  pageId: string;
  config: ARPageConfig;
}) => {
  const updatePageConfig = useDesignerStore((s) => s.updatePageConfig);

  return (
    <div className="space-y-0">
      <CollapsibleSection title="顶栏">
        <SwitchRow
          label="是否显示"
          checked={config.topBar.visible}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.topBar.visible = v;
            })
          }
        />
      </CollapsibleSection>

      <CollapsibleSection title="菜单">
        <SwitchRow
          label="是否显示"
          checked={config.menu.visible}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.menu.visible = v;
            })
          }
        />
        <NumberRow
          label="外边距"
          value={config.menu.margin}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.menu.margin = v;
            })
          }
        />
        <SwitchRow
          label="用户显示"
          checked={config.menu.showUser}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.menu.showUser = v;
            })
          }
        />
        <CustomMenuEditor
          menus={config.menu.customMenus ?? []}
          onChange={(menus) =>
            updatePageConfig(pageId, (c) => {
              c.menu.customMenus = menus;
            })
          }
        />
        <SwitchRow
          label="系统"
          checked={config.menu.showSystem}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.menu.showSystem = v;
            })
          }
        />
        <SwitchRow
          label="指令"
          checked={config.menu.showCommand}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.menu.showCommand = v;
            })
          }
        />
      </CollapsibleSection>

      <CollapsibleSection title="系统状态">
        <SwitchRow
          label="是否显示"
          checked={config.systemStatus.visible}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.visible = v;
            })
          }
        />
        <NumberRow
          label="外边距"
          value={config.systemStatus.margin}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.margin = v;
            })
          }
        />
        <NumberRow
          label="元素间距"
          value={config.systemStatus.gap}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.gap = v;
            })
          }
        />
        <SwitchRow
          label="蜂窝网络"
          checked={config.systemStatus.showCellular}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.showCellular = v;
            })
          }
        />
        <SwitchRow
          label="WIFI"
          checked={config.systemStatus.showWifi}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.showWifi = v;
            })
          }
        />
        <SwitchRow
          label="移动数据"
          checked={config.systemStatus.showMobileData ?? true}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.showMobileData = v;
            })
          }
        />
        <SwitchRow
          label="蓝牙"
          checked={config.systemStatus.showBluetooth ?? true}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.showBluetooth = v;
            })
          }
        />
        <SwitchRow
          label="GPS定位"
          checked={config.systemStatus.showGPS ?? true}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.showGPS = v;
            })
          }
        />
        <SwitchRow
          label="音量状态"
          checked={config.systemStatus.showVolume ?? true}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.showVolume = v;
            })
          }
        />
        <SwitchRow
          label="时间"
          checked={config.systemStatus.showTime ?? true}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.showTime = v;
            })
          }
        />
        <SwitchRow
          label="电池百分比"
          checked={config.systemStatus.showBatteryPercent ?? false}
          onChange={(v) =>
            updatePageConfig(pageId, (c) => {
              c.systemStatus.showBatteryPercent = v;
            })
          }
        />
      </CollapsibleSection>

      <CollapsibleSection title="布局">
        {(() => {
          const layout: LayoutConfig = config.layout ?? {
            arrangement: 'vertical',
            spacingMode: 'fixed',
            spacing: 8,
            distribution: 'top-left',
            columnDistribution: 'left',
          };

          const updateLayout = (updater: (l: LayoutConfig) => void) =>
            updatePageConfig(pageId, (c) => {
              if (!c.layout) {
                c.layout = {
                  arrangement: 'vertical',
                  spacingMode: 'fixed',
                  spacing: 8,
                  distribution: 'top-left',
                  columnDistribution: 'left',
                };
              }
              updater(c.layout);
            });

          return <LayoutEditor layout={layout} onChange={updateLayout} />;
        })()}
      </CollapsibleSection>

      {/* ---- 容器样式 ---- */}
      {(() => {
        const cs: ContainerStyleConfig = config.containerStyle ?? {
          background: '#0f172a',
          borderRadius: 0,
          padding: 12,
          margin: 0,
          border: null,
          shadow: null,
        };

        const updateCs = (updater: (s: ContainerStyleConfig) => void) => {
          updatePageConfig(pageId, (c) => {
            if (!c.containerStyle) {
              c.containerStyle = {
                background: '#0f172a',
                borderRadius: 0,
                padding: 12,
                margin: 0,
                border: null,
                shadow: null,
              };
            }
            updater(c.containerStyle);
          });
        };

        return (
          <CollapsibleSection title="容器样式">
            {/* 填充 */}
            <div className="flex items-center gap-2 py-1.5">
              <span className="w-10 shrink-0 text-xs text-slate-600">填充</span>
              <div className="flex-1">
                {cs.background && cs.background !== 'transparent' ? (
                  <ColorPickerPopover
                    value={cs.background}
                    onChange={(color) =>
                      updateCs((s) => {
                        s.background = color;
                      })
                    }
                  />
                ) : (
                  <span className="text-xs text-slate-400">无填充</span>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  updateCs((s) => {
                    s.background = s.background && s.background !== 'transparent' ? 'transparent' : '#ffffff';
                  })
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
              onChange={(v) =>
                updateCs((s) => {
                  s.borderRadius = v as FourCornerValue;
                })
              }
            />

            {/* 内边距 */}
            <FourSideInput
              label="内边距"
              value={cs.padding}
              sideKeys={{ a: 'top', b: 'right', c: 'bottom', d: 'left' }}
              sideLabels={{ a: '上', b: '右', c: '下', d: '左' }}
              onChange={(v) =>
                updateCs((s) => {
                  s.padding = v as FourSideValue;
                })
              }
            />

            {/* 外边距 */}
            <FourSideInput
              label="外边距"
              value={cs.margin}
              sideKeys={{ a: 'top', b: 'right', c: 'bottom', d: 'left' }}
              sideLabels={{ a: '上', b: '右', c: '下', d: '左' }}
              onChange={(v) =>
                updateCs((s) => {
                  s.margin = v as FourSideValue;
                })
              }
            />

            {/* 边框 */}
            <BorderEditorPopover
              value={cs.border ?? null}
              onChange={(v) =>
                updateCs((s) => {
                  s.border = v;
                })
              }
            />

            {/* 阴影 */}
            <ShadowEditorPopover
              value={cs.shadow ?? null}
              onChange={(v) =>
                updateCs((s) => {
                  s.shadow = v;
                })
              }
            />
          </CollapsibleSection>
        );
      })()}
    </div>
  );
};


const I18N_ACTION_BUTTON_CLASS = 'mb-2 inline-flex items-center gap-1.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer';
const I18N_ACTION_ICON_CLASS = 'flex h-4 w-4 items-center justify-center rounded-full border border-current';
const I18N_TABLE_WRAPPER_CLASS = 'overflow-hidden rounded-md border border-slate-200 bg-white';
const I18N_HEADER_CELL_CLASS = 'border-b border-r border-slate-200 px-3 py-2 text-xs font-medium text-slate-700';
const I18N_HEADER_LAST_CELL_CLASS = 'border-b border-slate-200 px-3 py-2 text-xs font-medium text-slate-700';
const I18N_BODY_CELL_CLASS = 'flex h-8 items-center px-3 text-xs';
const I18N_INPUT_CLASS = 'h-6 w-full border-0 bg-transparent px-0 text-xs leading-5 text-slate-700 outline-none ring-0 placeholder:text-slate-300';
const I18N_EMPTY_TEXT_CLASS = 'px-3 py-5 text-center text-xs text-slate-400';


const getI18nBodyCellClassName = ({
  isLastRow,
  withRightBorder = true,
  className = '',
}: {
  isLastRow: boolean;
  withRightBorder?: boolean;
  className?: string;
}) => {
  return [
    I18N_BODY_CELL_CLASS,
    withRightBorder && 'border-r border-slate-200',
    className,
  ]
    .filter(Boolean)
    .join(' ');
};

const I18nPanelShell = ({
  currentTitle,
  children,
}: {
  currentTitle: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="space-y-0">
      <CollapsibleSection title="全局" defaultOpen>
        <div className="px-1 py-1.5 text-xs text-slate-400">全局国际化配置暂未开放</div>
      </CollapsibleSection>

      <CollapsibleSection title={currentTitle} defaultOpen>
        {children}
      </CollapsibleSection>
    </div>
  );
};

const I18nAddButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={I18N_ACTION_BUTTON_CLASS}
  >
    <span className={I18N_ACTION_ICON_CLASS}>
      <Plus size={12} />
    </span>
    {label}
  </button>
);

const I18nTableCard = ({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={`${I18N_TABLE_WRAPPER_CLASS} ${className}`.trim()}>{children}</div>
);

const I18N_REMOVE_BUTTON_CLASS = 'inline-flex h-5 w-5 items-center justify-center text-slate-400 transition-colors hover:text-rose-500';
const I18N_REMOVE_CELL_CLASS = 'flex h-8 w-5 shrink-0 items-center justify-center';

type I18nEntryField = 'key' | 'zhCN' | 'enUS';

const I18nGridTemplateColumns = 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)';

const I18nHeaderRow = () => {
  return (
    <div className="grid bg-slate-50" style={{ gridTemplateColumns: I18nGridTemplateColumns }}>
      <div className={I18N_HEADER_CELL_CLASS}>key值</div>
      <div className={I18N_HEADER_CELL_CLASS}>中文</div>
      <div className={I18N_HEADER_LAST_CELL_CLASS}>英文</div>
    </div>
  );
};

const I18nEntryRow = React.memo(({
  entry,
  isLastRow,
  withRemove,
  onChange,
  onRemove,
}: {
  entry: I18nEntry;
  isLastRow: boolean;
  withRemove: boolean;
  onChange: (entryId: string, field: I18nEntryField, value: string) => void;
  onRemove?: (entryId: string) => void;
}) => {
  return (
    <div className="flex w-full items-stretch gap-2">
      <div
        className={`grid min-w-0 flex-1 border-x border-b border-slate-200 bg-white ${isLastRow ? 'rounded-b-md' : ''}`.trim()}
        style={{
          gridTemplateColumns: I18nGridTemplateColumns,
          contentVisibility: 'auto',
          containIntrinsicSize: '32px',
        }}
      >
        <div className={getI18nBodyCellClassName({ isLastRow })}>
          <input
            value={entry.key}
            onChange={(event) => onChange(entry.id, 'key', event.target.value)}
            placeholder="请输入 key"
            className={I18N_INPUT_CLASS}
          />
        </div>
        <div className={getI18nBodyCellClassName({ isLastRow })}>
          <input
            value={entry.zhCN}
            onChange={(event) => onChange(entry.id, 'zhCN', event.target.value)}
            placeholder="请输入中文"
            className={I18N_INPUT_CLASS}
          />
        </div>
        <div className={getI18nBodyCellClassName({ isLastRow, withRightBorder: false })}>
          <input
            value={entry.enUS}
            onChange={(event) => onChange(entry.id, 'enUS', event.target.value)}
            placeholder="请输入英文"
            className={I18N_INPUT_CLASS}
          />
        </div>
      </div>
      {withRemove ? (
        <div className={I18N_REMOVE_CELL_CLASS}>
          <button
            type="button"
            onClick={() => onRemove?.(entry.id)}
            className={I18N_REMOVE_BUTTON_CLASS}
            aria-label="删除国际化行"
          >
            <Minus size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
});

const I18nEntriesTab = ({
  currentTitle,
  entries,
  onAdd,
  onChange,
  onRemove,
}: {
  currentTitle: string;
  entries: I18nEntry[];
  onAdd: () => void;
  onChange: (entryId: string, field: I18nEntryField, value: string) => void;
  onRemove?: (entryId: string) => void;
}) => {
  const withRemove = Boolean(onRemove);

  return (
    <I18nPanelShell currentTitle={currentTitle}>
      <I18nAddButton label="新增key" onClick={onAdd} />

      {entries.length > 0 ? (
        <div className="space-y-0">
          <div className="flex items-stretch gap-2">
            <I18nTableCard className="min-w-0 flex-1 rounded-b-none border-b-0">
              <I18nHeaderRow />
            </I18nTableCard>
            {withRemove ? <div className="w-5 shrink-0" /> : null}
          </div>

          <div className="space-y-0">
            {entries.map((entry, index) => (
              <I18nEntryRow
                key={entry.id}
                entry={entry}
                isLastRow={index === entries.length - 1}
                withRemove={withRemove}
                onChange={onChange}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      ) : (
        <I18nTableCard>
          <I18nHeaderRow />
          <div className={I18N_EMPTY_TEXT_CLASS}>暂无国际化 key，点击上方“新增key”开始配置</div>
        </I18nTableCard>
      )}
    </I18nPanelShell>
  );
};

const PageI18nTab = ({
  pageId,
  config,
}: {
  pageId: string;
  config: ARPageConfig;
}) => {
  const updatePageConfig = useDesignerStore((s) => s.updatePageConfig);
  const entries = config.i18n?.entries ?? [];

  const updateEntries = React.useCallback(
    (updater: (entries: I18nEntry[]) => void) => {
      updatePageConfig(pageId, (pageConfig) => {
        if (!pageConfig.i18n) {
          pageConfig.i18n = { entries: [] };
        }
        updater(pageConfig.i18n.entries);
      });
    },
    [pageId, updatePageConfig]
  );

  const handleAddEntry = React.useCallback(() => {
    updateEntries((currentEntries) => {
      currentEntries.push({
        id: createId('i18n'),
        key: '',
        zhCN: '',
        enUS: '',
      });
    });
  }, [updateEntries]);

  const handleEntryChange = React.useCallback((
    entryId: string,
    field: I18nEntryField,
    value: string,
  ) => {
    updateEntries((currentEntries) => {
      const targetEntry = currentEntries.find((entry) => entry.id === entryId);
      if (!targetEntry) return;
      targetEntry[field] = value;
    });
  }, [updateEntries]);

  const handleEntryRemove = React.useCallback((entryId: string) => {
    updateEntries((currentEntries) => {
      const targetIndex = currentEntries.findIndex((entry) => entry.id === entryId);
      if (targetIndex < 0) return;
      currentEntries.splice(targetIndex, 1);
    });
  }, [updateEntries]);

  return (
    <I18nEntriesTab
      currentTitle="当前页面"
      entries={entries}
      onAdd={handleAddEntry}
      onChange={handleEntryChange}
      onRemove={handleEntryRemove}
    />
  );
};

const NodeI18nTab = () => {
  const activeNode = useDesignerStore((s) => s.activeNode);
  const updateActiveNodeProp = useDesignerStore((s) => s.updateActiveNodeProp);

  if (!activeNode) return null;

  const entries = ((activeNode.props.i18n as { entries?: I18nEntry[] } | undefined)?.entries ?? []);

  const handleAddEntry = React.useCallback(() => {
    const active = useDesignerStore.getState().activeNode;
    if (!active) return;

    const currentEntries = ((active.props.i18n as { entries?: I18nEntry[] } | undefined)?.entries ?? []);
    updateActiveNodeProp('i18n', {
      entries: [
        ...currentEntries,
        {
          id: createId('node_i18n'),
          key: '',
          zhCN: '',
          enUS: '',
        },
      ],
    });
  }, [updateActiveNodeProp]);

  const handleEntryChange = React.useCallback((
    entryId: string,
    field: I18nEntryField,
    value: string,
  ) => {
    const active = useDesignerStore.getState().activeNode;
    if (!active) return;

    const currentEntries = ((active.props.i18n as { entries?: I18nEntry[] } | undefined)?.entries ?? []);
    updateActiveNodeProp('i18n', {
      entries: currentEntries.map((entry) =>
        entry.id === entryId ? { ...entry, [field]: value } : entry
      ),
    });
  }, [updateActiveNodeProp]);

  const handleEntryRemove = React.useCallback((entryId: string) => {
    const active = useDesignerStore.getState().activeNode;
    if (!active) return;

    const currentEntries = ((active.props.i18n as { entries?: I18nEntry[] } | undefined)?.entries ?? []);
    updateActiveNodeProp('i18n', {
      entries: currentEntries.filter((entry) => entry.id !== entryId),
    });
  }, [updateActiveNodeProp]);

  return (
    <I18nEntriesTab
      currentTitle="当前组件"
      entries={entries}
      onAdd={handleAddEntry}
      onChange={handleEntryChange}
      onRemove={handleEntryRemove}
    />
  );
};

/* ---- 组件属性区（保持原有逻辑） ---- */

const NodePropertiesSection = () => {
  const activeNode = useDesignerStore((s) => s.activeNode);
  const updateActiveNodeProp = useDesignerStore((s) => s.updateActiveNodeProp);
  const removeActiveNode = useDesignerStore((s) => s.removeActiveNode);

  const nodeProps = React.useMemo(
    () => Object.entries(activeNode?.props ?? {}),
    [activeNode?.props]
  );

  if (!activeNode) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          组件属性
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
      <div className="space-y-2">
        {nodeProps.map(([key, value]) => {
          const valueType = typeof value;
          const keyId = `${activeNode.nodeId}_${key}`;

          if (valueType === 'boolean') {
            return (
              <label
                key={keyId}
                className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5"
              >
                <span className="text-xs font-medium text-slate-600">
                  {key}
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    updateActiveNodeProp(key, event.target.checked)
                  }
                />
              </label>
            );
          }

          if (valueType === 'number') {
            return (
              <div key={keyId} className="space-y-1">
                <label className="text-xs text-slate-500">{key}</label>
                <NumberInput
                  value={Number(value)}
                  onChange={(nextValue) => updateActiveNodeProp(key, nextValue)}
                />
              </div>
            );
          }

          if (typeof value === 'string' && isHexColor(value)) {
            return (
              <div key={keyId} className="space-y-1">
                <label className="text-xs text-slate-500">{key}</label>
                <ColorPickerPopover
                  value={value}
                  onChange={(color) => updateActiveNodeProp(key, color)}
                />
              </div>
            );
          }

          if (valueType === 'string') {
            return (
              <div key={keyId} className="space-y-1">
                <label className="text-xs text-slate-500">{key}</label>
                <input
                  value={String(value)}
                  onChange={(event) =>
                    updateActiveNodeProp(key, event.target.value)
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none ring-blue-500 focus:ring-2"
                />
              </div>
            );
          }

          return (
            <div key={keyId} className="space-y-1">
              <label className="text-xs text-slate-500">{key}</label>
              <textarea
                readOnly
                value={JSON.stringify(value, null, 2)}
                className="min-h-20 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-xs text-slate-600"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ---- 主面板 ---- */

/** 页面名称编辑框：支持实时输入，空值时显示红框，失焦时回退 */
const PageNameInput = ({
  pageId,
  title,
}: {
  pageId: string;
  title: string;
}) => {
  const renamePage = useDesignerStore((s) => s.renamePage);
  const [localValue, setLocalValue] = React.useState(title);
  const isEmpty = localValue.trim() === '';

  React.useEffect(() => {
    setLocalValue(title);
  }, [title]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);
    if (next.trim()) {
      renamePage(pageId, next);
    }
  };

  const handleBlur = () => {
    if (isEmpty) {
      setLocalValue(title || '未命名页面');
      renamePage(pageId, title || '未命名页面');
    }
  };

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`min-w-0 flex-1 text-sm font-semibold h-7 ${
        isEmpty ? 'border-red-400 focus-visible:border-red-400' : ''
      }`}
    />
  );
};

export const PropertyPanel = () => {
  const activeNode = useDesignerStore((s) => s.activeNode);
  const activePageId = useDesignerStore((s) => s.activePageId);
  const pages = useDesignerStore((s) => s.pages);
  const pageOrder = useDesignerStore((s) => s.pageOrder);
  const removePage = useDesignerStore((s) => s.removePage);
  const activePage = activePageId ? pages[activePageId] : null;
  const pageConfig = activePage?.config ?? getDefaultPageConfig();

  const [collapsed, setCollapsed] = React.useState(false);
  const [panelWidth, setPanelWidth] = React.useState(RIGHT_PANEL_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = React.useState(false);
  const [activeTab, setActiveTab] =
    React.useState<PropertyTabKey>('properties');

  React.useEffect(() => {
    setActiveTab('properties');
  }, [activeNode?.nodeId, activePageId]);

  /* ---- 收起态：悬浮小块 ---- */
  if (collapsed) {
    return (
      <div className="relative shrink-0">
        <div className="absolute right-2 top-3 z-10 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-md">
          <button
            type="button"
            title="预览"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <CirclePlay size={16} />
          </button>
          <button
            type="button"
            title="展开面板"
            onClick={() => setCollapsed(false)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <PanelRightOpen size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ---- 展开态：完整面板 ---- */
  return (
    <Resizable
      size={{ width: panelWidth, height: '100%' }}
      minWidth={RIGHT_PANEL_MIN_WIDTH}
      maxWidth={RIGHT_PANEL_MAX_WIDTH}
      className="relative shrink-0"
      enable={{
        top: false,
        right: false,
        bottom: false,
        left: true,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      handleStyles={{
        left: {
          left: -4,
          width: 8,
          cursor: 'col-resize',
          zIndex: 20,
        },
      }}
      handleComponent={{
        left: (
          <div className="group flex h-full w-full items-center justify-center transition-colors">
            <div
              className={`h-full w-0.5 transition-colors ${
                isResizing
                  ? 'bg-blue-600'
                  : 'bg-slate-200 group-hover:bg-slate-400'
              }`}
            />
          </div>
        ),
      }}
      onResizeStart={() => {
        setIsResizing(true);
      }}
      onResizeStop={(_event, _direction, ref) => {
        setPanelWidth(ref.offsetWidth);
        setIsResizing(false);
      }}
    >
      <aside className="flex h-full w-full min-w-0 flex-col border-l border-slate-200 bg-white">
        {/* 头部：页面名称 + 操作 */}
        <div className="border-b border-slate-200 p-4">
          {activePage ? (
            <div className="flex items-center gap-1.5">
              <PageNameInput pageId={activePage.id} title={activePage.title} />
              <button
                type="button"
                title="预览"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                <CirclePlay size={13} />
                预览
              </button>
              <button
                type="button"
                title="设置"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Settings size={15} />
              </button>
              {pageOrder.length > 1 && (
                <button
                  type="button"
                  title="删除页面"
                  onClick={() => removePage(activePage.id)}
                  className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                type="button"
                title="收起面板"
                onClick={() => setCollapsed(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <PanelRightClose size={15} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400">未选择页面</p>
          )}
        </div>

        {/* 内容区 */}
        {activePage && !activeNode ? (
          /* 页面属性配置（无组件选中时） */
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as PropertyTabKey)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SegmentedControl
              options={PROPERTY_PANEL_TABS}
              value={activeTab}
              onValueChange={setActiveTab}
              columns={3}
              className="mx-4 my-2"
            />

            <TabsContent
              value="properties"
              className="min-h-0 flex-1 overflow-y-auto px-4 pt-2"
            >
              <PagePropertiesTab pageId={activePage.id} config={pageConfig} />
            </TabsContent>

            <TabsContent
              value="events"
              className="min-h-0 flex-1 overflow-y-auto px-4 pt-4"
            >
              <p className="text-xs text-slate-400">事件配置（开发中）</p>
            </TabsContent>

            <TabsContent
              value="i18n"
              className="min-h-0 flex-1 overflow-y-auto px-4 pt-4"
            >
              <PageI18nTab pageId={activePage.id} config={pageConfig} />
            </TabsContent>
          </Tabs>
        ) : activeNode ? (
          /* 组件属性 */
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as PropertyTabKey)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SegmentedControl
              options={PROPERTY_PANEL_TABS}
              value={activeTab}
              onValueChange={setActiveTab}
              columns={3}
              className="mx-4 my-2"
            />

            <TabsContent
              value="properties"
              className="min-h-0 flex-1 overflow-y-auto px-4 pt-2"
            >
              {(() => {
                const PanelComp = COMPONENT_PANEL_MAP[activeNode.name];
                return PanelComp ? <PanelComp /> : <NodePropertiesSection />;
              })()}
            </TabsContent>

            <TabsContent
              value="events"
              className="min-h-0 flex-1 overflow-y-auto px-4 pt-4"
            >
              <p className="text-xs text-slate-400">事件配置（开发中）</p>
            </TabsContent>

            <TabsContent
              value="i18n"
              className="min-h-0 flex-1 overflow-y-auto px-4 pt-4"
            >
              <NodeI18nTab />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-4">
            <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
              选中页面中的组件后，可在此编辑属性。
            </section>
          </div>
        )}
      </aside>
    </Resizable>
  );
};
