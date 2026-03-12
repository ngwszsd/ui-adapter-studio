import React, { useMemo } from 'react';
import { useEditor, useNode } from '@craftjs/core';
import { Resizable } from 're-resizable';
import { useDesignerStore } from '../../store/useDesignerStore';
import { getEditorApi } from '../../store/editorRegistry';
import { usePageId } from '../../store/pageIdContext';
import { findMirroredNodeIds } from '../../utils/listSync';
import { normalizeResizableSize } from '../../utils/size';

interface ResizerProps {
  width: number | string;
  height: number | string;
  minWidth?: number;
  minHeight?: number;
  wrapperStyle?: React.CSSProperties;
  children: React.ReactNode;
}

const HANDLE_STYLE: React.CSSProperties = {
  width: '8px',
  height: '8px',
  backgroundColor: '#ffffff',
  border: '1px solid #2563eb',
  borderRadius: '50%',
};

interface ScrollSnapshot {
  el: HTMLElement;
  top: number;
  left: number;
}

const getClosestScrollable = (
  target: EventTarget | null
): HTMLElement | null => {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest<HTMLElement>('[data-scrollable]');
};

const restoreScrollSnapshot = (snapshot: ScrollSnapshot | null) => {
  if (!snapshot) return;
  snapshot.el.scrollTop = snapshot.top;
  snapshot.el.scrollLeft = snapshot.left;
};

