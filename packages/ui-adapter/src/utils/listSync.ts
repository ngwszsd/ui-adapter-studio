import type { ChildDragPayload, ComponentDragPayload } from '../componentRegistry';
import type { EditorApi } from '../store/editorRegistry';

export type ListSyncPayload = ComponentDragPayload | ChildDragPayload;

type ListSyncApi = Pick<
  EditorApi,
  'getChildNodeIds' | 'getNodeProps' | 'getParentNodeId'
>;

const getRoleName = (props: Record<string, unknown> | null): string | null => {
  const verticalRole = props?.verticalListRole;
  if (typeof verticalRole === 'string' && verticalRole) return verticalRole;

  const horizontalRole = props?.horizontalListRole;
  if (typeof horizontalRole === 'string' && horizontalRole) return horizontalRole;

  const gridRole = props?.gridListRole;
  if (typeof gridRole === 'string' && gridRole) return gridRole;

  return null;
};

const getListSyncKey = (props: Record<string, unknown> | null): string | null => {
  const syncKey = props?.listSyncKey;
  return typeof syncKey === 'string' && syncKey ? syncKey : null;
};

const findAncestorByRole = (
  api: ListSyncApi,
  nodeId: string,
  role: string,
): string | null => {
  let currentNodeId: string | null = nodeId;

  while (currentNodeId) {
    const props = api.getNodeProps(currentNodeId);
    if (getRoleName(props) === role) return currentNodeId;
    currentNodeId = api.getParentNodeId(currentNodeId);
  }

  return null;
};

const getSubtreeNodeIds = (api: ListSyncApi, rootNodeId: string): string[] => {
  const result: string[] = [];
  const stack = [...api.getChildNodeIds(rootNodeId)];

  while (stack.length > 0) {
    const currentNodeId = stack.shift();
    if (!currentNodeId) continue;
    result.push(currentNodeId);
    stack.unshift(...api.getChildNodeIds(currentNodeId));
  }

  return result;
};

const getPathFromAncestor = (
  api: ListSyncApi,
  ancestorNodeId: string,
  targetNodeId: string,
): number[] | null => {
  if (ancestorNodeId === targetNodeId) return [];

  const path: number[] = [];
  let currentNodeId: string | null = targetNodeId;

  while (currentNodeId && currentNodeId !== ancestorNodeId) {
    const parentNodeId = api.getParentNodeId(currentNodeId);
    if (!parentNodeId) return null;

    const siblingNodeIds = api.getChildNodeIds(parentNodeId);
    const childIndex = siblingNodeIds.indexOf(currentNodeId);
    if (childIndex < 0) return null;

    path.unshift(childIndex);
    currentNodeId = parentNodeId;
  }

  return currentNodeId === ancestorNodeId ? path : null;
};

const resolveNodeByPath = (
  api: ListSyncApi,
  rootNodeId: string,
  path: number[],
): string | null => {
  let currentNodeId = rootNodeId;

  for (const childIndex of path) {
    const childNodeIds = api.getChildNodeIds(currentNodeId);
    const nextNodeId = childNodeIds[childIndex];
    if (!nextNodeId) return null;
    currentNodeId = nextNodeId;
  }

  return currentNodeId;
};

const getRepeatedItemContext = (api: ListSyncApi, nodeId: string) => {
  const itemNodeId = findAncestorByRole(api, nodeId, 'item');
  if (!itemNodeId) return null;

  const itemsContainerNodeId = api.getParentNodeId(itemNodeId);
  if (!itemsContainerNodeId) return null;
  if (getRoleName(api.getNodeProps(itemsContainerNodeId)) !== 'items') return null;

  const itemNodeIds = api
    .getChildNodeIds(itemsContainerNodeId)
    .filter((childNodeId) => getRoleName(api.getNodeProps(childNodeId)) === 'item');

  if (itemNodeIds.length <= 1) return null;

  return {
    itemNodeId,
    itemsContainerNodeId,
    peerItemNodeIds: itemNodeIds.filter((candidateNodeId) => candidateNodeId !== itemNodeId),
  };
};

export const findMirroredNodeIds = (
  api: ListSyncApi,
  nodeId: string,
): string[] => {
  const context = getRepeatedItemContext(api, nodeId);
  if (!context) return [];

  const targetProps = api.getNodeProps(nodeId);
  const syncKey = getListSyncKey(targetProps);
  if (syncKey) {
    return context.peerItemNodeIds
      .map((itemNodeId) =>
        getSubtreeNodeIds(api, itemNodeId).find(
          (candidateNodeId) => getListSyncKey(api.getNodeProps(candidateNodeId)) === syncKey
        ) ?? null
      )
      .filter((candidateNodeId): candidateNodeId is string => Boolean(candidateNodeId));
  }

  const roleName = getRoleName(targetProps);
  if (!roleName) return [];

  if (roleName === 'item') {
    return context.peerItemNodeIds;
  }

  if (!roleName.startsWith('item-')) return [];

  return context.peerItemNodeIds
    .map((itemNodeId) =>
      getSubtreeNodeIds(api, itemNodeId).find(
        (candidateNodeId) => getRoleName(api.getNodeProps(candidateNodeId)) === roleName
      ) ?? null
    )
    .filter((candidateNodeId): candidateNodeId is string => Boolean(candidateNodeId));
};

export const getMirroredParentIds = (
  api: ListSyncApi,
  parentNodeId: string,
): string[] => {
  const context = getRepeatedItemContext(api, parentNodeId);
  if (!context) return [];

  const path = getPathFromAncestor(api, context.itemNodeId, parentNodeId);
  if (!path) return [];

  return context.peerItemNodeIds
    .map((itemNodeId) => resolveNodeByPath(api, itemNodeId, path))
    .filter((candidateNodeId): candidateNodeId is string => Boolean(candidateNodeId));
};

export const withListSyncKeys = (
  payload: ListSyncPayload,
  syncGroupId: string,
  path = 'root',
): ListSyncPayload => ({
  ...payload,
  props: {
    ...payload.props,
    listSyncKey: `${syncGroupId}:${path}`,
  },
  defaultChildren: payload.defaultChildren?.map((child, index) =>
    withListSyncKeys(child, syncGroupId, `${path}.${index}`) as ChildDragPayload
  ),
});
