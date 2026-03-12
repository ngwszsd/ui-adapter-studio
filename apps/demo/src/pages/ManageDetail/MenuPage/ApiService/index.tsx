import { CirclePlus } from 'lucide-react';
import { useState, memo } from 'react';
import { Resizable } from 're-resizable';
import { ApiProvider } from './context/ApiContext';
import { RequestTabs } from './components/RequestTabs';
import { RequestBar } from './components/RequestBar';
import { RequestDetailTabs } from './components/RequestDetailTabs';
import { ApiDirectoryTree } from './components/ApiDirectoryTree';
import ResponseDetail from './components/ResponseDetail';
import { EnhancedButton, EnhancedInput } from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import { openCreateCollectionModal } from './components/CreateCollectionDialog';
import { useParams } from 'react-router';
import { useFetchApiGroups } from './store';

const APIServerContent = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const { project_id } = useParams<{ project_id: string }>();
  const fetchApiGroups = useFetchApiGroups();
  const { t } = useTranslation('manageDetail');

  return (
    <div className="flex h-full bg-card">
      {/* 左侧可调整面板 */}
      <Resizable
        defaultSize={{
          width: 268,
          height: '100%',
        }}
        minWidth={220}
        maxWidth={400}
        enable={{
          top: false,
          right: true,
          bottom: false,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        handleStyles={{
          right: {
            width: '10px',
            right: '-5px',
          },
        }}
        handleClasses={{
          right:
            'relative z-50 cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:-translate-x-1/2 after:w-[1px] after:h-full after:bg-primary after:opacity-0 hover:after:opacity-100 active:after:opacity-100 after:transition-opacity',
        }}
        className="flex flex-col border-r border-border"
      >
        <div className="p-5 pb-3">
          <EnhancedInput.Search
            placeholder={t('apiService.search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center px-5">
          <EnhancedButton
            type="link"
            className="px-0!"
            onClick={async () => {
              const bool = await openCreateCollectionModal({
                openType: 'folder',
                project_id: Number(project_id),
              });
              // 创建成功后刷新列表
              if (bool.success) {
                fetchApiGroups(Number(project_id));
              }
            }}
          >
            <CirclePlus />
            {t('apiService.actions.add')}
          </EnhancedButton>
        </div>

        <div className="flex-1 min-h-0 px-2">
          <ApiDirectoryTree
            project_id={Number(project_id)}
            searchTerm={searchTerm}
          />
        </div>
      </Resizable>

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* API服务内容区域 */}

        {/* 请求标签页 */}
        <RequestTabs />

        {/* 请求配置区域 */}
        <RequestBar />

        {/* 请求详情标签页 */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <RequestDetailTabs />
        </div>

        <Resizable
          defaultSize={{
            width: '100%',
            height: 300,
          }}
          minHeight={100}
          maxHeight={800}
          enable={{
            top: true,
            right: false,
            bottom: false,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
          handleStyles={{
            top: {
              height: '10px',
              top: '-5px',
            },
          }}
          handleClasses={{
            top: 'relative z-50 cursor-row-resize after:absolute after:inset-x-0 after:top-1/2 after:-translate-y-1/2 after:h-[1px] after:w-full after:bg-primary after:opacity-0 hover:after:opacity-100 active:after:opacity-100 after:transition-opacity',
          }}
          className="flex flex-col bg-card border-t border-border"
        >
          <ResponseDetail />
        </Resizable>
      </div>
    </div>
  );
});

const APIServer = memo(() => {
  return (
    <ApiProvider>
      <APIServerContent />
    </ApiProvider>
  );
});

export default APIServer;
