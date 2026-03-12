import React from 'react';
import { useEditor } from '@craftjs/core';
import { EditableLayerName, useLayer } from '@craftjs/layers';
import { ChevronRight, Eye, EyeOff, PanelsTopLeft } from 'lucide-react';
import { useLayerDragIndicatorStore } from '../store/layerDragIndicator';

interface CraftLayerItemProps {
  children?: React.ReactNode;
}

export const CraftLayerItem = React.memo(function CraftLayerItem({
  children,
}: CraftLayerItemProps) {
  const {
    id,
    depth,
    children: childNodeIds,
    expanded,
    connectors,
    actions,
    isHovered,
  } = useLayer((layer) => ({
    expanded: layer.expanded,
    isHovered: layer.event.hovered,
  }));

  const draggingNodeId = useLayerDragIndicatorStore((state) => state.draggingNodeId);
  const targetNodeId = useLayerDragIndicatorStore((state) => state.targetNodeId);
  const position = useLayerDragIndicatorStore((state) => state.position);
  const startDrag = useLayerDragIndicatorStore((state) => state.startDrag);
  const updateIndicator = useLayerDragIndicatorStore((state) => state.updateIndicator);
  const clearIndicator = useLayerDragIndicatorStore((state) => state.clear);

  const {
    hidden,
    topLevel,
    isSelected,
    shouldBeExpanded,
    actions: editorActions,
  } = useEditor((state, query) => ({
    hidden: state.nodes[id]?.data.hidden ?? false,
    topLevel: query.node(id).isTopLevelCanvas(),
    isSelected: state.events.selected.has(id),
    shouldBeExpanded: (() => {
      const selectedIds = Array.from(state.events.selected);
      const selectedId = selectedIds[selectedIds.length - 1];
      if (!selectedId) return false;
      return query.node(selectedId).ancestors(true).includes(id);
    })(),
  }));

  const hasChildren = childNodeIds.length > 0;
  const rowRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (shouldBeExpanded && !expanded) {
      actions.setExpandedState(true);
    }
  }, [actions, expanded, shouldBeExpanded]);

  React.useEffect(() => {
    if (!isSelected || !rowRef.current) return;

    const rafId = window.requestAnimationFrame(() => {
      rowRef.current?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isSelected]);

  const rowStateClass = isSelected
    ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'
    : isHovered
      ? 'bg-slate-100 text-slate-700'
      : 'text-slate-600 hover:bg-slate-50';

  const showIndicatorBefore = draggingNodeId !== null && draggingNodeId !== id && targetNodeId === id && position === 'before';
  const showIndicatorAfter = draggingNodeId !== null && draggingNodeId !== id && targetNodeId === id && position === 'after';
  const indicatorOffset = Math.max(20, 8 + depth * 14 + 14);

  const handleDragStart = React.useCallback(() => {
    startDrag(id);
  }, [id, startDrag]);

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!draggingNodeId || draggingNodeId === id) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const nextPosition = event.clientY <= rect.top + rect.height / 2 ? 'before' : 'after';
      updateIndicator(id, nextPosition);
    },
    [draggingNodeId, id, updateIndicator]
  );

  const handleDragEnd = React.useCallback(() => {
    clearIndicator();
  }, [clearIndicator]);

  const handleDrop = React.useCallback(() => {
    window.requestAnimationFrame(() => {
      clearIndicator();
    });
  }, [clearIndicator]);

  return (
    <div
      ref={(el) => {
        rowRef.current = el;
        if (el) connectors.layer(el);
      }}
      className="craft-layer-row relative py-0.5"
    >
      {showIndicatorBefore ? (
        <div
          className="pointer-events-none absolute right-1 top-0 z-20"
          style={{ left: indicatorOffset }}
        >
          <div className="relative h-0.5 rounded-full bg-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]">
            <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-blue-500" />
          </div>
        </div>
      ) : null}

      <div
        ref={(el) => {
          if (el) connectors.drag(el);
        }}
        className={`group flex min-h-7 items-center rounded-md pr-2 transition-colors ${rowStateClass}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[data-layer-control="true"]')) return;
          editorActions.selectNode(id);
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
      >
        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation();
            if (!hasChildren) return;
            actions.toggleLayer();
          }}
          data-layer-control="true"
          className={`mr-1 inline-flex h-4 w-4 items-center justify-center rounded text-slate-400 transition ${
            hasChildren
              ? 'opacity-100 hover:bg-slate-200/70'
              : 'pointer-events-none opacity-0'
          }`}
          aria-label="展开/收起"
        >
          <ChevronRight
            size={12}
            className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </button>

        <div
          ref={(el) => {
            if (el) connectors.layerHeader(el);
          }}
          className="flex min-w-0 flex-1 items-center gap-1"
        >
          {topLevel ? (
            <PanelsTopLeft size={12} className="shrink-0 text-slate-400" />
          ) : null}
          <div className="min-w-0 flex-1 [&_h2]:m-0 [&_h2]:truncate [&_h2]:text-xs [&_h2]:font-medium [&_h2]:leading-5">
            <EditableLayerName />
          </div>
        </div>

        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation();
            editorActions.setHidden(id, !hidden);
          }}
          data-layer-control="true"
          className={`ml-1 inline-flex h-5 w-5 items-center justify-center rounded transition-colors ${
            isSelected
              ? 'text-blue-600 hover:bg-blue-100'
              : 'text-slate-400 hover:bg-slate-200'
          }`}
          aria-label={hidden ? '显示图层' : '隐藏图层'}
        >
          {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>

      {showIndicatorAfter ? (
        <div
          className="pointer-events-none absolute bottom-0 right-1 z-20"
          style={{ left: indicatorOffset }}
        >
          <div className="relative h-0.5 rounded-full bg-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]">
            <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-blue-500" />
          </div>
        </div>
      ) : null}

      {hasChildren && expanded ? (
        <div className="ml-4 border-l border-slate-200/90 pl-1.5">
          {children}
        </div>
      ) : null}
    </div>
  );
});
