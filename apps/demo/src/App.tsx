import { router } from './routes';
import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@/context/themeContext';
import NiceModal from '@ebay/nice-modal-react';
import {
  Toaster,
  TooltipProvider,
  ConfigProvider,
  zhCN,
  enUS,
} from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const AppContent = () => {
  const { i18n } = useTranslation();

  const locale = useMemo(() => {
    return i18n.language.startsWith('zh') ? zhCN : enUS;
  }, [i18n.language]);

  return (
    <ConfigProvider locale={locale}>
      <NiceModal.Provider>
        <TooltipProvider>
          <div className="w-full h-screen relative overflow-y-hidden">
            <RouterProvider router={router} />
          </div>
          <Toaster />
        </TooltipProvider>
      </NiceModal.Provider>
    </ConfigProvider>
  );
};

const App = () => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
