import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Resizer } from '../shared/Resizer';
import { resolveSize } from '../../utils/size';
import type {
  VideoSourceType,
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

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const SKIP_SECONDS = 5;

/* ---- Icons ---- */

const RewindIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 19 2 12 11 5 11 19" />
    <polygon points="22 19 13 12 22 5 22 19" />
  </svg>
);

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="3" width="5" height="18" rx="1" />
    <rect x="14" y="3" width="5" height="18" rx="1" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 19 22 12 13 5 13 19" />
    <polygon points="2 19 11 12 2 5 2 19" />
  </svg>
);

/* ---- 播放器 Hook ---- */

const useVideoPlayer = (videoRef: React.RefObject<HTMLVideoElement | null>, enabled: boolean) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !enabled) return;

    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onLoadedMetadata = () => setDuration(el.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);

    // 如果视频已有 metadata（缓存），直接读取
    if (el.readyState >= 1) {
      setDuration(el.duration || 0);
      setCurrentTime(el.currentTime);
    }

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [videoRef, enabled]);

  const togglePlay = React.useCallback(() => {
    const el = videoRef.current;
    if (!el || !enabled) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [videoRef, enabled]);

  const skip = React.useCallback((delta: number) => {
    const el = videoRef.current;
    if (!el || !enabled) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  }, [videoRef, enabled]);

  const seek = React.useCallback((time: number) => {
    const el = videoRef.current;
    if (!el || !enabled) return;
    el.currentTime = time;
  }, [videoRef, enabled]);

  return { isPlaying, currentTime, duration, togglePlay, skip, seek };
};

/* ---- Props ---- */

interface VideoDisplayProps {
  // 常用设置
  sourceType?: VideoSourceType;
  videoUrl?: string | null;
  bindingField?: string;
  videoTitle?: string;
  fullscreen?: boolean;
  loop?: boolean;
  lazy?: boolean;

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

export const VideoDisplay = ({
  sourceType = 'local',
  videoUrl = null,
  bindingField = '',
  videoTitle = '视频标题',
  fullscreen = false,
  loop = false,
  lazy = false,

  positionType = 'relative',
  positionTop,
  positionRight,
  positionBottom,
  positionLeft,

  widthMode = 'fixed',
  heightMode = 'fixed',
  width = 280,
  height = 180,
  sizeLimits = [],

  containerStyle,

  blur,

  transform,
}: VideoDisplayProps) => {
  const {
    connectors: { drag },
  } = useNode();

  // 判断是否处于编辑器模式（设计态）
  const { enabled: isEditorMode } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  // 预览态 = 编辑器未激活（后期切换预览时 enabled=false）
  const isPreview = !isEditorMode;

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const { isPlaying, currentTime, duration, togglePlay, skip, seek } = useVideoPlayer(videoRef, isPreview);

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

  const resolvedWidth = resolveSize(widthMode, width, 280);
  const resolvedHeight = resolveSize(heightMode, height, 180);

  // Transform
  const t = transform;
  const hasTransform =
    t && (t.scale !== 100 || t.rotate !== 0 || t.translateX !== 0 || t.translateY !== 0 || t.skewX !== 0 || t.skewY !== 0);
  const transformStr = hasTransform
    ? `scale(${t.scale / 100}) rotate(${t.rotate}deg) translate(${t.translateX}%, ${t.translateY}%) skew(${t.skewX}deg, ${t.skewY}deg)`
    : undefined;

  // 根据来源类型决定展示的视频 URL
  const displayUrl = sourceType === 'binding' ? (bindingField || null) : videoUrl;
  const hasVideo = !!displayUrl;

  // 设计态显示静态数据，预览态显示真实数据
  const displayCurrentTime = isPreview ? currentTime : 0;
  const displayDuration = isPreview && duration > 0 ? duration : 0;
  const progressPercent = displayDuration > 0 ? (displayCurrentTime / displayDuration) * 100 : 0;

  // 忽略设计态不使用的 props（运行时/预览时才生效）
  void fullscreen;

  // 进度条点击定位
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPreview || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

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
          backgroundColor: bg !== 'transparent' ? bg : '#0f172a',
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
        {/* 视频背景区域 */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* 视频元素 */}
          {hasVideo ? (
            <video
              ref={videoRef}
              src={displayUrl!}
              muted={isEditorMode}
              playsInline
              loop={loop}
              preload={lazy ? 'none' : 'metadata'}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              }}
            />
          )}

          {/* 半透明遮罩 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: isPlaying ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.35)',
              transition: 'background 0.3s',
            }}
          />

          {/* 内容层 — 设计态不可交互 */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1,
              pointerEvents: isEditorMode ? 'none' : 'auto',
            }}
          >
            {/* 顶部 - 视频标题 */}
            <div style={{ padding: '8px 12px', textAlign: 'center' }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#e2e8f0',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {videoTitle || (sourceType === 'binding' ? `绑定: ${bindingField || '未设置'}` : '暂无视频')}
              </span>
            </div>

            {/* 中部 - 控制按钮 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              {/* 快退 */}
              <button
                type="button"
                onClick={() => skip(-SKIP_SECONDS)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: isPreview ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <div style={{ color: '#cbd5e1' }}>
                  <RewindIcon />
                </div>
                <span style={{ fontSize: 9, color: '#94a3b8' }}>快退</span>
              </button>

              {/* 播放/暂停 */}
              <button
                type="button"
                onClick={togglePlay}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: isPreview ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f1f5f9',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </div>
                <span style={{ fontSize: 9, color: '#94a3b8' }}>
                  {isPlaying ? '暂停' : '播放'}
                </span>
              </button>

              {/* 快进 */}
              <button
                type="button"
                onClick={() => skip(SKIP_SECONDS)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: isPreview ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <div style={{ color: '#cbd5e1' }}>
                  <ForwardIcon />
                </div>
                <span style={{ fontSize: 9, color: '#94a3b8' }}>快进</span>
              </button>
            </div>

            {/* 底部 - 进度条 */}
            <div
              style={{
                padding: '4px 10px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 32, textAlign: 'center' }}>
                {formatTime(displayCurrentTime)}
              </span>
              <div
                onClick={handleProgressClick}
                style={{
                  flex: 1,
                  height: 3,
                  backgroundColor: 'rgba(148,163,184,0.3)',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: isPreview ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${progressPercent}%`,
                    backgroundColor: '#3b82f6',
                    borderRadius: 2,
                    transition: isPreview ? 'none' : 'width 0.3s',
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 32, textAlign: 'center' }}>
                {formatTime(displayDuration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Resizer>
  );
};

VideoDisplay.craft = {
  displayName: '视频',
  props: {
    sourceType: 'local',
    videoUrl: null,
    bindingField: '',
    videoTitle: '视频标题',
    fullscreen: false,
    loop: false,
    lazy: false,
    positionType: 'relative',
    positionTop: 0,
    positionRight: 0,
    positionBottom: 0,
    positionLeft: 0,
    widthMode: 'fixed',
    heightMode: 'fixed',
    width: 280,
    height: 180,
    sizeLimits: [],
    containerStyle: null,
    blur: null,
    transform: { scale: 100, rotate: 0, translateX: 0, translateY: 0, skewX: 0, skewY: 0 },
  },
};
