import React, { useEffect, useMemo, useState, useRef } from 'react';

type MarqueeTextProps = {
  text: string;
  height: number;
  fontSize: number;
  active: boolean;
  paused: boolean;
  interval: number;
  onNearEnd: () => void;
};

const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  height,
  fontSize,
  active,
  paused,
  interval,
  onNearEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const dirRef = useRef<-1 | 1>(-1);
  const hitMinRef = useRef(false);
  const notifiedRef = useRef(false);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const check = () => {
      const cw = containerRef.current?.offsetWidth || 0;
      const sw = contentRef.current?.scrollWidth || 0;
      setScrollable(sw > cw);
    };
    check();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    return () => ro?.disconnect();
  }, [text]);

  useEffect(() => {
    posRef.current = 0;
    dirRef.current = -1;
    hitMinRef.current = false;
    notifiedRef.current = false;
    if (contentRef.current)
      contentRef.current.style.transform = 'translateX(0px)';
  }, [text, active]);

  useEffect(() => {
    if (!active) return;
    if (!scrollable) {
      if (paused) return;
      const t = setTimeout(() => {
        onNearEnd();
      }, interval);
      return () => clearTimeout(t);
    }
    let raf = 0;
    let last = 0;
    const speed = 45;
    let started = false;
    const startDelay = 1000;
    const startTimer = setTimeout(() => {
      started = true;
    }, startDelay);

    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused && started) {
        const cw = containerRef.current?.offsetWidth || 0;
        const sw = contentRef.current?.scrollWidth || 0;
        const minX = cw - sw;
        let next = posRef.current + dirRef.current * speed * dt;

        if (next <= minX) {
          const t = setTimeout(() => {
            onNearEnd();
          }, interval);

          return () => {
            cancelAnimationFrame(raf);
            clearTimeout(startTimer);
            clearTimeout(t);
          };
        }

        posRef.current = next;
        if (contentRef?.current) {
          contentRef.current.style.transform = `translateX(${next}px)`;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [active, scrollable, paused, interval, onNearEnd]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    height,
    lineHeight: `${height}px`,
    fontSize,
    overflow: 'hidden',
    textAlign: 'left',
  };
  const contentStyle: React.CSSProperties = {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    transform: 'translateX(0px)',
    willChange: 'transform',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <div ref={contentRef} style={contentStyle}>
        {text}
      </div>
    </div>
  );
};

export type TextFlipCarouselProps = {
  items: string[];
  interval?: number;
  duration?: number;
  className?: string;
  height?: number;
  fontSize?: number;
  direction?: 'up' | 'down';
  pauseOnHover?: boolean;
};

const TextFlipCarousel: React.FC<TextFlipCarouselProps> = ({
  items,
  interval = 2000,
  duration = 400,
  className,
  height = 24,
  fontSize = 14,
  direction = 'up',
  pauseOnHover = true,
}) => {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);

  const renderItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    if (items.length === 1) return items.slice();
    const n = items.length;
    return direction === 'up' ? [...items, items[0]] : [items[n - 1], ...items];
  }, [items, direction]);

  useEffect(() => {
    if (!items || items.length < 2) {
      setIndex(0);
      return;
    }
    setIndex(direction === 'down' ? 1 : 0);
  }, [items, direction]);

  const step = direction === 'up' ? 1 : -1;
  const handleNext = () => {
    if (hover && pauseOnHover) return;
    const len = items?.length || 0;
    if (!Array.isArray(items) || !len) return;
    if (len < 2) return;

    setIndex((prev) => {
      const i = prev + step;
      return i > len - 1 ? 0 : i;
    });
  };

  if (!renderItems.length) return null;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    height,
    overflow: 'hidden',
  };

  const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    transform: `translateY(-${index * height}px)`,
    transition: `transform ${400}ms ease`,
    willChange: 'transform',
  };

  const itemStyle: React.CSSProperties = {
    height,
    textAlign: 'left',
    flex: '0 0 auto',
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={listStyle}>
        {renderItems.map((it, i) => (
          <div key={i} style={itemStyle}>
            <MarqueeText
              key={i}
              text={it}
              height={height}
              fontSize={fontSize}
              active={i === index}
              paused={hover && pauseOnHover}
              interval={interval}
              onNearEnd={handleNext}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TextFlipCarousel;
