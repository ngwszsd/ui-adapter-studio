import React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type ColumnType,
  Badge,
  ButtonGroup,
  EnhancedTable,
  Switch,
} from '@teamhelper/ui';

type DemoRow = {
  key: string;
  id: number;
  name: string;
  age: number;
  city: string;
  email: string;
};

const EnhancedTableBasicDemo = () => {
  const [stickyHeaderEnabled, setStickyHeaderEnabled] = React.useState(true);
  const [ageAlign, setAgeAlign] = React.useState<'left' | 'center' | 'right'>(
    'left',
  );

  const enhancedColumns: ColumnType<DemoRow>[] = React.useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: true },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 160,
        ellipsis: true,
      },
      {
        title: '年龄',
        dataIndex: 'age',
        key: 'age',
        width: 100,
        align: 'right',
        sorter: (a: any, b: any) => a.age - b.age,
      },
      { title: '城市', dataIndex: 'city', key: 'city', width: 160 },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
        width: 240,
        ellipsis: true,
      },
      {
        title: '操作',
        key: 'action',
        width: 140,
        render: () => (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary">
              查看
            </Button>
            <Button size="sm" variant="outline">
              编辑
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const enhancedColumnsDynamic: ColumnType<DemoRow>[] = React.useMemo(
    () =>
      enhancedColumns.map((c) =>
        c.key === 'age' ? { ...c, align: ageAlign } : c,
      ),
    [enhancedColumns, ageAlign],
  );

  const enhancedData: DemoRow[] = React.useMemo(() => {
    const cities = [
      '上海',
      '北京',
      '广州',
      '深圳',
      '杭州',
      '成都',
      '武汉',
      '西安',
    ];
    const names = [
      '张三',
      '李四',
      '王五',
      '赵六',
      '孙七',
      '周八',
      '吴九',
      '郑十',
    ];
    return Array.from({ length: 150000 }).map((_, i) => ({
      key: String(i + 1),
      id: i + 1,
      name: `${names[i % names.length]}-${i + 1}`,
      age: 18 + (i % 50),
      city: cities[i % cities.length],
      email:
        i % 2 > 0
          ? `user${i + 1}@example.com`
          : 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@qq.com',
    }));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>增强表格 (固定表头 + 虚拟滚动)</CardTitle>
        <CardDescription>
          使用 @tanstack/react-virtual 优化大数据量渲染，滚动时表头保持固定
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">表头固定</span>
            <Switch
              checked={stickyHeaderEnabled}
              onCheckedChange={setStickyHeaderEnabled}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">年龄列对齐</span>
            <ButtonGroup>
              <Button
                size="sm"
                variant={ageAlign === 'left' ? 'default' : 'outline'}
                onClick={() => setAgeAlign('left')}
              >
                左
              </Button>
              <Button
                size="sm"
                variant={ageAlign === 'center' ? 'default' : 'outline'}
                onClick={() => setAgeAlign('center')}
              >
                中
              </Button>
              <Button
                size="sm"
                variant={ageAlign === 'right' ? 'default' : 'outline'}
                onClick={() => setAgeAlign('right')}
              >
                右
              </Button>
            </ButtonGroup>
          </div>
        </div>
        <EnhancedTable
          columns={enhancedColumnsDynamic}
          dataSource={enhancedData}
          rowKey="key"
          size="middle"
          bordered
          scroll={{ y: 420 }}
          stickyHeader
          rowSelection={{ type: 'checkbox' }}
          title={() => (
            <div className="flex items-center justify-between">
              <span>用户列表（150000 行，虚拟滚动）</span>
              <Badge variant="secondary">性能优化</Badge>
            </div>
          )}
          footer={(data) => (
            <div className="text-muted-foreground">
              当前总计：{data.length} 行
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default EnhancedTableBasicDemo;
