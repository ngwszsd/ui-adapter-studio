import React from 'react';
import { useNode } from '@craftjs/core';
import { Resizer } from '../shared/Resizer';
import { resolveSize } from '../../utils/size';
import type {
  TextStyleMode,
  TextAlign,
  TextVerticalAlign,
  TextShadowConfig,
  OverflowMode,
  PositionType,
  SizeMode,
  SizeLimitItem,
  ContainerStyleConfig,
  TransformConfig,
  FourSideValue,
  FourCornerValue,
} from '../../types';

/* ---- 预设样式映射 ---- */

const PRESET_MAP: Record<string, { fontSize: number; fontWeight: number }> = {
  '36': { fontSize: 36, fontWeight: 700 },
  '32': { fontSize: 32, fontWeight: 700 },
  '28': { fontSize: 28, fontWeight: 600 },
  '24': { fontSize: 24, fontWeight: 500 },
  '20': { fontSize: 20, fontWeight: 400 },
};

/* ---- 工具函数 ---- */

const resolveFourSide = (v: FourSideValue | undefined): string => {
  if (v == null) return '6px 8px';
  if (typeof v === 'number') return `${v}px`;
  return `${v.top}px ${v.right}px ${v.bottom}px ${v.left}px`;
};

const resolveFourCorner = (v: FourCornerValue | undefined): string | number => {
  if (v == null) return 8;
  if (typeof v === 'number') return v;
  return `${v.tl}px ${v.tr}px ${v.br}px ${v.bl}px`;
};

const VERTICAL_ALIGN_MAP: Record<TextVerticalAlign, string> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
};

/* ---- Props ---- */

interface TextProps {
  // 常用设置
  text?: string;
  styleMode?: TextStyleMode;
  presetStyle?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: TextAlign;
  verticalAlign?: TextVerticalAlign;
  color?: string | null;
  textShadow?: TextShadowConfig | null;
  maxLines?: number | null;

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
  overflow?: OverflowMode;

  // 变换
  transform?: TransformConfig;
}

export const Text = ({
  text = 'Text',
  styleMode = 'preset',
  presetStyle = '22',
  fontSize = 22,
  fontWeight = 500,
  letterSpacing = 0,
  lineHeight,
  textAlign = 'left',
  verticalAlign = 'top',
  color = null,
  textShadow,
  maxLines,

  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,

  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 160,
  height = 44,
  sizeLimits = [],

  containerStyle,
  overflow = 'visible',

  transform,
}: TextProps) => {
  const {
    connectors: { drag },
  } = useNode();

  // Resolve font from preset or custom
  const preset = styleMode === 'preset' ? PRESET_MAP[presetStyle] : null;
  const resolvedFontSize = preset?.fontSize ?? fontSize;
  const resolvedFontWeight = preset?.fontWeight ?? fontWeight;

  const cs = containerStyle;
  const bg = cs?.background ?? 'transparent';
  const borderRadius = cs ? resolveFourCorner(cs.borderRadius) : 8;
  const padding = cs ? resolveFourSide(cs.padding) : '6px 8px';
  const margin = cs ? resolveFourSide(cs.margin) : undefined;

  const borderStr = cs?.border
    ? `${cs.border.width}px ${cs.border.style} ${cs.border.color}`
    : undefined;

  const shadowStr = cs?.shadow
    ? `${cs.shadow.type === 'inset' ? 'inset ' : ''}${cs.shadow.x}px ${cs.shadow.y}px ${cs.shadow.blur}px ${cs.shadow.spread}px ${cs.shadow.color}`
    : undefined;

  const textShadowStr = textShadow
    ? `${textShadow.x}px ${textShadow.y}px ${textShadow.blur}px ${textShadow.color}`
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

  const resolvedWidth = resolveSize(widthMode, width, 160);
  const resolvedHeight = resolveSize(heightMode, height, 44);

  // Transform
  const t = transform;
  const hasTransform =
    t && (t.scale !== 100 || t.rotate !== 0 || t.translateX !== 0 || t.translateY !== 0 || t.skewX !== 0 || t.skewY !== 0);
  const transformStr = hasTransform
    ? `scale(${t.scale / 100}) rotate(${t.rotate}deg) translate(${t.translateX}%, ${t.translateY}%) skew(${t.skewX}deg, ${t.skewY}deg)`
    : undefined;

  // Max lines (line clamp)
  const clampStyle: React.CSSProperties =
    maxLines != null && maxLines > 0
      ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {};

  return (
    <Resizer width={resolvedWidth} height={resolvedHeight}>
      <div
        ref={(ref: HTMLDivElement | null) => {
          if (ref) drag(ref);
        }}
        style={{
          width: '100%',
          height: '100%',
          fontSize: resolvedFontSize,
          fontWeight: resolvedFontWeight,
          letterSpacing: letterSpacing !== 0 ? letterSpacing : undefined,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
          textAlign,
          color: color ?? undefined,
          padding,
          margin,
          backgroundColor: bg,
          borderRadius,
          border: borderStr,
          boxShadow: shadowStr,
          textShadow: textShadowStr,
          cursor: 'move',
          display: 'flex',
          alignItems: VERTICAL_ALIGN_MAP[verticalAlign],
          overflow,
          boxSizing: 'border-box',
          transform: transformStr,
          ...positionStyle,
          ...limitStyle,
        }}
      >
        <span style={{ width: '100%', whiteSpace: 'pre-wrap', ...clampStyle }}>{text}</span>
      </div>
    </Resizer>
  );
};

Text.craft = {
  props: {
    text: 'Text',
    styleMode: 'preset',
    presetStyle: '22',
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: 0,
    lineHeight: null,
    textAlign: 'left',
    verticalAlign: 'top',
    color: null,
    textShadow: null,
    maxLines: null,
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 160,
    height: 44,
    sizeLimits: [],
    containerStyle: null,
    overflow: 'visible',
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
  },
};
