import {
  EnhancedButton as Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';
import { PageHeader } from '@/components/PageHeader';

const PageHeaderDemo = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>页头 (PageHeader)</CardTitle>
        <CardDescription>
          页头位于页容器中，页容器顶部，起到了内容概览和引导页级操作的作用。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PageHeader
          title="标题"
          subTitle="返回"
          extra={<Button type="primary">新增</Button>}
          classNames={{
            box: 'bg-background',
          }}
        />
      </CardContent>
    </Card>
  );
};

export default PageHeaderDemo;
