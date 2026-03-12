import React from 'react';
import {
  RadioGroup,
  RadioGroupItem,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type TreeNode,
  type SelectionMode,
  Label,
  Tree,
  type TreeSelectInfo,
} from '@teamhelper/ui';
import { toast } from '@teamhelper/ui';

type ApiMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS';
type ApiNode = TreeNode & { method?: ApiMethod };

const EnhancedTreeDemo = () => {
  const [treeSelectionMode, setTreeSelectionMode] =
    React.useState<SelectionMode>('single');
  const [selectedTreeNodes, setSelectedTreeNodes] = React.useState<string[]>(
    [],
  );
  const [selectedNodeInfo, setSelectedNodeInfo] = React.useState<string>('');

  const methodColorClass: Record<ApiMethod, string> = {
    GET: 'text-green-600 dark:text-green-400',
    POST: 'text-orange-600 dark:text-orange-400',
    PUT: 'text-blue-600 dark:text-blue-400',
    DELETE: 'text-red-600 dark:text-red-400',
    PATCH: 'text-purple-600 dark:text-purple-400',
    HEAD: 'text-slate-600 dark:text-slate-400',
    OPTIONS: 'text-teal-600 dark:text-teal-400',
  };

  const renderApiRow = React.useCallback((node: TreeNode) => {
    const api = node as ApiNode;
    const methodEl = api.method ? (
      <span
        className={`text-xs font-medium mr-2 ${methodColorClass[api.method]}`}
      >
        {api.method}
      </span>
    ) : null;
    return (
      <>
        {methodEl}
        {node.icon && <span className="mr-2">{node.icon}</span>}
        <span className="truncate">{node.title}</span>
      </>
    );
  }, []);

  const apiTreeData: ApiNode[] = React.useMemo(
    () => [
      {
        key: 'group-teamhelper',
        title: 'Teamhelper',
        children: [
          { key: 'post-login', title: '登录', method: 'POST' },
          { key: 'get-profile', title: '获取个人信息', method: 'GET' },
        ],
      },
    ],
    [],
  );

  const largeApiTreeData: ApiNode[] = React.useMemo(() => {
    return Array.from({ length: 100 }).map((_, gi) => ({
      key: `group-${gi + 1}`,
      title: `服务组 ${gi + 1}`,
      children: Array.from({ length: 5 }).map((__, si) => ({
        key: `group-${gi + 1}-item-${si + 1}`,
        title: `接口 ${si + 1}`,
        method: (si % 2 ? 'GET' : 'POST') as ApiMethod,
      })),
    }));
  }, []);

  const handleTreeSelect = (keys: React.Key[], info: TreeSelectInfo) => {
    setSelectedTreeNodes(keys.map((key) => String(key)));
    const nodeInfo = keys.map((key) => String(key)).join(', ');
    setSelectedNodeInfo(nodeInfo);
    toast(`已选中节点: ${nodeInfo} ${JSON.stringify(info)}`, {
      description: `选择模式: ${treeSelectionMode === 'single' ? '单选' : '多选'}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>增强树形组件（虚拟滚动 + 节点选中）</CardTitle>
        <CardDescription>支持展开折叠、节点选中、自定义内容</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-4">
            <Label>选择模式:</Label>
            <RadioGroup
              value={treeSelectionMode}
              onValueChange={(value) => {
                setTreeSelectionMode(value as SelectionMode);
                setSelectedTreeNodes([]);
                setSelectedNodeInfo('');
              }}
              className="flex flex-row gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">单选</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple" id="multiple" />
                <Label htmlFor="multiple">多选</Label>
              </div>
            </RadioGroup>
          </div>
          {selectedNodeInfo && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm font-medium">已选中节点:</div>
              <div className="text-sm text-muted-foreground mt-1">
                {selectedNodeInfo}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="text-sm text-muted-foreground">
            示例样式 - 支持节点选中
          </div>
          <Tree
            treeData={apiTreeData}
            containerHeight={280}
            showToggleIcon={false}
            estimatedItemSize={40}
            indent={20}
            renderNodeContent={renderApiRow}
            selectionMode={treeSelectionMode}
            selectable
            selectedKeys={selectedTreeNodes}
            onSelect={handleTreeSelect}
          />
        </section>

        <section className="space-y-3">
          <div className="text-sm text-muted-foreground">
            大数据量（100 组 × 5 项）- 支持节点选中
          </div>
          <Tree
            treeData={largeApiTreeData}
            estimatedItemSize={40}
            containerHeight={420}
            showToggleIcon
            indent={20}
            renderNodeContent={renderApiRow}
            selectionMode={treeSelectionMode}
            selectable
            selectedKeys={selectedTreeNodes}
            onSelect={handleTreeSelect}
          />
        </section>
      </CardContent>
    </Card>
  );
};

export default EnhancedTreeDemo;
