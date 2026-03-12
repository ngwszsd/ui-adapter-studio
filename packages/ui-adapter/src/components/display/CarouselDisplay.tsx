import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Resizer } from '../shared/Resizer';
import { resolveSize } from '../../utils/size';
import type {
  CarouselContentMode,
  CarouselImageItem,
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

/* ---- Icons ---- */

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ---- 页面指示器 ---- */

const IndicatorCircle = ({
  label,
  isActive,
  onClick,
}: {
  label: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: 18,
      height: 18,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isActive ? '#fff' : 'rgba(255,255,255,0.25)',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      fontSize: 10,
      fontWeight: isActive ? 600 : 400,
      color: isActive ? '#1e293b' : 'rgba(255,255,255,0.7)',
      transition: 'background 0.2s, color 0.2s',
      lineHeight: 1,
    }}
  >
    {label}
  </button>
);

const EllipsisIcon = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="2" cy="8" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="14" cy="8" r="1.5" />
  </svg>
);

const PageIndicators = ({
  total,
  activeIndex,
  onSelect,
}: {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) => {
  if (total <= 0) return null;

  // ≤ 4：显示全部带数字的圆形指示器
  if (total <= 4) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {Array.from({ length: total }, (_, i) => (
          <IndicatorCircle
            key={i}
            label={i + 1}
            isActive={i === activeIndex}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>
    );
  }

  // > 4：显示 [1] [2] [⋯] [N]，第3位为省略号
  const isMiddleActive = activeIndex >= 2 && activeIndex < total - 1;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <IndicatorCircle label={1} isActive={activeIndex === 0} onClick={() => onSelect(0)} />
      <IndicatorCircle label={2} isActive={activeIndex === 1} onClick={() => onSelect(1)} />
      <IndicatorCircle label={<EllipsisIcon />} isActive={isMiddleActive} />
      <IndicatorCircle label={total} isActive={activeIndex === total - 1} onClick={() => onSelect(total - 1)} />
    </div>
  );
};

/* ---- Props ---- */

interface CarouselDisplayProps {
  // 常用设置
  contentMode?: CarouselContentMode;
  images?: CarouselImageItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;

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

export const CarouselDisplay = ({
  contentMode = 'static',
  images = [],
  autoPlay = true,
  autoPlayInterval = 2,

  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,

  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 240,
  height = 132,
  sizeLimits = [],

  containerStyle,

  blur,

  transform,
}: CarouselDisplayProps) => {
  const {
    connectors: { drag },
  } = useNode();

  const { enabled: isEditorMode } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));
  const isPreview = !isEditorMode;

  const [activeIndex, setActiveIndex] = React.useState(0);

  const cs = containerStyle;
  const bg = cs?.background ?? '#312e81';
  const borderRadius = cs ? resolveFourCorner(cs.borderRadius) : 10;
  const padding = cs ? resolveFourSide(cs.padding) : '0px';
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

  const resolvedWidth = resolveSize(widthMode, width, 240);
  const resolvedHeight = resolveSize(heightMode, height, 132);

  // Transform
  const t = transform;
  const hasTransform =
    t && (t.scale !== 100 || t.rotate !== 0 || t.translateX !== 0 || t.translateY !== 0 || t.skewX !== 0 || t.skewY !== 0);
  const transformStr = hasTransform
    ? `scale(${t.scale / 100}) rotate(${t.rotate}deg) translate(${t.translateX}%, ${t.translateY}%) skew(${t.skewX}deg, ${t.skewY}deg)`
    : undefined;

  // 使用全部图片（不过滤有效图片，因为默认项也要显示占位）
  const totalImages = images.length;
  const safeIndex = totalImages > 0 ? Math.min(activeIndex, totalImages - 1) : 0;
  const currentImage = totalImages > 0 ? images[safeIndex] : null;
  const hasCurrentImage = currentImage
    ? (currentImage.sourceType === 'local' && !!currentImage.imageUrl)
      || (currentImage.sourceType === 'binding' && !!currentImage.bindingField)
    : false;

  const goPrev = () => {
    if (totalImages <= 1) return;
    setActiveIndex((prev) => (prev <= 0 ? totalImages - 1 : prev - 1));
  };

  const goNext = () => {
    if (totalImages <= 1) return;
    setActiveIndex((prev) => (prev >= totalImages - 1 ? 0 : prev + 1));
  };

  // 忽略设计态不使用的 props
  void autoPlay;
  void autoPlayInterval;

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
          cursor: isEditorMode ? 'move' : 'default',
          boxSizing: 'border-box',
          transform: transformStr,
          ...blurStyle,
          ...positionStyle,
          ...limitStyle,
        }}
      >
        {/* 图片轮播区域 */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          {hasCurrentImage ? (
            <img
              src={
                currentImage!.sourceType === 'local'
                  ? currentImage!.imageUrl!
                  : currentImage!.bindingField
              }
              alt=""
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
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
                background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>
                {contentMode === 'dynamic' ? '动态内容' : '暂无图片'}
              </span>
            </div>
          )}
        </div>

        {/* 底部控制栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            background: '#000',
            pointerEvents: isEditorMode ? 'none' : 'auto',
          }}
        >
          {/* 左侧：← 上一页 */}
          <button
            type="button"
            onClick={goPrev}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: isPreview ? 'pointer' : 'default',
              color: '#cbd5e1',
            }}
          >
            <ChevronLeftIcon />
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>上一页</span>
          </button>

          {/* 中间：页面指示器 */}
          <PageIndicators
            total={totalImages}
            activeIndex={safeIndex}
            onSelect={(i) => {
              if (i < totalImages) setActiveIndex(i);
            }}
          />

          {/* 右侧：下一页 → */}
          <button
            type="button"
            onClick={goNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: isPreview ? 'pointer' : 'default',
              color: '#cbd5e1',
            }}
          >
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>下一页</span>
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </Resizer>
  );
};

CarouselDisplay.craft = {
  displayName: '轮播',
  props: {
    contentMode: 'static',
    images: [
      { id: 'default_1', sourceType: 'local', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', bindingField: '', fileName: '风景图1.jpg' },
      { id: 'default_2', sourceType: 'local', imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop', bindingField: '', fileName: '风景图2.jpg' },
    ],
    autoPlay: true,
    autoPlayInterval: 2,
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 240,
    height: 132,
    sizeLimits: [],
    containerStyle: null,
    blur: null,
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
  },
};
