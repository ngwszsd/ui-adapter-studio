import React from 'react';
import { SegmentedControl } from './SegmentedControl';
import { LayoutRow, NumberRow } from './property-helpers';
import type {
  ArrangementMode,
  SpacingMode,
  GridPosition,
  ColumnPosition,
  LayoutConfig,
} from '../../types';

/* ---- 常量 ---- */

const ARRANGEMENT_OPTIONS: { label: string; value: ArrangementMode }[] = [
  { label: '纵向', value: 'vertical' },
  { label: '横向', value: 'horizontal' },
  { label: '换行', value: 'wrap' },
];

const SPACING_MODE_OPTIONS: { label: string; value: SpacingMode }[] = [
  { label: '固定', value: 'fixed' },
  { label: '自动', value: 'auto' },
];

const GRID_ROWS: {
  row: 'top' | 'center' | 'bottom';
  positions: GridPosition[];
}[] = [
  { row: 'top', positions: ['top-left', 'top-center', 'top-right'] },
  { row: 'center', positions: ['center-left', 'center', 'center-right'] },
  {
    row: 'bottom',
    positions: ['bottom-left', 'bottom-center', 'bottom-right'],
  },
];

const GRID_LINE_LENGTHS = [5, 8, 5];

const COLUMN_TITLE_MAP: Record<
  ArrangementMode,
  Record<ColumnPosition, string>
> = {
  vertical: { left: 'left', center: 'center', right: 'right' },
  horizontal: { left: 'top', center: 'center', right: 'bottom' },
  wrap: { left: 'top', center: 'center', right: 'bottom' },
};

/* ---- 内部组件 ---- */

/** 动态对齐线图标 — 根据方向和对齐方式显示不同长短的线条 */
const AlignIcon = ({
  direction,
  align,
}: {
  direction: 'horizontal' | 'vertical';
  align: 'start' | 'center' | 'end';
}) => {
  const lengths = [5, 8, 5];
  const t = 1.5;
  const gap = 1.25;

  if (direction === 'horizontal') {
    const totalH = lengths.length * t + (lengths.length - 1) * gap;
    const sy = (10 - totalH) / 2;
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        {lengths.map((w, i) => {
          const y = sy + i * (t + gap);
          const x =
            align === 'start' ? 1 : align === 'end' ? 9 - w : (10 - w) / 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={t}
              rx={0.5}
              fill="currentColor"
            />
          );
        })}
      </svg>
    );
  }

  const totalW = lengths.length * t + (lengths.length - 1) * gap;
  const sx = (10 - totalW) / 2;
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      {lengths.map((h, i) => {
        const x = sx + i * (t + gap);
        const y =
          align === 'start' ? 1 : align === 'end' ? 9 - h : (10 - h) / 2;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={t}
            height={h}
            rx={0.5}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
};

/** 单条对齐线图标 */
const SingleLine = ({
  direction,
  align,
  length,
}: {
  direction: 'horizontal' | 'vertical';
  align: 'start' | 'center' | 'end';
  length: number;
}) => {
  const t = 1.5;
  if (direction === 'horizontal') {
    const x =
      align === 'start' ? 1 : align === 'end' ? 9 - length : (10 - length) / 2;
    const y = (10 - t) / 2;
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <rect
          x={x}
          y={y}
          width={length}
          height={t}
          rx={0.5}
          fill="currentColor"
        />
      </svg>
    );
  }
  const x = (10 - t) / 2;
  const y =
    align === 'start' ? 1 : align === 'end' ? 9 - length : (10 - length) / 2;
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <rect
        x={x}
        y={y}
        width={t}
        height={length}
        rx={0.5}
        fill="currentColor"
      />
    </svg>
  );
};

const getAlignIconProps = (
  pos: GridPosition,
  arrangement: ArrangementMode
): {
  direction: 'horizontal' | 'vertical';
  align: 'start' | 'center' | 'end';
} => {
  const isVerticalArr = arrangement === 'vertical';
  const [v, h] = pos.split('-') as [
    'top' | 'center' | 'bottom',
    'left' | 'center' | 'right' | undefined,
  ];
  const hPos = h ?? 'center';
  if (isVerticalArr) {
    return {
      direction: 'horizontal',
      align: hPos === 'left' ? 'start' : hPos === 'right' ? 'end' : 'center',
    };
  }
  return {
    direction: 'vertical',
    align: v === 'top' ? 'start' : v === 'bottom' ? 'end' : 'center',
  };
};

