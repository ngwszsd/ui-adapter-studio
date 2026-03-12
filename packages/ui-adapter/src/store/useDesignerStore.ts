import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import type { SerializedNodes } from '@craftjs/core';
import type {
  ARPage,
  ARPageConfig,
  ActiveNodeInfo,
  CanvasInteractionMode,
  DesignerOutput,
  GlobalVariable,
  PersistedDesignerState,
  SizeMode,
} from '../types';
import { AR_VIEWPORT_HEIGHT, AR_VIEWPORT_WIDTH } from '../types';
import { createId } from '../utils/id';
import { findMirroredNodeIds } from '../utils/listSync';
import type { EditorApi } from './editorRegistry';
import { getEditorApi } from './editorRegistry';

type PageEntityMap = Record<string, ARPage>;

const INTERACTION_MODE_KEY = 'designer_interaction_mode';

const getStoredInteractionMode = (): CanvasInteractionMode => {
  try {
    const stored = sessionStorage.getItem(INTERACTION_MODE_KEY);
    if (stored === 'mouse' || stored === 'touchpad') return stored;
  } catch {
    /* SSR / 无权限场景静默回退 */
  }
  return 'mouse';
};

const PAGE_BASE_X = 240;
const PAGE_BASE_Y = 180;
const PAGE_COLS = 3;
const PAGE_GAP_X = AR_VIEWPORT_WIDTH + 120;
const PAGE_GAP_Y = AR_VIEWPORT_HEIGHT + 140;

const getPagePositionByIndex = (index: number) => {
  const col = index % PAGE_COLS;
  const row = Math.floor(index / PAGE_COLS);

  return {
    x: PAGE_BASE_X + col * PAGE_GAP_X,
    y: PAGE_BASE_Y + row * PAGE_GAP_Y,
  };
};

type SizeAxis = 'width' | 'height';

const getModeAxis = (key: string): SizeAxis | null => {
  if (key === 'widthMode') return 'width';
  if (key === 'heightMode') return 'height';
  return null;
};

const isSizeMode = (value: unknown): value is SizeMode =>
  value === 'fixed' ||
  value === 'fill' ||
  value === 'percent' ||
  value === 'fit-content';

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
};

const roundNumber = (value: number, fractionDigits = 0) =>
  Number(value.toFixed(fractionDigits));

const measureNodeAndParent = (
  editorApi: EditorApi,
  nodeId: string,
  axis: SizeAxis,
  canvasScale: number
): { nodePx: number; parentPx: number } | null => {
  if (typeof window === 'undefined') return null;

  const nodeEl = editorApi.getNodeDom(nodeId);
  if (!nodeEl) return null;

  const parentEl = nodeEl.parentElement;
  if (!parentEl) return null;

  const scale = canvasScale > 0 ? canvasScale : 1;
  const nodeRect = nodeEl.getBoundingClientRect();
  const parentRect = parentEl.getBoundingClientRect();

  const rawNodePx = axis === 'width' ? nodeRect.width : nodeRect.height;
  const rawParentPx = axis === 'width' ? parentRect.width : parentRect.height;
  if (!Number.isFinite(rawNodePx) || !Number.isFinite(rawParentPx)) return null;

  const nodePx = Math.max(0, rawNodePx / scale);
  const parentPx = Math.max(0, rawParentPx / scale);
  return { nodePx, parentPx };
};

const convertSizeValueForModeChange = ({
  prevMode,
  nextMode,
  prevValue,
  axis,
  editorApi,
  nodeId,
  canvasScale,
}: {
  prevMode: SizeMode;
  nextMode: SizeMode;
  prevValue: unknown;
  axis: SizeAxis;
  editorApi: EditorApi;
  nodeId: string;
  canvasScale: number;
}): number | null => {
  if (prevMode === nextMode) return null;
  if (nextMode === 'fill') return null;

  if (prevMode === 'fill' && nextMode === 'percent') {
    return 100;
  }

  const measured = measureNodeAndParent(editorApi, nodeId, axis, canvasScale);
  const prevNumber = toFiniteNumber(prevValue);

  if (nextMode === 'fixed') {
    if (measured) {
      return roundNumber(measured.nodePx);
    }

    return prevNumber != null ? Math.max(0, roundNumber(prevNumber)) : null;
  }

  if (nextMode === 'percent') {
    if (measured && measured.parentPx > 0) {
      return Math.max(0, roundNumber((measured.nodePx / measured.parentPx) * 100, 2));
    }
    if (prevMode === 'fill') return 100;
  }

  if (nextMode === 'fit-content') {
    if (measured) {
      return roundNumber(measured.nodePx);
    }
  }

  return prevNumber != null ? Math.max(0, roundNumber(prevNumber)) : null;
};

