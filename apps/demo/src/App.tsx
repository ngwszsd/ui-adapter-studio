import { Editor } from '@teamhelper/ui-adapter';
import { TooltipProvider, Toaster } from '@teamhelper/ui';
import NiceModal from '@ebay/nice-modal-react';

const App = () => {
  return (
    <NiceModal.Provider>
      <TooltipProvider>
        <div className="w-full h-screen">
          <Editor projectId="demo-project" />
        </div>
        <Toaster />
      </TooltipProvider>
    </NiceModal.Provider>
  );
};

export default App;
