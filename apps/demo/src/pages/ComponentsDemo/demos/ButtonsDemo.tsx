import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EnhancedButton,
} from '@teamhelper/ui';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ButtonsDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>按钮组件 (Button)</CardTitle>
      <CardDescription>不同样式和尺寸的按钮</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button>默认按钮</Button>
        <Button variant="secondary">次要按钮</Button>
        <Button variant="destructive">危险按钮</Button>
        <Button variant="outline">轮廓按钮</Button>
        <Button variant="ghost">幽灵按钮</Button>
        <Button variant="link">链接按钮</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm">小按钮</Button>
        <Button size="default">默认大小</Button>
        <Button size="lg">大按钮</Button>
        <Button size="icon">
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <EnhancedButton>按钮1</EnhancedButton>

        <EnhancedButton
          className={cn(
            'border border-primary text-primary bg-transparent',
            'hover:border-primary/70 hover:text-primary/70 hover:bg-transparent',
          )}
        >
          按钮2
        </EnhancedButton>

        <EnhancedButton
          className={cn(
            'border border-destructive text-destructive bg-transparent',
            'hover:border-destructive/70 hover:text-destructive/70 hover:bg-transparent',
          )}
        >
          按钮3
        </EnhancedButton>

        <EnhancedButton
          className={cn(
            'border border-green-500 text-green-500 bg-transparent',
            'hover:border-green-500/70 hover:text-green-500/70 hover:bg-transparent',
          )}
        >
          按钮4
        </EnhancedButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <EnhancedButton type="link">按钮5</EnhancedButton>

        <EnhancedButton
          className={cn(
            'border-0 shadow-none text-destructive bg-transparent',
            'hover:text-destructive/70 hover:bg-transparent',
          )}
        >
          按钮6
        </EnhancedButton>

        <EnhancedButton
          className={cn(
            'border-0 shadow-none text-green-500 bg-transparent',
            'hover:text-green-500/70 hover:bg-transparent',
          )}
        >
          按钮7
        </EnhancedButton>

        <EnhancedButton
          type="text"
          className={cn(
            'text-foreground bg-transparent',
            'hover:text-foreground/70 hover:bg-transparent',
          )}
        >
          按钮8
        </EnhancedButton>

        <EnhancedButton
          type="text"
          className={cn(
            'text-muted-foreground bg-transparent',
            'hover:text-muted-foreground/70 hover:bg-transparent',
          )}
        >
          按钮9
        </EnhancedButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <EnhancedButton type="primary" ghost>
          按钮10
        </EnhancedButton>

        <EnhancedButton
          className={cn(
            'border-0 shadow-none text-destructive bg-transparent',
            'hover:text-destructive hover:bg-destructive/10',
          )}
        >
          按钮11
        </EnhancedButton>

        <EnhancedButton
          className={cn(
            'border-0 shadow-none text-green-500 bg-transparent',
            'hover:text-green-500 hover:bg-green-500/10',
          )}
        >
          按钮12
        </EnhancedButton>

        <EnhancedButton
          className={cn(
            'border-0 shadow-none text-foreground bg-transparent',
            'hover:text-foreground hover:bg-foreground/10',
          )}
        >
          按钮13
        </EnhancedButton>

        <EnhancedButton
          className={cn(
            'border-0 shadow-none text-muted-foreground bg-transparent',
            'hover:text-muted-foreground hover:bg-muted-foreground/10',
          )}
        >
          按钮14
        </EnhancedButton>
      </div>
    </CardContent>
  </Card>
);

export default ButtonsDemo;
