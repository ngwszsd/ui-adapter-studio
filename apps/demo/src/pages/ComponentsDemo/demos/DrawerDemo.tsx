import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@teamhelper/ui';

const DrawerDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>抽屉 (Drawer)</CardTitle>
      <CardDescription>从屏幕边缘滑出的面板组件</CardDescription>
    </CardHeader>
    <CardContent>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">打开抽屉</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>抽屉标题</DrawerTitle>
              <DrawerDescription>这是抽屉的描述内容。</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <div className="flex items-center justify-center space-x-2">
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-7xl font-bold tracking-tighter">100</div>
                  <div className="text-[0.70rem] uppercase text-muted-foreground">
                    目标值
                  </div>
                </div>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DrawerFooter>
              <Button>提交</Button>
              <DrawerClose asChild>
                <Button variant="outline">取消</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </CardContent>
  </Card>
);

export default DrawerDemo;
