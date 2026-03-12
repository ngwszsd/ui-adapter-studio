import React from 'react';
import ReactDOM from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import type { SerializedNodes } from '@craftjs/core';
import {
  Editor as CraftEditor,
  Element,
  Frame,
  useEditor,
} from '@craftjs/core';
import { Layers } from '@craftjs/layers';
import type { ARPage, ResolverComponentName } from './types';
import { AR_VIEWPORT_HEIGHT, AR_VIEWPORT_WIDTH } from './types';
import {
  CRAFT_COMPONENT_MIME,
  RESOLVER,
  decodeDragPayload,
  type ChildDragPayload,
  type ComponentDragPayload,
} from './componentRegistry';
import { CraftLayerItem } from './components/CraftLayerItem';
import { StageRoot } from './components/container/StageRoot';
import { Viewport } from './components/Viewport';
import { useDesignerStore } from './store/useDesignerStore';
import { registerEditorApi, unregisterEditorApi } from './store/editorRegistry';
import { CraftIndicatorPortal } from './components/CraftIndicatorPortal';
import { useLayerPortalStore } from './store/layerPortal';
import { PageIdContext } from './store/pageIdContext';
import { createId } from './utils/id';
import { getMirroredParentIds, withListSyncKeys } from './utils/listSync';

interface PageItemProps {
  pageId: string;
}

interface DragSession {
  // 指针起点（屏幕坐标）
  startClientX: number;
  startClientY: number;
  // 页面拖拽开始时的页面原始坐标（画布坐标）
  originX: number;
  originY: number;
  // 过程中实时更新的最新坐标（用于抬手时提交）
  latestX: number;
  latestY: number;
}

interface ScrollLockSession {
  snapshots: Array<{
    el: HTMLElement;
    top: number;
    left: number;
    lockId: string | null;
  }>;
  rafId: number;
}

// 空页面提示文案中展示的 AR 固定视口尺寸
const PAGE_MIN_DROP_HINT = `${AR_VIEWPORT_WIDTH}x${AR_VIEWPORT_HEIGHT}`;
const EMPTY_NODE_PROPS = Object.freeze({}) as Record<string, unknown>;

/**
 * 外部组件投放区：每个页面独立处理原生 DnD，保证“拖到哪一页就插到哪一页”。
 */
