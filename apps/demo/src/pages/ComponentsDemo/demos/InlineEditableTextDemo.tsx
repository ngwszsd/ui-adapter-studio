import { InlineEditableText } from '@/components/common/InlineEditableText';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';

const InlineEditableTextDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>文本可编辑 (InlineEditableText)</CardTitle>
      <CardDescription>便于内部管理状态。</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <InlineEditableText defaultValue="猜猜我是谁" placeholder="请输入" />
    </CardContent>
  </Card>
);

export default InlineEditableTextDemo;
