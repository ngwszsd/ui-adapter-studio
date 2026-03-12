import {
  useApi,
  createNewRequest,
} from '@/pages/ManageDetail/MenuPage/ApiService/context/ApiContext.tsx';
import type { ApiRequest } from '@/pages/ManageDetail/MenuPage/ApiService/context/ApiContext.tsx';
import { openSaveAsRequestDialog } from './SaveAsRequestDialog.tsx';
import { openGenerateCodeDialog } from './GenerateCodeDialog.tsx';
import { openImportCurlDialog } from './ImportCurlDialog.tsx';
import {
  EnhancedInput as Input,
  DropdownButton,
  EnhancedSelect as Select,
  message,
} from '@teamhelper/ui';
import { cn } from '@/lib/utils.ts';
import {
  addApi,
  type ApiParams,
  editApi,
  type CurlHttpInfoDto,
  executeApiInterface,
} from '@/pages/ManageDetail/MenuPage/ApiService/server.ts';
import { useParams } from 'react-router';
import { useFetchApiGroups } from '@/pages/ManageDetail/MenuPage/ApiService/store';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  jsonToBodyParamList,
  bodyParamListToJson,
  METHOD_COLORS,
  METHOD_MAP,
  BODY_MODE_MAP,
  METHOD_MAP_REVERSE,
  BODY_MODE_MAP_REVERSE,
} from '../utils';

