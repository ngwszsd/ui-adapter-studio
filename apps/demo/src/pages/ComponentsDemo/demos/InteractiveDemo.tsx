import React from 'react';
import {
  RadioGroup,
  RadioGroupItem,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Progress,
  Slider,
  Switch,
} from '@teamhelper/ui';

const InteractiveDemo = () => {
  const [progress, setProgress] = React.useState(33);
  const [switchChecked, setSwitchChecked] = React.useState(false);
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);
  const [radioValue, setRadioValue] = React.useState('option1');
  const [sliderValue, setSliderValue] = React.useState([50]);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>交互组件</CardTitle>
        <CardDescription>复选框、开关、进度条等交互元素</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={checkboxChecked}
            onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
          />
          <Label htmlFor="terms">同意条款和条件</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="airplane-mode"
            checked={switchChecked}
            onCheckedChange={setSwitchChecked}
          />
          <Label htmlFor="airplane-mode">飞行模式</Label>
        </div>

        <div className="space-y-2">
          <Label>单选按钮组</Label>
          <RadioGroup value={radioValue} onValueChange={setRadioValue}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option1" id="option1" />
              <Label htmlFor="option1">选项 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option2" id="option2" />
              <Label htmlFor="option2">选项 2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option3" id="option3" />
              <Label htmlFor="option3">选项 3</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>滑块 ({sliderValue[0]})</Label>
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>进度条 ({progress}%)</Label>
          <Progress value={progress} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveDemo;
