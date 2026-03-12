import { AlertCircle, Info, Terminal } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';

const AlertDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>警告组件 (Alert)</CardTitle>
      <CardDescription>用于显示重要信息的提示框</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>提示!</AlertTitle>
        <AlertDescription>这是一个默认的提示信息。</AlertDescription>
      </Alert>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>信息</AlertTitle>
        <AlertDescription>这是一个信息提示。</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>错误</AlertTitle>
        <AlertDescription>发生了一个错误，请检查您的输入。</AlertDescription>
      </Alert>
    </CardContent>
  </Card>
);

export default AlertDemo;
