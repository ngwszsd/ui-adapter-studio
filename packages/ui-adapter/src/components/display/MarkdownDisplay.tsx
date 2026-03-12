import React from 'react';
import { useNode } from '@craftjs/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Resizer } from '../shared/Resizer';
import { resolveSize } from '../../utils/size';
import type {
  TextAlign,
  TextVerticalAlign,
  OverflowMode,
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

/* ---- 默认 Markdown 内容 ---- */

const DEFAULT_CONTENT = `# 一级标题

这是一段普通文本，用于展示 Markdown 的基本排版效果。

## 二级标题

### 三级标题

1. 第一项有序列表
2. 第二项有序列表
3. 第三项有序列表

[访问 XRFlow](https://xrflow.cn)

![示例图片](https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&h=120&fit=crop)

> 这是一段引用文本，用于展示引用样式的排版效果。`;

/* ---- Props ---- */

interface MarkdownDisplayProps {
  // 常用设置
  content?: string;
  textAlign?: TextAlign;
  verticalAlign?: TextVerticalAlign;
  color?: string | null;
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

export const MarkdownDisplay = ({
  content = DEFAULT_CONTENT,
  textAlign = 'left',
  verticalAlign = 'top',
  color = null,
  maxLines = null,

  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,

  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 280,
  height = 320,
  sizeLimits = [],

  containerStyle,
  overflow = 'scroll',

  transform,
}: MarkdownDisplayProps) => {
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

  const resolvedWidth = resolveSize(widthMode, width, 280);
  const resolvedHeight = resolveSize(heightMode, height, 320);

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
          textAlign,
          color: color ?? '#ffffff',
          padding,
          margin,
          backgroundColor: bg,
          borderRadius,
          border: borderStr,
          boxShadow: shadowStr,
          cursor: 'move',
          display: 'flex',
          alignItems: VERTICAL_ALIGN_MAP[verticalAlign],
          overflow,
          scrollbarWidth: 'none',
          boxSizing: 'border-box',
          transform: transformStr,
          ...positionStyle,
          ...limitStyle,
        }}
      >
        <div style={{ width: '100%', ...clampStyle }} className="markdown-preview">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3 }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: '12px 0 6px', lineHeight: 1.3 }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: '10px 0 4px', lineHeight: 1.3 }}>{children}</h3>
              ),
              p: ({ children }) => (
                <p style={{ fontSize: 13, margin: '4px 0', lineHeight: 1.6 }}>{children}</p>
              ),
              ol: ({ children }) => (
                <ol style={{ fontSize: 13, margin: '4px 0', paddingLeft: 20, lineHeight: 1.6 }}>{children}</ol>
              ),
              ul: ({ children }) => (
                <ul style={{ fontSize: 13, margin: '4px 0', paddingLeft: 20, lineHeight: 1.6 }}>{children}</ul>
              ),
              li: ({ children }) => (
                <li style={{ margin: '2px 0' }}>{children}</li>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  style={{ color: '#60a5fa', textDecoration: 'underline' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt ?? ''}
                  style={{ maxWidth: '100%', borderRadius: 4, margin: '4px 0', display: 'block' }}
                />
              ),
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    margin: '8px 0',
                    paddingLeft: 12,
                    borderLeft: '3px solid #475569',
                    color: '#ffffff',
                    fontStyle: 'italic',
                    fontSize: 13,
                  }}
                >
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code
                  style={{
                    backgroundColor: 'rgba(148,163,184,0.15)',
                    padding: '1px 4px',
                    borderRadius: 3,
                    fontSize: 12,
                  }}
                >
                  {children}
                </code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </Resizer>
  );
};

MarkdownDisplay.craft = {
  displayName: 'Markdown',
  props: {
    content: DEFAULT_CONTENT,
    textAlign: 'left',
    verticalAlign: 'top',
    color: null,
    maxLines: null,
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 280,
    height: 320,
    sizeLimits: [],
    containerStyle: null,
    overflow: 'scroll',
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
  },
};
