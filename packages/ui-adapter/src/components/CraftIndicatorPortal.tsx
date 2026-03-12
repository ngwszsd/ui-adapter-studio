import React from 'react';
import ReactDOM from 'react-dom';
import { useEditor } from '@craftjs/core';

const THICKNESS = 2;
const SUCCESS_COLOR = '#22c55e';
const ERROR_COLOR = '#ef4444';

/**
 * 获取元素在视口坐标系中的完整信息。
 * 与 Craft.js 的 getDOMInfo 逻辑一致，但 margin/padding 乘以了实际的
 * CSS transform 缩放比，确保所有数值统一在视口坐标系。
 */
function getViewportDOMInfo(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);

  // 通过 CSS 宽度与视觉宽度的比值推算 transform 缩放
  const cssWidth = el.offsetWidth;
  const scale = cssWidth > 0 ? rect.width / cssWidth : 1;

  const margin = {
    top: (parseInt(style.marginTop) || 0) * scale,
    right: (parseInt(style.marginRight) || 0) * scale,
    bottom: (parseInt(style.marginBottom) || 0) * scale,
    left: (parseInt(style.marginLeft) || 0) * scale,
  };
  const padding = {
    top: (parseInt(style.paddingTop) || 0) * scale,
    right: (parseInt(style.paddingRight) || 0) * scale,
    bottom: (parseInt(style.paddingBottom) || 0) * scale,
    left: (parseInt(style.paddingLeft) || 0) * scale,
  };

  const outerWidth = Math.round(rect.width + margin.left + margin.right);
  const outerHeight = Math.round(rect.height + margin.top + margin.bottom);

  // 匹配 Craft.js getDOMInfo 的 inFlow 检测逻辑
  let inFlow = false;
  if (el.parentElement) {
    const parentStyle = window.getComputedStyle(el.parentElement);
    const overflowOk = !(style.overflow && style.overflow !== 'visible');
    const floatOk = parentStyle.float === 'none';
    const notGrid = parentStyle.display !== 'grid';
    const notHorizontalFlex = !(
      parentStyle.display === 'flex' &&
      parentStyle.flexDirection !== 'column'
    );
    const positionOk =
      style.position === 'static' || style.position === 'relative';
    const displayOk = ['block', 'list-item', 'table', 'flex', 'grid'].includes(
      style.display
    );

    inFlow =
      overflowOk &&
      floatOk &&
      notGrid &&
      notHorizontalFlex &&
      positionOk &&
      displayOk;
  }

  return {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
    width: rect.width,
    height: rect.height,
    outerWidth,
    outerHeight,
    margin,
    padding,
    inFlow,
  };
}

/**
 * 自定义拖拽指示线。
 *
 * Craft.js 内置的 RenderIndicator 使用 position:fixed 渲染在 CraftEditor 内部，
 * 而 CraftEditor 位于 react-zoom-pan-pinch 的 TransformComponent 内部。
 * 根据 CSS 规范，祖先的 CSS transform 会为 position:fixed 创建新的包含块，
 * 导致指示线坐标相对于 transform 容器而非视口，从而位置偏移。
 *
 * 本组件通过 ReactDOM.createPortal 将指示线渲染到 document.body，
 * 绕过 transform 层级，使 position:fixed 正确相对于视口定位。
 */
export const CraftIndicatorPortal = React.memo(
  function CraftIndicatorPortal() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { indicator } = useEditor((state: any) => ({
      indicator: state.indicator,
    }));

    if (!indicator) return null;

    const parentDom = indicator.placement?.parent?.dom as HTMLElement | null;
    const currentNodeDom = indicator.placement?.currentNode?.dom as
      | HTMLElement
      | null;
    const where: 'before' | 'after' = indicator.placement?.where ?? 'before';

    if (!parentDom) return null;

    let t = 0,
      l = 0,
      w = 0,
      h = 0;

    if (currentNodeDom) {
      const info = getViewportDOMInfo(currentNodeDom);

      // inFlow 可能因为子组件 display: inline-block 被判定为 false，
      // 但如果父容器是 column flex 布局，插入方向仍然是纵向排列，指示线应为横线。
      const parentEl = currentNodeDom.parentElement;
      const parentFlex = parentEl ? window.getComputedStyle(parentEl) : null;
      const isColumnFlex =
        parentFlex?.display === 'flex' &&
        (parentFlex.flexDirection === 'column' ||
          parentFlex.flexDirection === 'column-reverse');

      if (info.inFlow || isColumnFlex) {
        // 纵向排列（文档流 / column flex）：目标上方或下方的横线
        w = info.outerWidth;
        h = THICKNESS;
        t = where === 'before' ? info.top : info.bottom;
        l = info.left;
      } else {
        // 横向排列（水平 flex 等）：目标左侧或右侧的竖线
        w = THICKNESS;
        h = info.outerHeight;
        t = info.top;
        l =
          where === 'before' ? info.left : info.left + info.outerWidth;
      }
    } else {
      // 空容器：在容器内容区顶部显示横线
      const parentInfo = getViewportDOMInfo(parentDom);
      t = parentInfo.top + parentInfo.padding.top;
      l = parentInfo.left + parentInfo.padding.left;
      w =
        parentInfo.width - parentInfo.padding.left - parentInfo.padding.right;
      h = THICKNESS;
    }

    const bgColor = indicator.error ? ERROR_COLOR : SUCCESS_COLOR;

    return ReactDOM.createPortal(
      <div
        style={{
          position: 'fixed',
          top: `${t}px`,
          left: `${l}px`,
          width: `${w}px`,
          height: `${h}px`,
          backgroundColor: bgColor,
          boxShadow: `0 0 6px ${bgColor}`,
          zIndex: 99999,
          transition: '0.15s ease-in',
          pointerEvents: 'none',
        }}
      />,
      document.body
    );
  }
);
