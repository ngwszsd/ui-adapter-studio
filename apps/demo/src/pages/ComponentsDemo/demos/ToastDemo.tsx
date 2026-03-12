import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';
import { toast } from '@teamhelper/ui';

const ToastDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>消息提示 (Toast)</CardTitle>
      <CardDescription>基于 Sonner 的消息提示组件</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => toast('这是一个基础消息')} variant="outline">
          基础消息
        </Button>
        <Button onClick={() => toast.success('操作成功！')} variant="outline">
          成功消息
        </Button>
        <Button onClick={() => toast.error('操作失败！')} variant="outline">
          错误消息
        </Button>
        <Button onClick={() => toast.warning('请注意！')} variant="outline">
          警告消息
        </Button>
        <Button onClick={() => toast.info('信息提示')} variant="outline">
          信息消息
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default ToastDemo;
