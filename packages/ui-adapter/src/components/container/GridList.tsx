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
  OverflowMode,
  BlurConfig,
  TransformConfig,
  FourSideValue,
  FourCornerValue,
  GridListDataMode,
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

interface GridListProps {
  children?: React.ReactNode;
  title?: string;
  columnCount?: number;
  columnGap?: number;
  rowGap?: number;
  dataMode?: GridListDataMode;
  expression?: string;
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

export const GridList = ({
  children,
  title: _title = '这是一个标题',
  columnCount: _columnCount = 2,
  columnGap: _columnGap = 20,
  rowGap: _rowGap = 20,
  dataMode: _dataMode = 'expression',
  expression: _expression = '',
  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,
  widthMode = 'fill',
  heightMode = 'fit-content',
  width = 520,
  height = 560,
  sizeLimits = [],
  containerStyle,
  overflow = 'scroll',
  blur,
  transform,
}: GridListProps) => {
  const {
    id,
    connectors: { drag },
    hasChildren,
  } = useNode((node) => ({
    hasChildren: node.data.nodes.length > 0,
  }));

  const cs = containerStyle;
  const background = cs?.background ?? 'transparent';
  const borderRadius = cs ? resolveFourCorner(cs.borderRadius) : 0;
  const padding = cs ? resolveFourSide(cs.padding) : '12px';
  const margin = cs ? resolveFourSide(cs.margin) : undefined;

  const border = cs?.border
    ? `${cs.border.width}px ${cs.border.style} ${cs.border.color}`
    : undefined;

  const shadow = cs?.shadow
    ? `${cs.shadow.type === 'inset' ? 'inset ' : ''}${cs.shadow.x}px ${cs.shadow.y}px ${cs.shadow.blur}px ${cs.shadow.spread}px ${cs.shadow.color}`
    : undefined;

  const blurStyle: React.CSSProperties = {};
  if (blur && blur.value > 0) {
    if (blur.type === 'background') {
      blurStyle.backdropFilter = `blur(${blur.value}px)`;
    } else {
      blurStyle.filter = `blur(${blur.value}px)`;
    }
  }

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
  const resolvedHeight = resolveSize(heightMode, height, 560);

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

  const overflowStyle = getScrollableOverflowStyle(overflow);

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
        className="craft-grid-list"
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
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          ...blurStyle,
          ...positionStyle,
          ...limitStyle,
          ...overflowStyle,
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 120,
              fontSize: 12,
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          >
            拖拽组件到此宫格列表
          </span>
        )}
      </div>
    </Resizer>
  );
};

GridList.craft = {
  displayName: '宫格列表',
  props: {
    title: '这是一个标题',
    columnCount: 2,
    columnGap: 20,
    rowGap: 20,
    dataMode: 'expression',
    expression: '',
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fill',
    heightMode: 'fit-content',
    width: 520,
    height: 560,
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
