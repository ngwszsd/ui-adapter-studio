import ThUploadDragger, {
  type IThUploadDraggerRef,
  type ThUploadDraggerProps,
} from '@/components/common/ThUploadDragger';
import { cn } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface IFileObjectKeys {
  fileKey: string;
  fileSize: number;
}

interface IFileRows {
  id: string;
  file: File;
  fileKey?: string;
  fileSize?: number;
}

export interface IKnowledgeBaseUploadDraggerProps extends Omit<
  ThUploadDraggerProps,
  'onChange' | 'ref'
> {
  onChange?: (files: File[]) => void;
  onDeleteFileClick?: (files: File[]) => void;
  onUploadChange?: (fileObjectKeys: Array<Partial<IFileObjectKeys>>) => void;
}

export const KnowledgeBaseUploadDragger: React.FC<
  IKnowledgeBaseUploadDraggerProps
> = ({ onChange, onDeleteFileClick, onUploadChange }) => {
  const thUploadDraggerRef = useRef<IThUploadDraggerRef>(null);
  const [fileRows, setFileRows] = useState<Array<IFileRows>>([]);

  const previewUrlObj = useMemo(() => {
    const result = fileRows?.reduce?.<Record<string, string>>((res, item) => {
      if (item?.id) {
        res[item?.id] = URL.createObjectURL(item?.file);
      }
      return res;
    }, {});

    return result;
  }, [fileRows]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlObj).forEach((item) => {
        URL.revokeObjectURL(item);
      });
    };
  }, [previewUrlObj]);

  useEffect(() => {
    const keys = fileRows
      .filter((item) => item.fileKey)
      .map((item) => ({
        fileKey: item.fileKey,
        fileSize: item.fileSize,
      }));
    onUploadChange?.(keys);
  }, [fileRows, onUploadChange]);

  return (
    <div>
      <ThUploadDragger
        type="knowledge"
        ref={thUploadDraggerRef}
        accept=".jpg,.jpeg,.png"
        maxSizeMB={100}
        maxCount={15}
        isCustomClick
        onChange={(files) => {
          const nextRows =
            files?.map?.((f, i) => {
              return {
                id: `${Date.now() + i}`,
                file: f,
              };
            }) || [];

          const file_rows = [...fileRows, ...nextRows];
          setFileRows(file_rows);
          onChange?.(file_rows.map((item) => item.file));
        }}
        onUploaded={(fileKey, file) => {
          setFileRows((prev) =>
            prev.map((item) => {
              if (item.file === file) {
                return {
                  ...item,
                  fileKey,
                  fileSize: file?.size / 1024 || 0,
                };
              }
              return item;
            }),
          );
        }}
      />

      {Array.isArray(fileRows) && fileRows.length ? (
        <div className="mt-5 flex flex-wrap items-center gap-5">
          {fileRows.map((item) => {
            const src = previewUrlObj?.[item?.id];
            if (!src) return null;

            return (
              <div
                key={item?.id}
                className="relative w-[100px] h-[100px] rounded-[8px] border-2 border-muted border-dashed overflow-hidden flex items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-[8px] overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    src={src}
                    draggable={false}
                  />
                </div>

                {!item.fileKey ? (
                  <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                ) : null}

                <div
                  className={cn(
                    'absolute top-1.5 right-1.5 bg-destructive text-white w-3.5 h-3.5 rounded-full items-center justify-center cursor-pointer hover:bg-destructive/80 hidden z-20',
                    item?.fileKey && 'group-hover:flex',
                  )}
                  onClick={() => {
                    const newFileRows = fileRows.filter(
                      (item02) => item02?.id !== item?.id,
                    );
                    setFileRows(newFileRows);
                    onDeleteFileClick?.(newFileRows.map((item) => item.file));

                    thUploadDraggerRef.current?.updateFileCountFn?.(
                      newFileRows?.length,
                    );
                  }}
                >
                  <X className="w-3! h-3!" />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
