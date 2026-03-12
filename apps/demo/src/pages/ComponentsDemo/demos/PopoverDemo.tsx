import {
  Button,
  EnhancedInput as Input,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@teamhelper/ui';

const PopoverDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>弹出框 (Popover)</CardTitle>
      <CardDescription>点击触发的弹出内容组件</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">打开弹出框</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">设置</h4>
              <p className="text-sm text-muted-foreground">配置您的偏好设置</p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="width">宽度</Label>
                <Input
                  id="width"
                  defaultValue="100%"
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="maxWidth">最大宽度</Label>
                <Input
                  id="maxWidth"
                  defaultValue="300px"
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="height">高度</Label>
                <Input
                  id="height"
                  defaultValue="25px"
                  className="col-span-2 h-8"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </CardContent>
  </Card>
);

export default PopoverDemo;
