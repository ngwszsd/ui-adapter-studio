import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useLayoutEffect,
} from 'react';
import {
  OtterFlow,
  setOtterFlowApiServicesFetcher,
  setOtterFlowDatasetSearchConfigDialogOpener,
  setOtterFlowDatasetsFetcher,
  setOtterFlowLanguage,
  setOtterFlowMcpServicesFetcher,
  setOtterFlowMcpToolsFetcher,
  setOtterFlowNoticeHandler,
  setOtterFlowTextModelsFetcher,
  setOtterFlowTheme,
  setOtterFlowWorkflowDetailFetcher,
  setOtterFlowWorkflowLibraryFetcher,
  type OtterFlowEditorState,
  type OtterFlowDatasetSearchConfig,
  type OtterFlowSaveStatus,
} from '@teamhelper/otter-flow';
import { EnhancedButton, message, openModalWarning } from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store';
import { useTheme } from '@/context/themeContext';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  type ApiDetailInfoDto,
  getApiDetail,
  getApiGroup,
  type OptionList,
} from '@/pages/ManageDetail/MenuPage/ApiService/server';
import {
  getMcpDetailApi,
  getMcpListApi,
} from '@/pages/ManageDetail/MenuPage/McpService/server';
import {
  getModelsApi,
  knowledgeBasesApi,
} from '@/pages/ManageDetail/MenuPage/Knowledge/server';
import {
  getWorkflowDetailApi,
  getWorkflowsWorkspaceListApi,
  getWorkflowsWorkspaceEditStatusApi,
  type IWorkflowsWorkspaceEditStatusVo,
} from '@/pages/ManageDetail/MenuPage/GlobalWorkflow/server';
import {
  openSearchConfigDialog,
  type SearchConfigDialogResult,
} from '@/pages/ManageDetail/MenuPage/Knowledge/KnowledgeDetail/components/SearchConfigDialog';
import type { IKnowledgeBasesSearchParams } from '@/pages/ManageDetail/MenuPage/Knowledge/KnowledgeDetail/server';
import { Archive, ChevronLeft, History, Send, Settings } from 'lucide-react';
import {
  archiveWorkflowApi,
  loadWorkflowDraftVersionApi,
  publishWorkflowApi,
  type ILoadWorkflowVersionListVo,
} from './server';
import { openWorkflowDraftArchiveDialog } from './DraftArchiveDialog';
import { openWorkflowPublishDialog } from './PublishVersionDialog';
import { VersionHistoryDialog } from './VersionHistoryDialog';

const toSearchMode = (
  mode: OtterFlowDatasetSearchConfig['searchMode'],
): IKnowledgeBasesSearchParams['search_mode'] => {
  if (mode === 'fulltext') return '2';
  if (mode === 'hybrid') return '3';
  return '1';
};

const toOtterSearchMode = (
  mode: IKnowledgeBasesSearchParams['search_mode'] | undefined,
): OtterFlowDatasetSearchConfig['searchMode'] => {
  if (mode === '2') return 'fulltext';
  if (mode === '3') return 'hybrid';
  return 'semantic';
};

const QUERY_REWRITE_MODEL_SEPARATOR = '::';
const textModelNameCache = new Map<number, string>();
let textModelNameMapPromise: Promise<Map<number, string>> | null = null;
let firstTextModelCache: { id: number; name: string } | null = null;

const parseLegacyQueryRewriteModel = (
  value: unknown,
): { id: string; name: string } => {
  const raw = String(value ?? '').trim();
  if (!raw) return { id: '', name: '' };
  const separatorIndex = raw.indexOf(QUERY_REWRITE_MODEL_SEPARATOR);
  if (separatorIndex >= 0) {
    return {
      id: raw.slice(0, separatorIndex).trim(),
      name: raw
        .slice(separatorIndex + QUERY_REWRITE_MODEL_SEPARATOR.length)
        .trim(),
    };
  }
  if (/^\d+$/.test(raw)) {
    return { id: raw, name: '' };
  }
  return { id: '', name: raw };
};

const toPositiveModelId = (value: unknown): number | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const modelId = Number(raw);
  return Number.isFinite(modelId) && modelId > 0 ? modelId : null;
};

