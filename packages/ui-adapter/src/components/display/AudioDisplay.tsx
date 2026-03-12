import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Resizer } from '../shared/Resizer';
import voiceDisc from '../../../assets/voice.webp';
import { resolveSize } from '../../utils/size';
import type {
  AudioSourceType,
  AudioPlayerStyle,
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

const PlayIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const PauseIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
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

const WaveformIcon = ({ size = 16, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="8" x2="4" y2="16" />
    <line x1="8" y1="5" x2="8" y2="19" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="16" y1="7" x2="16" y2="17" />
    <line x1="20" y1="10" x2="20" y2="14" />
  </svg>
);

/* ---- 播放器 Hook ---- */

const useAudioPlayer = (audioRef: React.RefObject<HTMLAudioElement | null>, enabled: boolean) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const el = audioRef.current;
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
  }, [audioRef, enabled]);

  const togglePlay = React.useCallback(() => {
    const el = audioRef.current;
    if (!el || !enabled) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [audioRef, enabled]);

  const skip = React.useCallback((delta: number) => {
    const el = audioRef.current;
    if (!el || !enabled) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  }, [audioRef, enabled]);

  const seek = React.useCallback((time: number) => {
    const el = audioRef.current;
    if (!el || !enabled) return;
    el.currentTime = time;
  }, [audioRef, enabled]);

  return { isPlaying, currentTime, duration, togglePlay, skip, seek };
};

/* ---- Props ---- */

interface AudioDisplayProps {
  // 常用设置
  sourceType?: AudioSourceType;
  audioUrl?: string | null;
  bindingField?: string;
  audioTitle?: string;
  playerStyle?: AudioPlayerStyle;
  loop?: boolean;
  preload?: boolean;
  controlColor?: string | null;

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

/* ---- 进度条组件 ---- */

const ProgressBar = ({
  currentTime,
  duration,
  onSeek,
  accentColor,
  interactive,
}: {
  currentTime: number;
  duration: number;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  accentColor: string;
  interactive: boolean;
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flex: 1,
      }}
    >
      <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 32, textAlign: 'center' }}>
        {formatTime(currentTime)}
      </span>
      <div
        onClick={onSeek}
        style={{
          flex: 1,
          height: 3,
          backgroundColor: 'rgba(148,163,184,0.3)',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          cursor: interactive ? 'pointer' : 'default',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: accentColor,
            borderRadius: 2,
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 32, textAlign: 'center' }}>
        {formatTime(duration)}
      </span>
    </div>
  );
};

/* ---- 主组件 ---- */

