import * as Sentry from '@sentry/react';

export const initMonitoring = () => {
  return; // Temporarily disable Sentry
  const dsnUrl = import.meta.env.PUBLIC_SENTRY_DSN;
  const port = window.location.port;
  const dsnProd =
    port === '7777'
      ? 'https://17e87298e54b96ea2ff7dc2456afbb34@o4507977309487104.ingest.us.sentry.io/4507977313812480'
      : 'https://fdf26321839b4596fc62b83c9b12e59c@o4510674197020672.ingest.de.sentry.io/4510674203050064';
  const isNodeProd = process.env.NODE_ENV === 'production';
  if (dsnUrl) {
    // 7777 开发 us 🇺🇸数据中心
    // 7778 测试 de 🇩🇪数据中心
    Sentry.init({
      dsn: isNodeProd ? dsnProd : dsnUrl,
      // Setting this option to true will send default PII data to Sentry.
      // For example, automatic IP address collection on events
      sendDefaultPii: true,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Tracing
      tracesSampleRate: 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    console.log('Sentry initialized');
  } else {
    console.warn('Sentry DSN not found. Monitoring is disabled.');
  }
};
