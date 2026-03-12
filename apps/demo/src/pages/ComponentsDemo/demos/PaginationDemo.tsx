import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EnhancedPagination as Pagination,
} from '@teamhelper/ui';

const PaginationDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>分页 (Pagination)</CardTitle>
      <CardDescription>用于分页导航的组件</CardDescription>
    </CardHeader>
    <CardContent>
      <Pagination
        showQuickJumper
        showSizeChanger
        current={1}
        pageSize={10}
        total={999}
      />
    </CardContent>
  </Card>
);

export default PaginationDemo;
