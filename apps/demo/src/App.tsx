import { Editor } from '@teamhelper/ui-adapter';
import { TooltipProvider, Toaster, ConfigProvider, zhCN } from '@teamhelper/ui';
import NiceModal from '@ebay/nice-modal-react';
import { ThemeProvider } from '@/context/themeContext';

const App = () => {
  return (
    <ThemeProvider>
      <ConfigProvider locale={zhCN}>
        <NiceModal.Provider>
          <TooltipProvider>
            <div className="w-full h-screen relative overflow-y-hidden">
              <Editor projectId="demo-project" />
            </div>
            <Toaster />
          </TooltipProvider>
        </NiceModal.Provider>
      </ConfigProvider>
    </ThemeProvider>
  );
};

export default App;
