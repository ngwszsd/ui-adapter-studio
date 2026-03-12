import { create } from 'zustand';

interface LayerPortalState {
  containerEl: HTMLDivElement | null;
  setContainerEl: (el: HTMLDivElement | null) => void;
}

export const useLayerPortalStore = create<LayerPortalState>((set) => ({
  containerEl: null,
  setContainerEl: (el) => set({ containerEl: el }),
}));
