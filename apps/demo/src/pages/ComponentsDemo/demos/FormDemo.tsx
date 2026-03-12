import {
  EnhancedInput as Input,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  EnhancedTextarea,
} from '@teamhelper/ui';

const FormDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>表单组件</CardTitle>
      <CardDescription>输入框、标签、文本域等表单元素</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="email">邮箱</Label>
        <Input type="email" id="email" placeholder="请输入邮箱" />
      </div>
      <div className="grid w-full gap-1.5">
        <Label htmlFor="message">消息</Label>
        <EnhancedTextarea placeholder="请输入您的消息" id="message" />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="select">选择框</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="请选择一个选项" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">选项 1</SelectItem>
            <SelectItem value="option2">选项 2</SelectItem>
            <SelectItem value="option3">选项 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="search">搜索框</Label>

        <Input.Search placeholder="请输入关键字" id="search" />
      </div>
    </CardContent>
  </Card>
);

export default FormDemo;
