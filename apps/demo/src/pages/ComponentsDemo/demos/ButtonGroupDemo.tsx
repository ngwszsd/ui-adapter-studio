import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ButtonGroup,
} from '@teamhelper/ui';

const ButtonGroupDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>按钮组 (ButtonGroup)</CardTitle>
      <CardDescription>将多个按钮组合在一起的组件</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <ButtonGroup>
        <Button variant="outline">左</Button>
        <Button variant="outline">中</Button>
        <Button variant="outline">右</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button>第一个</Button>
        <Button>第二个</Button>
        <Button>第三个</Button>
      </ButtonGroup>
    </CardContent>
  </Card>
);

export default ButtonGroupDemo;
