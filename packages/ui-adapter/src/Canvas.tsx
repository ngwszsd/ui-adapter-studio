import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  ChevronDown,
  LayoutGrid,
  LocateFixed,
  Map,
  MousePointer2,
  Plus,
  Tablet,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button, Tooltip, TooltipTrigger, TooltipContent } from '@teamhelper/ui';
import {
  MiniMap,
  TransformComponent,
  TransformWrapper,
} from 'react-zoom-pan-pinch';
import { PageItem } from './PageItem';
import type { ARPage } from './types';
import { AR_VIEWPORT_HEIGHT, AR_VIEWPORT_WIDTH } from './types';
import { useDesignerStore } from './store/useDesignerStore';

// 逻辑画布大小（无限画布的可编辑区域，不等于可视窗口大小）
const CANVAS_WIDTH = 7200;
const CANVAS_HEIGHT = 4200;
// 统一限制缩放边界，避免过度缩放导致交互异常
const MIN_SCALE = 0.25;
const MAX_SCALE = 2;

// 底部缩放菜单预设倍率
const ZOOM_PRESETS = [0.5, 1, 1.5, 2];
// 触控板平移灵敏度（越小移动越慢）
const TOUCHPAD_PAN_SENSITIVITY = 0.35;
// 这些元素内部禁用画布拖拽，避免和组件交互冲突
const PANNING_EXCLUDED = [
  'page-drag-handle',
  'button',
  'input',
  'textarea',
  'craft-container',
  'craft-node-shell',
];
// 表单元素里禁用滚轮缩放，避免影响输入体验
const WHEEL_EXCLUDED = ['input', 'textarea', 'craft-container', 'craft-vertical-list', 'craft-horizontal-list', 'craft-grid-list'];
// 小地图显示状态持久化 key
const MINIMAP_STORAGE_KEY = 'ui-designer-minimap';
const PAGE_MOUNT_BUFFER = 320;

/**
 * 判断 wheel 事件是否应由内部可滚动容器处理（而非画布缩放/平移）。
 * 向上查找最近的 [data-scrollable] 元素，若该元素在任意方向存在溢出内容则返回 true。
 */
const shouldScrollInternally = (event: WheelEvent): boolean => {
  const scrollable = (event.target as HTMLElement).closest?.<HTMLElement>(
    '[data-scrollable]'
  );
  if (!scrollable) return false;

  const hasVerticalOverflow = scrollable.scrollHeight > scrollable.clientHeight;
  const hasHorizontalOverflow = scrollable.scrollWidth > scrollable.clientWidth;

  // 只要内部容器在任意方向存在溢出内容，就拦截 wheel 事件，
  // 避免滚到边界后事件泄漏到画布触发缩放/平移
  return hasVerticalOverflow || hasHorizontalOverflow;
};

type SetTransformFn = (
  x: number,
  y: number,
  scale: number,
  animationTime?: number
) => void;

