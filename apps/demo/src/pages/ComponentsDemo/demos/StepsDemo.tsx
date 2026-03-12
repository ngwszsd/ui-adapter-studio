import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Steps,
} from '@teamhelper/ui';

const description = 'This is a content.';
const items = [
  {
    title: 'Finished',
    description,
  },
  {
    title: 'In Progress',
    description,
    subTitle: 'Left 00:00:08',
  },
  {
    title: 'Waiting',
    description,
  },
];

const StepsDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>步骤条 (Steps)</CardTitle>
      <CardDescription>引导用户按照流程完成任务的导航条。</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Steps current={1} items={items} />
      <Steps current={1} items={items} size="small" />
    </CardContent>
  </Card>
);

export default StepsDemo;
