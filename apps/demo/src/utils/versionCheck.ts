/**
 * 版本检测工具
 * 用于检测应用版本更新，在版本不匹配时自动刷新页面
 * 解决部署新版本后用户浏览器缓存旧资源导致的 "Unexpected token '<'" 错误
 *
 * 性能优化：
 * - 只在页面可见时进行定时检查，后台标签页暂停检查
 * - 使用小间隔（60秒）的轮询，请求体极小（约100字节）
 */

import { toast } from '@teamhelper/ui';
import i18n from '@/i18n';

// ================== 配置 ==================

interface VersionCheckConfig {
  /** 检查间隔（毫秒），默认 60 秒 */
  checkInterval: number;
  /** 是否在页面可见性变化时检查 */
  checkOnVisibilityChange: boolean;
  /** 是否在路由切换时检查 */
  checkOnRouteChange: boolean;
}

const DEFAULT_CONFIG: VersionCheckConfig = {
  checkInterval: 60 * 1000, // 60 秒
  checkOnVisibilityChange: true,
  checkOnRouteChange: true,
};

// ================== 状态 ==================

const VERSION_FILE_PATH = '/version.json';
let currentVersion: string | null = null;
let checkTimer: ReturnType<typeof setInterval> | null = null;
let isRefreshing = false;
let hasShownPrompt = false; // 防止重复显示提示
let config: VersionCheckConfig = { ...DEFAULT_CONFIG };
let isPageVisible = true; // 跟踪页面可见性

// ================== 国际化 ==================

type VersionCheckKeys = 'newVersionDetected' | 'refresh' | 'refreshing';

/**
 * 获取国际化文本
 * 使用类型断言绕过严格类型检查（versionCheck key 在运行时是有效的）
 */
function t(key: VersionCheckKeys): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (i18n.t as any)(`versionCheck.${key}`);
}

// ================== 核心函数 ==================

/**
 * 获取服务器上的最新版本
 */
async function fetchServerVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${VERSION_FILE_PATH}?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn(
        '[VersionCheck] Failed to fetch version file:',
        response.status,
      );
      return null;
    }

    const data = await response.json();
    return data.version || null;
  } catch (error) {
    console.warn('[VersionCheck] Error fetching version:', error);
    return null;
  }
}

/**
 * 检查是否有新版本
 */
async function checkForUpdate(): Promise<boolean> {
  if (isRefreshing) return false;

  const serverVersion = await fetchServerVersion();

  if (!serverVersion) {
    return false;
  }

  // 首次获取版本时，保存当前版本
  if (!currentVersion) {
    currentVersion = serverVersion;
    console.info('[VersionCheck] Current version:', currentVersion);
    return false;
  }

  // 版本不匹配，需要更新
  if (serverVersion !== currentVersion) {
    console.info(
      '[VersionCheck] New version detected:',
      serverVersion,
      '(current:',
      currentVersion,
      ')',
    );
    return true;
  }

  return false;
}

/**
 * 执行页面刷新
 */
function doRefresh(): void {
  if (isRefreshing) return;
  isRefreshing = true;

  console.info('[VersionCheck] Reloading page...');

  // 清除 Service Worker 缓存
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  window.location.reload();
}

/**
 * 使用 sonner Toast 显示更新提示
 * 简洁的提示，让用户决定何时刷新
 */
function showUpdatePrompt(): void {
  if (hasShownPrompt) return;
  hasShownPrompt = true;

  toast.info(t('newVersionDetected'), {
    duration: Infinity, // 不自动关闭
    id: 'version-update-toast',
    closeButton: false,
    action: {
      label: t('refresh'),
      onClick: () => {
        doRefresh();
      },
    },
    onDismiss: () => {
      // 用户关闭后，一段时间后可以再次提示
      setTimeout(
        () => {
          hasShownPrompt = false;
        },
        5 * 60 * 1000,
      ); // 5 分钟后可以再次提示
    },
  });
}