// 缩放值钳制到安全范围
const clampScale = (value: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

const updateGridStyle = (
  gridEl: HTMLDivElement | null,
  positionX: number,
  positionY: number,
  scale: number
) => {
  if (!gridEl) return;

  // 网格步长跟随缩放变化，保证视觉密度稳定
  const scaledStep = 40 * scale;
  // 使用模运算做偏移，让网格在平移时保持“连续滑动”而不是跳变
  const offsetX = ((positionX % scaledStep) + scaledStep) % scaledStep;
  const offsetY = ((positionY % scaledStep) + scaledStep) % scaledStep;

  gridEl.style.backgroundSize = `${scaledStep}px ${scaledStep}px`;
  gridEl.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
};

const getTargetPage = (activePageId: string | null, pages: ARPage[]) => {
  if (pages.length === 0) return null;
  const activePage = activePageId
    ? pages.find((page) => page.id === activePageId) ?? null
    : null;
  return activePage ?? pages[0] ?? null;
};

const isPageVisible = (
  page: ARPage,
  viewportWidth: number,
  viewportHeight: number,
  positionX: number,
  positionY: number,
  scale: number
) => {
  const left = page.x * scale + positionX;
  const top = page.y * scale + positionY;
  const width = AR_VIEWPORT_WIDTH * scale;
  const height = AR_VIEWPORT_HEIGHT * scale;

  return !(
    left + width < -PAGE_MOUNT_BUFFER ||
    top + height < -PAGE_MOUNT_BUFFER ||
    left > viewportWidth + PAGE_MOUNT_BUFFER ||
    top > viewportHeight + PAGE_MOUNT_BUFFER
  );
};

const getCenterTransform = (
  targetPage: ARPage | null,
  viewportEl: HTMLDivElement | null,
  scaleToUse: number
) => {
  if (!targetPage || !viewportEl) return null;

  const wrapperWidth = viewportEl.clientWidth;
  const wrapperHeight = viewportEl.clientHeight;
  const nextScale = clampScale(scaleToUse);

  const pageCenterX = targetPage.x + AR_VIEWPORT_WIDTH / 2;
  const pageCenterY = targetPage.y + AR_VIEWPORT_HEIGHT / 2;

  // 将目标页面中心对齐到当前可视区域中心
  return {
    positionX: wrapperWidth / 2 - pageCenterX * nextScale,
    positionY: wrapperHeight / 2 - pageCenterY * nextScale,
    scale: nextScale,
  };
};

export const Canvas = () => {
  // P1：Canvas 不直接订阅完整 page 对象，
  // 这里只拿渲染页面壳子所需的最小摘要，避免 craftState 变化把整块画布拖着重渲
  const pageSummaries = useDesignerStore(
    useShallow((state) =>
      state.pageOrder
        .map((pageId) => {
          const page = state.pages[pageId];
          return page
            ? [page.id, page.title, String(page.x), String(page.y)].join('::')
            : null;
        })
        .filter((item): item is string => item !== null)
    )
  );
  // 由轻量摘要还原出 Canvas 当前真正关心的页面外壳信息
  const pages = React.useMemo<ARPage[]>(() =>
    pageSummaries.map((item) => {
      const [id, title, x, y] = item.split('::');
      return { id, title, x: Number(x), y: Number(y) } as ARPage;
    }),
  [pageSummaries]);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const addPage = useDesignerStore((state) => state.addPage);
  const autoLayoutPages = useDesignerStore((state) => state.autoLayoutPages);
  const setCanvasScale = useDesignerStore((state) => state.setCanvasScale);
  const scale = useDesignerStore((state) => state.canvasScale);
  const interactionMode = useDesignerStore((state) => state.interactionMode);
  const setInteractionMode = useDesignerStore(
    (state) => state.setInteractionMode
  );

  const targetPage = React.useMemo(
    () => getTargetPage(activePageId, pages),
    [activePageId, pages]
  );

  // 画布DOM与弹窗DOM引用
  const canvasViewportRef = React.useRef<HTMLDivElement | null>(null);
  const gridLayerRef = React.useRef<HTMLDivElement | null>(null);
  const zoomMenuRef = React.useRef<HTMLDivElement | null>(null);
  // 缓存 transform 实时状态，供触控板平移和 KeepScale 同步复用
  const transformStateRef = React.useRef({
    positionX: 0,
    positionY: 0,
    scale: 0.7,
  });
  // 缓存 setTransform imperative API，便于在 effect 中主动触发同步
  const setTransformRef = React.useRef<SetTransformFn | null>(null);
  // 保存最新 fitAllPages 实现，供分帧调度时调用，避免闭包拿到旧状态
  const fitAllPagesRef = React.useRef<(() => void) | null>(null);
  // 自动布局与 fitAll 分别维护独立 raf，便于取消和去重
  const autoLayoutRafRef = React.useRef<number>(0);
  const fitAllRafRef = React.useRef<number>(0);
  // 防止连续点击“自动布局”按钮重复排队
  const autoLayoutPendingRef = React.useRef(false);

  const [openZoomMenu, setOpenZoomMenu] = React.useState(false);
  // 用于按钮禁用态，反馈当前是否仍在等待布局 / 聚焦完成
  const [isAutoLayoutPending, setIsAutoLayoutPending] = React.useState(false);
  const [showMinimap, setShowMinimap] = React.useState(
    () => sessionStorage.getItem(MINIMAP_STORAGE_KEY) === 'true',
  );
  const [viewportSize, setViewportSize] = React.useState({ width: 0, height: 0 });
  const [viewState, setViewState] = React.useState({
    positionX: 0,
    positionY: 0,
    scale: 0.7,
  });
  const viewStateRafRef = React.useRef<number>(0);
  const pendingViewStateRef = React.useRef(viewState);

  // P2：按当前视口只挂载“可见页面 + 当前激活页”，
  // 大量页面场景下显著减少同时存在的 CraftEditor 数量
  const visiblePageIds = React.useMemo(() => {
    if (pages.length <= 1 || viewportSize.width <= 0 || viewportSize.height <= 0) {
      return pages.map((page) => page.id);
    }

    return pages
      .filter((page) =>
        page.id === activePageId ||
        isPageVisible(
          page,
          viewportSize.width,
          viewportSize.height,
          viewState.positionX,
          viewState.positionY,
          viewState.scale
        )
      )
      .map((page) => page.id);
  }, [activePageId, pages, viewportSize.height, viewportSize.width, viewState.positionX, viewState.positionY, viewState.scale]);
  const visiblePageIdsSignature = React.useMemo(
    () => visiblePageIds.join('::'),
    [visiblePageIds]
  );

  const syncKeepScaleLayout = React.useCallback(() => {
    const setTransform = setTransformRef.current;
    if (!setTransform) return;

    // 重新派发“当前 transform”，用于通知新挂载的 KeepScale 节点立即校准尺寸
    const {
      positionX,
      positionY,
      scale: currentScale,
    } = transformStateRef.current;
    setTransform(positionX, positionY, currentScale, 0);
  }, []);

  const commitViewState = React.useCallback((nextState: typeof viewState) => {
    pendingViewStateRef.current = nextState;
    if (viewStateRafRef.current) return;

    viewStateRafRef.current = requestAnimationFrame(() => {
      viewStateRafRef.current = 0;
      const latestState = pendingViewStateRef.current;
      setViewState((prev) => {
        if (
          prev.positionX === latestState.positionX &&
          prev.positionY === latestState.positionY &&
          prev.scale === latestState.scale
        ) {
          return prev;
        }

        return latestState;
      });
    });
  }, []);

  // 统一取消自动布局链路上尚未执行的 raf，避免卸载或重复点击残留任务
  const cancelScheduledAutoLayout = React.useCallback(() => {
    if (autoLayoutRafRef.current) {
      cancelAnimationFrame(autoLayoutRafRef.current);
      autoLayoutRafRef.current = 0;
    }
    if (fitAllRafRef.current) {
      cancelAnimationFrame(fitAllRafRef.current);
      fitAllRafRef.current = 0;
    }
    autoLayoutPendingRef.current = false;
    setIsAutoLayoutPending(false);
  }, []);

  // 将 fitAllPages 推迟到若干帧后执行：
  // 给 Zustand 写入页面坐标、React 提交页面位置更新留出缓冲时间，减少布局抖动
  const scheduleFitAllPages = React.useCallback(
    (frames = 1, onDone?: () => void) => {
      if (fitAllRafRef.current) {
        cancelAnimationFrame(fitAllRafRef.current);
        fitAllRafRef.current = 0;
      }

      // 逐帧递减，而不是 setTimeout，确保和浏览器渲染节奏对齐
      const scheduleNextFrame = (remainingFrames: number) => {
        fitAllRafRef.current = window.requestAnimationFrame(() => {
          if (remainingFrames <= 1) {
            fitAllRafRef.current = 0;
            fitAllPagesRef.current?.();
            onDone?.();
            return;
          }

          scheduleNextFrame(remainingFrames - 1);
        });
      };

      scheduleNextFrame(Math.max(1, frames));
    },
    []
  );

  // 自动布局入口：同一时间只允许一条“布局 -> fitAll”链路在跑
  const scheduleAutoLayoutAndFit = React.useCallback(() => {
    if (autoLayoutPendingRef.current) return;

    autoLayoutPendingRef.current = true;
    setIsAutoLayoutPending(true);

    autoLayoutRafRef.current = window.requestAnimationFrame(() => {
      autoLayoutRafRef.current = 0;
      // 先执行页面重排；后续再等两帧做 fitAll，避免立即读取到旧布局包围盒
      autoLayoutPages();
      scheduleFitAllPages(2, () => {
        autoLayoutPendingRef.current = false;
        setIsAutoLayoutPending(false);
      });
    });
  }, [autoLayoutPages, scheduleFitAllPages]);

  const interactionConfig = React.useMemo(() => {
    if (interactionMode === 'touchpad') {
      // 触控板友好模式：所有 wheel 事件由原生 handler 全权接管（平移 + 缩放）
      // 禁用库内置的 wheel / pinch，避免双重处理和 clamp 失效
      return {
        panning: {
          excluded: PANNING_EXCLUDED,
          allowLeftClickPan: false,
          wheelPanning: false,
          velocityDisabled: true,
        },
        wheel: {
          wheelDisabled: true,
          touchPadDisabled: true,
          excluded: WHEEL_EXCLUDED,
        },
        pinch: {
          disabled: true,
        },
      };
    }

    // 鼠标友好模式：左键拖动画布 + 滚轮缩放，禁用触控板缩放手势
    return {
      panning: {
        excluded: PANNING_EXCLUDED,
        allowLeftClickPan: true,
        wheelPanning: false,
        velocityDisabled: true,
      },
      wheel: {
        smoothStep: 0.06,
        wheelDisabled: false,
        touchPadDisabled: true,
        excluded: WHEEL_EXCLUDED,
      },
      pinch: {
        disabled: true,
      },
    };
  }, [interactionMode]);

  React.useEffect(() => {
    // 初始化网格样式，和 initialScale 保持一致
    updateGridStyle(gridLayerRef.current, 0, 0, 0.7);
  }, []);

  React.useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el) return;

    const updateViewportSize = () => {
      setViewportSize((prev) => {
        const nextWidth = el.clientWidth;
        const nextHeight = el.clientHeight;
        if (prev.width === nextWidth && prev.height === nextHeight) return prev;
        return { width: nextWidth, height: nextHeight };
      });
    };

    updateViewportSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateViewportSize);
      return () => window.removeEventListener('resize', updateViewportSize);
    }

    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => () => {
    if (viewStateRafRef.current) {
      cancelAnimationFrame(viewStateRafRef.current);
    }
    cancelScheduledAutoLayout();
  }, [cancelScheduledAutoLayout]);

  React.useEffect(() => {
    // 点击弹窗外区域时关闭缩放菜单
    if (!openZoomMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(target)) {
        setOpenZoomMenu(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [openZoomMenu]);

  React.useEffect(() => {
    // 可见页面集合变化后，下一帧主动同步一次 transform：
    // 解决新进入视口的页面标题拖拽头尺寸未按屏幕等比显示的问题
    const rafId = window.requestAnimationFrame(() => {
      syncKeepScaleLayout();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [syncKeepScaleLayout, visiblePageIdsSignature]);

  // 触控板模式：用原生 wheel 监听替代 React onWheelCapture
  // React 合成事件默认 passive，preventDefault() 不生效，导致页面跟着滚动
  React.useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el || interactionMode !== 'touchpad') return;

    const handleWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea')) return;

      // 内部可滚动容器还有溢出内容时，交给浏览器原生滚动处理
      // 但仍需阻止冒泡，避免事件泄漏到外层页面引发全局滚动
      if (shouldScrollInternally(event)) {
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const setTransform = setTransformRef.current;
      if (!setTransform) return;

      const {
        positionX: currentX,
        positionY: currentY,
        scale: currentScale,
      } = transformStateRef.current;

      if (event.ctrlKey) {
        // Ctrl+wheel = 触控板捏合缩放，自行 clamp 到 MIN_SCALE / MAX_SCALE
        const nextScale = clampScale(currentScale * (1 - event.deltaY * 0.01));

        // 以指针位置为锚点缩放
        const rect = el.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        const ratio = nextScale / currentScale;
        const nextX = pointerX - (pointerX - currentX) * ratio;
        const nextY = pointerY - (pointerY - currentY) * ratio;

        setTransform(nextX, nextY, nextScale, 0);
        transformStateRef.current = {
          positionX: nextX,
          positionY: nextY,
          scale: nextScale,
        };
        return;
      }

      // 普通两指滚动 = 平移
      const nextX = currentX - event.deltaX * TOUCHPAD_PAN_SENSITIVITY;
      const nextY = currentY - event.deltaY * TOUCHPAD_PAN_SENSITIVITY;

      setTransform(nextX, nextY, currentScale, 0);
      transformStateRef.current = {
        positionX: nextX,
        positionY: nextY,
        scale: currentScale,
      };
    };

    el.addEventListener('wheel', handleWheel, {
      passive: false,
      capture: true,
    });
    return () => {
      el.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [interactionMode]);

  // 鼠标模式：内部可滚动容器有余量时，阻止 wheel 事件传播到 react-zoom-pan-pinch
  React.useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el || interactionMode !== 'mouse') return;

    const handleWheelGuard = (event: WheelEvent) => {
      if (shouldScrollInternally(event)) {
        event.stopPropagation();
        return;
      }
    };

    el.addEventListener('wheel', handleWheelGuard, { capture: true });
    return () => {
      el.removeEventListener('wheel', handleWheelGuard, { capture: true });
    };
  }, [interactionMode]);

  return (
    <div
      ref={canvasViewportRef}
      className="relative h-full w-full overflow-hidden bg-[#eef1f6]"
    >
      {/* 全屏网格背景层：不参与事件，仅用于视觉参考 */}
      <div
        ref={gridLayerRef}
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          backgroundPosition: '0 0',
        }}
      />

      {/* 画布平移/缩放根组件 */}
      <TransformWrapper
        initialScale={0.7}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        centerOnInit={false}
        limitToBounds={false}
        doubleClick={{ disabled: true }}
        panning={interactionConfig.panning}
        wheel={interactionConfig.wheel}
        pinch={interactionConfig.pinch}
        onTransformed={(_, state) => {
          // 将当前缩放写入全局状态，供其他模块（如 PageItem 拖拽）使用
          setCanvasScale(state.scale);

          commitViewState({
            positionX: state.positionX,
            positionY: state.positionY,
            scale: state.scale,
          });

          // 缓存最新 transform，避免频繁闭包捕获
          transformStateRef.current = {
            positionX: state.positionX,
            positionY: state.positionY,
            scale: state.scale,
          };

          // 同步刷新背景网格（位置 + 缩放）
          updateGridStyle(
            gridLayerRef.current,
            state.positionX,
            state.positionY,
            state.scale
          );
        }}
      >
        {({ setTransform, zoomIn, zoomOut }) => {
          // 保存最新 setTransform，给 effect 内的同步逻辑调用
          setTransformRef.current = setTransform;

          // 工具函数：将目标页面居中显示（可指定缩放）
          const centerPage = (scaleToUse: number, page?: ARPage | null) => {
            const target = page ?? targetPage;
            const centerState = getCenterTransform(
              target,
              canvasViewportRef.current,
              scaleToUse
            );
            if (!centerState) return;

            // 加一点动画时长，提升视觉平滑度
            setTransform(
              centerState.positionX,
              centerState.positionY,
              centerState.scale,
              220
            );
          };

          // 计算自适应缩放倍率
          const getFitScale = () => {
            if (!canvasViewportRef.current) return scale;
            const wrapperWidth = canvasViewportRef.current.clientWidth;
            const wrapperHeight = canvasViewportRef.current.clientHeight;
            return clampScale(
              Math.min(
                (wrapperWidth - 180) / AR_VIEWPORT_WIDTH,
                (wrapperHeight - 220) / AR_VIEWPORT_HEIGHT
              )
            );
          };

          // 聚焦当前激活页面（自适应缩放）
          const focusCurrentPage = () => {
            centerPage(getFitScale());
          };

          // 自动布局后将视口适配到所有页面的包围盒
          const fitAllPages = () => {
            const vp = canvasViewportRef.current;
            if (!vp) return;

            const s = useDesignerStore.getState();
            if (!s.pageOrder.length) return;

            // 计算所有页面的包围盒
            let minX = Infinity,
              minY = Infinity;
            let maxX = -Infinity,
              maxY = -Infinity;
            for (const id of s.pageOrder) {
              const p = s.pages[id];
              if (!p) continue;
              minX = Math.min(minX, p.x);
              minY = Math.min(minY, p.y);
              maxX = Math.max(maxX, p.x + AR_VIEWPORT_WIDTH);
              maxY = Math.max(maxY, p.y + AR_VIEWPORT_HEIGHT);
            }

            const contentW = maxX - minX;
            const contentH = maxY - minY;
            const padding = 80;
            const wrapperW = vp.clientWidth;
            const wrapperH = vp.clientHeight;

            const fitScale = clampScale(
              Math.min(
                (wrapperW - padding * 2) / contentW,
                (wrapperH - padding * 2) / contentH
              )
            );

            const centerX = minX + contentW / 2;
            const centerY = minY + contentH / 2;

            setTransform(
              wrapperW / 2 - centerX * fitScale,
              wrapperH / 2 - centerY * fitScale,
              fitScale,
              220
            );
          };

          // 每次 render 都刷新 ref，保证分帧任务拿到的是最新 fitAll 逻辑
          fitAllPagesRef.current = fitAllPages;

          // 缩放预设按钮统一入口
          const applyZoomPreset = (nextScale: number) => {
            centerPage(nextScale);
          };

          return (
            <>
              {/* 画布内容层（页面实例都渲染在这里） */}
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{
                  width: `${CANVAS_WIDTH}px`,
                  height: `${CANVAS_HEIGHT}px`,
                  position: 'relative',
                }}
              >
                {/* P2：这里只渲染视口内实际可见的页面实例 */}
                {visiblePageIds.map((pageId) => (
                  <PageItem key={pageId} pageId={pageId} />
                ))}
              </TransformComponent>

              {/* 小地图：辅助定位，蓝色高亮当前激活页面 */}
              {showMinimap && (
                <div className="pointer-events-none absolute bottom-4 right-4 z-[110]">
                  <MiniMap
                    width={180}
                    height={110}
                    borderColor="#3b82f6"
                    className="pointer-events-auto overflow-hidden rounded-lg border border-slate-200/80 bg-white/90 shadow-md backdrop-blur-sm"
                  >
                    <div
                      className="relative bg-slate-50/80"
                      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                    >
                      {pages.map((page) => {
                        const isMiniActive =
                          page.id === (activePageId ?? targetPage?.id ?? '');

                        return (
                          <div
                            key={`mini_${page.id}`}
                            className="absolute rounded-[2px]"
                            style={{
                              left: page.x,
                              top: page.y,
                              width: AR_VIEWPORT_WIDTH,
                              height: AR_VIEWPORT_HEIGHT,
                              border: isMiniActive
                                ? '2px solid #3b82f6'
                                : '1px solid #cbd5e1',
                              backgroundColor: isMiniActive
                                ? 'rgba(59,130,246,0.12)'
                                : 'rgba(226,232,240,0.5)',
                            }}
                          />
                        );
                      })}
                    </div>
                  </MiniMap>
                </div>
              )}

              {/* 底部操作栏：交互模式、缩放、聚焦、自动布局、新建页面 */}
              <div
                datatype="operations button"
                className="pointer-events-none absolute bottom-6 left-1/2 z-[120] -translate-x-1/2"
              >
                <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-lg">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setInteractionMode('mouse')}
                        className={`rounded-lg p-2 transition hover:bg-slate-100 ${interactionMode === 'mouse' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                      >
                        <MousePointer2 size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      鼠标模式
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setInteractionMode('touchpad')}
                        className={`rounded-lg p-2 transition hover:bg-slate-100 ${interactionMode === 'touchpad' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                      >
                        <Tablet size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      触控板模式
                    </TooltipContent>
                  </Tooltip>

                  <div className="mx-1 h-6 w-px bg-slate-200" />

                  <div ref={zoomMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenZoomMenu((value) => !value);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <span>{Math.round(scale * 100)}%</span>
                      <ChevronDown size={14} />
                    </button>

                    {openZoomMenu ? (
                      // 缩放弹窗点击 item 后不主动关闭；在外部 pointerdown 时统一关闭
                      <div className="absolute bottom-12 left-0 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            zoomIn(0.1);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <ZoomIn size={14} />
                          放大
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            zoomOut(0.1);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <ZoomOut size={14} />
                          缩小
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            focusCurrentPage();
                          }}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        >
                          自适应
                        </button>
                        <div className="my-1 h-px bg-slate-200" />
                        {ZOOM_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => applyZoomPreset(preset)}
                            className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                          >
                            {Math.round(preset * 100)}%
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={focusCurrentPage}
                        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                      >
                        <LocateFixed size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      聚焦当前页面
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        // 自动布局较重，统一走分帧调度，避免连点造成连续重排
                        onClick={scheduleAutoLayoutAndFit}
                        disabled={isAutoLayoutPending}
                        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <LayoutGrid size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      自动布局
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() =>
                          setShowMinimap((v) => {
                            const next = !v;
                            sessionStorage.setItem(MINIMAP_STORAGE_KEY, String(next));
                            return next;
                          })
                        }
                        className={`rounded-lg p-2 transition hover:bg-slate-100 ${showMinimap ? 'text-blue-600' : 'text-slate-600'}`}
                      >
                        <Map size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      {showMinimap ? '隐藏小地图' : '显示小地图'}
                    </TooltipContent>
                  </Tooltip>

                  <div className="mx-1 h-6 w-px bg-slate-200" />

                  <Button
                    size="sm"
                    onClick={() => {
                      const newId = addPage();
                      const newPage = useDesignerStore.getState().pages[newId];
                      if (newPage) {
                        requestAnimationFrame(() => centerPage(getFitScale(), newPage));
                      }
                    }}
                    className="rounded-lg"
                  >
                    <Plus size={14} />
                    新建页面
                  </Button>
                </div>
              </div>
            </>
          );
        }}
      </TransformWrapper>
    </div>
  );
};
