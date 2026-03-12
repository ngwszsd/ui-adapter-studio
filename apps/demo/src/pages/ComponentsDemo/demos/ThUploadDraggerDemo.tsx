import ThUploadDragger from '@/components/common/ThUploadDragger';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Upload,
} from '@teamhelper/ui';

const ThUploadDraggerDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>拖拽上传 (ThUploadDragger)</CardTitle>
      <CardDescription>
        <div>把文件拖入指定区域，完成上传，同样支持点击上传；</div>
        <div>
          为业务场景深度定制的拖拽上传组件，封装「获取云端地址 →
          直传文件」的全流程，让上传更简单、更可靠。
        </div>
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <ThUploadDragger
        type="knowledge"
        fileName="ThUploadDraggerDemo"
        accept=".json"
        maxSizeMB={1}
        maxCount={5}
        listType="list"
        onUploaded={async (fileKey) => {
          console.log('fileKey', fileKey);
        }}
        isCustomClick
      />
    </CardContent>
  </Card>
);

export default ThUploadDraggerDemo;
