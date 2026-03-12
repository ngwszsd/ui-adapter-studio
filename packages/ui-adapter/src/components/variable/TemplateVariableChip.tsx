import React from 'react';
import { FaChevronRight, FaCube, FaTimes } from 'react-icons/fa';
import { cn } from '../../utils/cn';

export type TemplateVariableChipVariant = 'input' | 'inline';
export type TemplateVariableChipAppearance = 'default' | 'compact' | 'pill';

export type TemplateVariableChipProps = {
  label: React.ReactNode;
  icon?: React.ReactNode;
  template?: string;
  variant?: TemplateVariableChipVariant;
  selected?: boolean;
  className?: string;
  contentEditable?: boolean;
  appearance?: TemplateVariableChipAppearance;
  onMouseDown?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  onRemove?: () => void;
};

const renderChipLabel = (label: React.ReactNode) => {
  if (typeof label !== 'string') return label;
  if (!label.includes('>')) return label;

  const parts = label.split(/\s*>\s*/g).filter(Boolean);
  if (parts.length <= 1) return label;

  return parts.map((p, idx) => (
    <React.Fragment key={`${idx}-${p}`}>
      <span>{p}</span>
      {idx < parts.length - 1 ? (
        <FaChevronRight
          size={10}
          className="mx-0.5 inline-block text-gray-400"
        />
      ) : null}
    </React.Fragment>
  ));
};

const TemplateVariableChip = ({
  label,
  icon,
  template,
  variant = 'input',
  selected,
  className,
  contentEditable,
  appearance = 'default',
  onMouseDown,
  onClick,
  onRemove,
}: TemplateVariableChipProps) => {
  return (
    <span
      data-template={template}
      contentEditable={contentEditable}
      className={cn(
        'shrink-0 inline-flex items-center gap-1 max-w-full rounded-md border border-gray-200 text-gray-700 box-border',
        appearance === 'compact' ? 'px-1 text-[10px]' : 'px-1.5 text-xs',
        appearance === 'pill' ? 'rounded-full' : '',
        selected
          ? 'bg-blue-100 border-blue-300'
          : 'bg-gray-50',
        variant === 'inline'
          ? 'mx-1 h-[22px] py-0 align-middle'
          : appearance === 'compact'
            ? 'h-[20px] py-0 align-middle'
            : 'py-1',
        className
      )}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement | null)?.closest('button')) return;
        onMouseDown?.(e);
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement | null)?.closest('button')) return;
        onClick?.(e);
      }}
    >
      <span className="shrink-0 flex items-center">
        {icon ?? (
          <FaCube
            className={cn(
              'text-blue-500',
              appearance === 'compact' ? 'text-[11px]' : ''
            )}
          />
        )}
      </span>
      <span className="truncate">{renderChipLabel(label)}</span>
      {onRemove != null && (
        <button
          type="button"
          className="shrink-0 p-0.5 rounded hover:bg-gray-200/70"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <FaTimes size={10} className="text-gray-400" />
        </button>
      )}
    </span>
  );
};

export default React.memo(TemplateVariableChip);
