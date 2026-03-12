import React from 'react';
import { cn } from '../../utils/cn';

export type VariableTypeSpecLike = {
  type?: string;
  subtype?: string;
  elementType?: VariableTypeSpecLike | null;
};

export type VariableTypeChipProps = {
  typeSpec?: VariableTypeSpecLike | string | null;
  label?: string;
  className?: string;
};

const BASE_TYPE_LABELS: Record<string, string> = {
  string: 'String',
  integer: 'Integer',
  number: 'Number',
  boolean: 'Boolean',
  time: 'Time',
  object: 'Object',
  array: 'Array',
  file: 'File',
  any: 'Any',
};

const FILE_SUBTYPE_LABELS: Record<string, string> = {
  default: 'Default',
  image: 'Image',
  svg: 'SVG',
  audio: 'Audio',
  video: 'Video',
  voice: 'Voice',
  doc: 'Doc',
  ppt: 'PPT',
  excel: 'Excel',
  txt: 'TXT',
  code: 'Code',
  pdf: 'PDF',
  zip: 'ZIP',
};

const formatTypeLabel = (
  typeSpec?: VariableTypeSpecLike | string | null
): string => {
  if (!typeSpec) return BASE_TYPE_LABELS.string;
  if (typeof typeSpec === 'string')
    return BASE_TYPE_LABELS[typeSpec] ?? typeSpec;

  const base = (typeSpec.type ?? 'string').trim() || 'string';
  if (base === 'array') {
    const elemBase =
      (typeSpec.elementType?.type ?? 'string').trim() || 'string';
    const elemLabel = BASE_TYPE_LABELS[elemBase] ?? elemBase;
    return `Array<${elemLabel}>`;
  }
  if (base === 'file') {
    const subtype = (typeSpec.subtype ?? 'default').trim() || 'default';
    const subtypeLabel = FILE_SUBTYPE_LABELS[subtype] ?? subtype;
    return `File:${subtypeLabel}`;
  }
  return BASE_TYPE_LABELS[base] ?? base;
};

const VariableTypeChip = ({
  typeSpec,
  label,
  className,
}: VariableTypeChipProps) => {
  return (
    <span
      className={cn(
        'shrink-0 text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 rounded px-1.5 py-0.5',
        className
      )}
    >
      {label ?? formatTypeLabel(typeSpec)}
    </span>
  );
};

export default React.memo(VariableTypeChip);
