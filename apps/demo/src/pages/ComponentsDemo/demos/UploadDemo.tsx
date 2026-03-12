import {
  EnhancedButton as Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Upload,
} from '@teamhelper/ui';
import { useState } from 'react';
import { Package, Plus, Upload as UploadIcon } from 'lucide-react';

const UploadDemo = () => {
  const [iconUrls, setIconUrls] = useState<Record<string, string>>({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>上传 (Upload)</CardTitle>
        <CardDescription>文件选择上传控件。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-transparent flex items-center justify-center overflow-hidden border border-border">
            {iconUrls['a'] ? (
              <img
                src={iconUrls['a']}
                alt="app icon"
                className="w-[42px] h-[42px] rounded-lg object-cover"
              />
            ) : (
              <div className="w-[42px] h-[42px] rounded-lg bg-[#EBF4FF] flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            )}
          </div>

          <Upload
            accept=".jpg,.jpeg,.png"
            multiple={false}
            showUploadList={false}
            onChange={({ file }) => {
              const f = file?.originFileObj;
              if (f) {
                const url = URL.createObjectURL(f);
                setIconUrls((prev) => ({ ...prev, a: url }));
              }
            }}
          >
            <Button shape="round">
              <Plus className="h-4 w-4" />
              <span className="text-xs font-medium">自定义上传</span>
            </Button>
          </Upload>
        </div>

        <Upload
          accept=".jpg,.jpeg,.png"
          multiple={false}
          showUploadList={false}
          onChange={({ file }) => {
            const f = file?.originFileObj;
            if (f) {
              const url = URL.createObjectURL(f);
              setIconUrls((prev) => ({ ...prev, b: url }));
            }
          }}
        >
          <div className="h-15 w-15 bg-background rounded-[12px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group">
            {iconUrls['b'] ? (
              <img
                src={iconUrls['b']}
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
        </Upload>
      </CardContent>
    </Card>
  );
};

export default UploadDemo;
