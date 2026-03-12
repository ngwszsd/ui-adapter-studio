import React from 'react';
import { useNode } from '@craftjs/core';
import { Resizer } from '../shared/Resizer';
import { resolveSize } from '../../utils/size';
import type {
  ImageSourceType,
  ImageFillMode,
  PositionType,
  SizeMode,
  SizeLimitItem,
  ContainerStyleConfig,
  TransformConfig,
  FourSideValue,
  FourCornerValue,
  BlurConfig,
} from '../../types';

/* ---- 工具函数 ---- */

const resolveFourSide = (v: FourSideValue | undefined): string => {
  if (v == null) return '0px';
  if (typeof v === 'number') return `${v}px`;
  return `${v.top}px ${v.right}px ${v.bottom}px ${v.left}px`;
};

const resolveFourCorner = (v: FourCornerValue | undefined): string | number => {
  if (v == null) return 8;
  if (typeof v === 'number') return v;
  return `${v.tl}px ${v.tr}px ${v.br}px ${v.bl}px`;
};

const FILL_MODE_CSS: Record<ImageFillMode, React.CSSProperties['objectFit']> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
};

/* ---- Props ---- */

interface ImageDisplayProps {
  sourceType?: ImageSourceType;
  imageUrl?: string | null;
  bindingField?: string;
  fillMode?: ImageFillMode;
  forcePlaceholder?: boolean;
  placeholderMode?: 'image' | 'number';
  placeholderText?: string;

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
  blur?: BlurConfig | null;
  transform?: TransformConfig;
}

export const ImageDisplay = ({
  sourceType = 'local',
  imageUrl = null,
  bindingField = '',
  fillMode = 'cover',
  forcePlaceholder = false,
  placeholderMode = 'image',
  placeholderText = '',

  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,

  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 200,
  height = 120,
  sizeLimits = [],

  containerStyle,

  blur,

  transform,
}: ImageDisplayProps) => {
  const {
    connectors: { drag },
  } = useNode();

  const cs = containerStyle;
  const bg = cs?.background ?? 'transparent';
  const borderRadius = cs ? resolveFourCorner(cs.borderRadius) : 8;
  const padding = cs ? resolveFourSide(cs.padding) : '0px';
  const margin = cs ? resolveFourSide(cs.margin) : undefined;

  const borderStr = cs?.border
    ? `${cs.border.width}px ${cs.border.style} ${cs.border.color}`
    : undefined;

  const shadowStr = cs?.shadow
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
  for (const lim of sizeLimits) {
    limitStyle[lim.type] = lim.value;
  }

  const positionStyle: React.CSSProperties = {
    position: positionType,
  };
  if (positionType !== 'relative') {
    if (positionTop != null) positionStyle.top = positionTop;
    if (positionRight != null) positionStyle.right = positionRight;
    if (positionBottom != null) positionStyle.bottom = positionBottom;
    if (positionLeft != null) positionStyle.left = positionLeft;
  }

  const resolvedWidth = resolveSize(widthMode, width, 200);
  const resolvedHeight = resolveSize(heightMode, height, 120);

  const t = transform;
  const hasTransform =
    t &&
    (t.scale !== 100 ||
      t.rotate !== 0 ||
      t.translateX !== 0 ||
      t.translateY !== 0 ||
      t.skewX !== 0 ||
      t.skewY !== 0);
  const transformStr = hasTransform
    ? `scale(${t.scale / 100}) rotate(${t.rotate}deg) translate(${t.translateX}%, ${t.translateY}%) skew(${t.skewX}deg, ${t.skewY}deg)`
    : undefined;

  const displayUrl = sourceType === 'binding' ? (bindingField || null) : imageUrl;
  const showNumberPlaceholder = forcePlaceholder && placeholderMode === 'number';
  const hasImage = !!displayUrl && !forcePlaceholder;

  return (
    <Resizer width={resolvedWidth} height={resolvedHeight}>
      <div
        ref={(ref: HTMLDivElement | null) => {
          if (ref) drag(ref);
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: bg,
          borderRadius,
          padding,
          margin,
          border: borderStr,
          boxShadow: shadowStr,
          cursor: 'move',
          boxSizing: 'border-box',
          transform: transformStr,
          ...blurStyle,
          ...positionStyle,
          ...limitStyle,
        }}
      >
        {hasImage ? (
          <img
            src={displayUrl!}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: FILL_MODE_CSS[fillMode],
              objectPosition: 'center',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        ) : showNumberPlaceholder ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1e293b',
              borderRadius: 4,
              color: '#ffffff',
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {placeholderText || '1'}
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: '#1e293b',
              borderRadius: 4,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: 11, color: '#ffffff' }}>
              {sourceType === 'binding' ? `绑定: ${bindingField || '未设置'}` : '暂无图片'}
            </span>
          </div>
        )}
      </div>
    </Resizer>
  );
};

ImageDisplay.craft = {
  displayName: '图片',
  props: {
    sourceType: 'local',
    imageUrl: null,
    bindingField: '',
    fillMode: 'cover',
    forcePlaceholder: false,
    placeholderMode: 'image',
    placeholderText: '',
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 200,
    height: 120,
    sizeLimits: [],
    containerStyle: null,
    blur: null,
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
  },
};
