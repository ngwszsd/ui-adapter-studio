import NiceModal, { useModal } from '@ebay/nice-modal-react';
import React, { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Modal, EnhancedSlider } from '@teamhelper/ui';
import { Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';
import getCroppedImg from '@/lib/canvasUtils';
import { useTranslation } from 'react-i18next';

export interface ImageCropperModalProps {
  imageSrc: string;
  aspect?: number;
  cropShape?: 'rect' | 'round';
  title?: string;
  outputType?: string;
}

const ImageCropperDialog = NiceModal.create(
  ({
    imageSrc,
    aspect = 1,
    cropShape = 'rect',
    title,
    outputType = 'image/jpeg',
  }: ImageCropperModalProps) => {
    const { t } = useTranslation('userInfo');
    const modal = useModal();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
      null,
    );

    const onCropComplete = useCallback(
      (croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
      },
      [],
    );

    const onCancel = () => {
      modal.resolve();
      modal.hide();
    };

    const handleConfirm = async () => {
      try {
        if (imageSrc && croppedAreaPixels) {
          const croppedImage = await getCroppedImg(
            imageSrc,
            croppedAreaPixels,
            rotation,
            undefined,
            outputType,
          );
          if (croppedImage) {
            modal.resolve(croppedImage);
            modal.hide();
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <Modal
        open={Boolean(modal?.visible)}
        title={title || t('ImageCropper.title')}
        onCancel={onCancel}
        onOk={handleConfirm}
        classNames={{
          content: 'w-[520px] h-[80vh]',
          body: 'flex flex-col min-h-0 flex-1',
        }}
        onOpenChange={(open) => {
          if (!open) {
            setTimeout(() => {
              modal.remove();
            }, 360);
          }
        }}
      >
        <div className="relative bg-black/5 flex-1 min-h-50">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            showGrid={false}
            cropShape={cropShape}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Zoom Control */}
          <div className="flex items-center gap-4">
            <Minus
              className="w-4 h-4 text-foreground cursor-pointer"
              onClick={() => setZoom(Math.max(1, zoom - 0.1))}
            />
            <EnhancedSlider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
              trackClassName="h-1 bg-[#F7F8FA]"
              thumbClassName="bg-primary w-[14px] h-[14px] border-0 ring-6 ring-primary/10"
              tooltip={{
                formatter: (val) => `${Number(val).toFixed(1)}x`,
              }}
              onChange={(value) => {
                setZoom(value?.[0]);
              }}
            />
            <Plus
              className="w-4 h-4 text-foreground cursor-pointer"
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            />
          </div>

          {/* Rotation Control */}
          <div className="flex items-center gap-4">
            <RotateCcw
              className="w-4 h-4 text-foreground cursor-pointer"
              onClick={() => setRotation(rotation - 90)}
            />
            <EnhancedSlider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              className="flex-1"
              trackClassName="h-1 bg-[#F7F8FA]"
              thumbClassName="bg-primary w-[14px] h-[14px] border-0 ring-6 ring-primary/10"
              tooltip={{
                formatter: (val) => `${val}°`,
              }}
              onChange={(value) => {
                setRotation(value?.[0]);
              }}
            />
            <RotateCw
              className="w-4 h-4 text-foreground cursor-pointer"
              onClick={() => setRotation(rotation + 90)}
            />
          </div>
        </div>
      </Modal>
    );
  },
);

export const openImageCropperModal = (
  props: ImageCropperModalProps,
): Promise<Blob | undefined> => {
  return NiceModal.show(ImageCropperDialog, props) as Promise<Blob | undefined>;
};

export default ImageCropperDialog;
