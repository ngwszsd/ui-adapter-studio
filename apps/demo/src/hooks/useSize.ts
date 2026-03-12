import { type RefObject, useState, useEffect } from 'react';
export const useSize = (domRef?: RefObject<HTMLElement | null>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = domRef?.current;

    if (!element) {
      console.warn('`useSize`: domRef is null or undefined.');
      return;
    }

    if (typeof ResizeObserver === 'undefined') {
      console.warn(
        '`useSize`: ResizeObserver is not supported by this browser.',
      );
      return;
    }

    let isMounted = true; // 防止卸载后更新状态
    const observer = new ResizeObserver((entries) => {
      if (!isMounted) return;

      try {
        const entry = entries[0];
        if (entry && entry.target.isConnected) {
          const { width, height } = entry.contentRect;
          setSize({ width, height });
        }
      } catch (error) {
        console.error('`useSize`: Error in ResizeObserver callback.', error);
      }
    });

    observer.observe(element);

    return () => {
      isMounted = false;
      observer.disconnect(); // 确保在卸载时断开监听
    };
  }, [domRef]);

  return size;
};
