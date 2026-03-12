import React from 'react';
import {
  Modal,
  Button,
  EnhancedInput as Input,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
} from '@teamhelper/ui';
import { toast } from '@teamhelper/ui';

const EnhanceModalDemo = () => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>增强 Modal（统一头部/底部）</CardTitle>
          <CardDescription>演示通用 Modal 的基本用法与 API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setOpen(true)} variant="default">
              打开增强 Modal
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="邀请设计师 Demo"
        okText="确认"
        cancelText="取消"
        onOkBeforeFunction={() => {
          if (!value.trim()) {
            toast.warning('请输入公司名称');
            return false;
          }
          return true;
        }}
        onOk={async () => {
          await new Promise((r) => setTimeout(r, 800));
          toast.success(`已邀请：${value}`);
        }}
        onCancelBeforeFunction={() => true}
        onCancel={() => {
          toast.info('已取消');
        }}
      >
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            这是内容区，支持自定义节点。
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="companyNameDemo">公司名称</Label>
            <Input
              id="companyNameDemo"
              placeholder="请输入公司名称"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EnhanceModalDemo;
