import React from 'react';

type NodePropUpdater = (nodeId: string, key: string, value: unknown) => void;
type NodeDeleter = (nodeId: string) => void;
type NodeDomGetter = (nodeId: string) => HTMLElement | null;
type ChildNodeIdsGetter = (nodeId: string) => string[];
type NodeComponentNameGetter = (nodeId: string) => string | null;
type NodePropsGetter = (nodeId: string) => Record<string, unknown> | null;
type ParentNodeIdGetter = (nodeId: string) => string | null;

/**
 * 外部拖拽创建连接器：将 Craft.js connectors.create 暴露给 CraftEditor 外部的 Toolbox。
 * 调用方式与 Craft.js 一致：create(domElement, reactElement)
 */
type CreateConnector = (
  el: HTMLElement,
  userElement: React.ReactElement,
) => void;

export interface EditorApi {
  updateNodeProp: NodePropUpdater;
  deleteNode: NodeDeleter;
  create: CreateConnector;
  getNodeDom: NodeDomGetter;
  getChildNodeIds: ChildNodeIdsGetter;
  getNodeComponentName: NodeComponentNameGetter;
  getNodeProps: NodePropsGetter;
  getParentNodeId: ParentNodeIdGetter;
}

const editorRegistry = new Map<string, EditorApi>();

export const registerEditorApi = (pageId: string, api: EditorApi) => {
  editorRegistry.set(pageId, api);
};

export const unregisterEditorApi = (pageId: string) => {
  editorRegistry.delete(pageId);
};

export const getEditorApi = (pageId: string) => editorRegistry.get(pageId);
