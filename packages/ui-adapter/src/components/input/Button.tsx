import React from 'react';
import { useNode } from '@craftjs/core';
import { Resizer } from '../shared/Resizer';
import { getIconComponent } from '../shared/iconRegistry';
import { resolveSize } from '../../utils/size';
import type {
  ButtonVariant,
  PositionType,
  SizeMode,
  SizeLimitItem,
  ContainerStyleConfig,
  TransformConfig,
  FourSideValue,
  FourCornerValue,
} from '../../types';

const VARIANT_STYLES: Record<
  ButtonVariant,
  { bg: string; text: string; border: string }
> = {
  primary: { bg: '#2563eb', text: '#ffffff', border: 'transparent' },
  secondary: { bg: '#475569', text: '#ffffff', border: 'transparent' },
  outline: { bg: 'transparent', text: '#334155', border: '#cbd5e1' },
  warning: { bg: '#dc2626', text: '#ffffff', border: 'transparent' },
};

const resolveFourSide = (v: FourSideValue | undefined): string => {
  if (v == null) return '8px 16px';
  if (typeof v === 'number') return `${v}px`;
  return `${v.top}px ${v.right}px ${v.bottom}px ${v.left}px`;
};

const resolveFourCorner = (v: FourCornerValue | undefined): string | number => {
  if (v == null) return 8;
  if (typeof v === 'number') return v;
  return `${v.tl}px ${v.tr}px ${v.br}px ${v.bl}px`;
};

interface ButtonProps {
  // 常用设置
  variant?: ButtonVariant;
  showText?: boolean;
  children?: React.ReactNode;
  showIcon?: boolean;
  iconName?: string;
  iconColor?: string;

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
  containerStyle?: ContainerStyleConfig;

  // 变换
  transform?: TransformConfig;
}

export const Button = ({
  variant = 'primary',
  showText = true,
  children = '点击操作',
  showIcon = false,
  iconName = '',
  iconColor = '#ffffff',
  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,
  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 132,
  height = 42,
  sizeLimits = [],
  containerStyle,
  transform,
}: ButtonProps) => {
  const {
    connectors: { drag },
  } = useNode();

  const vs = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
  const cs = containerStyle;

  const bg = cs?.background ?? vs.bg;
  const borderRadius = cs ? resolveFourCorner(cs.borderRadius) : 8;
  const padding = cs ? resolveFourSide(cs.padding) : '8px 16px';
  const margin = cs ? resolveFourSide(cs.margin) : undefined;

  const borderStr =
    cs?.border
      ? `${cs.border.width}px ${cs.border.style} ${cs.border.color}`
      : variant === 'outline'
        ? `1px solid ${vs.border}`
        : '1px solid rgba(255,255,255,0.24)';

  const shadowStr = cs?.shadow
    ? `${cs.shadow.type === 'inset' ? 'inset ' : ''}${cs.shadow.x}px ${cs.shadow.y}px ${cs.shadow.blur}px ${cs.shadow.spread}px ${cs.shadow.color}`
    : '0 1px 2px rgba(2,6,23,0.2)';

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

  const resolvedWidth = resolveSize(widthMode, width, 132);
  const resolvedHeight = resolveSize(heightMode, height, 42);

  const IconComp = showIcon && iconName ? getIconComponent(iconName) : null;

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
          padding,
          margin,
          backgroundColor: bg,
          color: variant === 'outline' ? vs.text : '#fff',
          borderRadius,
          border: borderStr,
          cursor: 'move',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          boxShadow: shadowStr,
          boxSizing: 'border-box',
          transform: transformStr,
          ...positionStyle,
          ...limitStyle,
        }}
      >
        {IconComp && <IconComp size={14} color={iconColor} />}
        {showText && (children || '点击操作')}
      </div>
    </Resizer>
  );
};

Button.craft = {
  props: {
    variant: 'primary',
    showText: true,
    children: '点击操作',
    showIcon: false,
    iconName: '',
    iconColor: '#ffffff',
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 132,
    height: 42,
    sizeLimits: [],
    containerStyle: null,
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
  },
};
