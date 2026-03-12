import React from 'react';
import { X, Plus } from 'lucide-react';
import { useApi, createNewRequest } from '../context/ApiContext';
import { cn } from '@/lib/utils.ts';
import {
  EnhancedButton as Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import { METHOD_COLORS, METHOD_MAP } from '../utils';
import { useParams } from 'react-router';
import { openCreateCollectionModal } from './CreateCollectionDialog';
import { useFetchApiGroups } from '../store';
import { type ApiRequest } from '../context/ApiContext';
import { type ApiNode } from './ApiDirectoryTree';

export function RequestTabs() {
  const { t } = useTranslation('manageDetail');
  const { state, dispatch } = useApi();
  const { project_id } = useParams<{ project_id: string }>();
  const fetchApiGroups = useFetchApiGroups();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const prevLenRef = React.useRef(state.requests.length);

  const handleAddRequest = () => {
    const newRequest = createNewRequest();
    dispatch({ type: 'ADD_REQUEST', payload: newRequest });
  };

  const handleRemoveRequest = (requestId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (state.requests.length > 1) {
      dispatch({ type: 'REMOVE_REQUEST', payload: requestId });
    }
  };

  const handleCloseOthers = (requestId: number) => {
    dispatch({ type: 'CLOSE_OTHER_REQUESTS', payload: requestId });
  };

  const handleCloseAll = () => {
    dispatch({ type: 'CLOSE_ALL_REQUESTS' });
  };

  const handleSelectRequest = (requestId: number) => {
    dispatch({ type: 'SET_ACTIVE_REQUEST', payload: requestId });
  };

  const handleRename = async (request: ApiRequest) => {
    const res = await openCreateCollectionModal({
      openType: 'editRequest',
      project_id: Number(project_id),
      node: {
        id: request.id,
        name: request.name,
        method: METHOD_MAP[request.method],
        url_template: request.url,
      } as ApiNode,
    });
    if (res && res.success) {
      fetchApiGroups(Number(project_id));
      dispatch({
        type: 'UPDATE_REQUEST',
        payload: {
          id: request.id,
          updates: {
            name: res.name || '',
          },
        },
      });
    }
  };

  React.useEffect(() => {
    const currLen = state.requests.length;
    if (currLen > prevLenRef.current) {
      const el = containerRef.current;
      if (el) {
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      }
    }
    prevLenRef.current = currLen;
  }, [state.requests.length]);

  return (
    <div className="flex items-center border-b bg-card">
      <div
        ref={containerRef}
        className="flex items-center overflow-x-auto cursor-pointer scrollbar-hide"
        style={{
          maxWidth: 'calc(100% - 40px)',
        }}
      >
        {state.requests.map((request) => (
          <ContextMenu key={request.id}>
            <ContextMenuTrigger>
              <div
                className={cn(
                  'flex items-center group relative border-r border-border w-[180px] h-9 px-5 gap-3',
                  request.id === state.activeRequestId
                    ? 'bg-background'
                    : 'bg-card',
                )}
              >
                <div
                  onClick={() => handleSelectRequest(request.id)}
                  className="flex items-center font-medium text-sm gap-1 flex-1 min-w-0 relative"
                >
                  <div className={cn(METHOD_COLORS[request?.method || 'GET'])}>
                    {request?.method}
                  </div>
                  <div
                    className="text-foreground flex-1 truncate"
                    title={request.name}
                  >
                    {request.name}
                  </div>
                  {/*{request.status === 'new' && (*/}
                  {/*  <div className="absolute -right-[10px] transform -translate-y-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />*/}
                  {/*)}*/}
                </div>

                <Button
                  onClick={(e) => handleRemoveRequest(request.id, e)}
                  title={t('apiService.tab.closeTab')}
                  type="text"
                  className={cn(
                    'bg-foreground/10 text-card rounded-full w-3.5 h-3.5 p-0!',
                    'hover:bg-foreground/20 hover:text-card invisible',
                    'dark:text-card-foreground',
                    state?.requests?.length > 1 && 'group-hover:visible',
                  )}
                >
                  <X className="h-w-2.5! w-2.5!" />
                </Button>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-card">
              <ContextMenuItem
                onClick={() => handleRemoveRequest(request.id)}
                disabled={state.requests.length <= 1}
              >
                {t('apiService.tab.closeCurrent')}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleRename(request)}
                disabled={request.status === 'new'}
              >
                {t('apiService.tree.edit')}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleCloseOthers(request.id)}
                disabled={state.requests.length <= 1}
              >
                {t('apiService.tab.closeOther')}
              </ContextMenuItem>
              <ContextMenuItem onClick={handleCloseAll}>
                {t('apiService.tab.closeAll')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>

      <div className="border-r border-border w-10 shrink-0 h-9 flex items-center justify-center self-start">
        <Button
          onClick={handleAddRequest}
          className={cn(
            'shadow-none text-foreground bg-transparent w-6 h-6 border-0',
            'hover:text-foreground hover:bg-background',
          )}
          title={t('apiService.tabs.newRequestTooltip')}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
