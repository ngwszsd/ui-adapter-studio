/**
 * 极其安全的通用翻译崩溃修复补丁
 * 逻辑：仅在检测到翻译工具处于活跃状态时，才激活补丁并输出可视化日志。
 */
export function initGoogleTranslateFix() {
  if (typeof Node !== 'function' || !Node.prototype) return;

  // 定义：检测当前页面是否真的开启了翻译
  const isToolActive = () => {
    return (
      document.documentElement.classList.contains('translated-ltr') ||
      document.documentElement.classList.contains('translated-rtl') ||
      document.documentElement.classList.contains(
        'immersive-translate-state',
      ) ||
      document.documentElement.hasAttribute(
        'data-immersive-translate-effect',
      ) ||
      !!document.querySelector('font.goog-text-highlight') ||
      !!document.querySelector('immersive-translate-target-inner') ||
      !!document.querySelector('.immersive-translate-target-wrapper') ||
      !!document.body?.classList.contains('immersive-translate-state') ||
      !!document.querySelector('[data-immersive-translate-effect]')
    );
  };

  /**
   * 核心补丁：底层拦截
   */
  const applySafePatch = () => {
    if ((window as any).__GT_FIX_PATCHED__) return;
    (window as any).__GT_FIX_PATCHED__ = true;

    // 1. 劫持 removeChild
    const srcRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        if (child.parentNode) {
          // 如果开启了翻译，我们悄悄帮 React 把它从错误的父节点里删掉，防止崩溃
          return srcRemoveChild.apply(child.parentNode, [child]) as T;
        }
        return child;
      }
      return srcRemoveChild.apply(this, [child]) as T;
    };

    // 2. 劫持 insertBefore
    const srcInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(
      newChild: T,
      refChild: Node | null,
    ): T {
      if (refChild && refChild.parentNode !== this) {
        // 参考节点被翻译插件弄丢了，我们退而求其次插入到容器末尾
        return srcInsertBefore.apply(this, [newChild, null]) as T;
      }
      return srcInsertBefore.apply(this, [newChild, refChild]) as T;
    };
  };

  /**
   * 激活逻辑：检测到翻译时应用补丁并打印日志
   */
  const checkAndActivate = () => {
    if (isToolActive()) {
      // 1. 动态挂载补丁
      applySafePatch();

      // 2. 打印激活日志（仅打印一次）
      if (!(window as any).__GT_FIX_LOGGED__) {
        (window as any).__GT_FIX_LOGGED__ = true;
        console.info(
          '%c[Translate Fix] 检测到翻译工具运行，DOM 保护已激活。',
          'color: #1677ff; font-weight: bold; padding: 2px 4px; border-radius: 2px; background: rgba(22, 119, 255, 0.1);',
        );
      }
    }
  };

  // --- 智能触发链 ---

  // 1. 初始检查
  checkAndActivate();

  // 2. 动态监听：当翻译工具被点击、语言被更改、或翻译标记被注入时，触发激活检查
  const observer = new MutationObserver(() => {
    checkAndActivate();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'lang'],
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, attributes: true });
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      if (document.body)
        observer.observe(document.body, { childList: true, attributes: true });
    });
  }
}
