import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputNumber,
} from '@teamhelper/ui';

const InputNumberDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>数字输入框 (InputNumber)</CardTitle>
      <CardDescription>通过鼠标或键盘，输入范围内的数值。</CardDescription>
    </CardHeader>
    <CardContent className="space-x-4">
      <InputNumber className="w-50" placeholder="请输入" />

      <InputNumber
        min={1}
        max={10}
        step={1}
        precision={0}
        className="w-50"
        defaultValue={6}
      />
    </CardContent>
  </Card>
);

export default InputNumberDemo;