export const AudioDisplay = ({
  sourceType = 'local',
  audioUrl = null,
  bindingField = '',
  audioTitle = '音频标题',
  playerStyle = 'large',
  loop = false,
  preload = true,
  controlColor = null,

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
}: AudioDisplayProps) => {
  const {
    connectors: { drag },
  } = useNode();

  const { enabled: isEditorMode } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const isPreview = !isEditorMode;

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { isPlaying, currentTime, duration, togglePlay, skip, seek } = useAudioPlayer(audioRef, isPreview);

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

  const displayUrl = sourceType === 'binding' ? (bindingField || null) : audioUrl;
  const hasAudio = !!displayUrl;

  const displayCurrentTime = isPreview ? currentTime : 0;
  const displayDuration = isPreview && duration > 0 ? duration : 0;

  const accentColor = controlColor ?? '#3b82f6';

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPreview || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  // 隐藏的 audio 元素
  const audioElement = hasAudio ? (
    <audio
      ref={audioRef}
      src={displayUrl!}
      loop={loop}
      preload={preload ? 'metadata' : 'none'}
      style={{ display: 'none' }}
    />
  ) : null;

  /* ---------- 大播放器 ---------- */
  const renderLargePlayer = () => (
    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* 黑色背景 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000000',
        }}
      />

      {/* 半透明遮罩 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isPlaying ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.35)',
          transition: 'background 0.3s',
        }}
      />

      {/* 内容层 */}
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
        {/* 顶部 - 音频标题 */}
        <div style={{ padding: '8px 12px', textAlign: 'center' }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#e2e8f0',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {audioTitle || (sourceType === 'binding' ? `绑定: ${bindingField || '未设置'}` : '暂无音频')}
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
            <div style={{ color: controlColor ?? '#cbd5e1' }}>
              <RewindIcon />
            </div>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>快退</span>
          </button>

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
                color: controlColor ?? '#f1f5f9',
                transition: 'background-color 0.2s',
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </div>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>
              {isPlaying ? '暂停' : '播放'}
            </span>
          </button>

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
            <div style={{ color: controlColor ?? '#cbd5e1' }}>
              <ForwardIcon />
            </div>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>快进</span>
          </button>
        </div>

        {/* 底部 - 进度条 */}
        <div style={{ padding: '4px 10px 8px' }}>
          <ProgressBar
            currentTime={displayCurrentTime}
            duration={displayDuration}
            onSeek={handleProgressClick}
            accentColor={accentColor}
            interactive={isPreview}
          />
        </div>
      </div>
    </div>
  );

  /* ---------- 小播放器 ---------- */
  const renderSmallPlayer = () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: '#000000',
        pointerEvents: isEditorMode ? 'none' : 'auto',
      }}
    >
      {/* 左侧 - 碟片图片 + 播放按钮 */}
      <div
        style={{
          position: 'relative',
          width: 48,
          height: 48,
          flexShrink: 0,
          cursor: isPreview ? 'pointer' : 'default',
        }}
        onClick={togglePlay}
      >
        <img
          src={voiceDisc}
          alt="audio disc"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            animation: isPlaying ? 'spin 4s linear infinite' : 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: controlColor ?? '#ffffff',
          }}
        >
          {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </div>
      </div>

      {/* 右侧 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        {/* 上部 - 名称 + 音频谱 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: 500,
              color: '#e2e8f0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {audioTitle || '暂无音频'}
          </span>
          <WaveformIcon size={16} color={controlColor ?? '#94a3b8'} />
        </div>

        {/* 下部 - 进度条 */}
        <ProgressBar
          currentTime={displayCurrentTime}
          duration={displayDuration}
          onSeek={handleProgressClick}
          accentColor={accentColor}
          interactive={isPreview}
        />
      </div>
    </div>
  );

  /* ---------- 小播放条 ---------- */
  const renderBarPlayer = () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: '#000000',
        pointerEvents: isEditorMode ? 'none' : 'auto',
      }}
    >
      {/* 播放按钮 */}
      <div
        onClick={togglePlay}
        style={{
          width: 24,
          height: 24,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: controlColor ?? '#e2e8f0',
          cursor: isPreview ? 'pointer' : 'default',
        }}
      >
        {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </div>

      {/* 进度条 */}
      <ProgressBar
        currentTime={displayCurrentTime}
        duration={displayDuration}
        onSeek={handleProgressClick}
        accentColor={accentColor}
        interactive={isPreview}
      />

      {/* 音频谱图标 */}
      <WaveformIcon size={16} color={controlColor ?? '#94a3b8'} />
    </div>
  );

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
          backgroundColor: bg !== 'transparent' ? bg : '#000000',
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
        {audioElement}
        {playerStyle === 'large' && renderLargePlayer()}
        {playerStyle === 'small' && renderSmallPlayer()}
        {playerStyle === 'bar' && renderBarPlayer()}
      </div>
    </Resizer>
  );
};

AudioDisplay.craft = {
  displayName: '音频',
  props: {
    sourceType: 'local',
    audioUrl: null,
    bindingField: '',
    audioTitle: '音频标题',
    playerStyle: 'large',
    loop: false,
    preload: true,
    controlColor: null,
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
