import {
  AspectRatio,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';

const AspectRatioDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>宽高比 (AspectRatio)</CardTitle>
      <CardDescription>用于保持元素宽高比的组件</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="w-[300px]">
        <AspectRatio
          ratio={16 / 9}
          className="bg-muted rounded-md overflow-hidden"
        >
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-400 to-purple-600 text-primary-foreground font-semibold">
            16:9 宽高比
          </div>
        </AspectRatio>
      </div>
      <div className="w-[200px]">
        <AspectRatio ratio={1} className="bg-muted rounded-md overflow-hidden">
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-400 to-blue-600 text-primary-foreground font-semibold">
            1:1 正方形
          </div>
        </AspectRatio>
      </div>
    </CardContent>
  </Card>
);

export default AspectRatioDemo;
