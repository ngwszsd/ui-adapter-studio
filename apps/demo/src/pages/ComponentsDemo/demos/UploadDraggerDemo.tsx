import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Upload,
} from '@teamhelper/ui';

const UploadDraggerDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>拖拽上传 (Upload.Dragger)</CardTitle>
      <CardDescription>
        把文件拖入指定区域，完成上传，同样支持点击上传。
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Upload.Dragger
        accept=".png, .jpg, .jpeg"
        listType="list"
        description="把文件拖到此处，或点击上传 (listType='list')"
      />
      <Upload.Dragger
        accept=".png, .jpg, .jpeg"
        listType="card"
        className="h-[164px]"
        description="把文件拖到此处，或点击上传 (listType='card')"
      />
    </CardContent>
  </Card>
);

export default UploadDraggerDemo;
