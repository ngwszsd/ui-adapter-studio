import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';

const AlertDialogDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>警告对话框 (AlertDialog)</CardTitle>
      <CardDescription>用于确认危险操作的对话框</CardDescription>
    </CardHeader>
    <CardContent>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">删除账户</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除账户吗？</AlertDialogTitle>
            <AlertDialogDescription>此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction>继续</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>
  </Card>
);

export default AlertDialogDemo;