const getQueryRewriteModelId = (
  config: OtterFlowDatasetSearchConfig,
): string => {
  const fieldId = String(config.queryRewriteModelId ?? '').trim();
  if (fieldId) return fieldId;
  return parseLegacyQueryRewriteModel(config.queryRewriteModel).id;
};

const getQueryRewriteModelName = (
  config: OtterFlowDatasetSearchConfig,
): string => {
  const fieldName = String(config.queryRewriteModelName ?? '').trim();
  if (fieldName) return fieldName;
  return parseLegacyQueryRewriteModel(config.queryRewriteModel).name;
};

const loadTextModelNameMap = async (): Promise<Map<number, string>> => {
  if (textModelNameCache.size > 0) {
    return textModelNameCache;
  }
  if (textModelNameMapPromise) {
    return textModelNameMapPromise;
  }

  textModelNameMapPromise = getModelsApi({ type: '1' })
    .then((list) => {
      list.forEach((item) => {
        const modelId = Number(item?.id);
        if (!Number.isFinite(modelId) || modelId <= 0) return;
        const modelName = String(item?.name || item?.model_name || '').trim();
        if (!modelName) return;
        textModelNameCache.set(modelId, modelName);
        if (!firstTextModelCache) {
          firstTextModelCache = {
            id: modelId,
            name: modelName,
          };
        }
      });
      return textModelNameCache;
    })
    .catch(() => textModelNameCache)
    .finally(() => {
      textModelNameMapPromise = null;
    });

  return textModelNameMapPromise;
};

const resolveTextModelName = async (
  modelId: number | null,
): Promise<string> => {
  if (!modelId) return '';
  const cached = textModelNameCache.get(modelId);
  if (cached) return cached;
  const map = await loadTextModelNameMap();
  return map.get(modelId) || '';
};

const resolveFirstTextModel = async (): Promise<{
  id: number;
  name: string;
} | null> => {
  if (firstTextModelCache) return firstTextModelCache;

  const map = await loadTextModelNameMap();
  if (firstTextModelCache) return firstTextModelCache;

  for (const [id, name] of map.entries()) {
    if (!Number.isFinite(id) || id <= 0) continue;
    if (!name) continue;
    firstTextModelCache = { id, name };
    return firstTextModelCache;
  }
  return null;
};

const isWorkflowData = (
  value: unknown,
): value is {
  nodes: any[];
  edges: any[];
  globalConfig?: any;
} => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const raw = value as { nodes?: unknown; edges?: unknown };
  return Array.isArray(raw.nodes) && Array.isArray(raw.edges);
};

const resolveWorkflowDslData = (value: unknown) => {
  if (isWorkflowData(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (isWorkflowData(parsed)) return parsed;
    } catch {}
  }
  return null;
};

const toKnowledgeSearchConfig = (
  config: OtterFlowDatasetSearchConfig,
): Partial<IKnowledgeBasesSearchParams> => ({
  search_mode: toSearchMode(config.searchMode),
  embedding_weight: Number(config.hybridWeight ?? 0.5),
  using_re_rank: Boolean(config.useRerank),
  rerank_weight: Number(config.rerankWeight ?? 0.3),
  rerank_model: String(config.rerankModel || ''),
  limit: Number(config.quoteLimit ?? 5000),
  similarity: Number(config.minRelevance ?? 0.4),
  dataset_search_using_extension_query: config.useQueryRewrite !== false,
  dataset_search_extension_model: toPositiveModelId(
    getQueryRewriteModelId(config),
  ),
  dataset_search_extension_bg: String(config.queryRewriteBackground || ''),
});

