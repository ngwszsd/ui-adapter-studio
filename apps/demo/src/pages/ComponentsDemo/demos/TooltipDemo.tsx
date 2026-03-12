import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@teamhelper/ui';
import { HelpCircle } from 'lucide-react';

const TooltipDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>工具提示 (Tooltip)</CardTitle>
      <CardDescription>鼠标悬停时显示的提示信息</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">
              <HelpCircle className="h-4 w-4 mr-2" />
              悬停查看提示
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>这是一个工具提示信息</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary">另一个提示</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>这个提示显示在底部</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </CardContent>
  </Card>
);

export default TooltipDemo;
