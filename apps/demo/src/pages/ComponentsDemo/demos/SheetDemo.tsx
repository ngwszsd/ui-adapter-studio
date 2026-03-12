import {
  Button,
  EnhancedInput as Input,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Sheet,
} from '@teamhelper/ui';
import { Calendar, Mail, MessageSquare } from 'lucide-react';

const SheetDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>侧边栏 (Sheet)</CardTitle>
      <CardDescription>从屏幕边缘滑出的侧边栏组件</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">从右侧打开</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>编辑个人资料</SheetTitle>
              <SheetDescription>
                在这里修改您的个人资料信息。完成后点击保存。
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  姓名
                </Label>
                <Input id="name" defaultValue="张三" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  用户名
                </Label>
                <Input
                  id="username"
                  defaultValue="@zhangsan"
                  className="col-span-3"
                />
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit">保存更改</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">从左侧打开</Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>导航菜单</SheetTitle>
              <SheetDescription>选择您要访问的页面</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <Button variant="ghost" className="justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                日历
              </Button>
              <Button variant="ghost" className="justify-start">
                <Mail className="mr-2 h-4 w-4" />
                邮件
              </Button>
              <Button variant="ghost" className="justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                消息
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </CardContent>
  </Card>
);

export default SheetDemo;