interface DropIndicatorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const DropZone = React.memo(function DropZone({
  pageId,
  children,
}: {
  pageId: string;
  children: React.ReactNode;
}) {
  const { actions, query, stageRootId, stageChildrenCount } = useEditor(
    (state) => {
      let stageId: string | null = null;
      for (const nodeId of Object.keys(state.nodes)) {
        if (state.nodes[nodeId]?.data?.name === 'StageRoot') {
          stageId = nodeId;
          break;
        }
      }
      const stageNode = stageId ? state.nodes[stageId] : null;
      return {
        stageRootId: stageId,
        stageChildrenCount: stageNode?.data.nodes.length ?? 0,
      };
    }
  );
  const setActivePage = useDesignerStore((state) => state.setActivePage);
  const canvasScale = useDesignerStore((state) => state.canvasScale);

  const [isDragOver, setIsDragOver] = React.useState(false);
  const [indicator, setIndicator] = React.useState<DropIndicatorRect | null>(
    null
  );
  const [dropContainerRect, setDropContainerRect] = React.useState<DropIndicatorRect | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropTargetRef = React.useRef<{
    parentId: string;
    index: number;
  } | null>(null);
  const rafRef = React.useRef<number>(0);
  const canvasScaleRef = React.useRef(canvasScale);
  const stageRootIdRef = React.useRef(stageRootId);
  canvasScaleRef.current = canvasScale;
  stageRootIdRef.current = stageRootId;

  const hasToolboxPayload = React.useCallback((dt: DataTransfer | null) => {
    if (!dt) return false;
    return Array.from(dt.types).includes(CRAFT_COMPONENT_MIME);
  }, []);

  const findCanvasContainerAtPoint = React.useCallback((clientX: number, clientY: number) => {
    const root = containerRef.current;
    if (!root) return null;

    const hitElements = document.elementsFromPoint(clientX, clientY);
    for (const element of hitElements) {
      if (!(element instanceof HTMLElement)) continue;
      if (!root.contains(element)) continue;

      const canvasContainer = element.closest<HTMLElement>('[data-drop-container-id]');
      if (!canvasContainer || !root.contains(canvasContainer)) continue;

      const rect = canvasContainer.getBoundingClientRect();
      const style = window.getComputedStyle(canvasContainer);
      const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
      const paddingRight = Number.parseFloat(style.paddingRight) || 0;
      const paddingTop = Number.parseFloat(style.paddingTop) || 0;
      const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
      const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
      const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
      const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
      const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;

      const contentLeft = rect.left + borderLeft + paddingLeft;
      const contentRight = rect.right - borderRight - paddingRight;
      const contentTop = rect.top + borderTop + paddingTop;
      const contentBottom = rect.bottom - borderBottom - paddingBottom;

      const hasContentBox = contentRight > contentLeft && contentBottom > contentTop;
      const insideContentBox = hasContentBox
        ? clientX >= contentLeft && clientX <= contentRight && clientY >= contentTop && clientY <= contentBottom
        : clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;

      if (insideContentBox) {
        return canvasContainer;
      }
    }

    return null;
  }, []);

  const clearDragState = React.useCallback(() => {
    setIsDragOver(false);
    setIndicator(null);
    setDropContainerRect(null);
    dropTargetRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const resolveDropTarget = React.useCallback(
    (
      clientX: number,
      clientY: number,
      targetEl: HTMLElement
    ): {
      parentId: string;
      index: number;
      indicatorRect: DropIndicatorRect | null;
      dropContainerRect: DropIndicatorRect | null;
    } | null => {
      const pointContainerEl = findCanvasContainerAtPoint(clientX, clientY);
      const canvasNodeId = pointContainerEl?.getAttribute('data-drop-container-id');

      const rootQuery = query.node('ROOT');
      const parentId =
        canvasNodeId ??
        stageRootIdRef.current ??
        rootQuery.childNodes()[0] ??
        'ROOT';

      try {
        const parentNode = query.node(parentId).get();
        const childIds: string[] = parentNode?.data?.nodes ?? [];
        const parentDom = parentNode?.dom as HTMLElement | null;

        if (!parentDom) {
          return {
            parentId,
            index: 0,
            indicatorRect: null,
            dropContainerRect: null,
          };
        }

        // 普通容器节点的 node.dom 是 Resizer 外壳，真正承载布局的是内部
        // data-canvas-node-id === parentId 的那层；
        // StageRoot 则直接 connect 在自身 DOM 上，不能误取到它内部的第一个子容器。
        const flexHost =
          parentDom.getAttribute('data-drop-container-id') === parentId
            ? parentDom
            : parentDom.querySelector<HTMLElement>(
                `[data-drop-container-id="${parentId}"]`
              ) ?? parentDom;
        const direction = getComputedStyle(flexHost).flexDirection;
        const isRow = direction === 'row' || direction === 'row-reverse';
        const zoneRect = containerRef.current?.getBoundingClientRect();
        if (!zoneRect) {
          return {
            parentId,
            index: childIds.length,
            indicatorRect: null,
            dropContainerRect: null,
          };
        }

        const scale = canvasScaleRef.current || 1;
        const hostRect = flexHost.getBoundingClientRect();
        const dropContainerRect: DropIndicatorRect = {
          top: (hostRect.top - zoneRect.top) / scale,
          left: (hostRect.left - zoneRect.left) / scale,
          width: hostRect.width / scale,
          height: hostRect.height / scale,
        };

        if (childIds.length === 0) {
          return {
            parentId,
            index: 0,
            indicatorRect: null,
            dropContainerRect,
          };
        }

        let insertIndex = childIds.length;
        let rect: DropIndicatorRect | null = null;

        for (let i = 0; i < childIds.length; i++) {
          const childDom = query.node(childIds[i]).get()
            ?.dom as HTMLElement | null;
          if (!childDom) continue;

          const childRect = childDom.getBoundingClientRect();
          const shouldInsertBefore = isRow
            ? clientX < childRect.left + childRect.width / 2
            : clientY < childRect.top + childRect.height / 2;

          if (!shouldInsertBefore) continue;

          insertIndex = i;
          rect = isRow
            ? {
                top: (childRect.top - zoneRect.top) / scale,
                left: (childRect.left - zoneRect.left) / scale - 1,
                width: 2,
                height: childRect.height / scale,
              }
            : {
                top: (childRect.top - zoneRect.top) / scale - 1,
                left: (childRect.left - zoneRect.left) / scale,
                width: childRect.width / scale,
                height: 2,
              };
          break;
        }

        if (insertIndex === childIds.length) {
          const lastChildDom = query.node(childIds[childIds.length - 1]).get()
            ?.dom as HTMLElement | null;
          if (lastChildDom) {
            const lastRect = lastChildDom.getBoundingClientRect();
            rect = isRow
              ? {
                  top: (lastRect.top - zoneRect.top) / scale,
                  left: (lastRect.right - zoneRect.left) / scale + 1,
                  width: 2,
                  height: lastRect.height / scale,
                }
              : {
                  top: (lastRect.bottom - zoneRect.top) / scale + 1,
                  left: (lastRect.left - zoneRect.left) / scale,
                  width: lastRect.width / scale,
                  height: 2,
                };
          }
        }

        return {
          parentId,
          index: insertIndex,
          indicatorRect: rect,
          dropContainerRect,
        };
      } catch {
        return {
          parentId,
          index: 0,
          indicatorRect: null,
          dropContainerRect: null,
        };
      }
    },
    [query]
  );

  const handleDragEnter = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!hasToolboxPayload(event.dataTransfer)) return;
      event.preventDefault();
      setIsDragOver(true);
    },
    [hasToolboxPayload]
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!hasToolboxPayload(event.dataTransfer)) return;

      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';

      const x = event.clientX;
      const y = event.clientY;
      const el = event.target as HTMLElement;
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const result = resolveDropTarget(x, y, el);
        if (!result) return;

        dropTargetRef.current = {
          parentId: result.parentId,
          index: result.index,
        };
        setIndicator(result.indicatorRect);
        setDropContainerRect(result.dropContainerRect);
      });
    },
    [hasToolboxPayload, resolveDropTarget]
  );

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const syncApi = {
        getChildNodeIds: (nodeId: string) => {
          try {
            return query.node(nodeId).get()?.data?.nodes ?? [];
          } catch {
            return [];
          }
        },
        getNodeProps: (nodeId: string) => {
          try {
            const node = query.node(nodeId).get();
            return (node?.data?.props as Record<string, unknown> | undefined) ?? null;
          } catch {
            return null;
          }
        },
        getParentNodeId: (nodeId: string) => {
          try {
            const ancestors = query.node(nodeId).ancestors();
            return ancestors[0] ?? null;
          } catch {
            return null;
          }
        },
      };

      const addPayloadNodeTree = (
        payload: ComponentDragPayload | ChildDragPayload,
        parentId: string,
        index?: number
      ): string | null => {
        const Comp = RESOLVER[payload.type];
        if (!Comp) return null;

        const reactElement = payload.isCanvas
          ? React.createElement(Element, {
              is: Comp,
              canvas: true,
              ...payload.props,
            })
          : React.createElement(Comp, payload.props);

        const nodeTree = query.parseReactElement(reactElement).toNodeTree();

        if (typeof index === 'number') {
          actions.addNodeTree(nodeTree, parentId, index);
        } else {
          actions.addNodeTree(nodeTree, parentId);
        }

        if (payload.isCanvas && payload.defaultChildren?.length) {
          for (const child of payload.defaultChildren) {
            addPayloadNodeTree(child, nodeTree.rootNodeId);
          }
        }

        return nodeTree.rootNodeId;
      };

      if (!hasToolboxPayload(event.dataTransfer)) return;

      event.preventDefault();
      event.stopPropagation();

      const cachedTarget = dropTargetRef.current;
      clearDragState();

      const encoded =
        event.dataTransfer.getData(CRAFT_COMPONENT_MIME) ||
        event.dataTransfer.getData('text/plain');
      if (!encoded) return;

      const payload = decodeDragPayload(encoded);
      if (!payload) return;

      let target = cachedTarget;
      if (!target) {
        const result = resolveDropTarget(
          event.clientX,
          event.clientY,
          event.target as HTMLElement
        );
        if (result) {
          target = { parentId: result.parentId, index: result.index };
        }
      }

      const mirrorParentIds = target
        ? getMirroredParentIds(syncApi, target.parentId)
        : [];

      const syncedPayload = mirrorParentIds.length > 0
        ? withListSyncKeys(payload, createId('list_sync'))
        : payload;

      const rootNodeId = target
        ? addPayloadNodeTree(syncedPayload, target.parentId, target.index)
        : addPayloadNodeTree(syncedPayload, 'ROOT');
      if (!rootNodeId) return;

      for (const mirrorParentId of mirrorParentIds) {
        addPayloadNodeTree(syncedPayload, mirrorParentId, target?.index);
      }

      actions.selectNode(rootNodeId);
      setActivePage(pageId);
    },
    [
      actions,
      clearDragState,
      hasToolboxPayload,
      pageId,
      resolveDropTarget,
      setActivePage,
    ]
  );

  const handleDragLeave = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!hasToolboxPayload(event.dataTransfer)) return;

      if (
        containerRef.current &&
        !containerRef.current.contains(event.relatedTarget as Node)
      ) {
        clearDragState();
      }
    },
    [clearDragState, hasToolboxPayload]
  );

  React.useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragOverCapture={(e) => {
        if (hasToolboxPayload(e.dataTransfer)) {
          e.preventDefault();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className="relative h-full w-full"
    >
      {stageChildrenCount === 0 && (
        <div className="pointer-events-none absolute left-3 top-3 text-xs text-slate-400">
          拖拽组件到此页面 ({PAGE_MIN_DROP_HINT})
        </div>
      )}
      {children}
      {isDragOver && dropContainerRect && (
        <div
          className="pointer-events-none absolute z-40 rounded-md border-2 border-dashed border-sky-400"
          style={{
            top: dropContainerRect.top,
            left: dropContainerRect.left,
            width: dropContainerRect.width,
            height: dropContainerRect.height,
          }}
        />
      )}
      {indicator && (
        <div
          className="pointer-events-none absolute z-50"
          style={{
            top: indicator.top,
            left: indicator.left,
            width: indicator.width,
            height: indicator.height,
            backgroundColor: '#22c55e',
            boxShadow: '0 0 6px #22c55e',
            borderRadius: 1,
          }}
        />
      )}
    </div>
  );
});

