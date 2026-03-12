import { cn } from '@/lib/utils';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DirectoryTree,
  Dropdown,
  EnhancedButton,
  Steps,
  type TreeNode,
} from '@teamhelper/ui';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo } from 'react';

type ApiNode = TreeNode & { method?: any };

const methodColorClass: Record<any, string> = {
  GET: 'text-green-400 dark:text-green-400',
  POST: 'text-orange-400 dark:text-orange-400',
  PUT: 'text-primary dark:text-primary',
  DELETE: 'text-destructive dark:text-destructive',
  PATCH: 'text-purple-400 dark:text-purple-400',
  HEAD: 'text-slate-400 dark:text-slate-400',
  OPTIONS: 'text-teal-400 dark:text-teal-400',
};

const DirectoryTreeDemo = () => {
  const apiTreeData: ApiNode[] = useMemo(
    () => [
      {
        key: 'group-teamhelper',
        title: 'Teamhelper',
        children: [
          {
            key: 'post-login',
            title: '登录',
            children: [
              {
                key: 'post-login-1',
                title: '登录1',
                children: [
                  { key: 'post-login-3', title: '登录abc', method: 'POST' },
                ],
              },
              { key: 'post-login-2', title: '登录2', method: 'POST' },
            ],
          },
          {
            key: 'get-profile',
            title: '获取个人信息',
            children: [
              {
                key: 'get-profile-1',
                title: '获取个人信息abc',
                method: 'POST',
              },
            ],
          },
          { key: 'post-register', title: '注册', method: 'POST' },
          { key: 'post-logout', title: '登出', method: 'POST' },
          { key: 'get-teamlist', title: '获取团队列表', method: 'GET' },
          { key: 'post-createteam', title: '创建团队', method: 'POST' },
          { key: 'put-updateteam', title: '更新团队信息', method: 'PUT' },
          { key: 'post-jointeam', title: '加入团队', method: 'POST' },
          { key: 'post-leaveteam', title: '离开团队', method: 'POST' },
          { key: 'delete-deleteteam', title: '删除团队', method: 'DELETE' },
          { key: 'post-deletemember', title: '删除成员', method: 'POST' },
          { key: 'post-invite', title: '邀请成员', method: 'POST' },
          { key: 'post-declineinvite', title: '拒绝邀请', method: 'POST' },
          { key: 'post-kickmember', title: '踢出成员', method: 'POST' },
          { key: 'post-acceptinvite', title: '接受邀请', method: 'POST' },
        ],
      },
      {
        key: 'group-teamhelper222',
        title: 'Teamhelper22',
        children: [
          { key: 'post-login2', title: '登录', method: 'POST' },
          { key: 'get-profile2', title: '获取个人信息', method: 'GET' },
          { key: 'post-register2', title: '注册', method: 'POST' },
          { key: 'post-logout2', title: '登出', method: 'POST' },
        ],
      },
    ],
    [],
  );

  const renderApiRow = useCallback(
    (
      node: ApiNode,
      state: {
        key: React.Key;
        level: number;
        expanded: boolean;
        isLeaf: boolean;
      },
    ) => {
      const api = node as ApiNode;
      const methodEl = api.method ? (
        <span className={`text-xs font-medium ${methodColorClass[api.method]}`}>
          {api.method}
        </span>
      ) : null;

      return (
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1">
            {methodEl}
            <span
              className={cn(
                'truncate font-medium text-foreground',
                !state?.level ? 'text-sm' : 'text-xs',
              )}
            >
              {node.title}
            </span>
          </div>

          <Dropdown
            menu={{
              items: [
                { key: 'request', label: '新请求' },
                { key: 'folder', label: '新文件夹' },
                { key: 'edit', label: '编辑' },
                { key: 'export', label: '导出' },
                { key: 'copy', label: '复制' },
                { key: 'delete', label: '删除', danger: true },
              ].filter((item) => {
                if (!state?.isLeaf) {
                  return !['copy'].includes(item?.key);
                } else {
                  return !['request', 'folder', 'export'].includes(item?.key);
                }
              }),
            }}
            placement="bottomRight"
            overlayClassName="min-w-20"
          >
            <EnhancedButton
              className={cn(
                'border-0 shadow-none text-foreground bg-transparent',
                'rounded-full w-8 h-[18px] hover:bg-muted-foreground/10',
                'p-0!',
              )}
            >
              <MoreHorizontal />
            </EnhancedButton>
          </Dropdown>
        </div>
      );
    },
    [],
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>目录树 (DirectoryTree)</CardTitle>
        <CardDescription>基于增强组件Tree实现的目录树。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 h-80">
        <DirectoryTree
          treeData={apiTreeData}
          selectionMode="single"
          expandAction="click"
          toggleIconPosition="left"
          showToggleIcon={false}
          renderNodeContent={renderApiRow}
          fileIcon={false}
          className="flex flex-col flex-1 min-h-0"
          containerHeight="100%"
        />
      </CardContent>
    </Card>
  );
};

export default DirectoryTreeDemo;
