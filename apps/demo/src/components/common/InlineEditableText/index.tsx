import React, { useEffect, useRef, useState } from 'react';
import { SquarePen } from 'lucide-react';
import { cn, type ClassValue } from '@/lib/utils';
import i18n from '@/i18n';
import {
  EnhancedInput,
  message,
  type InternalInputProps,
} from '@teamhelper/ui';

interface InlineEditableTextProps {
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  onChange?: (val: string) => void;
  className?: string;
  textClassName?: ClassValue;
  inputClassName?: string;
  iconClassName?: string;
  autoFocus?: boolean;
  inputProps?: InternalInputProps;
  editEmit?: () => boolean | void;
}

export const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  defaultValue = '',
  value,
  placeholder,
  onChange,
  className,
  textClassName,
  inputClassName,
  iconClassName,
  autoFocus = true,
  inputProps,
  editEmit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [innerValue, setInnerValue] = useState<string>(value ?? defaultValue);
  const prevValueRef = useRef(innerValue);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (value !== undefined) setInnerValue(value);
  }, [value]);

  const commit = () => {
    const next = innerValue?.trim?.() || '';
    setIsEmpty(!next);
    onChange?.(next);
    if (!next) {
      return;
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setIsEditing(false);
    if (value !== undefined) setInnerValue(value);
    else setInnerValue(prevValueRef.current);
  };

  return (
    <div className={cn('flex items-center w-fit', className)}>
      {!isEditing ? (
        <div
          className={cn(
            'text-base font-medium text-foreground px-1.5 py-1.5 truncate',
            textClassName,
          )}
        >
          {innerValue}
        </div>
      ) : (
        <EnhancedInput
          placeholder={
            placeholder || i18n.t('components:inlineEditableText.placeholder')
          }
          value={innerValue}
          onChange={(e) => setInnerValue(e.target.value)}
          className={cn(
            'text-base md:text-base font-medium text-foreground text-center',
            'placeholder:text-base placeholder:font-medium placeholder:text-muted-foreground',
            isEmpty && 'border-destructive',
            inputClassName,
          )}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          autoFocus={autoFocus}
          size="middle"
          onClick={(e) => {
            e.stopPropagation();
          }}
          {...inputProps}
        />
      )}

      <SquarePen
        className={cn(
          'h-4 w-4 text-primary cursor-pointer hover:text-primary/80 shrink-0',
          {
            hidden: isEditing,
          },
          iconClassName,
        )}
        onClick={(e) => {
          e.stopPropagation();

          const bol = editEmit?.();
          if (typeof bol === 'boolean' && !bol) return;

          prevValueRef.current = innerValue;
          setIsEditing(true);
        }}
      />
    </div>
  );
};
