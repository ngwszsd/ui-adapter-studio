import React, { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ChevronDown,
  ChevronUp,
  Bug,
} from 'lucide-react';
import {
  handleChunkLoadError,
  manualCheckAndRefresh,
} from '@/utils/versionCheck';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  isCheckingVersion: boolean;
  autoRefreshCountdown: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ErrorBoundaryClass extends Component<
  ErrorBoundaryProps & { t: any },
  ErrorBoundaryState
> {
  private autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(props: ErrorBoundaryProps & { t: any }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      isCheckingVersion: false,
      autoRefreshCountdown: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // 检测是否为资源加载错误或版本更新导致的错误
    this.checkIfVersionError(error);
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    window.removeEventListener(
      'unhandledrejection',
      this.handlePromiseRejection,
    );
    window.removeEventListener('error', this.handleGlobalError);
    this.clearAutoRefreshTimer();
  }

  handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error caught:', event.error || event.message);
    if (event.message.includes('ResizeObserver loop')) {
      return;
    }
    this.setState({
      hasError: true,
      error: event.error || new Error(event.message),
    });
  };

  handlePromiseRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);
    this.setState({ hasError: true, error: event.reason });
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  /**
   * 检测错误是否可能由版本更新引起
   */
  checkIfVersionError = async (error: Error) => {
    const errorMessage = error.message || '';
    const isVersionRelatedError =
      errorMessage.includes('Unexpected token') ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('Loading CSS chunk') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('dynamically imported module') ||
      error.name === 'ChunkLoadError';

    if (isVersionRelatedError) {
      console.log(
        '[ErrorBoundary] Detected potential version error, checking for updates...',
      );
      this.setState({ isCheckingVersion: true });

      try {
        // 通知版本检查系统
        handleChunkLoadError(error);

        // 手动检查版本
        const hasUpdate = await manualCheckAndRefresh();

        if (hasUpdate) {
          // 检测到版本更新，启动倒计时自动刷新
          this.startAutoRefreshCountdown();
        } else {
          // 没有检测到版本更新，可能是网络问题
          this.setState({ isCheckingVersion: false });
        }
      } catch (err) {
        console.error('[ErrorBoundary] Failed to check version:', err);
        this.setState({ isCheckingVersion: false });
      }
    }
  };

  /**
   * 启动自动刷新倒计时
   */
  startAutoRefreshCountdown = () => {
    this.setState({
      isCheckingVersion: false,
      autoRefreshCountdown: 5,
    });

    this.autoRefreshTimer = setInterval(() => {
      this.setState((prev) => {
        const newCountdown = (prev.autoRefreshCountdown || 0) - 1;

        if (newCountdown <= 0) {
          this.clearAutoRefreshTimer();
          window.location.reload();
          return null;
        }

        return {
          ...prev,
          autoRefreshCountdown: newCountdown,
        };
      });
    }, 1000);
  };

  /**
   * 清除自动刷新定时器
   */
  clearAutoRefreshTimer = () => {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  };

  /**
   * 取消自动刷新
   */
  cancelAutoRefresh = () => {
    this.clearAutoRefreshTimer();
    this.setState({ autoRefreshCountdown: null });
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
              {t('components:errorBoundary.title')}
            </h1>

            {/* Description */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {t('components:errorBoundary.description')}
            </p>

            {/* Version Check Status */}
            {this.state.isCheckingVersion && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {t('components:errorBoundary.checkingVersion')}
                  </p>
                </div>
              </div>
            )}

            {/* Auto Refresh Countdown */}
            {this.state.autoRefreshCountdown !== null && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                    {t('components:errorBoundary.newVersionDetected', {
                      countdown: this.state.autoRefreshCountdown,
                    })}
                  </p>
                  <button
                    onClick={this.cancelAutoRefresh}
                    className="text-xs text-green-700 dark:text-green-400 hover:underline"
                  >
                    {t('components:errorBoundary.cancelAutoRefresh')}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {this.state.error?.message && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 dark:text-red-300 font-mono wrap-break-word">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-5 h-5" />
                {t('components:errorBoundary.reset')}
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Home className="w-5 h-5" />
                {t('components:errorBoundary.goHome')}
              </button>
            </div>

            {/* Toggle Details */}
            <button
              onClick={this.toggleDetails}
              className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 py-2 transition-colors duration-200"
            >
              {this.state.showDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  {t('components:errorBoundary.hideDetails')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  {t('components:errorBoundary.showDetails')}
                </>
              )}
            </button>

            {/* Error Details */}
            {this.state.showDetails && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('components:errorBoundary.errorDetails')}
                  </h3>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-4 overflow-auto max-h-64">
                  <pre className="text-xs text-gray-800 dark:text-gray-300 font-mono whitespace-pre-wrap wrap-break-word">
                    {this.state.error?.stack || 'No stack trace available'}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to inject translation
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const { t } = useTranslation('components');
  return <ErrorBoundaryClass t={t}>{children}</ErrorBoundaryClass>;
};
