import React from 'react';
import { useNode } from '@craftjs/core';
import { Resizer } from '../shared/Resizer';
import { resolveSize } from '../../utils/size';
import type {
  RadioOptionItem,
  RadioDisplayStyle,
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
  if (v == null) return '8px';
  if (typeof v === 'number') return `${v}px`;
  return `${v.top}px ${v.right}px ${v.bottom}px ${v.left}px`;
};

const resolveFourCorner = (v: FourCornerValue | undefined): string | number => {
  if (v == null) return 8;
  if (typeof v === 'number') return v;
  return `${v.tl}px ${v.tr}px ${v.br}px ${v.bl}px`;
};

/* ---- 图片占位 Icon ---- */

const ImagePlaceholderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

/* ---- 复选框 ---- */

const CheckboxSquare = ({ active }: { active: boolean }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 16,
      height: 16,
      borderRadius: 3,
      border: `2px solid ${active ? '#3b82f6' : '#475569'}`,
      backgroundColor: active ? '#3b82f6' : 'transparent',
      flexShrink: 0,
    }}
  >
    {active && (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ display: 'block' }}>
        <path
          d="M2 5L4.2 7.5L8 2.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </span>
);

/* ---- 图片区域 ---- */

const ImageArea = ({
  imageUrl,
  style,
}: {
  imageUrl: string | null | undefined;
  style: React.CSSProperties;
}) => (
  <div
    style={{
      borderRadius: 6,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1e293b',
      flexShrink: 0,
      ...style,
    }}
  >
    {imageUrl ? (
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    ) : (
      <ImagePlaceholderIcon />
    )}
  </div>
);

/* ---- 描述文字（2行截断） ---- */

const CLAMP_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: '#ffffff',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  lineHeight: '16px',
};

/* ---- 横向卡片 ---- */

const HorizontalCard = ({
  option,
  active,
}: {
  option: RadioOptionItem;
  active: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 8,
      borderRadius: 8,
      border: `1px solid ${active ? '#3b82f6' : '#334155'}`,
      background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
      cursor: 'default',
      pointerEvents: 'none',
    }}
  >
    <ImageArea imageUrl={option.imageUrl} style={{ width: 48, height: 48 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {option.label}
      </span>
      {option.description && (
        <span style={CLAMP_STYLE}>{option.description}</span>
      )}
    </div>
    <CheckboxSquare active={active} />
  </div>
);

/* ---- 纵向卡片 ---- */

const VerticalCard = ({
  option,
  active,
}: {
  option: RadioOptionItem;
  active: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      borderRadius: 8,
      border: `1px solid ${active ? '#3b82f6' : '#334155'}`,
      background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
      cursor: 'default',
      pointerEvents: 'none',
    }}
  >
    <ImageArea
      imageUrl={option.imageUrl}
      style={{ width: 56, height: 56 }}
    />
    <span style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', textAlign: 'center' }}>
      {option.label}
    </span>
    {option.description && (
      <span style={{ ...CLAMP_STYLE, textAlign: 'center' }}>{option.description}</span>
    )}
    <CheckboxSquare active={active} />
  </div>
);

/* ---- Props ---- */

interface CheckboxGroupProps {
  // 常用设置
  showLabel?: boolean;
  label?: string;
  required?: boolean;
  options?: RadioOptionItem[];
  defaultValues?: string[];
  displayStyle?: RadioDisplayStyle;

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

  // 模糊
  blur?: BlurConfig | null;

  // 变换
  transform?: TransformConfig;
}

const MOCK_IMAGE_URL = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';

