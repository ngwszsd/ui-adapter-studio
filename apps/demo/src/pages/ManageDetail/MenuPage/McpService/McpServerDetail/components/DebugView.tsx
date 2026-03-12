import React, { useMemo, useState, useEffect } from 'react';
import { Copy, CircleQuestionMark } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import {
  Label,
  EnhancedInput as Input,
  InputNumber,
  Switch,
  EnhancedButton as Button,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  message,
  EnhancedButton,
  DivSkeleton,
  EnhancedTooltip,
} from '@teamhelper/ui';
import { ReactCodemirror } from '@/components/common/ReactCodemirror';
import { ReactSyntaxHighlighter } from '@/components/common/ReactSyntaxHighlighter';
import { useTheme } from '@/context/themeContext.tsx';
import { useTranslation } from 'react-i18next';
import {
  editMcpAllInfoApi,
  type McpInfoDetailDto,
  type McpInfoParams,
  type McpParsedResultDto,
  mcpPluginExecutionApi,
  type ToolsList,
} from '@/pages/ManageDetail/MenuPage/McpService/server.ts';
import copy from 'copy-to-clipboard';
type SchemaInputValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'integer'; // Added integer type

export type JsonSchemaPropertiesItemType = {
  description?: string;
  type: SchemaInputValueType;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  items?: { type: SchemaInputValueType };
};
export type JSONSchemaInputType = {
  type: SchemaInputValueType;
  properties?: Record<string, JsonSchemaPropertiesItemType>;
  required?: string[];
};
/**
 * 将以 ID 为键的对象转换为包含 id 字段的对象数组
 */
export function convertObjectToArray<T>(obj: T) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Input must be a non-null object');
  }

  return Object.entries(obj).map(([id, value]) => {
    if (typeof value !== 'object' || value === null) {
      return { id, ...value };
    }
    return { id, ...value };
  });
}

const toPrettyJson = (val: unknown): string => {
  try {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    }
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
};

interface DebugViewProps {
  activeTool: McpParsedResultDto | null;
  mcpDetailInfo?: McpInfoDetailDto;
  loading: boolean;
  parsedData: McpParsedResultDto[];
}

