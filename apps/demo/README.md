# AI Agent

## Setup

```bash
pnpm install # Install the dependencies:
pnpm dev # Start the dev server
pnpm build # Build the app for production
pnpm preview # Preview the production build locally
```

## Get started

Start the dev server at [http://localhost:10001](http://localhost:10001).

## 项目规范

[开发规范](https://teamhelper.feishu.cn/wiki/S28kwvWvVizJidkjgMMcUL7hnoG)

## 增强表格组件（固定表头 + 虚拟滚动）

路径：`src/components/enhance-ui/Table.tsx`

### 功能特性

- 固定表头：在容器滚动时，表头始终固定在顶部，列宽与内容天然对齐（同一张表）。
- 虚拟滚动：基于 `@tanstack/react-virtual`，对 1000+ 行数据进行只渲染可视区域优化。
- 启用阈值：当设置了 `scroll.y` 且数据量 `> 200` 时自动启用虚拟滚动。
- 性能优化：采用占位行（上/下）方式保持 `<table>` 语义，避免闪烁和卡顿。
- 保持 API 不变：兼容现有 `columns/dataSource/rowSelection/scroll` 等属性。
- 行高一致：按 `size` 自动估算固定行高，确保滚动平滑。
- 表头固定：默认开启，可通过 `stickyHeader` 配置启用/禁用，并自定义 `top` 与 `zIndex`。

### 快速示例

```tsx
import { Table as EnhancedTable } from '@/components/enhance-ui/Table';

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: true },
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160 },
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
];

const dataSource = Array.from({ length: 1500 }).map((_, i) => ({
  key: String(i + 1),
  id: i + 1,
  name: `用户-${i + 1}`,
  age: 18 + (i % 50),
  city: '上海',
  email: `user${i + 1}@example.com`,
}));

export default function Demo() {
  return (
    <EnhancedTable
      columns={columns}
      dataSource={dataSource}
      rowKey="key"
      bordered
      size="middle"
      scroll={{ y: 420 }}
      rowSelection={{ type: 'checkbox' }}
      stickyHeader={{ top: 0, zIndex: 20 }}
    />
  );
}
```

### 使用建议

- 建议在需要纵向滚动时传递 `scroll={{ y: number }}`，会自动启用虚拟滚动（数据量 > 50）。
- 从现在起，虚拟滚动的自动启用阈值为 `> 200` 条数据。
- 如需更紧凑或更舒适的行高，使用 `size="small|middle|large"`，内部会估算一致的行高以保证平滑滚动。
- 仍可使用 `sorter`、`rowSelection`、`title/footer`、`onRow/onHeaderRow` 等现有功能。
- 表头固定：可传递 `stickyHeader={false}` 关闭固定；或传递 `stickyHeader={{ top: 0, zIndex: 20 }}` 自定义位置与层级，避免被其他元素遮挡。

### 类型定义

主要类型：`ColumnType<T>`、`EnhancedTableProps<T>`。保留既有签名，并新增 `stickyHeader?: boolean | { top?: number; zIndex?: number }` 可选配置以增强体验。