const toOtterSearchConfig = async (
  value: SearchConfigDialogResult,
  fallback: OtterFlowDatasetSearchConfig,
): Promise<OtterFlowDatasetSearchConfig | null> => {
  if (!value) return null;

  const useQueryRewrite =
    typeof value.dataset_search_using_extension_query === 'boolean'
      ? value.dataset_search_using_extension_query
      : fallback.useQueryRewrite !== false;

  let currentModelId = (() => {
    const modelId = toPositiveModelId(value.dataset_search_extension_model);
    if (modelId) return modelId;
    return toPositiveModelId(getQueryRewriteModelId(fallback));
  })();
  if (useQueryRewrite && !currentModelId) {
    const firstModel = await resolveFirstTextModel();
    currentModelId = firstModel?.id ?? null;
  }
  const fallbackModelLabel = getQueryRewriteModelName(fallback);
  const resolvedModelLabel =
    (await resolveTextModelName(currentModelId)) || fallbackModelLabel;

  return {
    searchMode: toOtterSearchMode(value.search_mode),
    hybridWeight: Number(
      value.embedding_weight ?? fallback.hybridWeight ?? 0.5,
    ),
    useRerank:
      typeof value.using_re_rank === 'boolean'
        ? value.using_re_rank
        : Boolean(fallback.useRerank),
    rerankWeight: Number(value.rerank_weight ?? fallback.rerankWeight ?? 0.3),
    rerankModel: String(value.rerank_model ?? fallback.rerankModel ?? ''),
    quoteLimit: Number(value.limit ?? fallback.quoteLimit ?? 5000),
    minRelevance: Number(value.similarity ?? fallback.minRelevance ?? 0.4),
    useQueryRewrite,
    queryRewriteModelId: currentModelId ? String(currentModelId) : '',
    queryRewriteModelName: resolvedModelLabel || '',
    queryRewriteBackground: String(
      value.dataset_search_extension_bg ??
        fallback.queryRewriteBackground ??
        '',
    ),
  };
};