const EditorBridge = React.memo(function EditorBridge({
  pageId,
}: {
  pageId: string;
}) {
  // 当前页面是否激活、以及属性面板所需的活动节点写入能力
  const activePageId = useDesignerStore((state) => state.activePageId);
  const setActiveNode = useDesignerStore((state) => state.setActiveNode);
  const clearActiveNode = useDesignerStore((state) => state.clearActiveNode);

  const { actions, connectors, query: queryApi } = useEditor();
  const {
    selectedNodeId,
    selectedNodeName,
    selectedNodeDisplayName,
    selectedNodeProps,
  } = useEditor((state, query) => {
    // 同步 craft 的 selected 事件到外部 Zustand
    const selectedId = query.getEvent('selected').last() as string | null;
    const selectedNode = selectedId ? query.node(selectedId).get() : null;

    return {
      selectedNodeId: selectedId,
      selectedNodeName: selectedNode
        ? (selectedNode.data.name as ResolverComponentName)
        : null,
      selectedNodeDisplayName: selectedNode
        ? (selectedNode.data.displayName ?? selectedNode.data.name) as string
        : null,
      selectedNodeProps:
        (selectedNode?.data.props as Record<string, unknown> | undefined) ??
        EMPTY_NODE_PROPS,
    };
  });

  React.useEffect(() => {
    // 每个页面注册独立的 editor API，供右侧属性面板跨组件调用
    registerEditorApi(pageId, {
      updateNodeProp: (nodeId, key, value) => {
        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props[key] = value;
        });
      },
      deleteNode: (nodeId) => {
        actions.delete(nodeId);
      },
      create: (el, userElement) => {
        connectors.create(el, userElement);
      },
      getNodeDom: (nodeId) => {
        try {
          return (queryApi.node(nodeId).get()?.dom as HTMLElement | null) ?? null;
        } catch {
          return null;
        }
      },
      getChildNodeIds: (nodeId) => {
        try {
          return queryApi.node(nodeId).get()?.data?.nodes ?? [];
        } catch {
          return [];
        }
      },
      getNodeComponentName: (nodeId) => {
        try {
          const node = queryApi.node(nodeId).get();
          return node?.data?.name ?? null;
        } catch {
          return null;
        }
      },
      getNodeProps: (nodeId) => {
        try {
          const node = queryApi.node(nodeId).get();
          return (node?.data?.props as Record<string, unknown> | undefined) ?? null;
        } catch {
          return null;
        }
      },
      getParentNodeId: (nodeId) => {
        try {
          const ancestors = queryApi.node(nodeId).ancestors();
          return ancestors[0] ?? null;
        } catch {
          return null;
        }
      },
    });

    return () => {
      unregisterEditorApi(pageId);
    };
  }, [actions, connectors, pageId, queryApi]);

  React.useEffect(() => {
    // 非活动页面清理 craft 内部事件态，避免多页面同时保留选中状态
    if (activePageId !== pageId) {
      actions.clearEvents();
    }
  }, [actions, activePageId, pageId]);

  React.useEffect(() => {
    // ROOT 不作为可编辑组件写入属性面板
    if (!selectedNodeId || selectedNodeId === 'ROOT' || !selectedNodeName) {
      const current = useDesignerStore.getState().activeNode;
      if (current?.pageId === pageId) {
        clearActiveNode();
      }
      return;
    }

    // 将当前选中组件信息同步到全局，驱动右侧属性面板
    // name = data.name（resolver key，用于路由）
    // displayName = data.displayName（中文名，用于 UI 展示）
    setActiveNode({
      pageId,
      nodeId: selectedNodeId,
      name: selectedNodeName,
      displayName: selectedNodeDisplayName ?? selectedNodeName,
      props: selectedNodeProps,
    });
  }, [
    clearActiveNode,
    pageId,
    selectedNodeId,
    selectedNodeDisplayName,
    selectedNodeName,
    selectedNodeProps,
    setActiveNode,
  ]);

  return null;
});