const HTTP_METHODS: Array<{
  value: ApiRequest['method'];
  label: string;
  color: string;
}> = [
  { value: 'GET', label: 'GET', color: METHOD_COLORS.GET },
  { value: 'POST', label: 'POST', color: METHOD_COLORS.POST },
  // { value: 'PUT', label: 'PUT', color: METHOD_COLORS.PUT },
  // { value: 'DELETE', label: 'DELETE', color: METHOD_COLORS.DELETE },
  // { value: 'PATCH', label: 'PATCH', color: METHOD_COLORS.PATCH },
];
export function RequestBar() {
  const { t } = useTranslation('manageDetail');
  const { activeRequest, dispatch } = useApi();
  const { project_id } = useParams<{ project_id: string }>();
  const [sendLoading, setSendLoading] = useState(false);
  const fetchApiGroups = useFetchApiGroups();

  if (!activeRequest) return null;

  const handleMethodChange = (method: ApiRequest['method']) => {
    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: { method },
      },
    });
  };

  const handleUrlChange = (url: string) => {
    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: { url },
      },
    });
  };

  const handleSendRequest = async () => {
    if (!activeRequest?.url) {
      return message.error(t('apiService.bar.enterUrl'));
    }
    try {
      setSendLoading(true);
      const res = await executeApiInterface({
        body_mode: BODY_MODE_MAP[activeRequest.body.type] || 1,
        method: METHOD_MAP[activeRequest.method] || 1,
        url_template: activeRequest.url,
        params_list: activeRequest.params?.map((p) => ({
          code: p.key,
          value: p.value,
          enable: p.enable,
        })),
        header_list: activeRequest.headers?.map((h) => ({
          code: h.key,
          value: h.value,
          enable: h.enable,
        })),
        body_param_list:
          activeRequest.body.type === 'application/json'
            ? jsonToBodyParamList(activeRequest.body.content || '')
            : activeRequest.body.formData?.map((f) => ({
                code: f.key,
                value: f.value,
                type: f.type,
                enable: f.enable,
              })) || [],
      });
      const data = res.data;
      dispatch({
        type: 'UPDATE_REQUEST',
        payload: {
          id: activeRequest.id,
          updates: {
            response: data,
          },
        },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSendLoading(false);
    }
  };

  const handleSaveRequest = async (saveType?: 'save-as') => {
    try {
      if (!activeRequest.name) {
        return message.error(t('apiService.bar.enterRequestName'));
      }

      const saveParams: ApiParams = {
        project_id: Number(project_id),
        name: activeRequest.name,
        method: METHOD_MAP[activeRequest.method] || 1,
        url_template: activeRequest.url || '',
        body_mode: BODY_MODE_MAP[activeRequest.body.type] || 1,
        param_list: activeRequest.params?.map((p) => ({
          code: p.key,
          value: p.value,
          enable: p.enable,
        })),
        header_list: activeRequest.headers?.map((h) => ({
          code: h.key,
          value: h.value,
          enable: h.enable,
        })),
        body_param_list:
          activeRequest.body.type === 'application/json'
            ? jsonToBodyParamList(activeRequest.body.content || '')
            : activeRequest.body.formData?.map((f) => ({
                code: f.key,
                value: f.value,
                type: f.type,
                enable: f.enable,
              })) || [],
      };

      if (
        saveType === 'save-as' ||
        (!activeRequest.groupId && activeRequest.status !== 'existing')
      ) {
        const res = await openSaveAsRequestDialog({
          defaultName: activeRequest.name,
          project_id: Number(project_id),
        });
        if (!res) return;
        saveParams.name = res.name;
        saveParams.group_id = Number(res.folderKey);
      } else {
        saveParams.group_id = activeRequest.groupId;
      }

      if (activeRequest.status === 'existing' && saveType !== 'save-as') {
        saveParams.id = activeRequest.id;
        await editApi(saveParams);
        dispatch({
          type: 'UPDATE_REQUEST',
          payload: {
            id: activeRequest.id,
            updates: { status: 'existing' },
          },
        });
      } else {
        const res = await addApi(saveParams);
        if (res.data) {
          const newId = Number(res.data);

          if (saveType === 'save-as') {
            // Save As: Create new request/tab
            const newRequest = JSON.parse(JSON.stringify(activeRequest));
            newRequest.id = newId;
            newRequest.status = 'existing';
            newRequest.groupId = saveParams.group_id;
            newRequest.name = saveParams.name;

            dispatch({ type: 'ADD_REQUEST', payload: newRequest });
            dispatch({ type: 'SET_ACTIVE_REQUEST', payload: newId });
          } else {
            // New Request Save: Update current tab
            dispatch({
              type: 'UPDATE_REQUEST',
              payload: {
                id: activeRequest.id,
                updates: {
                  id: newId,
                  status: 'existing',
                  groupId: saveParams.group_id,
                  name: saveParams.name,
                },
              },
            });
            dispatch({
              type: 'SET_ACTIVE_REQUEST',
              payload: newId,
            });
          }
        }
      }

      message.success(t('apiService.bar.saveSuccess'));
      fetchApiGroups(Number(project_id));
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const currentMethod = HTTP_METHODS.find(
    (m) => m.value === activeRequest.method,
  );

  return (
    <div className="flex items-center gap-3 p-5 pb-2.5 bg-card">
      {/* HTTP 方法选择器 */}
      <div className="w-27">
        <Select
          options={HTTP_METHODS.map((m) => ({
            value: m.value,
            label: m.label,
          }))}
          value={activeRequest.method}
          onChange={(v) => handleMethodChange(v as ApiRequest['method'])}
          searchable={false}
          allowClear={false}
          showCheck={false}
          listHeight="auto"
          inputClassName={cn(currentMethod?.color, 'font-medium')}
        />
      </div>

      {/* URL 输入框 */}
      <div className="flex-1">
        <Input
          type="text"
          placeholder="URL"
          value={activeRequest.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="h-9"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3">
        <DropdownButton
          dropdownProps={{
            menu: {
              items: [
                {
                  key: 'curl',
                  label: t('apiService.bar.importCurl'),
                  cursorPointer: true,
                },
                {
                  key: 'code',
                  label: t('apiService.bar.generateCode'),
                  cursorPointer: true,
                },
                {
                  key: 'clear',
                  label: t('apiService.bar.clearAll'),
                  danger: true,
                  cursorPointer: true,
                },
              ],
              onClick: async ({ key, domEvent }) => {
                domEvent.stopPropagation();
                switch (key) {
                  case 'clear': {
                    const defaultReq = createNewRequest();
                    dispatch({
                      type: 'UPDATE_REQUEST',
                      payload: {
                        id: activeRequest.id,
                        updates: {
                          method: defaultReq.method,
                          url: defaultReq.url,
                          params: defaultReq.params,
                          headers: defaultReq.headers,
                          body: defaultReq.body,
                          response: null,
                        },
                      },
                    });
                    message.success(t('apiService.bar.cleared'));
                    return;
                  }
                  case 'code': {
                    await openGenerateCodeDialog({
                      request: activeRequest,
                    });
                    return;
                  }
                  case 'curl': {
                    const parsed = await openImportCurlDialog();
                    if (!parsed) return;

                    message.success(t('apiService.bar.importCurlSuccess'));

                    // Determining body type:
                    // parsed.body_mode usually comes as number from backend (1,2,3,4) or string?
                    // Based on previous code it could be 'application/json' (string).
                    // Let's handle both.
                    let bodyType: ApiRequest['body']['type'] = 'none';
                    if (parsed.body_mode) {
                      const modeNum =
                        typeof parsed.body_mode === 'number'
                          ? parsed.body_mode
                          : BODY_MODE_MAP[parsed.body_mode];
                      if (modeNum && BODY_MODE_MAP_REVERSE[modeNum]) {
                        bodyType = BODY_MODE_MAP_REVERSE[
                          modeNum
                        ] as ApiRequest['body']['type'];
                      }
                    }

                    const methodKey = parsed.method as number;
                    const method = (METHOD_MAP_REVERSE[methodKey] ||
                      'GET') as ApiRequest['method'];

                    dispatch({
                      type: 'UPDATE_REQUEST',
                      payload: {
                        id: activeRequest.id,
                        updates: {
                          method: method,
                          url: (parsed.base_url || '') + (parsed.path || ''),
                          headers:
                            parsed.header_list?.map((h) => ({
                              key: h.code,
                              value: h.value,
                              enable: h.enable ?? (h as any).enabled ?? true,
                            })) || [],
                          params:
                            parsed.param_list?.map((p) => ({
                              key: p.code,
                              value: p.value,
                              enable: p.enable ?? (p as any).enabled ?? true,
                            })) || [],
                          body: {
                            ...createNewRequest().body,
                            type: bodyType,
                            content:
                              bodyType === 'application/json'
                                ? bodyParamListToJson(
                                    parsed.body_param_list || [],
                                  )
                                : '',
                            formData:
                              bodyType !== 'application/json' &&
                              bodyType !== 'none'
                                ? parsed.body_param_list?.map((b) => ({
                                    key: b.code,
                                    value: b.value,
                                    type: 'text' as const,
                                    enable:
                                      b.enable ?? (b as any).enabled ?? true,
                                  })) || []
                                : [],
                          },
                        },
                      },
                    });
                  }
                }
              },
            },
          }}
          onClick={handleSendRequest}
          disabled={sendLoading}
        >
          {sendLoading ? t('apiService.bar.sending') : t('apiService.bar.send')}
        </DropdownButton>

        <DropdownButton
          dropdownProps={{
            menu: {
              items: [
                {
                  key: 'save-as',
                  label: t('apiService.bar.saveAs'),
                  cursorPointer: true,
                },
              ],
              onClick: async ({ key, domEvent }) => {
                domEvent.stopPropagation();
                switch (key) {
                  case 'save-as':
                    handleSaveRequest('save-as');
                    return;
                }
              },
            },
          }}
          onClick={() => handleSaveRequest()}
          type="default"
          className="bg-background hover:bg-foreground/10"
        >
          {t('apiService.bar.save')}
        </DropdownButton>
      </div>
    </div>
  );
}