export const CheckboxGroup = ({
  showLabel = true,
  label = '请选择',
  required = false,
  options = [
    { id: '1', label: '选项 1', value: 'option1', imageUrl: MOCK_IMAGE_URL, description: '这是选项 1 的描述文字' },
    { id: '2', label: '选项 2', value: 'option2', imageUrl: MOCK_IMAGE_URL, description: '这是选项 2 的描述文字' },
    { id: '3', label: '选项 3', value: 'option3', imageUrl: null, description: '这是选项 3 的描述文字' },
  ],
  defaultValues = ['option1'],
  displayStyle = 'horizontal',

  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,

  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 532,
  height = 245,
  sizeLimits = [],

  containerStyle,

  blur,

  transform,
}: CheckboxGroupProps) => {
  const {
    connectors: { drag },
  } = useNode();

  const cs = containerStyle;
  const bg = cs?.background ?? 'transparent';
  const borderRadius = cs ? resolveFourCorner(cs.borderRadius) : 8;
  const padding = cs ? resolveFourSide(cs.padding) : '8px';
  const margin = cs ? resolveFourSide(cs.margin) : undefined;

  const borderStr = cs?.border
    ? `${cs.border.width}px ${cs.border.style} ${cs.border.color}`
    : undefined;

  const shadowStr = cs?.shadow
    ? `${cs.shadow.type === 'inset' ? 'inset ' : ''}${cs.shadow.x}px ${cs.shadow.y}px ${cs.shadow.blur}px ${cs.shadow.spread}px ${cs.shadow.color}`
    : undefined;

  // Blur
  const blurStyle: React.CSSProperties = {};
  if (blur && blur.value > 0) {
    if (blur.type === 'background') {
      blurStyle.backdropFilter = `blur(${blur.value}px)`;
    } else {
      blurStyle.filter = `blur(${blur.value}px)`;
    }
  }

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

  const resolvedWidth = resolveSize(widthMode, width, 532);
  const resolvedHeight = resolveSize(heightMode, height, 245);

  // Transform
  const t = transform;
  const hasTransform =
    t && (t.scale !== 100 || t.rotate !== 0 || t.translateX !== 0 || t.translateY !== 0 || t.skewX !== 0 || t.skewY !== 0);
  const transformStr = hasTransform
    ? `scale(${t.scale / 100}) rotate(${t.rotate}deg) translate(${t.translateX}%, ${t.translateY}%) skew(${t.skewX}deg, ${t.skewY}deg)`
    : undefined;

  const checkedSet = new Set(defaultValues);
  const selectedCount = options.filter((o) => checkedSet.has(o.value)).length;
  const CardComponent = displayStyle === 'vertical' ? VerticalCard : HorizontalCard;

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
        {/* 顶部标题栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            flexShrink: 0,
          }}
        >
          {showLabel && (
            <>
              {required && (
                <span style={{ color: '#ef4444', fontSize: 14, lineHeight: 1 }}>*</span>
              )}
              <span style={{ fontSize: 14, color: '#ffffff', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </>
          )}
          <span style={{ fontSize: 11, color: '#ffffff', whiteSpace: 'nowrap' }}>
            已选择 {selectedCount}/{options.length}
          </span>
        </div>

        {/* 选项卡片列表 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
            minHeight: 0,
            scrollbarWidth: 'none',
          }}
        >
          {options.map((option) => (
            <CardComponent
              key={option.id}
              option={option}
              active={checkedSet.has(option.value)}
            />
          ))}
        </div>
      </div>
    </Resizer>
  );
};

CheckboxGroup.craft = {
  displayName: '多选',
  props: {
    showLabel: true,
    label: '请选择',
    required: false,
    options: [
      { id: '1', label: '选项 1', value: 'option1', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', description: '这是选项 1 的描述文字' },
      { id: '2', label: '选项 2', value: 'option2', imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop', description: '这是选项 2 的描述文字' },
      { id: '3', label: '选项 3', value: 'option3', imageUrl: null, description: '这是选项 3 的描述文字' },
    ],
    defaultValues: ['option1'],
    displayStyle: 'horizontal',
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 532,
    height: 245,
    sizeLimits: [],
    containerStyle: null,
    blur: null,
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
  },
};
