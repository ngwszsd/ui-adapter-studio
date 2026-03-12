import React from 'react';
import { useNode } from '@craftjs/core';
import type {
  ContainerStyleConfig,
  FourCornerValue,
  FourSideValue,
  GridPosition,
  LayoutConfig,
  BorderValue,
  ShadowValue,
} from '../../types';
import {
  useDesignerStore,
  getDefaultPageConfig,
} from '../../store/useDesignerStore';
import { usePageId } from '../../store/pageIdContext';

/* ---- 布局配置 → CSS 映射 ---- */

const VERTICAL_MAP: Record<'top' | 'center' | 'bottom', string> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
};

const HORIZONTAL_MAP: Record<'left' | 'center' | 'right', string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

const parseGridPosition = (pos: GridPosition) => {
  const [v, h] = pos.split('-') as [
    'top' | 'center' | 'bottom',
    'left' | 'center' | 'right' | undefined,
  ];
  return {
    vertical: VERTICAL_MAP[v] ?? 'flex-start',
    horizontal: HORIZONTAL_MAP[h ?? 'center'] ?? 'center',
  };
};

const DEFAULT_LAYOUT = getDefaultPageConfig().layout!;
const DEFAULT_CONTAINER_STYLE = getDefaultPageConfig().containerStyle!;

/* ---- 容器样式 → CSS 映射 ---- */

const resolveFourSide = (v: FourSideValue): string | number =>
  typeof v === 'number'
    ? v
    : `${v.top}px ${v.right}px ${v.bottom}px ${v.left}px`;

const resolveFourCorner = (v: FourCornerValue): string | number =>
  typeof v === 'number' ? v : `${v.tl}px ${v.tr}px ${v.br}px ${v.bl}px`;

const resolveBorder = (v: BorderValue | null): string | undefined =>
  v ? `${v.width}px ${v.style} ${v.color}` : undefined;

const resolveShadow = (v: ShadowValue | null): string | undefined =>
  v
    ? `${v.type === 'inset' ? 'inset ' : ''}${v.x}px ${v.y}px ${v.blur}px ${v.spread}px ${v.color}`
    : undefined;

const getLayoutStyles = (layout: LayoutConfig): React.CSSProperties => {
  const isRow =
    layout.arrangement === 'horizontal' || layout.arrangement === 'wrap';

  const styles: React.CSSProperties = {
    display: 'flex',
    flexDirection: isRow ? 'row' : 'column',
    flexWrap: layout.arrangement === 'wrap' ? 'wrap' : 'nowrap',
  };

  if (layout.spacingMode === 'fixed') {
    styles.gap = layout.spacing;

    const { vertical, horizontal } = parseGridPosition(layout.distribution);
    if (isRow) {
      styles.justifyContent = horizontal;
      styles.alignItems = vertical;
    } else {
      styles.justifyContent = vertical;
      styles.alignItems = horizontal;
    }
  } else {
    // 自动间距：主轴 space-between，交叉轴由 columnDistribution 控制
    styles.justifyContent = 'space-between';

    const crossAlign =
      HORIZONTAL_MAP[layout.columnDistribution] ?? 'flex-start';
    styles.alignItems = crossAlign;
  }

  return styles;
};

interface StageRootProps {
  children?: React.ReactNode;
  background?: string;
  padding?: number;
}

export const StageRoot = ({ children }: StageRootProps) => {
  const {
    id,
    connectors: { connect },
  } = useNode();

  const pageId = usePageId();
  const layout = useDesignerStore(
    (s) => (pageId ? s.pages[pageId]?.config?.layout : null) ?? DEFAULT_LAYOUT
  );
  const cs = useDesignerStore(
    (s) =>
      (pageId ? s.pages[pageId]?.config?.containerStyle : null) ??
      DEFAULT_CONTAINER_STYLE
  );
  const layoutStyles = getLayoutStyles(layout);

  return (
    <div
      data-canvas-node-id={id}
      data-drop-container-id={id}
      data-scrollable
      data-scroll-lock-id={pageId ? `page:${pageId}:stage-root` : undefined}
      ref={(ref: HTMLDivElement | null) => {
        if (ref) connect(ref);
      }}
      style={{
        width: '100%',
        height: '100%',
        padding: resolveFourSide(cs.padding),
        margin: resolveFourSide(cs.margin),
        background: cs.background,
        borderRadius: resolveFourCorner(cs.borderRadius),
        border: resolveBorder(cs.border ?? null),
        boxShadow: resolveShadow(cs.shadow ?? null),
        boxSizing: 'border-box',
        overflow: 'auto',
        scrollbarWidth: 'none',
        ...layoutStyles,
      }}
    >
      {children}
    </div>
  );
};

StageRoot.craft = {
  displayName: '页面根容器',
  props: {
    background: '#0f172a',
    padding: 12,
  },
  rules: {
    canDrag: () => false,
    canMoveIn: () => true,
  },
};
