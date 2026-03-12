import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@teamhelper/ui';

const SeparatorDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>分隔符 (Separator)</CardTitle>
      <CardDescription>用于分隔内容的线条组件</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
          <p className="text-sm text-muted-foreground">
            An open-source UI component library.
          </p>
        </div>
        <Separator className="my-4" />
        <div className="flex h-5 items-center space-x-4 text-sm">
          <div>Blog</div>
          <Separator orientation="vertical" />
          <div>Docs</div>
          <Separator orientation="vertical" />
          <div>Source</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default SeparatorDemo;