const WorkflowEdit: React.FC = memo(() => {
  const { t, i18n } = useTranslation('manageDetail');
  const { userInfo } = useAuthStore();
  const { theme } = useTheme();
  const { project_id } = useParams<{ project_id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<OtterFlowSaveStatus>('saved');
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [settingsOpenSignal, setSettingsOpenSignal] = useState(0);
  const [forcedVersionData, setForcedVersionData] =
    useState<ILoadWorkflowVersionListVo | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [isCheckingEditStatus, setIsCheckingEditStatus] = useState(false);
  const [blockedByOtherEditor, setBlockedByOtherEditor] = useState(false);
  const workflowId = useMemo(
    () => searchParams.get('workflowId')?.trim() || '',
    [searchParams],
  );
  const displayTitle =
    workflowTitle.trim() || (workflowId ? '全局工作流' : '新建工作流');
  const saveStatusMeta = useMemo(() => {
    if (saveStatus === 'saving') {
      return {
        label: '保存中',
        textClassName: 'text-[#1570EF]',
        dotClassName: 'bg-[#1570EF]',
      };
    }
    if (saveStatus === 'error') {
      return {
        label: '保存失败',
        textClassName: 'text-[#D92D20]',
        dotClassName: 'bg-[#D92D20]',
      };
    }
    if (saveStatus === 'unsaved') {
      return {
        label: '未保存',
        textClassName: 'text-[#F04438]',
        dotClassName: 'bg-[#F04438]',
      };
    }
    return {
      label: '已保存',
      textClassName: 'text-[#12B76A]',
      dotClassName: 'bg-[#12B76A]',
    };
  }, [saveStatus]);

  const isEditingLockedByOther = useCallback(
    (status: IWorkflowsWorkspaceEditStatusVo) => {
      if (!status?.editing) return false;

      const editingById = Number(status.editingBy);
      const currentUserId = Number(userInfo?.user_id);
      const currentUserName = String(userInfo?.name || '').trim();
      if (
        (!Number.isFinite(currentUserId) || currentUserId <= 0) &&
        !currentUserName
      ) {
        return false;
      }

      if (
        Number.isFinite(editingById) &&
        editingById > 0 &&
        Number.isFinite(currentUserId) &&
        currentUserId > 0
      ) {
        return editingById !== currentUserId;
      }

      const editingByName = String(status.editingByName || '').trim();
      if (editingByName && currentUserName) {
        return editingByName !== currentUserName;
      }

      return true;
    },
    [userInfo?.name, userInfo?.user_id],
  );

  const hasCurrentUserIdentity = useMemo(() => {
    const currentUserId = Number(userInfo?.user_id);
    const currentUserName = String(userInfo?.name || '').trim();
    return (
      (Number.isFinite(currentUserId) && currentUserId > 0) ||
      currentUserName.length > 0
    );
  }, [userInfo?.name, userInfo?.user_id]);

  const handleEditorStateChange = useCallback(
    (state: OtterFlowEditorState) => {
      if (workflowId && state.workflowId && state.workflowId !== workflowId) {
        return;
      }
      const nextWorkflowName = String(state.workflowName || '').trim();
      if (nextWorkflowName) {
        setWorkflowTitle(nextWorkflowName);
      }
      setSaveStatus(state.saveStatus);
    },
    [workflowId],
  );

  useEffect(() => {
    let active = true;
    if (!workflowId) {
      setBlockedByOtherEditor(false);
      setIsCheckingEditStatus(false);
      return () => {
        active = false;
      };
    }

    if (!hasCurrentUserIdentity) {
      setBlockedByOtherEditor(false);
      setIsCheckingEditStatus(true);
      return () => {
        active = false;
      };
    }

    setBlockedByOtherEditor(false);
    setIsCheckingEditStatus(true);

    const checkStatus = async () => {
      try {
        const status = await getWorkflowsWorkspaceEditStatusApi(workflowId);
        if (!active) return;
        if (isEditingLockedByOther(status)) {
          setBlockedByOtherEditor(true);
          await openModalWarning({
            title: t('app.status.editing.des'),
            description: (
              <div>
                {t('app.user')}
                <span className="text-foreground font-medium mx-1">
                  {status.editingByName || status.editingBy || '未知用户'}
                </span>
                {t('app.status.editing.tips')}
              </div>
            ),
            options: {
              footerBtnPosition: 'block',
              cancelText: null,
              okText: '我知道了',
              maskClosable: false,
            },
          });
          return;
        }
        setBlockedByOtherEditor(false);
      } catch (e) {
        if (!active) return;
        setBlockedByOtherEditor(false);
        console.error(e);
      } finally {
        if (!active) return;
        setIsCheckingEditStatus(false);
      }
    };

    void checkStatus();

    return () => {
      active = false;
    };
  }, [workflowId, hasCurrentUserIdentity, isEditingLockedByOther, t]);

  useEffect(() => {
    let active = true;
    if (!workflowId) {
      setWorkflowTitle('');
      setSaveStatus('saved');
      return () => {
        active = false;
      };
    }

    void getWorkflowDetailApi(workflowId)
      .then((detail) => {
        if (!active) return;
        const name =
          typeof detail?.name === 'string' && detail.name.trim().length > 0
            ? detail.name.trim()
            : '';
        setWorkflowTitle(name);
      })
      .catch(() => {
        if (!active) return;
        setWorkflowTitle('');
      });

    return () => {
      active = false;
    };
  }, [workflowId]);

  useEffect(() => {
    void setOtterFlowLanguage(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    setOtterFlowTheme(theme);
  }, [theme]);

  useEffect(() => {
    setOtterFlowNoticeHandler(({ type, message: noticeMessage }) => {
      const text = noticeMessage?.trim();
      if (!text) return;
      if (type === 'success') {
        message.success(text);
        return;
      }
      if (type === 'info') {
        message.info(text);
        return;
      }
      if (type === 'warning') {
        message.warning(text);
        return;
      }
      message.error(text);
    });

    setOtterFlowDatasetSearchConfigDialogOpener(async (currentConfig) => {
      const result = await openSearchConfigDialog({
        isolated: true,
        initialValues: toKnowledgeSearchConfig(currentConfig),
      });
      return await toOtterSearchConfig(result, currentConfig);
    });

    setOtterFlowDatasetsFetcher(async (keyword = '', parentId = null) => {
      const normalizedParentId = (() => {
        const value = Number(String(parentId ?? '').trim());
        return Number.isFinite(value) && value > 0 ? value : null;
      })();
      const list = await knowledgeBasesApi({
        keyword: keyword.trim(),
        parent_id: normalizedParentId,
      });

      return list
        .filter(
          (item) => (item.type === 1 || item.type === 2) && Number(item.id) > 0,
        )
        .map((item) => ({
          id: String(item.id),
          name: item.name?.trim() || String(item.id),
          description: item.description?.trim() || '',
          iconUrl: item.avatar?.trim() || '',
          parentId:
            typeof item.parent_id === 'number' && item.parent_id > 0
              ? String(item.parent_id)
              : '',
          isFolder: item.type === 2,
          embeddingModelId:
            typeof item.embedding_model_id === 'number' &&
            item.embedding_model_id > 0
              ? String(item.embedding_model_id)
              : '',
          embeddingModelName: item.embedding_model_name?.trim() || '',
        }));
    });

    setOtterFlowWorkflowLibraryFetcher(async () => {
      const projectId = Number(project_id);
      if (!Number.isFinite(projectId) || projectId <= 0) return [];

      const result = await getWorkflowsWorkspaceListApi({
        projectId,
        pageNo: 0,
        pageSize: 200,
      });
      const list = Array.isArray(result?.content) ? result.content : [];
      return list
        .map((item) => {
          const id =
            typeof item.id === 'string' || typeof item.id === 'number'
              ? String(item.id).trim()
              : '';
          if (!id) return null;
          const name =
            typeof item.name === 'string' && item.name.trim().length > 0
              ? item.name.trim()
              : id;
          const creatorName =
            item.createdBy == null ? '' : String(item.createdBy).trim();
          const iconUrl =
            typeof item.iconUrl === 'string' ? item.iconUrl.trim() : '';
          return {
            id,
            name,
            ...(creatorName ? { description: creatorName } : {}),
            ...(iconUrl ? { iconUrl } : {}),
          };
        })
        .filter(
          (
            item,
          ): item is {
            id: string;
            name: string;
            description?: string;
            iconUrl?: string;
          } => item !== null,
        );
    });

    setOtterFlowApiServicesFetcher(async () => {
      const projectId = Number(project_id);
      if (!Number.isFinite(projectId) || projectId <= 0) return [];

      const res = await getApiGroup({ project_id: projectId });
      const groups = Array.isArray(res.data) ? res.data : [];
      const detailCache = new Map<number, Promise<ApiDetailInfoDto | null>>();
      const resolveMethod = (method: unknown) => {
        if (typeof method === 'string') {
          const normalized = method.trim().toUpperCase();
          if (
            normalized === 'GET' ||
            normalized === 'POST' ||
            normalized === 'PUT' ||
            normalized === 'DELETE' ||
            normalized === 'PATCH' ||
            normalized === 'HEAD' ||
            normalized === 'OPTIONS'
          ) {
            return normalized;
          }
        }
        const methodCode = typeof method === 'number' ? method : Number(method);
        if (methodCode === 1) return 'GET';
        if (methodCode === 2) return 'POST';
        if (methodCode === 3) return 'PUT';
        if (methodCode === 4) return 'DELETE';
        if (methodCode === 5) return 'PATCH';
        if (methodCode === 6) return 'HEAD';
        if (methodCode === 7) return 'OPTIONS';
        return 'GET';
      };
      const resolveBodyType = (bodyMode: unknown) => {
        if (typeof bodyMode === 'string') {
          const normalized = bodyMode.trim().toLowerCase();
          if (normalized === 'json' || normalized === 'application/json') {
            return 'json';
          }
          if (
            normalized === 'x-www-form-urlencoded' ||
            normalized === 'application/x-www-form-urlencoded'
          ) {
            return 'x-www-form-urlencoded';
          }
          if (
            normalized === 'form-data' ||
            normalized === 'multipart/form-data'
          ) {
            return 'form-data';
          }
          if (normalized === 'none') {
            return 'none';
          }
        }
        const mode = typeof bodyMode === 'number' ? bodyMode : Number(bodyMode);
        if (mode === 2) return 'json';
        if (mode === 3) return 'x-www-form-urlencoded';
        if (mode === 4) return 'form-data';
        return 'none';
      };
      const normalizeKeyValueList = (
        list: OptionList[] | undefined,
      ): { key: string; value: string; enable: boolean }[] => {
        if (!Array.isArray(list)) return [];
        return list.map((item) => ({
          key:
            typeof item?.code === 'string'
              ? item.code
              : item?.code == null
                ? ''
                : String(item.code),
          value:
            typeof item?.value === 'string'
              ? item.value
              : item?.value == null
                ? ''
                : String(item.value),
          enable: item?.enable !== false,
        }));
      };
      const bodyParamListToJson = (paramList: OptionList[] | undefined) => {
        if (!Array.isArray(paramList) || paramList.length === 0) return '';
        if (paramList.length === 1 && !paramList[0]?.code) {
          return paramList[0]?.value || '';
        }
        const obj: Record<string, any> = {};
        paramList.forEach((item) => {
          if (!item?.code) return;
          try {
            obj[item.code] = JSON.parse(item.value);
          } catch {
            obj[item.code] = item.value;
          }
        });
        return JSON.stringify(obj, null, 2);
      };
      const getApiDetailCached = async (apiId: number) => {
        if (!detailCache.has(apiId)) {
          detailCache.set(
            apiId,
            (async () => {
              try {
                const detailRes = await getApiDetail({ api_id: apiId });
                return detailRes.data ?? null;
              } catch (error) {
                console.error(error);
                return null;
              }
            })(),
          );
        }
        return detailCache.get(apiId)!;
      };

      const groupEntries = await Promise.all(
        groups.map(async (group, groupIndex) => {
          const groupIdCandidate =
            typeof group.group_id === 'number' ||
            typeof group.group_id === 'string'
              ? String(group.group_id)
              : '';
          const groupId = groupIdCandidate || `api-group-${groupIndex}`;
          const groupName =
            typeof group.group_name === 'string' &&
            group.group_name.trim().length > 0
              ? group.group_name.trim()
              : groupId;
          const parentIdCandidate =
            typeof group.parent_id === 'number' ||
            typeof group.parent_id === 'string'
              ? String(group.parent_id)
              : '';
          const parentId =
            parentIdCandidate && parentIdCandidate !== '0'
              ? parentIdCandidate
              : '';
          const list = Array.isArray(group.list) ? group.list : [];

          const items = await Promise.all(
            list.map(async (item, itemIndex) => {
              const id =
                typeof item.id === 'number' || typeof item.id === 'string'
                  ? String(item.id)
                  : `${groupId}-api-${itemIndex}`;
              const name =
                typeof item.name === 'string' && item.name.trim().length > 0
                  ? item.name.trim()
                  : id;

              const numericApiId = Number(id);
              const detail =
                Number.isFinite(numericApiId) && numericApiId > 0
                  ? await getApiDetailCached(numericApiId)
                  : null;

              const bodyType = resolveBodyType(detail?.body_mode);
              const bodyParamList = Array.isArray(detail?.body_param_list)
                ? (detail.body_param_list as OptionList[])
                : [];

              return {
                id,
                name,
                method: resolveMethod(detail?.method ?? item.method),
                url:
                  detail?.url_template?.trim() ??
                  item.url_template?.trim() ??
                  '',
                headers: normalizeKeyValueList(
                  Array.isArray(detail?.header_list)
                    ? (detail.header_list as OptionList[])
                    : [],
                ),
                params: normalizeKeyValueList(
                  Array.isArray(detail?.param_list)
                    ? (detail.param_list as OptionList[])
                    : [],
                ),
                bodyType,
                bodyJson:
                  bodyType === 'json' ? bodyParamListToJson(bodyParamList) : '',
                bodyForm:
                  bodyType === 'form-data' ||
                  bodyType === 'x-www-form-urlencoded'
                    ? normalizeKeyValueList(bodyParamList)
                    : [],
              };
            }),
          );

          return {
            id: groupId,
            name: groupName,
            parentId,
            items: items.filter((item) => item.id.length > 0),
            children: [] as any[],
          };
        }),
      );

      const groupMap = new Map(groupEntries.map((entry) => [entry.id, entry]));

      const roots: Array<{
        id: string;
        name: string;
        items: {
          id: string;
          name: string;
          method: string;
          url: string;
        }[];
        children?: any[];
      }> = [];

      groupMap.forEach((node) => {
        if (node.parentId && groupMap.has(node.parentId)) {
          groupMap.get(node.parentId)?.children.push(node);
        } else {
          roots.push(node);
        }
      });

      const sanitize = (node: any): any => ({
        id: node.id,
        name: node.name,
        items: node.items,
        ...(Array.isArray(node.children) && node.children.length > 0
          ? { children: node.children.map((child: any) => sanitize(child)) }
          : {}),
      });

      return roots.map((root) => sanitize(root));
    });

    setOtterFlowMcpServicesFetcher(async () => {
      const projectId = Number(project_id);
      if (!Number.isFinite(projectId) || projectId <= 0) return [];

      const res = await getMcpListApi({ project_id: projectId });
      const list = Array.isArray(res.data) ? res.data : [];

      return list
        .map((item, index) => {
          const id =
            typeof item.id === 'number' || typeof item.id === 'string'
              ? String(item.id)
              : `mcp-${index}`;
          const name =
            typeof item.name === 'string' && item.name.trim().length > 0
              ? item.name.trim()
              : id;
          return {
            id,
            name,
            description: item.description?.trim() ?? '',
            iconUrl: item.icon_url?.trim() ?? '',
            creatorName: item.created_name?.trim() ?? '',
            creatorAvatarUrl: item.user_icon_url?.trim() ?? '',
            createdAt: item.created_time?.trim() ?? '',
          };
        })
        .filter((item) => item.id.length > 0);
    });

    setOtterFlowMcpToolsFetcher(async (serviceId) => {
      const numericServiceId = Number(serviceId);
      if (!Number.isFinite(numericServiceId) || numericServiceId <= 0) {
        return [];
      }

      const detailRes = await getMcpDetailApi(numericServiceId);
      const detail = detailRes.data;
      const tools = Array.isArray(detail?.tools) ? detail.tools : [];
      const serviceName =
        typeof detail?.name === 'string' && detail.name.trim().length > 0
          ? detail.name.trim()
          : '';
      const serverUrl =
        typeof detail?.service_url === 'string'
          ? detail.service_url.trim()
          : '';

      return tools
        .map((tool, index) => {
          const parsedParamSchema = (() => {
            if (typeof tool.param !== 'string' || !tool.param.trim()) {
              return null;
            }
            try {
              const parsed = JSON.parse(tool.param) as unknown;
              if (
                !parsed ||
                typeof parsed !== 'object' ||
                Array.isArray(parsed)
              ) {
                return null;
              }
              return parsed as Record<string, unknown>;
            } catch {
              return null;
            }
          })();

          const requiredParams = Array.isArray(tool.required)
            ? tool.required
                .map((item) => (typeof item === 'string' ? item.trim() : ''))
                .filter((item) => item.length > 0)
            : [];

          const id =
            typeof tool.id === 'number' || typeof tool.id === 'string'
              ? String(tool.id)
              : `${serviceId}-tool-${index}`;
          const name =
            typeof tool.tool_name === 'string' &&
            tool.tool_name.trim().length > 0
              ? tool.tool_name.trim()
              : id;
          return {
            id,
            name,
            serverUrl,
            description: tool.description?.trim() ?? '',
            serviceId,
            serviceName,
            parameterSchema: parsedParamSchema,
            requiredParams,
          };
        })
        .filter((item) => item.id.length > 0);
    });

    setOtterFlowTextModelsFetcher(async () => {
      const list = await getModelsApi({ type: '1' });
      return list
        .map((item) => {
          const modelId = Number(item?.id);
          if (!Number.isFinite(modelId) || modelId <= 0) return null;
          const modelName = String(item?.name || item?.model_name || '').trim();
          return {
            id: String(modelId),
            name: modelName || String(modelId),
          };
        })
        .filter((item): item is { id: string; name: string } => item !== null);
    });

    return () => {
      setOtterFlowNoticeHandler(null);
      setOtterFlowDatasetSearchConfigDialogOpener(null);
      setOtterFlowDatasetsFetcher(null);
      setOtterFlowApiServicesFetcher(null);
      setOtterFlowMcpServicesFetcher(null);
      setOtterFlowMcpToolsFetcher(null);
      setOtterFlowTextModelsFetcher(null);
      setOtterFlowWorkflowLibraryFetcher(null);
      setOtterFlowWorkflowDetailFetcher(null);
    };
  }, [project_id]);

  useLayoutEffect(() => {
    setOtterFlowWorkflowDetailFetcher(async (workflowId) => {
      if (forcedVersionData) {
        const id = String(
          forcedVersionData.workflowId ||
            (forcedVersionData as { workflow_id?: string }).workflow_id ||
            workflowId,
        );
        const name = forcedVersionData.version || 'Version';
        const data = resolveWorkflowDslData(
          forcedVersionData.graphData ||
            forcedVersionData.workflowData ||
            (forcedVersionData as { graph_data?: unknown }).graph_data ||
            (forcedVersionData as { workflow_data?: unknown }).workflow_data,
        );
        return {
          id,
          name,
          ...(data ? { data } : {}),
        };
      }

      const normalizedWorkflowId = String(workflowId || '').trim();
      if (!normalizedWorkflowId) return null;

      const detail = await getWorkflowDetailApi(normalizedWorkflowId);
      const id =
        (typeof detail.id === 'string' || typeof detail.id === 'number'
          ? String(detail.id).trim()
          : '') || normalizedWorkflowId;
      if (!id) return null;
      const data = resolveWorkflowDslData(detail.data ?? detail.dsl);
      const name =
        typeof detail.name === 'string' && detail.name.trim().length > 0
          ? detail.name.trim()
          : id;
      const iconUrl =
        typeof detail.iconUrl === 'string' ? detail.iconUrl.trim() : '';
      return {
        id,
        name,
        ...(iconUrl ? { iconUrl } : {}),
        ...(data ? { data } : {}),
      };
    });

    return () => {
      setOtterFlowWorkflowDetailFetcher(null);
    };
  }, [forcedVersionData]);

  const handleLoadVersion = useCallback(
    (versionData: ILoadWorkflowVersionListVo) => {
      setForcedVersionData(versionData);
      setEditorKey((prev) => prev + 1);
    },
    [],
  );

  const handleArchiveDraft = async () => {
    if (!workflowId) {
      message.warning('请先选择工作流');
      return;
    }
    const payload = await openWorkflowDraftArchiveDialog();
    if (!payload) return;

    const result = await archiveWorkflowApi(workflowId, {
      description: payload.description,
    });
    if (result?.id) {
      setSaveStatus('saved');
      message.success('草稿存档成功');
      return;
    }
    message.error('草稿存档失败');
  };

  const handlePublishVersion = async () => {
    if (!workflowId) {
      message.warning('请先选择工作流');
      return;
    }
    const draftVersion = await loadWorkflowDraftVersionApi(workflowId);
    const defaultVersion =
      (typeof draftVersion === 'string' ? draftVersion : '').trim() || 'v0.0.1';

    const payload = await openWorkflowPublishDialog({ defaultVersion });
    if (!payload) return;

    const result = await publishWorkflowApi(workflowId, {
      version: payload.version,
      description: payload.description,
    });
    if (result?.version || result?.description) {
      setSaveStatus('saved');
      message.success('发布成功');
      return;
    }
    message.error('发布失败');
  };

  const shouldRenderWorkflow =
    !workflowId || (!isCheckingEditStatus && !blockedByOtherEditor);

  return (
    <div className="h-full w-full overflow-hidden bg-background flex flex-col">
      <div className="shrink-0 h-[72px] border-b border-border bg-card/95 backdrop-blur px-5">
        <div className="h-full flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <EnhancedButton
              type="text"
              shape="circle"
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
              className="!w-7 !h-7 !p-0 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(-1)}
            />
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 min-w-0 leading-none">
                <span className="truncate text-[16px] font-semibold text-foreground">
                  {displayTitle}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 mt-1 text-[12px] leading-none ${saveStatusMeta.textClassName}`}
              >
                <span
                  className={`w-1 h-1 rounded-full shrink-0 ${saveStatusMeta.dotClassName}`}
                />
                <span>{saveStatusMeta.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <EnhancedButton
              type="default"
              icon={<Settings className="w-4 h-4" />}
              className="!w-10 !h-10 !px-0 rounded-[12px] text-[#344054]"
              onClick={() => setSettingsOpenSignal((prev) => prev + 1)}
            />
            <EnhancedButton
              type="default"
              icon={<History className="w-4 h-4" />}
              className="!w-10 !h-10 !px-0 rounded-[12px] text-[#344054]"
              onClick={() => setVersionHistoryOpen(true)}
            />
            <EnhancedButton
              type="default"
              icon={<Archive className="w-3.5 h-3.5" />}
              className="h-10 px-4 rounded-[12px] text-[14px] font-medium text-[#1D2939]"
              onClick={() => {
                void handleArchiveDraft();
              }}
            >
              存档
            </EnhancedButton>
            <EnhancedButton
              type="primary"
              icon={<Send className="w-3.5 h-3.5" />}
              className="h-10 px-4 rounded-[12px] text-[14px] font-medium"
              onClick={() => {
                void handlePublishVersion();
              }}
            >
              工作流发布
            </EnhancedButton>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {shouldRenderWorkflow ? (
          <OtterFlow
            key={editorKey}
            showHeader={false}
            settingsOpenSignal={settingsOpenSignal}
            onEditorStateChange={handleEditorStateChange}
          />
        ) : null}
      </div>

      <VersionHistoryDialog
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        workflowId={workflowId}
        onLoadVersion={handleLoadVersion}
      />
    </div>
  );
});

export default WorkflowEdit;