export const Resizer = ({
  children,
  width,
  height,
  minWidth = 40,
  minHeight = 32,
  wrapperStyle,
}: ResizerProps) => {
  const {
    id,
    actions: { setProp },
    connectors: { connect },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));
  const { actions: editorActions } = useEditor();
  const canvasScale = useDesignerStore((state) => state.canvasScale);
  const pageId = usePageId();
  const scrollSnapshotRef = React.useRef<ScrollSnapshot | null>(null);
  const isResizingRef = React.useRef(false);

  const resolvedWidth = useMemo(() => normalizeResizableSize(width, 120), [width]);
  const resolvedHeight = useMemo(() => normalizeResizableSize(height, 40), [height]);
  const [currentSize, setCurrentSize] = React.useState<{ width: number | string; height: number | string }>({
    width: resolvedWidth,
    height: resolvedHeight,
  });

  React.useEffect(() => {
    if (isResizingRef.current) return;
    setCurrentSize({ width: resolvedWidth, height: resolvedHeight });
  }, [resolvedHeight, resolvedWidth]);

  const handleStyles = useMemo(
    () => ({
      top: {
        ...HANDLE_STYLE,
        top: -6,
        left: '50%',
        transform: 'translateX(-50%)',
        cursor: 'n-resize',
        display: selected ? 'block' : 'none',
        zIndex: 40,
      },
      right: {
        ...HANDLE_STYLE,
        right: -6,
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'e-resize',
        display: selected ? 'block' : 'none',
        zIndex: 40,
      },
      bottom: {
        ...HANDLE_STYLE,
        bottom: -6,
        left: '50%',
        transform: 'translateX(-50%)',
        cursor: 's-resize',
        display: selected ? 'block' : 'none',
        zIndex: 40,
      },
      left: {
        ...HANDLE_STYLE,
        left: -6,
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'w-resize',
        display: selected ? 'block' : 'none',
        zIndex: 40,
      },
      topRight: {
        ...HANDLE_STYLE,
        top: -6,
        right: -6,
        cursor: 'ne-resize',
        display: selected ? 'block' : 'none',
        zIndex: 40,
      },
      bottomRight: {
        ...HANDLE_STYLE,
        right: -6,
        bottom: -6,
        cursor: 'se-resize',
        display: selected ? 'block' : 'none',
        zIndex: 40,
      },
      bottomLeft: {
        ...HANDLE_STYLE,
        left: -6,
        bottom: -6,
        cursor: 'sw-resize',
        display: selected ? 'block' : 'none',
        zIndex: 40,
      },
      topLeft: {
        ...HANDLE_STYLE,
        left: -6,
        top: -6,
        cursor: 'nw-resize',
        display: selected ? 'block' : 'none',
        zIndex: 40,
      },
    }),
    [selected]
  );

  return (
    <Resizable
      className="craft-node-shell"
      ref={(instance) => {
        if (instance?.resizable) {
          connect(instance.resizable);
        }
      }}
      size={currentSize}
      scale={canvasScale}
      minWidth={minWidth}
      minHeight={minHeight}
      onResizeStart={(e) => {
        isResizingRef.current = true;
        setCurrentSize((prev) => ({ ...prev }));
        e.stopPropagation();
        const scrollable = getClosestScrollable(e.target);
        scrollSnapshotRef.current = scrollable
          ? {
              el: scrollable,
              top: scrollable.scrollTop,
              left: scrollable.scrollLeft,
            }
          : null;

        // CraftJS 用原生 mousedown 做选中，在 React 合成事件触发前已完成冒泡，
        // 父容器可能抢走了选中。这里回抢——React 18 会批量处理，DOM 只更新一次。
        editorActions.selectNode(id);
      }}
      onResize={(e, direction, ref) => {
        e.stopPropagation();
        setCurrentSize({
          width: Math.max(minWidth, Math.round(ref.offsetWidth)),
          height: Math.max(minHeight, Math.round(ref.offsetHeight)),
        });
      }}
      onResizeStop={(e, direction, ref) => {
        e.stopPropagation();
        const directionKey = String(direction).toLowerCase();
        const nextWidth = Math.max(minWidth, Math.round(ref.offsetWidth));
        const nextHeight = Math.max(minHeight, Math.round(ref.offsetHeight));
        const shouldUpdateWidth = directionKey.includes('left') || directionKey.includes('right');
        const shouldUpdateHeight = directionKey.includes('top') || directionKey.includes('bottom');
        const editorApi = pageId ? getEditorApi(pageId) : null;
        const mirroredNodeIds = editorApi ? findMirroredNodeIds(editorApi, id) : [];

        setProp((props: Record<string, unknown>) => {
          if (shouldUpdateWidth) {
            props.width = nextWidth;
            props.widthMode = 'fixed';
          }

          if (shouldUpdateHeight) {
            props.height = nextHeight;
            props.heightMode = 'fixed';
          }
        });

        if (editorApi) {
          for (const mirroredNodeId of mirroredNodeIds) {
            if (shouldUpdateWidth) {
              editorApi.updateNodeProp(mirroredNodeId, 'width', nextWidth);
              editorApi.updateNodeProp(mirroredNodeId, 'widthMode', 'fixed');
            }

            if (shouldUpdateHeight) {
              editorApi.updateNodeProp(mirroredNodeId, 'height', nextHeight);
              editorApi.updateNodeProp(mirroredNodeId, 'heightMode', 'fixed');
            }
          }
        }

        // 两帧恢复：覆盖一次同步布局 + 一次异步副作用造成的滚动跳变
        window.requestAnimationFrame(() => {
          restoreScrollSnapshot(scrollSnapshotRef.current);
          window.requestAnimationFrame(() => {
            restoreScrollSnapshot(scrollSnapshotRef.current);
            scrollSnapshotRef.current = null;
            isResizingRef.current = false;
          });
        });
      }}
      enable={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      handleStyles={handleStyles}
      style={{
        outline: selected
          ? '2px solid #2563eb'
          : hovered
            ? '1px dashed #94a3b8'
            : 'none',
        outlineOffset: '1px',
        position: 'relative',
        display: 'inline-block',
        ...wrapperStyle,
      }}
    >
      <div
        className="pointer-events-auto h-full w-full overflow-hidden"
        onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => {
          event.stopPropagation();
          editorActions.selectNode(id);
        }}
      >
        {children}
      </div>
    </Resizable>
  );
};