const LayersPortal = React.memo(function LayersPortal({
  pageId,
}: {
  pageId: string;
}) {
  const activePageId = useDesignerStore((s) => s.activePageId);
  const containerEl = useLayerPortalStore((s) => s.containerEl);

  // 仅活动页面渲染图层树，避免多实例图层面板冲突
  if (pageId !== activePageId || !containerEl) return null;

  return ReactDOM.createPortal(
    <Layers expandRootOnLoad renderLayer={CraftLayerItem} />,
    containerEl
  );
});

const PageItemComponent = ({ pageId }: PageItemProps) => {
  // P3 的基础优化之一：PageItem 不订阅完整 page，
  // 只拿标题、坐标、配置等渲染页面壳子需要的字段，切断 craftState 高频回写造成的整页重渲
  const page = useDesignerStore(
    useShallow((state) => {
      const targetPage = state.pages[pageId];
      if (!targetPage) return null;

      return {
        id: targetPage.id,
        title: targetPage.title,
        x: targetPage.x,
        y: targetPage.y,
        config: targetPage.config,
      };
    })
  );
  const activePageId = useDesignerStore((state) => state.activePageId);
  const canvasScale = useDesignerStore((state) => state.canvasScale);
  const setActivePage = useDesignerStore((state) => state.setActivePage);
  const updatePagePosition = useDesignerStore(
    (state) => state.updatePagePosition
  );
  const updatePageCraftState = useDesignerStore(
    (state) => state.updatePageCraftState
  );

  if (!page) return null;

  const isActive = activePageId === page.id;

  // 本地位置状态用于页面拖动中的即时反馈
  const [position, setPosition] = React.useState({ x: page.x, y: page.y });
  const [isDraggingPage, setIsDraggingPage] = React.useState(false);

  const pageShellRef = React.useRef<HTMLDivElement | null>(null);
  const dragSessionRef = React.useRef<DragSession | null>(null);
  // Frame 的 data 仅用于初始化，后续编辑态不应被外部序列化结果反向驱动，
  // 否则会导致页面内容区域重建，滚动位置被重置。
  // 这里直接从 store 同步读取一次初始 craftState，避免把 PageItem 重新绑回到 craftState 订阅上。
  const initialFrameDataRef = React.useRef<SerializedNodes | undefined>(
    useDesignerStore.getState().pages[pageId]?.craftState ?? undefined
  );
  // 拖拽期间锁定最近滚动容器的 scrollTop/scrollLeft，避免被浏览器原生 DnD 重置
  const scrollLockSessionRef = React.useRef<ScrollLockSession | null>(null);
  // 节流 craft 序列化，避免频繁写 store
  const serializeTimerRef = React.useRef<number | null>(null);

  const stopScrollLock = React.useCallback(() => {
    const session = scrollLockSessionRef.current;
    if (!session) return;

    cancelAnimationFrame(session.rafId);
    session.snapshots.forEach((snapshot) => {
      if (!snapshot.el.isConnected) return;
      snapshot.el.scrollTop = snapshot.top;
      snapshot.el.scrollLeft = snapshot.left;
    });
    scrollLockSessionRef.current = null;
  }, []);

  const startScrollLock = React.useCallback(
    (target: EventTarget | null) => {
      const root = pageShellRef.current;
      if (!root || !(target instanceof Node)) return;
      if (!root.contains(target)) return;

      stopScrollLock();

      const scrollables = Array.from(
        root.querySelectorAll<HTMLElement>('[data-scrollable]')
      );
      if (scrollables.length === 0) return;

      const snapshots = scrollables.map((el) => ({
        el,
        top: el.scrollTop,
        left: el.scrollLeft,
        lockId: el.dataset.scrollLockId ?? null,
      }));

      const session: ScrollLockSession = {
        snapshots,
        rafId: 0,
      };

      const keep = () => {
        for (const snapshot of session.snapshots) {
          let lockEl = snapshot.el;
          if (!lockEl.isConnected) {
            const replacement = snapshot.lockId
              ? root.querySelector<HTMLElement>(
                  `[data-scroll-lock-id="${snapshot.lockId}"]`
                )
              : null;
            if (replacement) {
              snapshot.el = replacement;
              lockEl = replacement;
            } else {
              continue;
            }
          }

          lockEl.scrollTop = snapshot.top;
          lockEl.scrollLeft = snapshot.left;
        }

        session.rafId = requestAnimationFrame(keep);
      };
      session.rafId = requestAnimationFrame(keep);
      scrollLockSessionRef.current = session;
    },
    [stopScrollLock]
  );

  React.useEffect(() => {
    // 外部位置变化（自动布局/导入）时，同步到页面实例
    if (!isDraggingPage) {
      setPosition({ x: page.x, y: page.y });
    }
  }, [isDraggingPage, page.x, page.y]);

  const handlePointerMove = React.useCallback(
    (event: PointerEvent) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession) return;

      // 屏幕位移换算到画布坐标：需要除以当前画布缩放
      const deltaX = (event.clientX - dragSession.startClientX) / canvasScale;
      const deltaY = (event.clientY - dragSession.startClientY) / canvasScale;

      const nextX = dragSession.originX + deltaX;
      const nextY = dragSession.originY + deltaY;

      dragSession.latestX = nextX;
      dragSession.latestY = nextY;
      // 拖动中仅更新本地状态，结束后再提交全局 store
      setPosition({ x: nextX, y: nextY });
    },
    [canvasScale]
  );

  const stopDrag = React.useCallback(() => {
    const currentSession = dragSessionRef.current;
    if (!currentSession) return;

    dragSessionRef.current = null;
    setIsDraggingPage(false);
    // 抬手时一次性提交最终位置，减少全局状态写入次数
    updatePagePosition(page.id, currentSession.latestX, currentSession.latestY);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopDrag);
  }, [handlePointerMove, page.id, updatePagePosition]);

  const handleStartDrag = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      // 只有顶部 drag-handle 区域才允许拖动页面
      if (!target.closest('.page-drag-handle')) return;

      event.preventDefault();
      event.stopPropagation();

      setActivePage(page.id);
      setIsDraggingPage(true);
      dragSessionRef.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: position.x,
        originY: position.y,
        latestX: position.x,
        latestY: position.y,
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', stopDrag);
    },
    [
      handlePointerMove,
      page.id,
      position.x,
      position.y,
      setActivePage,
      stopDrag,
    ]
  );

  React.useEffect(() => {
    // 卸载时清理全局事件与定时器，避免内存泄漏
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDrag);
      stopScrollLock();
      if (serializeTimerRef.current) {
        window.clearTimeout(serializeTimerRef.current);
      }
    };
  }, [handlePointerMove, stopDrag, stopScrollLock]);

  React.useEffect(() => {
    const root = pageShellRef.current;
    if (!root) return;

    const handlePointerDownCapture = (event: PointerEvent) => {
      startScrollLock(event.target);
    };
    const handlePointerUpCapture = () => {
      stopScrollLock();
    };
    const handleDragStartCapture = (event: DragEvent) => {
      startScrollLock(event.target);
    };
    const handleDragEndCapture = () => {
      stopScrollLock();
    };

    root.addEventListener('pointerdown', handlePointerDownCapture, true);
    root.addEventListener('pointerup', handlePointerUpCapture, true);
    root.addEventListener('dragstart', handleDragStartCapture, true);
    root.addEventListener('dragend', handleDragEndCapture, true);
    root.addEventListener('drop', handleDragEndCapture, true);

    return () => {
      root.removeEventListener('pointerdown', handlePointerDownCapture, true);
      root.removeEventListener('pointerup', handlePointerUpCapture, true);
      root.removeEventListener('dragstart', handleDragStartCapture, true);
      root.removeEventListener('dragend', handleDragEndCapture, true);
      root.removeEventListener('drop', handleDragEndCapture, true);
    };
  }, [startScrollLock, stopScrollLock]);

  const handleNodesChange = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (query: any) => {
      // debounce 序列化：编辑高频场景下控制持久化频率
      if (serializeTimerRef.current) {
        window.clearTimeout(serializeTimerRef.current);
      }

      serializeTimerRef.current = window.setTimeout(() => {
        // 拖拽中不向外写序列化，避免页面级重渲染干扰滚动位置
        if (query.getEvent('dragged').all().length > 0) return;

        // 仅持久化活动页面，避免多页面编辑器并存时出现串写
        if (useDesignerStore.getState().activePageId !== page.id) return;

        const serializedNodes = query.getSerializedNodes();
        if (serializedNodes) {
          // 每个页面单独保存一份 craft 状态
          updatePageCraftState(page.id, serializedNodes);
        }
      }, 180);
    },
    [page.id, updatePageCraftState]
  );

  return (
    <div
      ref={pageShellRef}
      data-page-id={page.id}
      className="absolute"
      style={{
        // 拖动中提到最上层，活动页次之，非活动页最低
        left: position.x,
        top: position.y,
        zIndex: isDraggingPage ? 60 : isActive ? 40 : 20,
      }}
      onPointerDown={() => setActivePage(page.id)}
    >
      {/* 每个页面一个独立 CraftEditor，保证页面间状态隔离 */}
      <PageIdContext.Provider value={page.id}>
        <CraftEditor
          resolver={RESOLVER}
          onNodesChange={handleNodesChange}
          indicator={{ success: 'transparent', error: 'transparent' }}
        >
          {/*
            注意：EditorBridge 负责把 Craft 的 selected 事件同步到外部 store。
            如果像 P3 一样只在激活页挂载，那么从非激活页第一次点击组件时，
            会先激活页面、但拿不到这次点击产生的 selected 事件，表现为“节点要点两次才能选中”。
            所以这里必须常驻；仅把纯视觉层的指示器继续限制在激活页渲染。
          */}
          <EditorBridge pageId={page.id} />
          {/* 指示器仍只在激活页渲染，控制空闲页面编辑态开销 */}
          {isActive ? <CraftIndicatorPortal /> : null}
          <LayersPortal pageId={page.id} />
          <Viewport
            pageId={page.id}
            title={page.title}
            isActive={isActive}
            onActivate={() => setActivePage(page.id)}
            onStartDrag={handleStartDrag}
            pageConfig={page.config}
          >
            <DropZone pageId={page.id}>
              {/* Frame 数据来自页面持久化状态；首次为空时渲染 StageRoot */}
              <Frame data={initialFrameDataRef.current}>
                <Element
                  is={StageRoot}
                  canvas
                  background="#0f172a"
                  padding={12}
                />
              </Frame>
            </DropZone>
          </Viewport>
        </CraftEditor>
      </PageIdContext.Provider>
    </div>
  );
};

export const PageItem = React.memo(PageItemComponent);
