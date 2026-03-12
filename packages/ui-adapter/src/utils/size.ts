import type { SizeMode } from '../types';

export const resolveSize = (
  mode: SizeMode | undefined,
  value: number | undefined,
  fallback: number,
): number | string => {
  const resolvedMode = mode ?? 'fixed';
  const resolvedValue = value ?? fallback;

  if (resolvedMode === 'fit-content') return 'auto';
  if (resolvedMode === 'fill') return '100%';
  if (resolvedMode === 'percent') return `${resolvedValue}%`;

  return resolvedValue;
};

export const normalizeResizableSize = (
  value: number | string,
  fallback: number,
): number | string => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) return fallback;
    if (trimmedValue === 'auto') return trimmedValue;
    if (trimmedValue.endsWith('%')) return trimmedValue;
    if (trimmedValue.endsWith('px')) return trimmedValue;

    const parsedValue = Number.parseFloat(trimmedValue);
    if (Number.isFinite(parsedValue)) return parsedValue;
  }

  return fallback;
};
