import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@teamhelper/ui';

const TableDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>表格 (Table)</CardTitle>
      <CardDescription>用于展示结构化数据的表格组件</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableCaption>最近的发票列表</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">发票号</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>方法</TableHead>
            <TableHead className="text-right">金额</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">INV001</TableCell>
            <TableCell>已付款</TableCell>
            <TableCell>信用卡</TableCell>
            <TableCell className="text-right">¥250.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">INV002</TableCell>
            <TableCell>待付款</TableCell>
            <TableCell>PayPal</TableCell>
            <TableCell className="text-right">¥150.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">INV003</TableCell>
            <TableCell>未付款</TableCell>
            <TableCell>银行转账</TableCell>
            <TableCell className="text-right">¥350.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default TableDemo;