/**
 * 处理版本更新
 * 注意：ErrorBoundary 已经处理了错误场景的紧急恢复（带倒计时自动刷新）
 * 这里只处理正常的定时检查场景，使用简单的 Toast 提示
 */
function handleVersionUpdate(): void {
  if (isRefreshing) return;
  showUpdatePrompt();
}

// ================== 定时器管理（性能优化）==================

/**
 * 启动定时检查器
 * 只在页面可见时运行
 */
function startTimer(): void {
  if (checkTimer) return;

  checkTimer = setInterval(async () => {
    // 只在页面可见时检查
    if (!isPageVisible) return;

    const hasUpdate = await checkForUpdate();
    if (hasUpdate) {
      handleVersionUpdate();
    }
  }, config.checkInterval);

  console.info('[VersionCheck] Timer started');
}

/**
 * 停止定时检查器
 */
function stopTimer(): void {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
    console.info('[VersionCheck] Timer stopped');
  }
}

// ================== 事件监听 ==================

function onVisibilityChange(): void {
  isPageVisible = document.visibilityState === 'visible';

  if (isPageVisible) {
    console.info('[VersionCheck] Page became visible, resuming checks');

    // 页面变为可见时立即检查一次
    if (config.checkOnVisibilityChange) {
      checkForUpdate().then((hasUpdate) => {
        if (hasUpdate) {
          handleVersionUpdate();
        }
      });
    }

    // 重启定时器
    startTimer();
  } else {
    console.info('[VersionCheck] Page became hidden, pausing checks');
    // 页面不可见时停止定时器，节省资源
    stopTimer();
  }
}

function onRouteChange(): void {
  if (!config.checkOnRouteChange) return;

  checkForUpdate().then((hasUpdate) => {
    if (hasUpdate) {
      handleVersionUpdate();
    }
  });
}

// ================== 导出 API ==================

/**
 * 启动版本检查
 * @param customConfig 自定义配置
 */
export function startVersionCheck(
  customConfig?: Partial<VersionCheckConfig>,
): void {
  // 合并配置
  config = { ...DEFAULT_CONFIG, ...customConfig };

  // 初始化页面可见性状态
  isPageVisible = document.visibilityState === 'visible';

  // 先执行一次检查，获取当前版本
  checkForUpdate();

  // 只在页面可见时启动定时器
  if (isPageVisible) {
    startTimer();
  }

  // 监听页面可见性变化（用于暂停/恢复检查）
  document.addEventListener('visibilitychange', onVisibilityChange);

  // 路由切换时检查版本
  window.addEventListener('popstate', onRouteChange);

  console.info('[VersionCheck] Version check started');
}

/**
 * 停止版本检查
 */
export function stopVersionCheck(): void {
  stopTimer();

  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('popstate', onRouteChange);

  console.info('[VersionCheck] Version check stopped');
}

/**
 * 手动检查版本
 * 注意：此函数只检查版本，不会自动刷新页面
 * 刷新逻辑由调用方（如 ErrorBoundary）处理
 * @returns 是否检测到更新
 */
export async function manualCheckAndRefresh(): Promise<boolean> {
  const hasUpdate = await checkForUpdate();
  return hasUpdate;
}

/**
 * 处理资源加载错误（Script/CSS 加载失败）
 * 注意：此函数只记录错误，实际的版本检查和刷新由 ErrorBoundary 处理
 */
export function handleChunkLoadError(error: Error): void {
  console.error('[VersionCheck] Chunk load error detected:', error);

  const isChunkError =
    error.name === 'ChunkLoadError' ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Loading CSS chunk') ||
    error.message?.includes('Unexpected token') ||
    error.message?.includes('Failed to fetch dynamically imported module');

  if (isChunkError) {
    console.info(
      '[VersionCheck] This appears to be a chunk load error. ErrorBoundary will handle recovery.',
    );
  }
}

/**
 * 获取当前版本
 */
export function getCurrentVersion(): string | null {
  return currentVersion;
}

export default {
  startVersionCheck,
  stopVersionCheck,
  manualCheckAndRefresh,
  handleChunkLoadError,
  getCurrentVersion,
};
