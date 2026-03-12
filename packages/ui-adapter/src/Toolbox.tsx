import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  ChevronRight,
  EllipsisVertical,
  File,
  Layers,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Resizable } from 're-resizable';
import {
  CRAFT_COMPONENT_MIME,
  COMPONENT_REGISTRY,
  createDragPayload,
  encodeDragPayload,
} from './componentRegistry';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Input,
  InputNumber,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@teamhelper/ui';
import { SegmentedControl } from './components/shared/SegmentedControl';
import { InfoTip } from './components/shared/property-helpers';
import { useDesignerStore } from './store/useDesignerStore';
import { useLayerPortalStore } from './store/layerPortal';
import type { GlobalVariable } from './types';
import { GLOBAL_VARIABLE_TYPES } from './types';
import JsonEditor from './components/shared/JsonEditor';

type TabKey = '组件' | '模板' | '结构' | '数据';
const LEFT_PANEL_DEFAULT_WIDTH = 288;
const LEFT_PANEL_MIN_WIDTH = 240;
const LEFT_PANEL_MAX_WIDTH = 420;
const TOOLBOX_TABS = [
  { label: '组件', value: '组件' },
  { label: '模板', value: '模板' },
  { label: '结构', value: '结构' },
  { label: '数据', value: '数据' },
] as const satisfies ReadonlyArray<{ label: string; value: TabKey }>;

/* ------------------------------------------------------------------ */
/*  组件 Tab                                                           */
/* ------------------------------------------------------------------ */

