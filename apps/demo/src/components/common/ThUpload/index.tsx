import React, { useState } from 'react';
import { Upload, message, type EnhancedUploadProps } from '@teamhelper/ui';
import i18n from '@/i18n';
import {
  getRemotePreSignApi,
  commonUploadByPut,
  type RemoteFileInfoDto,
  type RemoteFileParams,
} from '@/common/server';

import {
  openImageCropperModal,
  type ImageCropperModalProps,
} from '../ImageCropperModal';

export interface ThUploadProps extends EnhancedUploadProps {
  type: RemoteFileParams['type'];
  fileName?: string;
  maxSizeMB?: number;
  crop?: boolean | Omit<ImageCropperModalProps, 'imageSrc'>;
  onUploaded?: (fileKey: string, file: File) => void;
  onError?: (e: any) => void;
}

const ThUpload: React.FC<ThUploadProps> = ({
  type,
  fileName,
  accept,
  maxSizeMB = 5,
  showUploadList = false,
  multiple = false,
  crop,
  disabled,
  onUploaded,
  onError,
  onChange,
  children,
  className,
}) => {
  const [uploading, setUploading] = useState(false);

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

  const commonUploadByPutFn = async (upload_url: string, f: File) => {
    let result = false;
    if (!upload_url || !f) return result;

    try {
      const dtoResult = await commonUploadByPut(upload_url, f);
      result = Boolean(dtoResult?.status === 200);
    } catch (error) {
      console.log(error);
    }
    return result;
  };

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

  return (
    <Upload
      accept={accept}
      multiple={multiple}
      showUploadList={showUploadList}
      disabled={disabled || uploading}
      beforeUpload={async (file: any) => {
        const f: File = (file?.originFileObj as File) || file;
        if (!validateFile(f)) return false;

        if (crop) {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          const imageSrc = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
          });

          const cropProps = typeof crop === 'boolean' ? {} : crop;
          const croppedBlob = await openImageCropperModal({
            imageSrc,
            outputType: f.type || 'image/jpeg',
            ...cropProps,
          });

          if (!croppedBlob) {
            return false;
          }

          const croppedFile = new File([croppedBlob], f.name, {
            type: croppedBlob.type,
            lastModified: Date.now(),
          });
          (croppedFile as any).uid = (f as any).uid;

          return croppedFile;
        }

        return true;
      }}
      customRequest={async (options: any) => {
        const f: File = (options.file?.originFileObj as File) || options.file;
        try {
          setUploading(true);

          const preSignRes = await getRemotePreSignFn(fileName || f?.name);
          const upload_url = preSignRes?.data?.upload_url;
          const file_key = preSignRes?.data?.file_key;

          const bool = await commonUploadByPutFn(upload_url, f);
          if (bool) {
            options.onSuccess?.({ file_key }, f);
            onUploaded?.(file_key, f);
            message.success(i18n.t('components:upload.success'));
          } else {
            options.onError?.(false);
            onError?.(false);
            message.error(i18n.t('components:upload.fail'));
          }
        } catch (e) {
          options.onError?.(e);
          onError?.(e);
          message.error(i18n.t('components:upload.fail'));
        } finally {
          setUploading(false);
        }
      }}
      onChange={onChange}
      className={className}
    >
      {children}
    </Upload>
  );
};

export default ThUpload;
