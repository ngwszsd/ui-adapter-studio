import React, { useState, useEffect } from 'react';
import { openEditMcpDialog } from './components/EditMcpDialog.tsx';
import {
  DebugView,
  type JsonSchemaPropertiesItemType,
} from './components/DebugView.tsx';
import { PageHeader } from '@/components/PageHeader.tsx';
import { cn } from '@/lib/utils.ts';
import {
  Label,
  EnhancedInput as Input,
  EnhancedButton as Button,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  List,
  openTipsModal,
  openModalError,
  EnhancedAvatar,
  message,
  DivSkeleton,
} from '@teamhelper/ui';
import {
  type AuthConfigResult,
  openAuthConfigDialog,
} from '../AuthConfigDialog.tsx';
import { useTranslation } from 'react-i18next';
import {
  delMcpListApi,
  getMcpDetailApi,
  type McpInfoDetailDto,
  type McpParsedResultDto,
  parseMcpAddressApi,
} from '@/pages/ManageDetail/MenuPage/McpService/server.ts';
import { useNavigate } from 'react-router';
import { convertObjectToArray } from './components/DebugView';
import { useManageDetailContext } from '@/pages/ManageDetail/context/ManageDetailContext.tsx';

function McpServerDetail() {
  const navigate = useNavigate();
  const { t } = useTranslation('manageDetail');
  const { pageParams } = useManageDetailContext();
  const { id } = pageParams as { id: number };
  const [parsing, setParsing] = useState(false);
  // 左侧：MCP 信息与工具列表
  const [parsedData, setParsedData] = React.useState<McpParsedResultDto[]>([]);
  const [activeTool, setActiveTool] = useState<McpParsedResultDto | null>(
    parsedData?.[0],
  );
  const [activeToolIndex, setActiveToolIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [mcpDetailInfo, setMcpDetailInfo] = useState<McpInfoDetailDto>();
  const fetchMcpDetail = async () => {
    try {
      setLoading(true);
      const { data } = await getMcpDetailApi(id as number);
      setMcpDetailInfo(data);
      setParsedData((data?.tools as McpParsedResultDto[]) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id) fetchMcpDetail();
  }, [id]);

  useEffect(() => {
    if (parsedData.length > 0) {
      setActiveTool(parsedData[0]);
      setActiveToolIndex(0);
    }
  }, [parsedData]);

  // 解析mcp
  const handleInterpret = async () => {
    try {
      setParsing(true);
      const response = await parseMcpAddressApi({
        server_url: mcpDetailInfo?.service_url as string,
        headers: mcpDetailInfo?.auth_config,
      });

      if (response.data) {
        setParsedData(response.data);
        message.success(t('createMcp.parse.success'));
      } else {
        setParsedData([]);
      }
    } catch (error) {
      console.error(t('createMcp.parse.error'), error);
      setParsedData([]);
    } finally {
      setParsing(false);
    }
  };

  // 查看工具详情弹窗
  const openToolDetail = (tool: McpParsedResultDto) => {
    const data = JSON.parse(tool.param || '{}');
    const params: {
      default: number | string;
      description: string;
      id: string;
      type: string;
      required?: boolean;
      renderType?: string;
    }[] = convertObjectToArray(data).map((t) => {
      const renderType = (typeItem: JsonSchemaPropertiesItemType) => {
        const type = typeItem.type;
        const items = typeItem.items;
        let t: string = 'Array';
        if (type === 'string') t = 'String';
        if (type === 'number' || type === 'integer') t = 'Number';
        if (type === 'boolean') t = 'Boolean';
        if (type === 'object') t = 'Object';
        if (type === 'array') {
          t = `Array<${items?.type}>`;
        }
        return t;
      };
      return {
        ...t,
        type: t?.type || 'array',
        renderType: renderType(t),
        required: tool.required?.includes(t.id),
      };
    });
    openTipsModal(
      <div className="space-y-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center space-x-3 border-b border-border pb-5">
          <EnhancedAvatar
            src={mcpDetailInfo?.icon_url}
            className="bg-orange-100/70 w-[46px] h-[46px] rounded-[8px] shrink-0"
            shape="square"
          ></EnhancedAvatar>

          <div className="space-y-1">
            <div className="text-sm text-foreground font-medium">
              {tool?.tool_name}
            </div>
            <div className="text-xs text-muted-foreground">
              {tool?.description}
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="text-sm font-medium pb-3">
            {t('mcpDetail.toolDetail.params')}
          </div>

          <div className="space-y-3 flex flex-col flex-1 min-h-0 overflow-y-auto">
            {params.length ? (
              params.map((p) => (
                <div key={p.id} className="border-b pb-2">
                  <div className="flex items-center text-sm space-x-5">
                    <div className="flex gap-1">
                      <div className="text-foreground">{p.id}</div>
                      {p.required && (
                        <span className="text-destructive text-xs">*</span>
                      )}
                    </div>

                    <div className="text-muted-foreground">
                      {t('mcpDetail.toolDetail.type')} ({p.renderType})
                    </div>
                  </div>
                  <div className="pt-1">{p.description}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">
                {t('mcpDetail.toolDetail.noParams')}
              </div>
            )}
          </div>
        </div>
      </div>,
      {
        title: t('mcpDetail.toolDetail.title'),
        okText: t('mcpDetail.toolDetail.confirm'),
        cancelText: null,
        className: 'w-[620px]',
        classNames: {
          body: 'flex flex-col flex-1 min-h-0',
          footer: 'border-t border-border',
        },
      },
    );
  };

  return (
    <div className="flex bg-card h-full">
      {/* 左侧：服务信息 + 工具列表 */}
      <div className="w-[518px] border-r border-border px-5 pt-4 pb-5 flex flex-col flex-1">
        <PageHeader
          subTitle={t('mcpDetail.back')}
          classNames={{
            box: 'px-0 pt-0',
          }}
        />

        <div className="pb-3.5 border-b border-border">
          {/* 标题与描述 */}
          <div className="flex flex-col">
            <DivSkeleton isSkeleton={loading} className="h-7">
              <div className="text-lg font-bold">{mcpDetailInfo?.name}</div>
            </DivSkeleton>

            <DivSkeleton isSkeleton={loading} className="h-4 mt-1.5">
              <div className="text-muted-foreground text-xs mt-1.5">
                {mcpDetailInfo?.description}
              </div>
            </DivSkeleton>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3.5 mt-5">
            <DivSkeleton isSkeleton={loading} className="w-[76px] h-8">
              <Button
                size="small"
                className={cn(
                  'border border-primary text-primary bg-transparent',
                  'hover:border-primary/70 hover:text-primary/70 hover:bg-transparent',
                  'w-[76px] text-xs',
                )}
                onClick={async () => {
                  const bool = await openEditMcpDialog({ mcpDetailInfo });
                  if (bool) {
                    await fetchMcpDetail();
                  }
                }}
              >
                {t('mcpDetail.actions.edit')}
              </Button>
            </DivSkeleton>

            <DivSkeleton isSkeleton={loading} className="w-[76px] h-8">
              <Button
                size="small"
                className={cn(
                  'border border-destructive text-destructive bg-transparent',
                  'hover:border-destructive/70 hover:text-destructive/70 hover:bg-transparent',
                  'w-[76px] text-xs',
                )}
                onClick={() => {
                  openModalError({
                    title: t('mcpDetail.delete.title'),
                    content: t('mcpDetail.delete.content', {
                      name: mcpDetailInfo?.name,
                    }),
                    onOkBeforeFunction: async () => {
                      const statusData = await delMcpListApi(id);
                      message.success(t('toast.delete.success'));
                      navigate(-1);
                      return !!statusData.data;
                    },
                  });
                }}
              >
                {t('mcpDetail.actions.delete')}
              </Button>
            </DivSkeleton>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {/* MCP 地址 */}
          <div className="py-5">
            <Label className="mb-[18px] justify-between">
              <div className="text-foreground text-base font-medium">
                {t('mcpDetail.mcpUrl.label')}
              </div>

              <DivSkeleton isSkeleton={loading} className="w-14 h-5">
                <Button
                  type="link"
                  className="p-0 h-auto"
                  onClick={async () => {
                    let params = {};
                    if (mcpDetailInfo?.auth_type === 1) {
                      const [scheme, token] = (
                        mcpDetailInfo.auth_config?.Authorization as string
                      ).split(' ', 2);
                      params = {
                        headers: mcpDetailInfo.auth_config,
                        kind: scheme as AuthConfigResult['kind'],
                        bearerValue: token,
                      };
                    } else {
                      params = {
                        headers: mcpDetailInfo?.auth_config,
                        kind: 'Custom',
                        bearerValue: '',
                      };
                    }
                    const config = await openAuthConfigDialog({
                      authConfig: params as AuthConfigResult,
                    });
                    if (Object.keys(config).length > 0) {
                      setMcpDetailInfo((prevState) => {
                        if (!prevState) return prevState;
                        return {
                          ...prevState,
                          auth_config: config.headers,
                          auth_type: config.kind === 'Bearer' ? 1 : 2,
                        };
                      });
                    }
                  }}
                >
                  {t('mcpDetail.authConfig')}
                </Button>
              </DivSkeleton>
            </Label>

            <div className="flex gap-4">
              <DivSkeleton isSkeleton={loading} className="flex-1 h-9">
                <Input
                  value={mcpDetailInfo?.service_url}
                  onChange={(e) => {
                    setMcpDetailInfo((prevState) => {
                      if (!prevState) return prevState;
                      return {
                        ...prevState,
                        service_url: e.target.value,
                      };
                    });
                  }}
                  placeholder={t('mcpDetail.mcpUrl.placeholder')}
                />
              </DivSkeleton>

              <DivSkeleton isSkeleton={loading} className="w-15 h-9">
                <Button
                  type="primary"
                  onClick={handleInterpret}
                  disabled={parsing}
                >
                  {parsing ? t('createMcp.parsing') : t('createMcp.parse')}
                </Button>
              </DivSkeleton>
            </div>
          </div>

          {/* 工具列表 */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="p-0 pb-4">
              <DivSkeleton isSkeleton={loading} className="w-full h-4">
                <CardTitle>
                  {t('mcpDetail.toolsList.title', {
                    count: parsedData?.length,
                  })}
                </CardTitle>
              </DivSkeleton>
            </CardHeader>

            <CardContent className="p-0 border border-border rounded-lg flex-1 overflow-hidden">
              <List
                dataSource={parsedData}
                estimatedItemSize={62}
                itemKey={(tool, index) => index}
                style={{ height: '100%' }}
                renderItem={(tool, idx) => {
                  const isActive = activeToolIndex === idx;
                  return (
                    <div
                      className={cn(isActive && 'bg-background')}
                      onClick={() => {
                        setActiveTool(tool);
                        setActiveToolIndex(idx);
                      }}
                    >
                      <div
                        className={cn(
                          `flex items-center py-3 mx-3 cursor-pointer border-b border-border`,
                        )}
                      >
                        <DivSkeleton isSkeleton={loading} className="w-7 h-5">
                          <div className="w-7 text-muted-foreground font-medium text-sm">
                            {String(idx + 1).padStart(2, '0')}
                          </div>
                        </DivSkeleton>

                        <div className="flex-1 flex flex-col min-h-0 min-w-0">
                          <DivSkeleton
                            isSkeleton={loading}
                            className="w-6/12 h-5"
                          >
                            <div
                              className="text-sm font-medium truncate"
                              title={tool.tool_name}
                            >
                              {tool.tool_name}
                            </div>
                          </DivSkeleton>

                          <DivSkeleton
                            isSkeleton={loading}
                            className="w-11/12 h-4 mt-1"
                          >
                            <div className="text-xs text-muted-foreground mt-1 truncate">
                              {tool.description}
                            </div>
                          </DivSkeleton>
                        </div>

                        <DivSkeleton isSkeleton={loading} className="w-12 h-8">
                          <Button
                            type="link"
                            size="small"
                            className="px-0 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              openToolDetail(tool);
                            }}
                          >
                            {t('mcpDetail.toolDetail.viewDetail')}
                          </Button>
                        </DivSkeleton>
                      </div>
                    </div>
                  );
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 右侧：调试视图 */}
      <DebugView
        activeTool={activeTool}
        mcpDetailInfo={mcpDetailInfo}
        loading={loading}
        parsedData={parsedData}
      />
    </div>
  );
}

export default McpServerDetail;
