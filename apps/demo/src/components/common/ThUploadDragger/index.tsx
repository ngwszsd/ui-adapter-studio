import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import {
  Upload,
  message,
  type UploadDraggerProps,
  type UploadDraggerRef,
} from '@teamhelper/ui';
import i18n from '@/i18n';
import {
  getRemotePreSignApi,
  commonUploadByPut,
  type RemoteFileInfoDto,
  type RemoteFileParams,
} from '@/common/server';
import FolderUpIcon from '@/assets/icon/upload.svg?react';
import { cn } from '@/lib/utils';
import type { AxiosProgressEvent } from 'axios';

export type IThUploadDraggerRef = {
  updateFileCountFn: (value: number) => void;
};

export interface ThUploadDraggerProps extends Omit<UploadDraggerProps, 'ref'> {
  type: RemoteFileParams['type'];
  fileName?: string;
  maxSizeMB?: number;
  onUploaded?: (fileKey: string, file: File) => void;
  title?: React.ReactNode;
  maxCount?: number;
  titleClassName?: string;
  descriptionClassName?: string;
  bodyClassName?: string;
  iconClassName?: string;
  contentClassName?: string;
  ref?: Ref<IThUploadDraggerRef>;
  onUploadProgress?: (
    progressEvent: AxiosProgressEvent,
    file: File,
    index?: number,
  ) => void;
}

const ThUploadDragger: React.FC<ThUploadDraggerProps> = ({
  type,
  fileName,
  accept,
  maxSizeMB = 100,
  multiple = true,
  disabled,
  showFileList = false,
  listType = 'list',
  fileList,
  onFileListChange,
  onUploaded,
  onError,
  onChange,
  children,
  className,
  title,
  description,
  maxCount = 15,
  titleClassName,
  descriptionClassName,
  bodyClassName,
  iconClassName,
  contentClassName,
  ref,
  onUploadProgress,
  isCustomClick = false,
}) => {
  const fileCount = useRef(0);
  const [uploading, setUploading] = useState(false);
  const uploadDraggerRef = useRef<UploadDraggerRef>(null);

  useEffect(() => {
    fileCount.current = 0;
  }, []);

  useImperativeHandle(ref, () => {
    return {
      updateFileCountFn(value) {
        fileCount.current = value || 0;
      },
    };
  }, [ref, fileCount]);

  const validateFile = (file: File) => {
    if (accept) {
      const list = accept
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const fileType = (file.type || '').toLowerCase();
      const fileNameLower = file.name.toLowerCase();
      const matched = list.some((item) => {
        const v = item.toLowerCase();
        if (v.startsWith('.')) return fileNameLower.endsWith(v);
        if (v.endsWith('/*')) {
          const cat = v.slice(0, v.indexOf('/'));
          const fileCat = fileType.split('/')[0];
          return fileCat === cat;
        }
        return fileType === v;
      });
      if (!matched) {
        message.error(i18n.t('components:upload.error.typeGeneric'));
        return false;
      }
    }
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      message.error(
        i18n.t('components:upload.error.sizeLimit', { maxSize: maxSizeMB }),
      );
      return false;
    }
    return true;
  };

  const getRemotePreSignFn = async (file_name: string) => {
    const result = {
      data: {} as RemoteFileInfoDto,
    };
    if (!file_name || !type) return result;

    try {
      const dtoResult = await getRemotePreSignApi({
        file_name,
        type,
      });

      result.data = dtoResult?.data || {};
    } catch (error) {
      console.log(error);
    }

    return result;
  };

  const commonUploadByPutFn = async (
    upload_url: string,
    f: File,
    index: number,
  ) => {
    let result = false;
    if (!upload_url || !f) return result;

    try {
      const dtoResult = await commonUploadByPut(
        upload_url,
        f,
        (progressEvent) => {
          onUploadProgress?.(progressEvent, f, index);
        },
      );
      result = Boolean(dtoResult?.status === 200);
    } catch (error) {
      console.log(error);
    }
    return result;
  };

  const handleFilesChange = async (files: File[]) => {
    try {
      if (maxCount > 0) {
        const n = maxCount - fileCount?.current;
        const len = files?.length || 0;
        if (n < 0 || len > n) {
          message.error(
            i18n.t('components:upload.error.maxCount', { maxCount }),
          );
          return;
        }

        fileCount.current += len;
      }

      onFileListChange?.(files);
      onChange?.(files);

      setUploading(true);
      await Promise.all(
        (files || []).map(async (f, index) => {
          if (!validateFile(f)) {
            onError?.(i18n.t('components:upload.error.typeOrSize'));
            return;
          }

          const preName = fileName || f.name;
          const preSignRes = await getRemotePreSignFn(preName);
          const { upload_url, file_key } = preSignRes?.data || {};
          const bool = await commonUploadByPutFn(upload_url, f, index);
          if (bool) {
            onUploaded?.(file_key, f);
            message.success(i18n.t('components:upload.success'));
          } else {
            onError?.(i18n.t('components:upload.fail'));
            message.error(i18n.t('components:upload.fail'));
          }
        }),
      );
    } catch (e: any) {
      onError?.(e?.message || i18n.t('components:upload.fail'));
      message.error(i18n.t('components:upload.fail'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Upload.Dragger
      accept={accept}
      multiple={multiple}
      showFileList={showFileList}
      listType={listType}
      className={className}
      fileList={fileList}
      disabled={disabled || uploading}
      maxSize={maxSizeMB ? maxSizeMB * 1024 * 1024 : undefined}
      onChange={handleFilesChange}
      onFileListChange={handleFilesChange}
      ref={uploadDraggerRef}
      isCustomClick={isCustomClick}
    >
      {children ?? (
        <div
          className={cn(
            'flex flex-col gap-4 items-center justify-center p-8 min-h-40',
            bodyClassName,
          )}
        >
          <FolderUpIcon className={cn('w-12 h-auto', iconClassName)} />

          <div
            className={cn('flex flex-col items-center gap-1', contentClassName)}
          >
            <div
              className={cn(
                'text-sm text-foreground font-medium flex items-center',
                titleClassName,
              )}
            >
              {title ?? (
                <>
                  <div>{i18n.t('components:upload.dragger.drag')}</div>
                  <div
                    className="text-primary cursor-pointer hover:text-primary/70 ml-1"
                    onClick={() => {
                      uploadDraggerRef?.current?.emitTriggerSelect?.();
                    }}
                  >
                    {i18n.t('components:upload.dragger.click')}
                  </div>
                </>
              )}
            </div>

            <div
              className={cn(
                'text-xs text-muted-foreground flex flex-col items-center',
                descriptionClassName,
              )}
            >
              {description ?? (
                <>
                  {accept ? (
                    <div>
                      {i18n.t('components:upload.dragger.supportTypes', {
                        accept,
                      })}
                    </div>
                  ) : null}

                  {maxCount || maxSizeMB ? (
                    <div className="flex items-center">
                      {maxCount ? (
                        <div className="flex items-center">
                          <div>
                            {i18n.t('components:upload.dragger.maxCountPrefix')}
                          </div>
                          <div className="mx-1">{maxCount}</div>
                          <div>
                            {i18n.t('components:upload.dragger.maxCountSuffix')}
                          </div>
                        </div>
                      ) : null}

                      {maxSizeMB ? (
                        <div className="flex items-center">
                          <div>
                            {i18n.t('components:upload.dragger.maxSizePrefix')}
                          </div>
                          <div className="mx-1">{maxSizeMB}</div>
                          <div>
                            {i18n.t('components:upload.dragger.maxSizeSuffix')}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Upload.Dragger>
  );
};

export default ThUploadDragger;
