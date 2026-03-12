import React from 'react';
import type { OverflowMode } from '../types';

export const getScrollableOverflowStyle = (
  overflow: OverflowMode,
): React.CSSProperties => {
  if (overflow === 'hidden') {
    return { overflow: 'hidden' };
  }

  if (overflow === 'scroll') {
    return {
      overflowX: 'auto',
      overflowY: 'auto',
      scrollbarWidth: 'none' as const,
      msOverflowStyle: 'none',
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain',
    };
  }

  return { overflow: 'visible' };
};

type ScrollWheelEvent = Pick<
  WheelEvent,
  'deltaX' | 'deltaY' | 'shiftKey' | 'preventDefault' | 'stopPropagation'
>;

export const handleBidirectionalWheelScroll = (
  target: HTMLDivElement,
  event: ScrollWheelEvent,
  overflow: OverflowMode,
) => {
  if (overflow !== 'scroll') return;

  const hasHorizontalOverflow = target.scrollWidth > target.clientWidth;
  const hasVerticalOverflow = target.scrollHeight > target.clientHeight;

  if (!hasHorizontalOverflow && !hasVerticalOverflow) return;

  let nextScrollLeft = target.scrollLeft;
  let nextScrollTop = target.scrollTop;
  let handled = false;

  if (hasHorizontalOverflow) {
    let horizontalDelta = event.deltaX;

    if (horizontalDelta === 0 && event.shiftKey) {
      horizontalDelta = event.deltaY;
    } else if (horizontalDelta === 0 && !hasVerticalOverflow) {
      horizontalDelta = event.deltaY;
    }

    if (horizontalDelta !== 0) {
      nextScrollLeft += horizontalDelta;
      handled = true;
    }
  }

  if (hasVerticalOverflow && event.deltaY !== 0 && !event.shiftKey) {
    nextScrollTop += event.deltaY;
    handled = true;
  }

  if (!handled) return;

  if (nextScrollLeft !== target.scrollLeft) {
    target.scrollLeft = nextScrollLeft;
  }

  if (nextScrollTop !== target.scrollTop) {
    target.scrollTop = nextScrollTop;
  }

  event.preventDefault();
  event.stopPropagation();
};

export const useBidirectionalWheelScroll = (
  ref: React.RefObject<HTMLDivElement | null>,
  overflow: OverflowMode,
) => {
  React.useEffect(() => {
    const element = ref.current;
    if (!element || overflow !== 'scroll') return;

    const handleWheel = (event: WheelEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const closestScrollable = target.closest<HTMLElement>('[data-scrollable]');
        if (closestScrollable && closestScrollable !== element) {
          return;
        }
      }

      handleBidirectionalWheelScroll(element, event, overflow);
    };

    element.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      element.removeEventListener('wheel', handleWheel, true);
    };
  }, [ref, overflow]);
};
