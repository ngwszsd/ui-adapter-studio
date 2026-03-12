import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  EnhancedTable,
  type ColumnType,
} from '@teamhelper/ui';

type DemoRow = {
  key: string;
  id: number;
  name: string;
  age: number;
  city: string;
  email: string;
};

const EnhancedTableFeaturesDemo = () => {
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
            <button className="shrink-0 text-sm">查看</button>
            <button className="shrink-0 text-sm">编辑</button>
          </div>
        ),
      },
    ],
    [],
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
        <CardTitle>增强表格 - 新功能演示</CardTitle>
        <CardDescription>
          演示单选功能、固定列配置和多选列固定等新特性
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="text-sm font-medium">1. 单选功能演示</div>
          <div className="text-sm text-muted-foreground">
            使用 rowSelection 设置 type 为 'radio' 实现单选
          </div>
          <EnhancedTable
            columns={enhancedColumns.slice(0, 4)}
            dataSource={enhancedData.slice(0, 10)}
            rowKey="key"
            size="small"
            bordered
            rowSelection={{ type: 'radio' }}
            title={() => (
              <div className="flex items-center gap-2">
                <span>单选模式</span>
                <Badge variant="outline">radio</Badge>
              </div>
            )}
          />
        </section>

        <section className="space-y-3">
          <div className="text-sm font-medium">2. 固定列功能演示</div>
          <div className="text-sm text-muted-foreground">
            左侧固定ID和姓名列，右侧固定操作列
          </div>
          <EnhancedTable
            columns={[
              {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                width: 80,
                fixed: 'left',
                sorter: true,
              },
              {
                title: '姓名',
                dataIndex: 'name',
                key: 'name',
                width: 120,
                fixed: 'left',
                ellipsis: true,
              },
              {
                title: '年龄',
                dataIndex: 'age',
                key: 'age',
                width: 100,
                align: 'right',
                sorter: true,
              },
              { title: '城市', dataIndex: 'city', key: 'city', width: 150 },
              {
                title: '邮箱',
                dataIndex: 'email',
                key: 'email',
                width: 200,
                ellipsis: true,
              },
              {
                title: '电话',
                dataIndex: 'phone',
                key: 'phone',
                width: 150,
                render: () => '138****8888',
              },
              {
                title: '地址',
                dataIndex: 'address',
                key: 'address',
                width: 200,
                render: () => '北京市朝阳区',
              },
              {
                title: '公司',
                dataIndex: 'company',
                key: 'company',
                width: 150,
                render: () => '科技有限公司',
              },
              {
                title: '操作',
                key: 'action',
                width: 120,
                fixed: 'right',
                render: () => (
                  <div className="flex gap-2">
                    <button className="shrink-0 text-sm">编辑</button>
                    <button className="shrink-0 text-sm">删除</button>
                  </div>
                ),
              },
            ]}
            dataSource={enhancedData}
            rowKey="key"
            size="small"
            bordered
            scroll={{ x: 1200, y: 300 }}
            title={() => (
              <div className="flex items-center gap-2">
                <span>固定列演示</span>
                <Badge variant="outline">fixed columns</Badge>
              </div>
            )}
          />
        </section>

        <section className="space-y-3">
          <div className="text-sm font-medium">3. 多选列固定演示</div>
          <div className="text-sm text-muted-foreground">
            多选列自动固定在左侧，支持全选功能
          </div>
          <EnhancedTable
            columns={[
              {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                width: 80,
                sorter: true,
              },
              {
                title: '姓名',
                dataIndex: 'name',
                key: 'name',
                width: 120,
                ellipsis: true,
              },
              {
                title: '年龄',
                dataIndex: 'age',
                key: 'age',
                width: 100,
                align: 'right',
                sorter: true,
              },
              { title: '城市', dataIndex: 'city', key: 'city', width: 150 },
              {
                title: '邮箱',
                dataIndex: 'email',
                key: 'email',
                width: 200,
                ellipsis: true,
              },
              {
                title: '电话',
                dataIndex: 'phone',
                key: 'phone',
                width: 150,
                render: () => '138****8888',
              },
              {
                title: '地址',
                dataIndex: 'address',
                key: 'address',
                width: 200,
                render: () => '北京市朝阳区',
              },
              {
                title: '公司',
                dataIndex: 'company',
                key: 'company',
                width: 150,
                render: () => '科技有限公司',
              },
              {
                title: '部门',
                dataIndex: 'department',
                key: 'department',
                width: 120,
                render: () => '技术部',
              },
              {
                title: '职位',
                dataIndex: 'position',
                key: 'position',
                width: 120,
                render: () => '工程师',
              },
            ]}
            dataSource={enhancedData}
            rowKey="key"
            size="small"
            bordered
            scroll={{ x: 1400, y: 350 }}
            rowSelection={{ type: 'checkbox' }}
            title={() => (
              <div className="flex items-center gap-2">
                <span>多选列固定演示</span>
                <Badge variant="outline">checkbox fixed</Badge>
              </div>
            )}
          />
        </section>
      </CardContent>
    </Card>
  );
};

export default EnhancedTableFeaturesDemo;
