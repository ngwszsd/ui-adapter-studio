import React from 'react';
import {
  FaCode,
  FaFile,
  FaFont,
  FaHashtag,
  FaList,
  FaQuestionCircle,
  FaRegClock,
  FaToggleOn,
} from 'react-icons/fa';
import { cn } from '../../utils/cn';
import type { VariableTypeSpecLike } from './VariableTypeChip';

export type VariableTypeIconProps = {
  typeSpec?: VariableTypeSpecLike | string | null;
  className?: string;
};

const VariableTypeIcon = ({ typeSpec, className }: VariableTypeIconProps) => {
  const baseType =
    typeof typeSpec === 'string' ? typeSpec : (typeSpec?.type ?? 'string');

  const normalized = baseType.trim().toLowerCase();

  let Icon = FaFont;
  let colorClass = 'text-blue-500';

  switch (normalized) {
    case 'string':
      Icon = FaFont;
      colorClass = 'text-orange-500';
      break;
    case 'integer':
    case 'number':
      Icon = FaHashtag;
      colorClass = 'text-blue-500';
      break;
    case 'boolean':
      Icon = FaToggleOn;
      colorClass = 'text-green-500';
      break;
    case 'array':
      Icon = FaList;
      colorClass = 'text-purple-500';
      break;
    case 'object':
      Icon = FaCode;
      colorClass = 'text-gray-500';
      break;
    case 'file':
      Icon = FaFile;
      colorClass = 'text-red-500';
      break;
    case 'time':
      Icon = FaRegClock;
      colorClass = 'text-teal-500';
      break;
    case 'any':
      Icon = FaQuestionCircle;
      colorClass = 'text-yellow-500';
      break;
    default:
      Icon = FaFont;
      colorClass = 'text-gray-400';
      break;
  }

  return <Icon className={cn(colorClass, className)} />;
};

export default React.memo(VariableTypeIcon);
