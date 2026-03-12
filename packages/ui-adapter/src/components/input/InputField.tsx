import React from 'react';
import { useNode } from '@craftjs/core';
import { Resizer } from '../shared/Resizer';
import { resolveSize } from '../../utils/size';
import type {
  InputFieldLayout,
  TextVerticalAlign,
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

interface InputFieldProps {
  // 常用设置
  showLabel?: boolean;
  label?: string;
  required?: boolean;
  placeholder?: string;
  maxLengthEnabled?: boolean;
  maxLength?: number;
  defaultValue?: string;
  layout?: InputFieldLayout;
  labelWidth?: number;
  verticalAlign?: TextVerticalAlign;

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

export const InputField = ({
  showLabel = true,
  label = '请输入文本',
  required = false,
  placeholder = '请输入内容',
  maxLengthEnabled = false,
  maxLength = 200,
  defaultValue = '',
  layout = 'vertical',
  labelWidth = 30,
  verticalAlign = 'top',

  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,

  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 240,
  height = 80,
  sizeLimits = [],

  containerStyle,

  transform,
}: InputFieldProps) => {
  const {
    connectors: { drag },
  } = useNode();

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

  const resolvedWidth = resolveSize(widthMode, width, 240);
  const resolvedHeight = resolveSize(heightMode, height, 80);

  // Transform
  const t = transform;
  const hasTransform =
    t && (t.scale !== 100 || t.rotate !== 0 || t.translateX !== 0 || t.translateY !== 0 || t.skewX !== 0 || t.skewY !== 0);
  const transformStr = hasTransform
    ? `scale(${t.scale / 100}) rotate(${t.rotate}deg) translate(${t.translateX}%, ${t.translateY}%) skew(${t.skewX}deg, ${t.skewY}deg)`
    : undefined;

  const isHorizontal = layout === 'horizontal';

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
          flexDirection: isHorizontal ? 'row' : 'column',
          alignItems: isHorizontal ? VERTICAL_ALIGN_MAP[verticalAlign] : undefined,
          gap: isHorizontal ? 8 : 4,
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
        {/* 标签 */}
        {showLabel && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexShrink: 0,
              ...(isHorizontal ? { width: `${labelWidth}%` } : {}),
            }}
          >
            {required && (
              <span style={{ color: '#ef4444', fontSize: 14, lineHeight: 1 }}>*</span>
            )}
            <span style={{ fontSize: 14, color: '#ffffff', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
        )}

        {/* textarea */}
        <textarea
          readOnly
          placeholder={placeholder}
          defaultValue={defaultValue}
          maxLength={maxLengthEnabled ? maxLength : undefined}
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            resize: 'none',
            background: 'transparent',
            borderRadius: '8px',
            border: '1px solid #334155',
            outline: 'none',
            color: '#ffffff',
            fontSize: 14,
            padding: '4px',
            pointerEvents: 'none',
          }}
        />
      </div>
    </Resizer>
  );
};

InputField.craft = {
  displayName: '输入框',
  props: {
    showLabel: true,
    label: '请输入文本',
    required: false,
    placeholder: '请输入内容',
    maxLengthEnabled: false,
    maxLength: 200,
    defaultValue: '',
    layout: 'vertical',
    labelWidth: 30,
    verticalAlign: 'top',
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 240,
    height: 80,
    sizeLimits: [],
    containerStyle: null,
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
  },
};
