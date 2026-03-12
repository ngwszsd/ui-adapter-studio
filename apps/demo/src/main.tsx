import { createRoot } from 'react-dom/client';
import './lib/nice-modal-patch'; // Patch NiceModal to auto-close on route change
import App from './App';
import { StrictMode } from 'react';
import './i18n'; // 导入 i18n 配置
import './main.css';
import './global.css'; // 导入全局主题CSS变量
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initMonitoring } from '@/lib/monitoring';
import { initGoogleTranslateFix } from '@/utils/dom-fix';
import { startVersionCheck, handleChunkLoadError } from '@/utils/versionCheck';

// initMonitoring();

// 启动谷歌翻译崩溃监听修复
initGoogleTranslateFix();

// 生产环境启动版本检测
if (import.meta.env.PROD) {
  startVersionCheck({
    checkInterval: 60 * 1000, // 每 60 秒检查一次（页面不可见时自动暂停）
  });

  // 全局错误处理：捕获资源加载失败
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement;
      // 检查是否是 script 或 link 加载失败
      if (target?.tagName === 'SCRIPT' || target?.tagName === 'LINK') {
        console.error(
          '[ResourceLoadError] Failed to load:',
          (target as HTMLScriptElement).src || (target as HTMLLinkElement).href,
        );
        handleChunkLoadError(new Error('Resource load failed'));
      }
    },
    true,
  );

  // 捕获未处理的 Promise 错误（如动态 import 失败）
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error instanceof Error) {
      handleChunkLoadError(error);
    }
  });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
}
