import { useApi } from '@/pages/ManageDetail/MenuPage/ApiService/context/ApiContext.tsx';
import { ParamsEditor } from './ParamsEditor.tsx';
import { BodyEditor } from './BodyEditor.tsx';
import { HeadersEditor } from './HeadersEditor.tsx';
import React from 'react';
import { EnhancedTabs as Tabs } from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';

export function RequestDetailTabs() {
  const { activeRequest, dispatch } = useApi();
  const { t } = useTranslation('manageDetail');

  if (!activeRequest) return null;

  const handleTabChange = (value: string) => {
    dispatch({
      type: 'SET_ACTIVE_TAB',
      payload: value as 'params' | 'body' | 'headers' | 'auth',
    });
  };
  const renderTabContent = React.useCallback(() => {
    switch (activeRequest.activeTab) {
      case 'params':
        return <ParamsEditor />;
      case 'body':
        return <BodyEditor setContentType={() => handleTabChange('headers')} />;
      case 'headers':
        return <HeadersEditor />;
      default:
        return null;
    }
  }, [activeRequest.activeTab]);
  return (
    <div className="flex-1 min-h-0">
      <div className="flex flex-col h-full">
        <Tabs
          type={'line'}
          items={[
            {
              label: t('apiService.tabs.params'),
              key: 'params',
            },
            {
              label: t('apiService.tabs.body'),
              key: 'body',
            },
            {
              label: t('apiService.tabs.headers'),
              key: 'headers',
            },
          ]}
          underline
          activeKey={activeRequest.activeTab}
          onChange={handleTabChange}
          listClassName="w-full justify-start"
        ></Tabs>
        <div className="flex-1 min-h-0">{renderTabContent()}</div>
      </div>
    </div>
  );
}