export const getDefaultPageConfig = (): ARPageConfig => ({
  topBar: { visible: true },
  menu: {
    visible: true,
    margin: 0,
    showUser: true,
    customMenus: [],
    showSystem: true,
    showCommand: true,
  },
  systemStatus: {
    visible: true,
    margin: 0,
    gap: 2,
    showCellular: true,
    showWifi: true,
    showMobileData: true,
    showBluetooth: true,
    showGPS: true,
    showVolume: true,
    showTime: true,
    showBatteryPercent: false,
  },
  layout: {
    arrangement: 'vertical',
    spacingMode: 'fixed',
    spacing: 8,
    distribution: 'top-left',
    columnDistribution: 'left',
  },
  containerStyle: {
    background: '#0f172a',
    borderRadius: 0,
    padding: 12,
    margin: 0,
    border: null,
    shadow: null,
  },
  i18n: {
    entries: [],
  },
});

const createPage = (index: number): ARPage => {
  const position = getPagePositionByIndex(index);

  return {
    id: createId('ar_page'),
    title: `页面 ${index + 1}`,
    x: position.x,
    y: position.y,
    craftState: null,
  };
};

const createInitialDesignerData = () => {
  const initialPage = createPage(0);

  return {
    pageOrder: [initialPage.id],
    pages: { [initialPage.id]: initialPage } as PageEntityMap,
    activePageId: initialPage.id,
    canvasScale: 0.7,
    interactionMode: getStoredInteractionMode() as CanvasInteractionMode,
    activeNode: null as ActiveNodeInfo | null,
    _hydrated: false,
    globalVariables: [] as GlobalVariable[],
  };
};

interface DesignerState {
  pageOrder: string[];
  pages: PageEntityMap;
  activePageId: string | null;
  canvasScale: number;
  interactionMode: CanvasInteractionMode;
  activeNode: ActiveNodeInfo | null;
  _hydrated: boolean;

  addPage: () => string;
  removePage: (id: string) => void;
  renamePage: (id: string, title: string) => void;
  updatePagePosition: (id: string, x: number, y: number) => void;
  updatePageCraftState: (id: string, state: SerializedNodes) => void;
  setActivePage: (id: string | null) => void;
  setActiveNode: (node: ActiveNodeInfo | null) => void;
  clearActiveNode: () => void;
  setCanvasScale: (scale: number) => void;
  setInteractionMode: (mode: CanvasInteractionMode) => void;
  autoLayoutPages: () => void;
  updateActiveNodeProp: (key: string, value: unknown) => void;
  removeActiveNode: () => void;
  updatePageConfig: (
    id: string,
    updater: (config: ARPageConfig) => void
  ) => void;
  getOutput: () => DesignerOutput;
  exportData: () => string;
  hydrateState: (persisted: PersistedDesignerState) => void;
  resetState: () => void;
  getPersistedState: () => PersistedDesignerState;

  globalVariables: GlobalVariable[];
  addGlobalVariable: () => void;
  removeGlobalVariable: (id: string) => void;
  updateGlobalVariable: (id: string, key: 'name' | 'value' | 'type', val: string) => void;
}

