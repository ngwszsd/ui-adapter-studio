import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 倒计时
 * @param initialSeconds 初始倒计时秒数（默认60）
 * @param onEnd 倒计时结束回调
 * @returns {
 *   seconds: 剩余秒数
 *   isRunning: 是否正在倒计时
 *   start: 开始倒计时
 *   reset: 重置倒计时
 * }
 */
export function useCountdown(initialSeconds: number = 60, onEnd?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const remainingRef = useRef(initialSeconds * 1000); // 毫秒级精度

  // 开始倒计时
  const start = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);
    startTimeRef.current = Date.now();

    const updateCountdown = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const remaining = Math.max(0, remainingRef.current - elapsed);

      setSeconds(Math.ceil(remaining / 1000));

      if (remaining > 0) {
        animationRef.current = requestAnimationFrame(updateCountdown);
      } else {
        setIsRunning(false);
        remainingRef.current = initialSeconds * 1000;
        onEnd?.();
      }
    };

    animationRef.current = requestAnimationFrame(updateCountdown);
  }, [initialSeconds, isRunning, onEnd]);

  // 重置倒计时
  const reset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setSeconds(initialSeconds);
    setIsRunning(false);
    remainingRef.current = initialSeconds * 1000;
  }, [initialSeconds]);

  // 清理动画帧
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    seconds,
    isRunning,
    start,
    reset,
  };
}
