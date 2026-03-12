import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@teamhelper/ui';

const SkeletonDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>骨架屏 (Skeleton)</CardTitle>
      <CardDescription>用于显示加载状态的占位符</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default SkeletonDemo;
