import React from 'react';
import { useNode } from '@craftjs/core';
import { Video } from 'lucide-react';
import { Resizer } from '../shared/Resizer';
import { resolveSize } from '../../utils/size';
import type {
  PositionType,
  SizeMode,
  SizeLimitItem,
  ContainerStyleConfig,
  TransformConfig,
  FourSideValue,
  FourCornerValue,
} from '../../types';

/* ---- 工具函数 ---- */

const resolveFourSide = (v: FourSideValue | undefined): string => {
  if (v == null) return '12px';
  if (typeof v === 'number') return `${v}px`;
  return `${v.top}px ${v.right}px ${v.bottom}px ${v.left}px`;
};

const resolveFourCorner = (v: FourCornerValue | undefined): string | number => {
  if (v == null) return 8;
  if (typeof v === 'number') return v;
  return `${v.tl}px ${v.tr}px ${v.br}px ${v.bl}px`;
};

/* ---- Props ---- */

interface VideoRecorderProps {
  // 常用设置
  maxDuration?: number;

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

  // 变换
  transform?: TransformConfig;
}

export const VideoRecorder = ({
  maxDuration: _maxDuration = 60,

  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,

  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 530,
  height = 100,
  sizeLimits = [],

  containerStyle,

  transform,
}: VideoRecorderProps) => {
  const {
    connectors: { drag },
  } = useNode();

  const cs = containerStyle;
  const bg = cs?.background ?? 'transparent';
  const borderRadius = cs ? resolveFourCorner(cs.borderRadius) : 8;
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

  const resolvedWidth = resolveSize(widthMode, width, 530);
  const resolvedHeight = resolveSize(heightMode, height, 100);

  // Transform
  const t = transform;
  const hasTransform =
    t && (t.scale !== 100 || t.rotate !== 0 || t.translateX !== 0 || t.translateY !== 0 || t.skewX !== 0 || t.skewY !== 0);
  const transformStr = hasTransform
    ? `scale(${t.scale / 100}) rotate(${t.rotate}deg) translate(${t.translateX}%, ${t.translateY}%) skew(${t.skewX}deg, ${t.skewY}deg)`
    : undefined;

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
          flexDirection: 'column',
          gap: 12,
          backgroundColor: bg,
          borderRadius,
          padding,
          margin,
          border: borderStr,
          boxShadow: shadowStr,
          cursor: 'move',
          boxSizing: 'border-box',
          transform: transformStr,
          ...positionStyle,
          ...limitStyle,
        }}
      >
        {/* 标题 */}
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#ffffff',
          }}
        >
          请录制视频
        </span>

        {/* 录制按钮 */}
        <div
          style={{
            width: '100%',
            height: 40,
            borderRadius: 8,
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Video size={16} color="#ffffff" />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#ffffff' }}>
            开始录制
          </span>
        </div>
      </div>
    </Resizer>
  );
};

VideoRecorder.craft = {
  displayName: '录像',
  props: {
    maxDuration: 60,
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 530,
    height: 100,
    sizeLimits: [],
    containerStyle: null,
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
  },
};
