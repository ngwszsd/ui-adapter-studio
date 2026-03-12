import RevealPassword from '@/components/common/RevealPassword';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';

const RevealPasswordDemo = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>显示或隐藏密码 (RevealPassword)</CardTitle>
        <CardDescription>
          将密码显隐逻辑抽出为独立组件，内部管理状态。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RevealPassword password="1234567890" />
      </CardContent>
    </Card>
  );
};

export default RevealPasswordDemo;
