import React from 'react';
import { useNode } from '@craftjs/core';
import { Resizer } from '../shared/Resizer';
import { resolveSize } from '../../utils/size';
import { getScrollableOverflowStyle, useBidirectionalWheelScroll } from '../../utils/scroll';
import type {
  PositionType,
  SizeMode,
  SizeLimitItem,
  ContainerStyleConfig,
  LayoutConfig,
  OverflowMode,
  BlurConfig,
  TransformConfig,
  FourSideValue,
  FourCornerValue,
  GridPosition,
} from '../../types';

/* ---- 工具函数 ---- */

const resolveFourSide = (v: FourSideValue | undefined): string => {
  if (v == null) return '0px';
  if (typeof v === 'number') return `${v}px`;
  return `${v.top}px ${v.right}px ${v.bottom}px ${v.left}px`;
};

const resolveFourCorner = (v: FourCornerValue | undefined): string | number => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return `${v.tl}px ${v.tr}px ${v.br}px ${v.bl}px`;
};

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

const getLayoutStyles = (layout: LayoutConfig): React.CSSProperties => {
  const isGridWrap = layout.arrangement === 'wrap' && (layout.columnCount ?? 0) > 0;

  if (isGridWrap) {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.max(1, Math.round(layout.columnCount ?? 1))}, minmax(0, 1fr))`,
      columnGap: layout.columnGap ?? layout.spacing,
      rowGap: layout.rowGap ?? layout.spacing,
      alignItems: 'start',
    };
  }

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
    styles.justifyContent = 'space-between';
    const crossAlign =
      HORIZONTAL_MAP[layout.columnDistribution] ?? 'flex-start';
    styles.alignItems = crossAlign;
  }

  return styles;
};

/* ---- Props ---- */

interface ContainerProps {
  children?: React.ReactNode;

  // 布局
  layout?: LayoutConfig;

  // 位置
  positionType?: PositionType;
  positionTop?: number;
  positionRight?: number;
  positionBottom?: number;
  positionLeft?: number;

  // 尺寸
  widthMode?: SizeMode;
  heightMode?: SizeMode;
  width?: number;
  height?: number;
  sizeLimits?: SizeLimitItem[];

  // 容器样式
  containerStyle?: ContainerStyleConfig | null;

  // 溢出
  overflow?: OverflowMode;

  // 模糊
  blur?: BlurConfig | null;

  // 变换
  transform?: TransformConfig;

  // Flex 子项收缩
  flexShrink?: number;
}

const DEFAULT_LAYOUT: LayoutConfig = {
  arrangement: 'vertical',
  spacingMode: 'fixed',
  spacing: 8,
  distribution: 'top-left',
  columnDistribution: 'left',
};

export const Container = ({
  children,

  layout = DEFAULT_LAYOUT,

  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,

  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 350,
  height = 180,
  sizeLimits = [],

  containerStyle,

  overflow = 'scroll',

  blur,

  transform,
  flexShrink,
}: ContainerProps) => {
  const {
    id,
    connectors: { drag },
    hasChildren,
  } = useNode((node) => ({
    hasChildren: node.data.nodes.length > 0,
  }));

  const cs = containerStyle;
  const bg = cs?.background ?? 'transparent';
  const borderRadius = cs ? resolveFourCorner(cs.borderRadius) : 0;
  const padding = cs ? resolveFourSide(cs.padding) : '12px';
  const margin = cs ? resolveFourSide(cs.margin) : undefined;

  const borderStr = cs?.border
    ? `${cs.border.width}px ${cs.border.style} ${cs.border.color}`
    : undefined;

  const shadowStr = cs?.shadow
    ? `${cs.shadow.type === 'inset' ? 'inset ' : ''}${cs.shadow.x}px ${cs.shadow.y}px ${cs.shadow.blur}px ${cs.shadow.spread}px ${cs.shadow.color}`
    : undefined;

  // Size limits
  const limitStyle: React.CSSProperties = {};
  for (const lim of sizeLimits) {
    limitStyle[lim.type] = lim.value;
  }

  // Position
  const positionStyle: React.CSSProperties = {
    position: positionType,
  };
  if (positionType !== 'relative') {
    if (positionTop != null) positionStyle.top = positionTop;
    if (positionRight != null) positionStyle.right = positionRight;
    if (positionBottom != null) positionStyle.bottom = positionBottom;
    if (positionLeft != null) positionStyle.left = positionLeft;
  }

  const resolvedWidth = resolveSize(widthMode, width, 350);
  const resolvedHeight = resolveSize(heightMode, height, 180);

  // Transform
  const t = transform;
  const hasTransform =
    t && (t.scale !== 100 || t.rotate !== 0 || t.translateX !== 0 || t.translateY !== 0 || t.skewX !== 0 || t.skewY !== 0);
  const transformStr = hasTransform
    ? `scale(${t.scale / 100}) rotate(${t.rotate}deg) translate(${t.translateX}%, ${t.translateY}%) skew(${t.skewX}deg, ${t.skewY}deg)`
    : undefined;

  // Blur
  const filterStr = blur ? `blur(${blur.value}px)` : undefined;

  // Overflow
  const isHorizontalArrangement = layout.arrangement === 'horizontal';
  const overflowStyle = getScrollableOverflowStyle(overflow);

  // Layout
  const layoutStyles = getLayoutStyles(layout);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  useBidirectionalWheelScroll(rootRef, overflow);

  return (
    <Resizer width={resolvedWidth} height={resolvedHeight} wrapperStyle={{  }}>
      <div
        ref={rootRef}
        data-canvas-node-id={id}
        data-drop-container-id={id}
        data-scrollable={overflow === 'scroll' ? true : undefined}
        data-scroll-lock-id={overflow === 'scroll' ? `node:${id}:root` : undefined}
        className="craft-container"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: bg,
          borderRadius,
          padding,
          margin,
          border: borderStr,
          boxShadow: shadowStr,
          boxSizing: 'border-box',
          transform: transformStr,
          filter: filterStr,
          flexShrink,
          ...positionStyle,
          ...limitStyle,
          ...overflowStyle,
          ...layoutStyles,
        }}
      >
        {/* 拖拽层：绝对定位在子组件下方。
            作为兄弟元素而非父元素，子组件的事件不会冒泡到此处，
            避免 Craft.js 的 drag connector 抢走子组件的选中状态。 */}
        <div
          ref={(ref: HTMLDivElement | null) => {
            if (ref) drag(ref);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'move',
          }}
        />
        {children}
        {!hasChildren && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          >
            拖拽组件到此容器
          </span>
        )}
      </div>
    </Resizer>
  );
};

Container.craft = {
  displayName: '容器',
  props: {
    layout: {
      arrangement: 'vertical',
      spacingMode: 'fixed',
      spacing: 8,
      distribution: 'top-left',
      columnDistribution: 'left',
    },
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 350,
    height: 180,
    sizeLimits: [],
    containerStyle: null,
    overflow: 'scroll',
    blur: null,
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
    flexShrink: undefined,
  },
  rules: {
    canMoveIn: () => true,
  },
};
