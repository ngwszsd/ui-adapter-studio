import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@teamhelper/ui';

const SpinnerDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>加载指示器 (Spinner)</CardTitle>
      <CardDescription>用于显示加载状态的旋转指示器</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-4">
        <Spinner className="h-4 w-4" />
        <span className="text-sm">小尺寸</span>
      </div>
      <div className="flex items-center gap-4">
        <Spinner />
        <span className="text-sm">默认尺寸</span>
      </div>
      <div className="flex items-center gap-4">
        <Spinner className="h-8 w-8" />
        <span className="text-sm">大尺寸</span>
      </div>
    </CardContent>
  </Card>
);

export default SpinnerDemo;
