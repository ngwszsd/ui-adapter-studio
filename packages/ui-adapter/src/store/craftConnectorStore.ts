import type React from 'react';
import { create } from 'zustand';

type CraftCreateConnector = (
  el: HTMLElement,
  userElement: React.ReactElement,
) => void;

interface CraftConnectorState {
  /** 当前活动页面编辑器的 create connector，供 Toolbox 使用 */
  create: CraftCreateConnector | null;
  setCreate: (fn: CraftCreateConnector | null) => void;
}

export const useCraftConnectorStore = create<CraftConnectorState>((set) => ({
  create: null,
  setCreate: (fn) => set({ create: fn }),
}));
