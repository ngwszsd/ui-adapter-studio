import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@teamhelper/ui';

const BadgeDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>徽章组件 (Badge)</CardTitle>
      <CardDescription>用于显示状态或标签的小标记</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        <Badge>默认</Badge>
        <Badge variant="secondary">次要</Badge>
        <Badge variant="destructive">危险</Badge>
        <Badge variant="outline">轮廓</Badge>
      </div>
    </CardContent>
  </Card>
);

export default BadgeDemo;
