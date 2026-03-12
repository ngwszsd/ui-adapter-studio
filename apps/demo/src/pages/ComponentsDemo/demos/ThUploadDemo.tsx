import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@teamhelper/ui';
import { useState } from 'react';
import { Plus, Upload as UploadIcon } from 'lucide-react';
import ThUpload from '@/components/common/ThUpload';

const ThUploadDemo = () => {
  const [iconUrl, setIconUrl] = useState<string>('');

  return (
    <Card>
      <CardHeader>
        <CardTitle>上传 (ThUpload)</CardTitle>
        <CardDescription>
          为业务场景深度定制的文件上传组件，封装「获取云端地址 →
          直传文件」的全流程，让上传更简单、更可靠。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ThUpload
          type="avatar"
          fileName="ThUploadDemo"
          accept=".jpg,.png,.jpeg"
          showUploadList={false}
          maxSizeMB={5}
          crop
          onChange={({ file }) => {
            const f = file?.originFileObj;
            if (f) {
              const url = URL.createObjectURL(f);
              setIconUrl(url);
            }
          }}
          onUploaded={async (fileKey) => {
            console.log('fileKey', fileKey);
          }}
        >
          <div className="h-15 w-15 bg-background rounded-[12px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt="app icon"
                className="w-full h-full object-cover"
              />
            ) : (
              <Plus className="h-6 w-6 text-primary" />
            )}

            <div className="text-muted flex flex-col items-center justify-center gap-1 bg-foreground/30 absolute w-full h-full opacity-0 group-hover:opacity-100 transition-opacity">
              <UploadIcon className="w-4 h-4" />
              <div className="text-xs scale-[0.83] font-medium">点击上传</div>
            </div>
          </div>
        </ThUpload>
      </CardContent>
    </Card>
  );
};

export default ThUploadDemo;
