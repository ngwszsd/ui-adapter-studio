import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EnhancedBreadcrumb,
} from '@teamhelper/ui';

const BreadcrumbDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>面包屑 (EnhancedBreadcrumb)</CardTitle>
      <CardDescription>
        显示当前页面在系统层级结构中的位置，并能向上返回。
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 flex flex-col">
      <EnhancedBreadcrumb
        items={[
          { label: '首页' },
          { label: '知识库' },
          { label: '团队助手' },
          { label: '团队助手介绍' },
          { label: '团队助手介绍2' },
          { label: '团队助手介绍3' },
          { label: '团队助手介绍4' },
          { label: '团队助手介绍5' },
          { label: '团队助手介绍6' },
        ]}
        separator="/"
        maxItems={Infinity}
      />
    </CardContent>
  </Card>
);

export default BreadcrumbDemo;
