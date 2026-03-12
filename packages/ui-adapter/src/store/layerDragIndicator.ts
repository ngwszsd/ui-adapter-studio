import { create } from 'zustand';

export type LayerIndicatorPosition = 'before' | 'after';

interface LayerDragIndicatorState {
  draggingNodeId: string | null;
  targetNodeId: string | null;
  position: LayerIndicatorPosition | null;
  startDrag: (nodeId: string) => void;
  updateIndicator: (targetNodeId: string, position: LayerIndicatorPosition) => void;
  clear: () => void;
}

export const useLayerDragIndicatorStore = create<LayerDragIndicatorState>((set) => ({
  draggingNodeId: null,
  targetNodeId: null,
  position: null,
  startDrag: (draggingNodeId) =>
    set({
      draggingNodeId,
      targetNodeId: null,
      position: null,
    }),
  updateIndicator: (targetNodeId, position) =>
    set((state) => {
      if (!state.draggingNodeId) return state;
      return { targetNodeId, position };
    }),
  clear: () =>
    set({
      draggingNodeId: null,
      targetNodeId: null,
      position: null,
    }),
}));