/** 九宫格方位选择器 */
const GridPositionSelector = ({
  value,
  onChange,
  arrangement = 'vertical',
}: {
  value: GridPosition;
  onChange: (pos: GridPosition) => void;
  arrangement?: ArrangementMode;
}) => {
  return (
    <div className="inline-grid grid-cols-3 gap-x-14 gap-y-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      {GRID_ROWS.flatMap(({ positions }) =>
        positions.map((pos) => {
          const isSelected = pos === value;
          return (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(pos)}
              className={`flex h-3.5 w-3.5 items-center justify-center transition-colors ${
                isSelected
                  ? 'text-blue-600'
                  : 'text-slate-300 hover:text-slate-400'
              }`}
              title={pos}
            >
              {isSelected ? (
                <AlignIcon {...getAlignIconProps(pos, arrangement)} />
              ) : (
                <span className="block h-[5px] w-[5px] rounded-full bg-current" />
              )}
            </button>
          );
        })
      )}
    </div>
  );
};

/** 三列方位选择器（自动间距模式） */
const ColumnPositionSelector = ({
  value,
  onChange,
  arrangement = 'vertical',
}: {
  value: ColumnPosition;
  onChange: (pos: ColumnPosition) => void;
  arrangement?: ArrangementMode;
}) => {
  const isVerticalArr = arrangement === 'vertical';
  const selectedIndex = value === 'left' ? 0 : value === 'right' ? 2 : 1;

  const lineDir: 'horizontal' | 'vertical' = isVerticalArr
    ? 'horizontal'
    : 'vertical';
  const lineAlign: 'start' | 'center' | 'end' =
    value === 'left' ? 'start' : value === 'right' ? 'end' : 'center';

  const COL_POS_LIST: ColumnPosition[] = ['left', 'center', 'right'];

  return (
    <div className="inline-grid grid-cols-3 gap-x-14 gap-y-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      {GRID_ROWS.flatMap(({ positions }, rowIdx) =>
        positions.map((pos, colIdx) => {
          const colPos: ColumnPosition = isVerticalArr
            ? COL_POS_LIST[colIdx]
            : COL_POS_LIST[rowIdx];

          const highlighted = isVerticalArr
            ? colIdx === selectedIndex
            : rowIdx === selectedIndex;

          const lineLength = isVerticalArr
            ? GRID_LINE_LENGTHS[rowIdx]
            : GRID_LINE_LENGTHS[colIdx];

          return (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(colPos)}
              className={`flex h-3.5 w-3.5 items-center justify-center transition-colors ${
                highlighted
                  ? 'text-blue-600'
                  : 'text-slate-300 hover:text-slate-400'
              }`}
              title={COLUMN_TITLE_MAP[arrangement][colPos]}
            >
              {highlighted ? (
                <SingleLine
                  direction={lineDir}
                  align={lineAlign}
                  length={lineLength}
                />
              ) : (
                <span className="block h-[5px] w-[5px] rounded-full bg-current" />
              )}
            </button>
          );
        })
      )}
    </div>
  );
};

/* ---- 导出组件 ---- */

export interface LayoutEditorProps {
  layout: LayoutConfig;
  onChange: (updater: (l: LayoutConfig) => void) => void;
}

export const LayoutEditor = ({ layout, onChange }: LayoutEditorProps) => {
  return (
    <>
      <LayoutRow label="排列方式">
        <SegmentedControl
          options={ARRANGEMENT_OPTIONS}
          value={layout.arrangement}
          onValueChange={(v) =>
            onChange((l) => {
              l.arrangement = v;
            })
          }
          columns={3}
          className="w-40 shrink-0"
        />
      </LayoutRow>

      <LayoutRow label="元素间距">
        <SegmentedControl
          options={SPACING_MODE_OPTIONS}
          value={layout.spacingMode}
          onValueChange={(v) =>
            onChange((l) => {
              l.spacingMode = v;
            })
          }
          columns={2}
          className="w-28 shrink-0"
        />
      </LayoutRow>

      {layout.spacingMode === 'fixed' && (
        <NumberRow
          label="间距值"
          value={layout.spacing}
          onChange={(v) =>
            onChange((l) => {
              l.spacing = v;
            })
          }
        />
      )}

      <LayoutRow label="元素分布">
        {layout.spacingMode === 'fixed' ? (
          <GridPositionSelector
            value={layout.distribution}
            arrangement={layout.arrangement}
            onChange={(v) =>
              onChange((l) => {
                l.distribution = v;
              })
            }
          />
        ) : (
          <ColumnPositionSelector
            value={layout.columnDistribution}
            arrangement={layout.arrangement}
            onChange={(v) =>
              onChange((l) => {
                l.columnDistribution = v;
              })
            }
          />
        )}
      </LayoutRow>
    </>
  );
};
