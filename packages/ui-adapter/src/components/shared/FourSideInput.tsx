import React from 'react';
import { Link2, Link2Off } from 'lucide-react';
import {
  InputNumber,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@teamhelper/ui';

interface SideKeys {
  a: string;
  b: string;
  c: string;
  d: string;
}

interface FourSideInputProps {
  label: string;
  value: number | Record<string, number>;
  sideKeys: SideKeys;
  sideLabels: SideKeys;
  onChange: (value: number | Record<string, number>) => void;
}

const SmallInput = ({
  value,
  onChange,
  tooltip,
}: {
  value: number;
  onChange: (v: number) => void;
  tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div>
        <InputNumber
          value={value}
          onChange={(v) => onChange(v ?? value)}
          size="small"
        />
      </div>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs">
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

export const FourSideInput = ({
  label,
  value,
  sideKeys,
  sideLabels,
  onChange,
}: FourSideInputProps) => {
  const [split, setSplit] = React.useState(typeof value !== 'number');

  // 外部值类型变化时同步 split 状态
  React.useEffect(() => {
    setSplit(typeof value !== 'number');
  }, [typeof value === 'number']);

  const sideValues = React.useMemo(() => {
    if (typeof value === 'number') {
      return {
        [sideKeys.a]: value,
        [sideKeys.b]: value,
        [sideKeys.c]: value,
        [sideKeys.d]: value,
      };
    }
    return value;
  }, [value, sideKeys]);

  const unifiedValue = typeof value === 'number' ? value : null;

  const allSame =
    typeof value !== 'number' &&
    sideValues[sideKeys.a] === sideValues[sideKeys.b] &&
    sideValues[sideKeys.b] === sideValues[sideKeys.c] &&
    sideValues[sideKeys.c] === sideValues[sideKeys.d];

  const toggleSplit = () => {
    if (split) {
      const unified = sideValues[sideKeys.a] ?? 0;
      setSplit(false);
      onChange(unified);
    } else {
      const v = typeof value === 'number' ? value : 0;
      setSplit(true);
      onChange({
        [sideKeys.a]: v,
        [sideKeys.b]: v,
        [sideKeys.c]: v,
        [sideKeys.d]: v,
      });
    }
  };

  const handleUnifiedChange = (n: number) => onChange(n);

  const handleSideChange = (key: string, n: number) => {
    onChange({ ...sideValues, [key]: n });
  };

  return (
    <div className="py-1.5">
      {/* 主行: label + 统一输入 + 切换按钮 */}
      <div className="flex items-center gap-2">
        <span className="w-10 shrink-0 text-xs text-slate-600">{label}</span>
        <div className="flex-1">
          {split ? (
            <input
              readOnly
              value={allSame ? String(sideValues[sideKeys.a]) : 'Mixed'}
              className="w-full cursor-default rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-400 outline-none"
            />
          ) : (
            <SmallInput
              value={unifiedValue ?? 0}
              onChange={handleUnifiedChange}
              tooltip={label}
            />
          )}
        </div>
        <button
          type="button"
          onClick={toggleSplit}
          className={`shrink-0 rounded p-1 transition-colors ${
            split
              ? 'text-blue-500 hover:bg-blue-50'
              : 'text-slate-400 hover:bg-slate-100'
          }`}
          title={split ? '合并为统一值' : '分别设置'}
        >
          {split ? <Link2Off size={14} /> : <Link2 size={14} />}
        </button>
      </div>

      {/* 四边子输入 */}
      {split && (
        <div className="mt-1.5 grid grid-cols-2 gap-1.5 pl-12">
          <SmallInput
            value={sideValues[sideKeys.a] ?? 0}
            onChange={(v) => handleSideChange(sideKeys.a, v)}
            tooltip={sideLabels.a}
          />
          <SmallInput
            value={sideValues[sideKeys.b] ?? 0}
            onChange={(v) => handleSideChange(sideKeys.b, v)}
            tooltip={sideLabels.b}
          />
          <SmallInput
            value={sideValues[sideKeys.c] ?? 0}
            onChange={(v) => handleSideChange(sideKeys.c, v)}
            tooltip={sideLabels.c}
          />
          <SmallInput
            value={sideValues[sideKeys.d] ?? 0}
            onChange={(v) => handleSideChange(sideKeys.d, v)}
            tooltip={sideLabels.d}
          />
        </div>
      )}
    </div>
  );
};
