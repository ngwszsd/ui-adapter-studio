import React, { useEffect, useState } from 'react';
import {
  FloatingPortal,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import type { VariableTypeSpecLike } from './VariableTypeChip';
import VariableTypeChip from './VariableTypeChip';
import VariableTypeIcon from './VariableTypeIcon';
import { cn } from '../../utils/cn';
import { useDesignerPortalRef } from '../../utils/portal';

export type VariableGroupItem = {
  template: string;
  groupId: string;
  label: string;
  chipLabel: string;
  icon: React.ReactNode;
  typeSpec?: VariableTypeSpecLike;
};

export type VariableGroup = {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: VariableGroupItem[];
};

export type VariablePickerData = {
  groups: VariableGroup[];
  itemByTemplate: Record<string, VariableGroupItem>;
};

export type VariablePickerPanelProps = {
  open: boolean;
  refs: ReturnType<typeof useFloating>['refs'];
  floatingStyles: ReturnType<typeof useFloating>['floatingStyles'];
  getFloatingProps: ReturnType<typeof useInteractions>['getFloatingProps'];
  groups: VariableGroup[];
  activeGroupId: string;
  onActiveGroupIdChange: (id: string) => void;
  onPick: (template: string) => void;
  className?: string;
  x?: number | null;
  y?: number | null;
  portalTarget?: 'designer' | 'body' | 'inline';
};

const VariablePickerPanel = React.memo(
  ({
    open,
    refs,
    floatingStyles,
    getFloatingProps,
    groups,
    activeGroupId,
    onActiveGroupIdChange,
    onPick,
    className,
    x,
    y,
    portalTarget = 'designer',
  }: VariablePickerPanelProps) => {
    const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];
    const [canShow, setCanShow] = useState(false);

    useEffect(() => {
      if (!open) {
        setCanShow(false);
        return;
      }

      setCanShow(false);
      let secondFrame = 0;
      const firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          setCanShow(true);
        });
      });

      return () => {
        cancelAnimationFrame(firstFrame);
        if (secondFrame) cancelAnimationFrame(secondFrame);
      };
    }, [open]);

    const portalRef = useDesignerPortalRef();

    if (!open) return null;

    const isPositioned = x != null && y != null && (x !== 0 || y !== 0);
    const mergedStyles = {
      ...floatingStyles,
      visibility:
        canShow && isPositioned ? ('visible' as const) : ('hidden' as const),
      pointerEvents: canShow && isPositioned ? undefined : ('none' as const),
    };

    const panel = (
      <div
        ref={refs.setFloating}
        style={mergedStyles}
        data-variable-picker-panel="true"
        className={cn(
          'z-[10010] w-[520px] max-w-[min(520px,calc(100vw-24px))] rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col',
          className
        )}
        {...getFloatingProps({
          onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
          onPointerDownCapture: (e: React.PointerEvent) => {
            e.stopPropagation();
          },
        })}
      >
          <div className="grid grid-cols-[200px_1fr] h-[320px]">
            {/* Left Column: Groups (Sources) */}
            <div className="border-r border-gray-100 bg-gray-50/50 p-2 overflow-y-auto">
              <div className="text-[10px] font-bold text-gray-400 px-2 py-1 mb-1 uppercase tracking-wider">
                Sources
              </div>
              <div className="space-y-0.5">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-all duration-200',
                      activeGroupId === g.id
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                    onClick={() => onActiveGroupIdChange(g.id)}
                  >
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded bg-blue-50 text-blue-500">
                      {React.isValidElement(g.icon)
                        ? React.cloneElement(
                            g.icon as React.ReactElement<any>,
                            { className: 'w-3 h-3' }
                          )
                        : g.icon}
                    </span>
                    <span className="truncate">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Items (Variables) */}
            <div className="flex flex-col h-full bg-white">
              <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-2">
                  {activeGroup?.icon && (
                    <span className="text-blue-500 scale-75 opacity-70">
                      {activeGroup.icon}
                    </span>
                  )}
                  {activeGroup?.label ?? 'Select a source'}
                </span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {activeGroup?.items?.length ?? 0} vars
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {(activeGroup?.items ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs gap-2">
                    <span>No variables available</span>
                  </div>
                ) : (
                  (activeGroup?.items ?? []).map((it) => (
                    <button
                      key={it.template}
                      type="button"
                      className="w-full group flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-mono transition-colors hover:bg-blue-50 text-gray-700"
                      onClick={() => onPick(it.template)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded bg-gray-100 group-hover:bg-blue-100 transition-colors">
                          {it.typeSpec ? (
                            <VariableTypeIcon
                              typeSpec={it.typeSpec}
                              className="w-3 h-3"
                            />
                          ) : (
                            it.icon
                          )}
                        </span>
                        <span className="truncate font-medium group-hover:text-blue-700">
                          {it.label}
                        </span>
                      </div>
                      <VariableTypeChip
                        typeSpec={it.typeSpec ?? 'string'}
                        className="ml-2 shrink-0"
                      />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
      </div>
    );

    if (portalTarget === 'inline') {
      return panel;
    }

    if (portalTarget === 'body') {
      return <FloatingPortal>{panel}</FloatingPortal>;
    }

    return <FloatingPortal root={portalRef?.current ?? undefined}>{panel}</FloatingPortal>;
  }
);

export default VariablePickerPanel;
