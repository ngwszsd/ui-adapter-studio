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
  VerticalListDataMode,
} from '../../types';

const resolveFourSide = (value: FourSideValue | undefined): string => {
  if (value == null) return '0px';
  if (typeof value === 'number') return `${value}px`;
  return `${value.top}px ${value.right}px ${value.bottom}px ${value.left}px`;
};

const resolveFourCorner = (value: FourCornerValue | undefined): string | number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return `${value.tl}px ${value.tr}px ${value.br}px ${value.bl}px`;
};

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

const parseGridPosition = (position: GridPosition) => {
  const [vertical, horizontal] = position.split('-') as [
    'top' | 'center' | 'bottom',
    'left' | 'center' | 'right' | undefined,
  ];

  return {
    vertical: VERTICAL_MAP[vertical] ?? 'flex-start',
    horizontal: HORIZONTAL_MAP[horizontal ?? 'center'] ?? 'center',
  };
};

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
    styles.justifyContent = 'space-between';
    styles.alignItems = HORIZONTAL_MAP[layout.columnDistribution] ?? 'flex-start';
  }

  return styles;
};

interface VerticalListProps {
  children?: React.ReactNode;
  title?: string;
  itemSpacing?: number;
  showItemNumber?: boolean;
  dataMode?: VerticalListDataMode;
  expression?: string;
  layout?: LayoutConfig;
  positionType?: PositionType;
  positionTop?: number;
  positionRight?: number;
  positionBottom?: number;
  positionLeft?: number;
  widthMode?: SizeMode;
  heightMode?: SizeMode;
  width?: number;
  height?: number;
  sizeLimits?: SizeLimitItem[];
  containerStyle?: ContainerStyleConfig | null;
  overflow?: OverflowMode;
  blur?: BlurConfig | null;
  transform?: TransformConfig;
}

const DEFAULT_LAYOUT: LayoutConfig = {
  arrangement: 'vertical',
  spacingMode: 'fixed',
  spacing: 12,
  distribution: 'top-left',
  columnDistribution: 'left',
};

export const VerticalList = ({
  children,
  title: _title = '列表标题',
  itemSpacing: _itemSpacing = 12,
  dataMode: _dataMode = 'expression',
  expression: _expression = '',
  layout = DEFAULT_LAYOUT,
  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,
  widthMode = 'fill',
  heightMode = 'fit-content',
  width = 520,
  height = 360,
  sizeLimits = [],
  containerStyle,
  overflow = 'scroll',
  blur,
  transform,
}: VerticalListProps) => {
  const {
    id,
    connectors: { drag },
    hasChildren,
  } = useNode((node) => ({
    hasChildren: node.data.nodes.length > 0,
  }));

  const containerStyleConfig = containerStyle;
  const background = containerStyleConfig?.background ?? 'transparent';
  const borderRadius = containerStyleConfig
    ? resolveFourCorner(containerStyleConfig.borderRadius)
    : 0;
  const padding = containerStyleConfig
    ? resolveFourSide(containerStyleConfig.padding)
    : '12px';
  const margin = containerStyleConfig
    ? resolveFourSide(containerStyleConfig.margin)
    : undefined;

  const border = containerStyleConfig?.border
    ? `${containerStyleConfig.border.width}px ${containerStyleConfig.border.style} ${containerStyleConfig.border.color}`
    : undefined;

  const shadow = containerStyleConfig?.shadow
    ? `${containerStyleConfig.shadow.type === 'inset' ? 'inset ' : ''}${containerStyleConfig.shadow.x}px ${containerStyleConfig.shadow.y}px ${containerStyleConfig.shadow.blur}px ${containerStyleConfig.shadow.spread}px ${containerStyleConfig.shadow.color}`
    : undefined;

  const limitStyle: React.CSSProperties = {};
  for (const limit of sizeLimits) {
    limitStyle[limit.type] = limit.value;
  }

  const positionStyle: React.CSSProperties = { position: positionType };
  if (positionType !== 'relative') {
    if (positionTop != null) positionStyle.top = positionTop;
    if (positionRight != null) positionStyle.right = positionRight;
    if (positionBottom != null) positionStyle.bottom = positionBottom;
    if (positionLeft != null) positionStyle.left = positionLeft;
  }

  const resolvedWidth = resolveSize(widthMode, width, 520);
  const resolvedHeight = resolveSize(heightMode, height, 360);

  const currentTransform = transform;
  const hasTransform =
    currentTransform &&
    (currentTransform.scale !== 100 ||
      currentTransform.rotate !== 0 ||
      currentTransform.translateX !== 0 ||
      currentTransform.translateY !== 0 ||
      currentTransform.skewX !== 0 ||
      currentTransform.skewY !== 0);
  const transformString = hasTransform
    ? `scale(${currentTransform.scale / 100}) rotate(${currentTransform.rotate}deg) translate(${currentTransform.translateX}%, ${currentTransform.translateY}%) skew(${currentTransform.skewX}deg, ${currentTransform.skewY}deg)`
    : undefined;

  const filterString = blur ? `blur(${blur.value}px)` : undefined;

  const overflowStyle = getScrollableOverflowStyle(overflow);

  const layoutStyles = getLayoutStyles(layout);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  useBidirectionalWheelScroll(rootRef, overflow);

  return (
    <Resizer width={resolvedWidth} height={resolvedHeight} wrapperStyle={{ margin: '0 auto' }}>
      <div
        ref={rootRef}
        data-canvas-node-id={id}
        data-drop-container-id={id}
        data-scrollable={overflow === 'scroll' ? true : undefined}
        data-scroll-lock-id={overflow === 'scroll' ? `node:${id}:root` : undefined}
        className="craft-vertical-list"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: background,
          borderRadius,
          padding,
          margin,
          border,
          boxShadow: shadow,
          boxSizing: 'border-box',
          transform: transformString,
          filter: filterString,
          ...positionStyle,
          ...limitStyle,
          ...overflowStyle,
          ...layoutStyles,
        }}
      >
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
            拖拽组件到此纵向列表
          </span>
        )}
      </div>
    </Resizer>
  );
};

VerticalList.craft = {
  displayName: '纵向列表',
  props: {
    title: '列表标题',
    itemSpacing: 12,
    showItemNumber: false,
    dataMode: 'expression',
    expression: '',
    layout: {
      arrangement: 'vertical',
      spacingMode: 'fixed',
      spacing: 12,
      distribution: 'top-left',
      columnDistribution: 'left',
    },
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fill',
    heightMode: 'fit-content',
    width: 520,
    height: 360,
    sizeLimits: [],
    containerStyle: null,
    overflow: 'scroll',
    blur: null,
    transform: {
      scale: 100,
      rotate: 0,
      translateX: 0,
      translateY: 0,
      skewX: 0,
      skewY: 0,
    },
  },
  rules: {
    canMoveIn: () => true,
  },
};