export function DebugView({
  activeTool,
  mcpDetailInfo,
  loading,
  parsedData,
}: DebugViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('manageDetail');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [saveBtnLoading, setSaveBtnLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // 获取当前选中工具的参数配置
  const currentToolParams = useMemo(() => {
    if (!activeTool?.param) return [];
    try {
      const data: JSONSchemaInputType['properties'] = JSON.parse(
        activeTool.param,
      );
      return convertObjectToArray<JSONSchemaInputType['properties']>(data).map(
        (t) => {
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
            required: activeTool.required?.includes(t.id),
          };
        },
      );
    } catch {
      return [];
    }
  }, [activeTool]);

  // 当选中工具变化时，重置参数
  useEffect(() => {
    setToolParams({});
    setOutput('');
    setErrors({});
  }, [activeTool]);

  // 保存MCP信息
  const saveMcpInfo = async () => {
    if (!mcpDetailInfo) return;

    const createData: McpInfoParams = {
      id: mcpDetailInfo.id as number,
      name: mcpDetailInfo.name as string,
      server_url: mcpDetailInfo.service_url,
      description: mcpDetailInfo.description || '',
      icon_object_key: mcpDetailInfo.icon_object_key || '',
      auth_config: mcpDetailInfo.auth_config,
      tools_list: parsedData.map((t) => {
        return {
          description: t.description,
          param: t.param,
          tool_name: t.tool_name,
          required: t.required,
        };
      }) as ToolsList[],
      auth_type: mcpDetailInfo.auth_type as number,
    };

    try {
      setSaveBtnLoading(true);
      await editMcpAllInfoApi(createData);
      message.success(t('toast.save.success'));
    } catch (e) {
      console.error(e);
    } finally {
      setSaveBtnLoading(false);
    }
  };

  const handleRun = async () => {
    // 校验必填项
    const newErrors: Record<string, boolean> = {};
    let hasError = false;
    currentToolParams.forEach((param) => {
      const val = toolParams[param.id];
      let isValid = true;

      if (param.required) {
        switch (param.type) {
          case 'string':
          case 'input':
            isValid = typeof val === 'string' && val.trim() !== '';
            break;
          case 'number':
          case 'integer':
            isValid = typeof val === 'number' && !isNaN(val);
            break;
          case 'boolean':
            isValid = typeof val === 'boolean'; // false is a valid boolean value
            break;
          case 'array':
          case 'object':
            isValid = val !== undefined && val !== null; // Check if it's defined, empty array/object might be valid
            // Further validation for array/object content could be added here if needed
            break;
          default:
            isValid = val !== undefined && val !== null && val !== '';
            break;
        }
      }

      if (param.required && !isValid) {
        newErrors[param.id] = true;
        hasError = true;
      }
    });

    setErrors(newErrors);

    if (hasError) {
      message.error(t('mcpDetail.debug.validationError'));
      return;
    }

    try {
      setRunning(true);
      const res = await mcpPluginExecutionApi({
        server_url: mcpDetailInfo?.service_url as string,
        headers: mcpDetailInfo?.auth_config,
        tools_name: activeTool?.tool_name,
        params: toolParams,
      });
      setOutput(JSON.stringify(res.data));
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 p-5 flex flex-col min-h-0">
      {/* 固定头部 */}
      <div className="flex items-center justify-between pb-9 shrink-0">
        <DivSkeleton isSkeleton={loading} className="w-5/12 h-7">
          <div className="text-lg font-medium">
            {t('mcpDetail.debug.title')}
          </div>
        </DivSkeleton>

        <DivSkeleton isSkeleton={loading} className="w-15 h-9">
          <Button
            type="primary"
            className="min-w-20"
            onClick={saveMcpInfo}
            loading={saveBtnLoading}
          >
            {t('mcpDetail.debug.save')}
          </Button>
        </DivSkeleton>
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto space-y-6">
        {/* 输入卡片 */}
        <Card className="rounded-xl bg-card text-card-foreground flex flex-col shrink-0">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base">
              {t('mcpDetail.debug.input')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-5">
            {!activeTool ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-muted-foreground">
                  Please select a tool from the left panel
                </span>
              </div>
            ) : (
              <>
                <div className="space-y-3.5 mb-4">
                  {currentToolParams.length > 0 ? (
                    currentToolParams.map((param) => (
                      <div key={param.id} className="space-y-3">
                        <Label className="flex items-center">
                          <div className="flex items-center gap-1">
                            <div className="text-sm text-foreground">
                              {param.id}
                            </div>
                            {param.required && (
                              <span className="text-destructive text-xs">
                                *
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ({param.renderType})
                          </span>
                          {param.description && (
                            <EnhancedTooltip title={param.description}>
                              <CircleQuestionMark className="text-muted-foreground w-4 h-4" />
                            </EnhancedTooltip>
                          )}
                        </Label>

                        {(() => {
                          const commonErrorClass = errors[param.id]
                            ? 'border-destructive focus-visible:ring-destructive'
                            : '';

                          const handleChange = (val: any) => {
                            setToolParams((prev) => ({
                              ...prev,
                              [param.id]: val,
                            }));
                            if (
                              errors[param.id] &&
                              val !== undefined &&
                              val !== null &&
                              val !== ''
                            ) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next[param.id];
                                return next;
                              });
                            }
                          };

                          if (
                            param.type === 'integer' ||
                            param.type === 'number'
                          ) {
                            return (
                              <InputNumber
                                placeholder={param.description}
                                className={cn('w-full', commonErrorClass)}
                                value={toolParams[param.id]}
                                onChange={handleChange}
                              />
                            );
                          }

                          if (param.type === 'boolean') {
                            return (
                              <Switch
                                checked={!!toolParams[param.id]}
                                onCheckedChange={(bool) => handleChange(!!bool)}
                              />
                            );
                          }

                          if (
                            !param.type ||
                            param.type === 'string' ||
                            param.type === 'input' // 兼容可能的类型定义
                          ) {
                            return (
                              <Input
                                placeholder={param.description}
                                className={cn(commonErrorClass)}
                                value={toolParams[param.id] || ''}
                                onChange={(e) => handleChange(e.target.value)}
                              />
                            );
                          }

                          // 默认渲染 CodeMirror (object, array, etc)
                          return (
                            <div
                              className={cn(
                                'h-[200px] border rounded-md overflow-hidden',
                                errors[param.id]
                                  ? 'border-destructive'
                                  : 'border-input',
                              )}
                            >
                              <ReactCodemirror
                                value={
                                  typeof toolParams[param.id] === 'string'
                                    ? toolParams[param.id]
                                    : toolParams[param.id]
                                      ? JSON.stringify(
                                          toolParams[param.id],
                                          null,
                                          2,
                                        )
                                      : ''
                                }
                                onChange={(value) => {
                                  handleChange(
                                    value ? JSON.parse(value) : null,
                                  );
                                }}
                                codemirrorType="json"
                                placeholder={param.description}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <span className="text-sm text-muted-foreground">
                        This tool has no parameters
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  type="primary"
                  onClick={handleRun}
                  disabled={running || !activeTool}
                  className="w-fit"
                >
                  {running
                    ? t('mcpDetail.debug.running')
                    : t('mcpDetail.debug.run')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* 输出卡片 */}
        <Card className="rounded-xl bg-card text-card-foreground flex flex-col shrink-0">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base text-foreground font-medium">
              {t('mcpDetail.debug.output')}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <DivSkeleton isSkeleton={loading} className="w-full">
              {output ? (
                <div className="rounded-[8px] border border-border overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                    <div className="text-sm text-foreground/70 font-medium">
                      JSON
                    </div>
                    <EnhancedButton
                      onClick={() => {
                        copy(toPrettyJson(output));
                        message.success(t('mcpDetail.debug.copySuccess'));
                      }}
                      size="small"
                      type="text"
                      className={cn(
                        'bg-transparent! hover:bg-muted/80!',
                        'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Copy className="w-4 h-4" />
                      {t('mcpDetail.debug.copy')}
                    </EnhancedButton>
                  </div>

                  <div className="bg-card">
                    <ReactSyntaxHighlighter
                      language="json"
                      customStyle={{
                        borderRadius: 0,
                        padding: '1em',
                        margin: 0,
                        backgroundColor: 'transparent',
                      }}
                      showLineNumbers={false}
                      theme={theme}
                    >
                      {toPrettyJson(output)}
                    </ReactSyntaxHighlighter>
                  </div>
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center border border-border rounded-[4px] bg-background">
                  <span className="text-xs text-muted-foreground">
                    {t('mcpDetail.debug.noOutput')}
                  </span>
                </div>
              )}
            </DivSkeleton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
