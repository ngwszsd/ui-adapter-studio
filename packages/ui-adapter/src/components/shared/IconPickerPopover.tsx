import React, { useState, useMemo } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Input,
} from '@teamhelper/ui';
import { X, Plus } from 'lucide-react';
import { CURATED_ICONS, getIconComponent } from './iconRegistry';

interface IconPickerPopoverProps {
  value: string;
  onChange: (name: string) => void;
}

export const IconPickerPopover = ({
  value,
  onChange,
}: IconPickerPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      CURATED_ICONS.filter(
        (icon) =>
          icon.name.toLowerCase().includes(search.toLowerCase()) ||
          icon.label.includes(search)
      ),
    [search]
  );

  const SelectedIcon = value ? getIconComponent(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-2 text-sm hover:bg-slate-50"
        >
          <span className="flex items-center gap-1.5 text-slate-600">
            {SelectedIcon ? (
              <>
                <SelectedIcon size={14} />
                <span className="text-xs">{value}</span>
              </>
            ) : (
              <span className="text-xs text-slate-400">选择图标</span>
            )}
          </span>
          <Plus size={12} className="text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <span className="text-xs font-semibold text-slate-700">
            选择图标
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-2">
          <Input
            placeholder="搜索图标名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
          />
        </div>

        {/* Icon Grid */}
        <div className="max-h-56 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              未找到匹配图标
            </p>
          ) : (
            <div className="grid grid-cols-8 gap-1">
              {filtered.map((icon) => {
                const Icon = icon.component;
                const isSelected = value === icon.name;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    title={icon.label}
                    onClick={() => {
                      onChange(icon.name);
                      setOpen(false);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear button */}
        {value && (
          <div className="border-t border-slate-100 px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="w-full rounded-md py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              清除图标
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
