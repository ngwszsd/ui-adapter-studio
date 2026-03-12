import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@teamhelper/ui';

const TabsDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>标签页 (Tabs)</CardTitle>
      <CardDescription>用于组织内容的标签页组件</CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">账户</TabsTrigger>
          <TabsTrigger value="password">密码</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="space-y-2">
          <p>管理您的账户设置和偏好。</p>
        </TabsContent>
        <TabsContent value="password" className="space-y-2">
          <p>更改您的密码设置。</p>
        </TabsContent>
        <TabsContent value="settings" className="space-y-2">
          <p>配置应用程序设置。</p>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

export default TabsDemo;
