import React from 'react';
import clsx from 'clsx';

type SegmentedControlColumns = 2 | 3 | 4;

const GRID_COL_CLASS_MAP: Record<SegmentedControlColumns, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export type SegmentedControlOption<T extends string> = {
  label: React.ReactNode;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<SegmentedControlOption<T>>;
  value: T;
  onValueChange: (value: T) => void;
  columns?: SegmentedControlColumns;
  className?: string;
  disabledValues?: T[];
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  columns = 4,
  className,
  disabledValues,
}: SegmentedControlProps<T>) {
  const disabledSet = disabledValues ? new Set(disabledValues) : null;

  return (
    <div
      role="tablist"
      className={clsx(
        'grid gap-1 rounded-lg bg-slate-100 p-1',
        GRID_COL_CLASS_MAP[columns],
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const isDisabled = disabledSet?.has(option.value) ?? false;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={isDisabled}
            onClick={() => onValueChange(option.value)}
            className={clsx(
              'flex items-center justify-center rounded-md py-1 text-xs transition-colors',
              isDisabled
                ? 'cursor-not-allowed text-slate-300'
                : isActive
                  ? 'bg-white font-semibold text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
