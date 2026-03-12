import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@teamhelper/ui';

const MenubarDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>菜单栏 (Menubar)</CardTitle>
      <CardDescription>水平菜单栏组件</CardDescription>
    </CardHeader>
    <CardContent>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>文件</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>新建</MenubarItem>
            <MenubarItem>打开</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>保存</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>编辑</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>撤销</MenubarItem>
            <MenubarItem>重做</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>复制</MenubarItem>
            <MenubarItem>粘贴</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>查看</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>缩放</MenubarItem>
            <MenubarItem>全屏</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </CardContent>
  </Card>
);

export default MenubarDemo;
