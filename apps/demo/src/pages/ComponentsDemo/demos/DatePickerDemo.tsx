import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DatePicker,
} from '@teamhelper/ui';

const DatePickerDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>日期选择框 (DatePicker)</CardTitle>
      <CardDescription>选择日期的控件。</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 flex flex-col">
      <DatePicker />
      <DatePicker.RangePicker />
    </CardContent>
  </Card>
);

export default DatePickerDemo;
