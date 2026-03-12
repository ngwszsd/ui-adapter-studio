import React from 'react';
import { useTranslation } from 'react-i18next';
import { CircleCheck, Copy } from 'lucide-react';
import {
  EnhancedButton as Button,
  EnhancedTabs as Tabs,
  message,
} from '@teamhelper/ui';
import { ReactSyntaxHighlighter } from '@/components/common/ReactSyntaxHighlighter';
import copy from 'copy-to-clipboard';
import { useApi } from '../context/ApiContext';
import { useMemo } from 'react';
import { cn } from '@/lib/utils.ts';

export default function ResponseDetail() {
  const { activeRequest } = useApi();
  const { t } = useTranslation('manageDetail');
  const [activeTab, setActiveTab] = React.useState('json');

  const response = activeRequest?.response;

  // 尝试解析 JSON
  const jsonContent = useMemo(() => {
    if (!response?.body) return '';
    try {
      return JSON.stringify(JSON.parse(response.body), null, 2);
    } catch (e) {
      return response.body || '';
    }
  }, [response?.body]);

  if (!activeRequest || !response) {
    return (
      <div className="flex flex-col px-5 h-full items-center justify-center text-muted-foreground text-sm">
        {t('apiService.response.empty')}
      </div>
    );
  }

  const rawContent = response.body || '';

  const headers =
    response.response_header_list?.map((h) => ({
      key: h.code,
      value: h.value,
    })) || [];

  const renderJsonTab = () => (
    <div className="border border-t-0 flex flex-col h-full">
      <ReactSyntaxHighlighter language="json">
        {jsonContent}
      </ReactSyntaxHighlighter>
    </div>
  );

  const renderRawTab = () => (
    <div className="border border-t-0 flex flex-col h-full">
      <ReactSyntaxHighlighter language="javascript">
        {rawContent}
      </ReactSyntaxHighlighter>
    </div>
  );

  const renderHeadersTab = () => (
    <div className="flex flex-col h-full">
      <div className="text-sm font-medium text-muted-foreground py-5">
        {t('apiService.response.headersList')}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {headers.map((h) => (
          <div key={h.key} className="flex items-center justify-between">
            <div className="text-sm font-medium flex items-center">
              <div className="text-muted-foreground w-[268px]">{h.key}</div>
              <div className="text-foreground flex-1">{h.value}</div>
            </div>

            <Button
              size="small"
              type="link"
              onClick={() => {
                copy(h.value);
                message.success(t('apiService.response.copySuccess'));
              }}
            >
              <Copy />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col px-5 h-full overflow-hidden">
      {/* 顶部状态信息区域 */}
      <div className="flex items-center justify-between pt-4 pb-3 bg-card border-b">
        <div className="flex items-center space-x-4 text-xs">
          <span className="flex items-center">
            <CircleCheck
              className={cn(
                'w-[14px] h-[14px] mr-1',
                response.status_code === 200
                  ? 'text-green-600'
                  : 'text-destructive',
              )}
            />

            <span
              className={cn(
                'text-green-600 font-semibold',
                response.status_code === 200
                  ? 'text-green-600'
                  : 'text-destructive',
              )}
            >
              {t('apiService.response.status', {
                status: response.status_code,
              })}
            </span>
          </span>
          <span className="text-muted-foreground">
            {t('apiService.response.duration', {
              duration: response.duration_millis,
            })}
          </span>
          <span className="text-muted-foreground">
            {t('apiService.response.size', { size: response.size_bytes })}
          </span>
        </div>
      </div>

      {/* 页签与内容 */}
      <div className="pt-3 flex-1 min-h-0">
        <Tabs
          type="line"
          underline
          activeKey={activeTab}
          onChange={setActiveTab}
          listClassName="flex justify-between items-center w-full"
          items={[
            {
              key: 'json',
              label: 'JSON',
              children: renderJsonTab(),
              className: 'mt-0 flex-1 min-h-0',
            },
            {
              key: 'raw',
              label: t('apiService.response.raw'),
              children: renderRawTab(),
              className: 'mt-0 flex-1 min-h-0',
            },
            {
              key: 'headers',
              label: t('apiService.response.headersTab'),
              children: renderHeadersTab(),
              className: 'mt-0 flex-1 min-h-0',
            },
          ]}
          tabBarExtraContent={{
            left: null,
            right: (
              <div className="flex items-center ml-auto">
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    // 根据当前激活的 tab 复制对应的内容
                    let contentToCopy = '';
                    switch (activeTab) {
                      case 'json':
                        contentToCopy = jsonContent;
                        break;
                      case 'raw':
                        contentToCopy = rawContent;
                        break;
                      case 'headers':
                        contentToCopy = JSON.stringify(headers, null, 2);
                        break;
                      default:
                        contentToCopy = '';
                    }
                    copy(contentToCopy);
                    message.success(t('apiService.response.copySuccess'));
                  }}
                >
                  <Copy />
                </Button>
              </div>
            ),
          }}
          className="flex flex-col h-full"
        />
      </div>
    </div>
  );
}
