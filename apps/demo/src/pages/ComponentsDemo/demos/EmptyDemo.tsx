import {
  EnhancedButton as Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';
import { Search } from 'lucide-react';

const EmptyDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>空状态 (Empty)</CardTitle>
      <CardDescription>用于显示空状态的组件</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">暂无数据</h3>
        <p className="text-muted-foreground mb-4">
          当前没有可显示的内容，请稍后再试。
        </p>
        <Button>刷新页面</Button>
      </div>
    </CardContent>
  </Card>
);

export default EmptyDemo;
