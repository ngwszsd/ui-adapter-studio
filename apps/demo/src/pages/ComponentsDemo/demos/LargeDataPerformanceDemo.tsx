import React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  EnhancedTable,
} from '@teamhelper/ui';
import { toast } from '@teamhelper/ui';

type Row = {
  key: number;
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  joinDate: string;
  score: number;
};

const LargeDataPerformanceDemo = () => {
  const [largeTableData, setLargeTableData] = React.useState<Row[]>([]);
  const [largeTableSelection, setLargeTableSelection] = React.useState<
    React.Key[]
  >([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>大数据量性能测试</CardTitle>
        <CardDescription>
          测试表格在大数据量下的选择性能，包含虚拟滚动和批量更新优化
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                const startTime = performance.now();
                const largeData = Array.from({ length: 10000 }, (_, i) => ({
                  key: i,
                  id: i + 1,
                  name: `用户 ${i + 1}`,
                  email: `user${i + 1}@example.com`,
                  department: `部门 ${(i % 10) + 1}`,
                  role: ['管理员', '开发者', '设计师', '测试员'][i % 4],
                  status: i % 3 === 0 ? '在线' : i % 3 === 1 ? '离线' : '忙碌',
                  joinDate: new Date(
                    2020 + (i % 4),
                    i % 12,
                    (i % 28) + 1,
                  ).toLocaleDateString(),
                  score: Math.floor(Math.random() * 100),
                }));
                setLargeTableData(largeData);
                const endTime = performance.now();
                toast.success(
                  `生成 ${largeData.length} 条数据耗时: ${(endTime - startTime).toFixed(2)}ms`,
                );
              }}
            >
              生成 10,000 条数据
            </Button>
            <Button
              onClick={() => {
                const startTime = performance.now();
                const largeData = Array.from({ length: 50000 }, (_, i) => ({
                  key: i,
                  id: i + 1,
                  name: `用户 ${i + 1}`,
                  email: `user${i + 1}@example.com`,
                  department: `部门 ${(i % 20) + 1}`,
                  role: ['管理员', '开发者', '设计师', '测试员', '产品经理'][
                    i % 5
                  ],
                  status: i % 3 === 0 ? '在线' : i % 3 === 1 ? '离线' : '忙碌',
                  joinDate: new Date(
                    2018 + (i % 6),
                    i % 12,
                    (i % 28) + 1,
                  ).toLocaleDateString(),
                  score: Math.floor(Math.random() * 100),
                }));
                setLargeTableData(largeData);
                const endTime = performance.now();
                toast.success(
                  `生成 ${largeData.length} 条数据耗时: ${(endTime - startTime).toFixed(2)}ms`,
                );
              }}
            >
              生成 50,000 条数据
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const startTime = performance.now();
                const largeData = Array.from({ length: 150000 }, (_, i) => ({
                  key: i,
                  id: i + 1,
                  name: `用户 ${i + 1}`,
                  email: `user${i + 1}@example.com`,
                  department: `部门 ${(i % 50) + 1}`,
                  role: [
                    '管理员',
                    '开发者',
                    '设计师',
                    '测试员',
                    '产品经理',
                    '运营',
                    '市场',
                  ][i % 7],
                  status: i % 3 === 0 ? '在线' : i % 3 === 1 ? '离线' : '忙碌',
                  joinDate: new Date(
                    2015 + (i % 9),
                    i % 12,
                    (i % 28) + 1,
                  ).toLocaleDateString(),
                  score: Math.floor(Math.random() * 100),
                }));
                setLargeTableData(largeData);
                const endTime = performance.now();
                toast.success(
                  `生成 ${largeData.length.toLocaleString()} 条数据耗时: ${(endTime - startTime).toFixed(2)}ms`,
                );
              }}
            >
              生成 150,000 条数据 🚀
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLargeTableData([]);
                setLargeTableSelection([]);
                toast.info('已清空数据');
              }}
            >
              清空数据
            </Button>
          </div>

          {largeTableData.length > 0 && (
            <div className="text-sm text-muted-foreground">
              当前数据量: {largeTableData.length.toLocaleString()} 条， 已选择:{' '}
              {largeTableSelection.length.toLocaleString()} 条
              {largeTableData.length > 200 && (
                <Badge variant="secondary" className="ml-2">
                  虚拟滚动已启用
                </Badge>
              )}
            </div>
          )}
        </section>

        <EnhancedTable
          columns={[
            {
              title: 'ID',
              dataIndex: 'id',
              key: 'id',
              width: 80,
              fixed: 'left',
            },
            {
              title: '姓名',
              dataIndex: 'name',
              key: 'name',
              width: 120,
              fixed: 'left',
            },
            { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
            {
              title: '部门',
              dataIndex: 'department',
              key: 'department',
              width: 120,
            },
            {
              title: '角色',
              dataIndex: 'role',
              key: 'role',
              width: 100,
              render: (role) => (
                <Badge
                  variant={
                    role === '管理员'
                      ? 'destructive'
                      : role === '开发者'
                        ? 'default'
                        : role === '设计师'
                          ? 'secondary'
                          : role === '测试员'
                            ? 'outline'
                            : 'default'
                  }
                >
                  {role}
                </Badge>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 80,
              render: (status) => (
                <Badge
                  variant={
                    status === '在线'
                      ? 'default'
                      : status === '离线'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {status}
                </Badge>
              ),
            },
            {
              title: '入职日期',
              dataIndex: 'joinDate',
              key: 'joinDate',
              width: 120,
            },
            {
              title: '评分',
              dataIndex: 'score',
              key: 'score',
              width: 80,
              fixed: 'right',
              render: (score) => (
                <div className="text-center">
                  <span
                    className={
                      score >= 80
                        ? 'text-green-600'
                        : score >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }
                  >
                    {score}
                  </span>
                </div>
              ),
            },
          ]}
          dataSource={largeTableData}
          rowKey="key"
          scroll={{ y: 400, x: 1000 }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: largeTableSelection,
            onChange: (selectedRowKeys) => {
              const startTime = performance.now();
              setLargeTableSelection(selectedRowKeys);
              const endTime = performance.now();
              console.log(
                `选择更新耗时: ${(endTime - startTime).toFixed(2)}ms`,
              );
            },
          }}
          title={() => (
            <div className="flex items-center justify-between">
              <span>大数据量表格 - 性能优化测试</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const startTime = performance.now();
                    setLargeTableSelection(
                      largeTableData.map((item) => item.key),
                    );
                    const endTime = performance.now();
                    toast.success(
                      `全选耗时: ${(endTime - startTime).toFixed(2)}ms`,
                    );
                  }}
                >
                  全选
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const startTime = performance.now();
                    setLargeTableSelection([]);
                    const endTime = performance.now();
                    toast.success(
                      `清空选择耗时: ${(endTime - startTime).toFixed(2)}ms`,
                    );
                  }}
                >
                  清空选择
                </Button>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default LargeDataPerformanceDemo;