const ComponentsTab = ({ searchTerm }: { searchTerm: string }) => {
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  const filteredGroups = React.useMemo(() => {
    const filtered = searchTerm
      ? COMPONENT_REGISTRY.filter((item) => item.label.includes(searchTerm))
      : COMPONENT_REGISTRY;

    return filtered.reduce<Record<string, typeof COMPONENT_REGISTRY>>(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {}
    );
  }, [searchTerm]);

  const toggleCategory = (category: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    type: string
  ) => {
    const payload = createDragPayload(type);
    if (!payload) return;

    const encoded = encodeDragPayload(payload);
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(CRAFT_COMPONENT_MIME, encoded);
    event.dataTransfer.setData('text/plain', encoded);
  };

  const entries = Object.entries(filteredGroups);

  if (searchTerm && entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
        未找到匹配的组件
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-1 overflow-y-auto p-3">
      {entries.map(([category, components]) => {
        const isCollapsed = collapsed.has(category);

        return (
          <section key={category}>
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <ChevronRight
                size={14}
                className={`shrink-0 text-slate-400 transition-transform duration-150 ${
                  isCollapsed ? '' : 'rotate-90'
                }`}
              />
              <span className="flex-1 text-left">{category}</span>
              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                {components.length}
              </span>
            </button>

            {!isCollapsed && (
              <div className="mt-1.5 mb-2 grid grid-cols-3 gap-2">
                {components.map((component) => (
                  <div
                    key={component.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, component.type)}
                    className="cursor-grab rounded-lg border border-transparent bg-white p-1.5 text-left transition hover:border-blue-200 hover:bg-blue-50 active:cursor-grabbing"
                    title={component.description}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mb-1 w-full overflow-hidden rounded">
                      <img
                        src={component.icon}
                        alt={component.label}
                        className="h-auto w-full object-contain"
                        draggable={false}
                      />
                    </div>
                    <p className="truncate text-center text-[11px] font-medium text-slate-700">
                      {component.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  页面菜单                                                           */
/* ------------------------------------------------------------------ */

const PageMenu = ({
  pageId,
  onClose,
  anchorRef,
}: {
  pageId: string;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) => {
  const removePage = useDesignerStore((s) => s.removePage);
  const renamePage = useDesignerStore((s) => s.renamePage);
  const pageCount = useDesignerStore((s) => s.pageOrder.length);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        anchorRef.current?.contains(e.target as Node)
      )
        return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-1 w-28 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        onClick={() => {
          const title = window.prompt('重命名页面');
          if (title) renamePage(pageId, title);
          onClose();
        }}
      >
        <Pencil size={12} /> 重命名
      </button>
      <button
        type="button"
        disabled={pageCount <= 1}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-40"
        onClick={() => {
          removePage(pageId);
          onClose();
        }}
      >
        <Trash2 size={12} /> 删除
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  结构 Tab                                                           */
/* ------------------------------------------------------------------ */

const StructureTab = () => {
  const pageSummaries = useDesignerStore(
    useShallow((state) =>
      state.pageOrder
        .map((pageId) => {
          const page = state.pages[pageId];
          return page ? [page.id, page.title].join('::') : null;
        })
        .filter((item): item is string => item !== null)
    )
  );
  const pages = React.useMemo(
    () =>
      pageSummaries.map((item) => {
        const [id, title] = item.split('::');
        return { id, title };
      }),
    [pageSummaries]
  );
  const activePageId = useDesignerStore((s) => s.activePageId);
  const setActivePage = useDesignerStore((s) => s.setActivePage);
  const setContainerEl = useLayerPortalStore((s) => s.setContainerEl);

  const [menuPageId, setMenuPageId] = React.useState<string | null>(null);
  const menuBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const layerContainerRef = React.useCallback(
    (el: HTMLDivElement | null) => setContainerEl(el),
    [setContainerEl]
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-slate-200 py-2">
        <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          页面
        </h3>
        <div className="mt-1 max-h-[180px] overflow-auto">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`group relative flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs ${
                page.id === activePageId
                  ? 'bg-blue-50 font-medium text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setActivePage(page.id)}
            >
              <File size={13} className="shrink-0" />
              <span className="flex-1 truncate">{page.title}</span>
              <div className="relative">
                <button
                  ref={menuPageId === page.id ? menuBtnRef : undefined}
                  type="button"
                  className="rounded p-0.5 opacity-0 hover:bg-slate-200 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuPageId(menuPageId === page.id ? null : page.id);
                  }}
                >
                  <EllipsisVertical size={14} />
                </button>
                {menuPageId === page.id && (
                  <PageMenu
                    pageId={page.id}
                    anchorRef={menuBtnRef}
                    onClose={() => setMenuPageId(null)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-2">
        <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <Layers size={11} className="mr-1 inline" />
          图层
        </h3>
        <div className="mt-1 px-2">
          <div
            ref={layerContainerRef}
            className="max-h-[42vh] overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  JSON 值编辑器（Object / Array）                                     */
/* ------------------------------------------------------------------ */

const JsonValueEditor = ({
  value,
  onChange,
  jsonType,
}: {
  value: string;
  onChange: (val: string) => void;
  jsonType: 'object' | 'array';
}) => {
  const errorText = React.useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (jsonType === 'object') {
        if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed))
          return '值必须是 JSON 对象';
      } else {
        if (!Array.isArray(parsed)) return '值必须是 JSON 数组';
      }
      return null;
    } catch {
      return 'JSON 格式错误';
    }
  }, [value, jsonType]);

  const handleFormat = React.useCallback(() => {
    try {
      const parsed = JSON.parse(value.trim());
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore
    }
  }, [value, onChange]);

  const canFormat = value.trim() && !errorText;

  return (
    <JsonEditor
      value={value}
      onChange={onChange}
      height="100px"
      onFormat={canFormat ? handleFormat : undefined}
      formatText={canFormat ? '格式化' : undefined}
      errorText={errorText}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  变量值输入（按类型切换）                                               */
/* ------------------------------------------------------------------ */

const VariableValueInput = ({
  type,
  value,
  onChange,
}: {
  type: string;
  value: string;
  onChange: (val: string) => void;
}) => {
  if (type === 'boolean') {
    return (
      <Select value={value || 'true'} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue placeholder="选择布尔值" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true" className="text-xs">true</SelectItem>
          <SelectItem value="false" className="text-xs">false</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (type === 'integer') {
    const numVal = value === '' ? null : Number(value);
    return (
      <InputNumber
        value={Number.isNaN(numVal) ? null : numVal}
        onChange={(v) => onChange(v == null ? '' : String(v))}
        step={1}
        precision={0}
        placeholder="整数值"
        size="small"
        className="w-full"
        inputClassName="h-7 text-xs"
      />
    );
  }

  if (type === 'number') {
    const numVal = value === '' ? null : Number(value);
    return (
      <InputNumber
        value={Number.isNaN(numVal) ? null : numVal}
        onChange={(v) => onChange(v == null ? '' : String(v))}
        placeholder="数值"
        size="small"
        className="w-full"
        inputClassName="h-7 text-xs"
      />
    );
  }

  if (type === 'object' || type === 'array') {
    return <JsonValueEditor value={value} onChange={onChange} jsonType={type} />;
  }

  // string (default)
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="变量值"
      className="h-7 text-xs"
    />
  );
};

/* ------------------------------------------------------------------ */
/*  变量行                                                              */
/* ------------------------------------------------------------------ */

const VariableItem = ({
  variable,
  isDuplicate,
  onUpdate,
  onRemove,
}: {
  variable: GlobalVariable;
  isDuplicate: boolean;
  onUpdate: (key: 'name' | 'value' | 'type', val: string) => void;
  onRemove: () => void;
}) => {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const hasError = !variable.name.trim() || isDuplicate;

  return (
    <div className="flex gap-1.5 py-1">
      {/* 左侧：名称 + 类型 + 值 */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1.5">
          <Input
            value={variable.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="变量名（必填）"
            required
            className={`h-7 w-0 flex-1 text-xs ${
              hasError ? 'border-destructive' : ''
            }`}
          />
          <Select
            value={variable.type ?? 'string'}
            onValueChange={(v) => onUpdate('type', v)}
          >
            <SelectTrigger className="h-7 w-[88px] shrink-0 font-mono text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GLOBAL_VARIABLE_TYPES.map((t) => (
                <SelectItem
                  key={t.value}
                  value={t.value}
                  className="font-mono text-xs"
                >
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <VariableValueInput
          type={variable.type ?? 'string'}
          value={variable.value}
          onChange={(val) => onUpdate('value', val)}
        />
        {isDuplicate && variable.name.trim() && (
          <p className="pl-0.5 text-[11px] text-destructive">变量名不能重复</p>
        )}
      </div>
      {/* 右侧：删除按钮，垂直居中 */}
      <div className="flex items-center">
        <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <Minus size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-56 p-3">
            <p className="text-xs font-medium text-slate-700">
              确定删除变量吗？
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              删除后对应的引用将失效
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  setConfirmOpen(false);
                }}
                className="rounded bg-red-500 px-2.5 py-1 text-xs text-white hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  数据 Tab                                                           */
/* ------------------------------------------------------------------ */

const DataTab = () => {
  const globalVariables = useDesignerStore((s) => s.globalVariables);
  const addGlobalVariable = useDesignerStore((s) => s.addGlobalVariable);
  const removeGlobalVariable = useDesignerStore((s) => s.removeGlobalVariable);
  const updateGlobalVariable = useDesignerStore((s) => s.updateGlobalVariable);

  const [collapsed, setCollapsed] = React.useState(false);

  const duplicateNames = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of globalVariables) {
      const name = v.name.trim();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const dups = new Set<string>();
    for (const [name, count] of counts) {
      if (count > 1) dups.add(name);
    }
    return dups;
  }, [globalVariables]);

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <section>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <ChevronRight
            size={14}
            className={`shrink-0 text-slate-400 transition-transform duration-150 ${
              collapsed ? '' : 'rotate-90'
            }`}
          />
          <span className="text-left">变量</span>
          <InfoTip content="用于存储应用界面的临时数据，作用范围为当前应用内的所有页面" />
          <span className="flex-1" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addGlobalVariable();
            }}
            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500"
          >
            <Plus size={14} />
          </button>
        </button>

        {!collapsed && (
          <div className="mt-1 pl-5">
            {globalVariables.length === 0 ? (
              <p className="py-2 text-center text-[11px] text-slate-400">
                暂无变量，点击 + 添加
              </p>
            ) : (
              globalVariables.map((v) => (
                <VariableItem
                  key={v.id}
                  variable={v}
                  isDuplicate={duplicateNames.has(v.name.trim())}
                  onUpdate={(key, val) => updateGlobalVariable(v.id, key, val)}
                  onRemove={() => removeGlobalVariable(v.id)}
                />
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Toolbox 主组件                                                     */
/* ------------------------------------------------------------------ */

export const Toolbox = () => {
  const [activeTab, setActiveTab] = React.useState<TabKey>('组件');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [collapsed, setCollapsed] = React.useState(false);
  const [panelWidth, setPanelWidth] = React.useState(LEFT_PANEL_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = React.useState(false);

  /* ---- 收起态：悬浮小块 ---- */
  if (collapsed) {
    return (
      <div className="relative shrink-0">
        <div className="absolute left-2 top-3 z-10 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-md">
          <button
            type="button"
            title="展开面板"
            onClick={() => setCollapsed(false)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ---- 展开态：完整面板 ---- */
  return (
    <Resizable
      size={{ width: panelWidth, height: '100%' }}
      minWidth={LEFT_PANEL_MIN_WIDTH}
      maxWidth={LEFT_PANEL_MAX_WIDTH}
      className="relative shrink-0"
      enable={{
        top: false,
        right: true,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      handleStyles={{
        right: {
          right: -4,
          width: 8,
          cursor: 'col-resize',
          zIndex: 20,
        },
      }}
      handleComponent={{
        right: (
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
      <aside className="flex h-full w-full min-w-0 select-none flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">组件</p>
            <button
              type="button"
              title="收起面板"
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>
          <SegmentedControl
            options={TOOLBOX_TABS}
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-3"
          />
          {activeTab === '组件' && (
            <div className="relative mt-3">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索组件..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          )}
        </div>

        {activeTab === '组件' && <ComponentsTab searchTerm={searchTerm} />}
        {activeTab === '结构' && <StructureTab />}
        {activeTab === '数据' && <DataTab />}
        {activeTab === '模板' && (
          <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
            即将推出
          </div>
        )}
      </aside>
    </Resizable>
  );
};
