import React, { useEffect, useRef, useState } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { X } from 'lucide-react';
import { Button } from '@teamhelper/ui';
import { cn } from '../../utils/cn';
import { useDesignerPortalRef } from '../../utils/portal';

export type TemplateEditorDialogProps = {
  open: boolean;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  widthClassName?: string;
  bodyClassName?: string;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  onOk?: () => void;
  onCancel?: () => void;
};

const TemplateEditorDialog = ({
  open,
  title,
  children,
  className,
  widthClassName = 'w-[620px]',
  bodyClassName,
  okText = '确定',
  cancelText = '取消',
  onOpenChange,
  onOk,
  onCancel,
}: TemplateEditorDialogProps) => {
  const portalRef = useDesignerPortalRef();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const animationMs = 180;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel?.();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, onOpenChange, open]);

  useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setMounted(true);
      setVisible(false);
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    setVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
    }, animationMs);
  }, [animationMs, open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (!mounted) return null;

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleOk = () => {
    onOk?.();
    onOpenChange(false);
  };

  return (
    <FloatingPortal root={portalRef?.current ?? undefined}>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center">
        <button
          type="button"
          aria-label="关闭弹窗遮罩"
          className={cn(
            'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200',
            visible ? 'opacity-100' : 'opacity-0'
          )}
          onClick={handleCancel}
        />

        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'relative flex max-h-[90vh] max-w-[96vw] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 ease-out',
            visible
              ? 'translate-y-0 scale-100 opacity-100'
              : 'translate-y-2 scale-[0.98] opacity-0',
            widthClassName,
            className
          )}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="truncate text-[14px] font-semibold text-slate-900">
              {title}
            </div>
            <button
              type="button"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={handleCancel}
            >
              <X size={14} />
            </button>
          </div>

          <div
            className={cn(
              'min-h-0 flex-1 overflow-auto px-5 py-4',
              bodyClassName
            )}
          >
            {children}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <Button onClick={handleCancel}>{cancelText}</Button>
            <Button variant="default" onClick={handleOk}>
              {okText}
            </Button>
          </div>
        </div>
      </div>
    </FloatingPortal>
  );
};

export default React.memo(TemplateEditorDialog);