export const useDesignerStore = create<DesignerState>()(
  immer((set, get) => ({
    ...createInitialDesignerData(),

    addPage: () => {
      const newPage = createPage(get().pageOrder.length);

      set((state) => {
        state.pageOrder.push(newPage.id);
        state.pages[newPage.id] = newPage;
        state.activePageId = newPage.id;
        state.activeNode = null;
      });

      return newPage.id;
    },

    removePage: (id) => {
      set((state) => {
        if (!state.pages[id]) return;

        delete state.pages[id];
        state.pageOrder = state.pageOrder.filter((pageId) => pageId !== id);

        if (state.activePageId === id) {
          state.activePageId = state.pageOrder[0] ?? null;
        }

        if (state.activeNode?.pageId === id) {
          state.activeNode = null;
        }
      });
    },

    renamePage: (id, title) => {
      set((state) => {
        const page = state.pages[id];
        if (page) {
          page.title = title;
        }
      });
    },

    updatePagePosition: (id, x, y) => {
      set((state) => {
        const page = state.pages[id];
        if (!page) return;

        page.x = x;
        page.y = y;
      });
    },

    updatePageCraftState: (id, craftState) => {
      set((state) => {
        const page = state.pages[id];
        if (page) {
          page.craftState = craftState;
        }
      });
    },

    setActivePage: (id) => {
      set((state) => {
        // 避免重复写入相同 activePage，减少拖拽开始时的无效重渲染
        const activeNodeOnTargetPage =
          !state.activeNode || state.activeNode.pageId === id;
        if (state.activePageId === id && activeNodeOnTargetPage) {
          return;
        }

        state.activePageId = id;

        if (state.activeNode?.pageId !== id) {
          state.activeNode = null;
        }
      });
    },

    setActiveNode: (node) => {
      set((state) => {
        state.activeNode = node;
        if (node) {
          state.activePageId = node.pageId;
        }
      });
    },

    clearActiveNode: () => {
      set((state) => {
        state.activeNode = null;
      });
    },

    setCanvasScale: (scale) => {
      set((state) => {
        if (state.canvasScale === scale) return;
        state.canvasScale = scale;
      });
    },

    setInteractionMode: (mode) => {
      try {
        sessionStorage.setItem(INTERACTION_MODE_KEY, mode);
      } catch {
        /* 静默 */
      }
      set((state) => {
        state.interactionMode = mode;
      });
    },

    autoLayoutPages: () => {
      set((state) => {
        state.pageOrder.forEach((pageId, index) => {
          const page = state.pages[pageId];
          if (!page) return;

          const nextPosition = getPagePositionByIndex(index);
          page.x = nextPosition.x;
          page.y = nextPosition.y;
        });
      });
    },

    updateActiveNodeProp: (key, value) => {
      const activeNode = get().activeNode;
      if (!activeNode) return;

      const editorApi = getEditorApi(activeNode.pageId);
      if (!editorApi) return;
      const mirroredNodeIds = findMirroredNodeIds(editorApi, activeNode.nodeId);

      const sizeAxis = getModeAxis(key);
      const nextMode = sizeAxis && isSizeMode(value) ? value : null;
      if (sizeAxis && nextMode) {
        const prevModeRaw = activeNode.props[key];
        const prevMode = isSizeMode(prevModeRaw) ? prevModeRaw : 'fixed';
        const sizeValueKey = sizeAxis;
        const prevSizeValue = activeNode.props[sizeValueKey];
        const convertedSizeValue = convertSizeValueForModeChange({
          prevMode,
          nextMode,
          prevValue: prevSizeValue,
          axis: sizeAxis,
          editorApi,
          nodeId: activeNode.nodeId,
          canvasScale: get().canvasScale,
        });

        editorApi.updateNodeProp(activeNode.nodeId, key, nextMode);
        if (convertedSizeValue != null) {
          editorApi.updateNodeProp(activeNode.nodeId, sizeValueKey, convertedSizeValue);
        }

        for (const mirroredNodeId of mirroredNodeIds) {
          const mirroredProps = editorApi.getNodeProps(mirroredNodeId) ?? {};
          const mirroredPrevModeRaw = mirroredProps[key];
          const mirroredPrevMode = isSizeMode(mirroredPrevModeRaw)
            ? mirroredPrevModeRaw
            : 'fixed';
          const mirroredPrevSizeValue = mirroredProps[sizeValueKey];
          const mirroredConvertedSizeValue = convertSizeValueForModeChange({
            prevMode: mirroredPrevMode,
            nextMode,
            prevValue: mirroredPrevSizeValue,
            axis: sizeAxis,
            editorApi,
            nodeId: mirroredNodeId,
            canvasScale: get().canvasScale,
          });

          editorApi.updateNodeProp(mirroredNodeId, key, nextMode);
          if (mirroredConvertedSizeValue != null) {
            editorApi.updateNodeProp(
              mirroredNodeId,
              sizeValueKey,
              mirroredConvertedSizeValue
            );
          }
        }

        set((state) => {
          if (!state.activeNode) return;
          if (state.activeNode.nodeId !== activeNode.nodeId) return;
          state.activeNode.props[key] = nextMode;
          if (convertedSizeValue != null) {
            state.activeNode.props[sizeValueKey] = convertedSizeValue;
          }
        });
        return;
      }

      editorApi.updateNodeProp(activeNode.nodeId, key, value);
      for (const mirroredNodeId of mirroredNodeIds) {
        editorApi.updateNodeProp(mirroredNodeId, key, value);
      }

      set((state) => {
        if (!state.activeNode) return;
        if (state.activeNode.nodeId !== activeNode.nodeId) return;
        state.activeNode.props[key] = value;
      });
    },

    removeActiveNode: () => {
      const activeNode = get().activeNode;
      if (!activeNode) return;

      const editorApi = getEditorApi(activeNode.pageId);
      if (!editorApi) return;
      const mirroredNodeIds = findMirroredNodeIds(editorApi, activeNode.nodeId);

      for (const mirroredNodeId of mirroredNodeIds) {
        editorApi.deleteNode(mirroredNodeId);
      }
      editorApi.deleteNode(activeNode.nodeId);

      set((state) => {
        if (state.activeNode?.nodeId === activeNode.nodeId) {
          state.activeNode = null;
        }
      });
    },

    addGlobalVariable: () => {
      set((state) => {
        const existingNums = state.globalVariables
          .map((v) => {
            const match = v.name.match(/^variable_(\d+)$/);
            return match ? Number(match[1]) : 0;
          })
          .filter((n) => n > 0);
        const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
        state.globalVariables.push({
          id: createId('gvar'),
          name: `variable_${nextNum}`,
          type: 'string',
          value: '',
        });
      });
    },

    removeGlobalVariable: (id) => {
      set((state) => {
        state.globalVariables = state.globalVariables.filter((v) => v.id !== id);
      });
    },

    updateGlobalVariable: (id, key, val) => {
      set((state) => {
        const variable = state.globalVariables.find((v) => v.id === id);
        if (variable) {
          (variable as any)[key] = val;
        }
      });
    },

    updatePageConfig: (id, updater) => {
      set((state) => {
        const page = state.pages[id];
        if (!page) return;
        if (!page.config) {
          page.config = getDefaultPageConfig();
        }
        updater(page.config);
      });
    },

    getOutput: () => {
      const { pageOrder, pages } = get();

      return {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        viewport: {
          width: AR_VIEWPORT_WIDTH,
          height: AR_VIEWPORT_HEIGHT,
        },
        pages: pageOrder
          .map((pageId) => pages[pageId])
          .filter(Boolean)
          .map((page) => ({
            id: page.id,
            title: page.title,
            x: page.x,
            y: page.y,
            nodes: page.craftState ?? {},
          })),
      };
    },

    exportData: () => JSON.stringify(get().getPersistedState(), null, 2),

    hydrateState: (persisted) => {
      const { pageOrder, pages, canvasScale, interactionMode, globalVariables } = persisted;

      // 校验数据合法性
      if (!pageOrder?.length || !pages) return;
      const valid = pageOrder.every((id) => pages[id]);
      if (!valid) return;

      set((state) => {
        state.pageOrder = pageOrder;
        state.pages = pages as PageEntityMap;
        state.canvasScale = canvasScale ?? 0.7;
        state.interactionMode = interactionMode ?? 'mouse';
        state.globalVariables = globalVariables ?? [];
        state.activePageId = pageOrder[0];
        state.activeNode = null;
        state._hydrated = true;
      });

      // 同步 interactionMode 到 sessionStorage
      try {
        sessionStorage.setItem(
          INTERACTION_MODE_KEY,
          persisted.interactionMode ?? 'mouse'
        );
      } catch {
        /* 静默 */
      }
    },

    resetState: () => {
      const initialState = createInitialDesignerData();

      set((state) => {
        state.pageOrder = initialState.pageOrder;
        state.pages = initialState.pages;
        state.activePageId = initialState.activePageId;
        state.canvasScale = initialState.canvasScale;
        state.interactionMode = initialState.interactionMode;
        state.activeNode = null;
        state._hydrated = true;
        state.globalVariables = initialState.globalVariables;
      });
    },

    getPersistedState: () => {
      const { pageOrder, pages, canvasScale, interactionMode, globalVariables } = get();
      return { pageOrder, pages, canvasScale, interactionMode, globalVariables };
    },
  }))
);

export const usePages = () =>
  useDesignerStore(
    useShallow((state) =>
      state.pageOrder.map((pageId) => state.pages[pageId]).filter(Boolean)
    )
  );
