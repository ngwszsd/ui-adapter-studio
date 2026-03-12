import { cn } from '@/lib/utils';
import React, { useState } from 'react';

// 折叠面板项的类型定义
export interface CollapsePanelProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  childrenClassName?: string;
}

// 单个折叠面板组件
export const CollapsePanel = ({
  title,
  children,
  isOpen,
  onToggle,
  className,
  headerClassName,
  contentClassName,
  childrenClassName,
}: CollapsePanelProps) => {
  return (
    <div
      className={cn(
        'mb-2 border border-gray-200 rounded-lg bg-card',
        className,
      )}
    >
      {/* 面板头部 */}
      <div
        className={cn(
          'flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200',
          headerClassName,
        )}
        onClick={onToggle}
      >
        <span className="font-medium text-gray-800">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
            isOpen ? 'rotate-90' : 'rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      {/* 面板内容 */}
      <div
        className={cn(
          `overflow-hidden transition-all duration-300`,
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0',
          contentClassName,
        )}
      >
        <div
          className={cn(
            'p-3 pt-0 space-y-1 max-h-80 overflow-y-auto scrollbar-hide',
            childrenClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// 自定义Hook：管理多个面板的展开状态
export const useCollapseState = (defaultActiveKeys: string[] = []) => {
  const [openPanels, setOpenPanels] = useState<Set<string>>(
    new Set(defaultActiveKeys),
  );

  const togglePanel = (key: string) => {
    const newOpenPanels = new Set(openPanels);
    if (newOpenPanels.has(key)) {
      newOpenPanels.delete(key);
    } else {
      newOpenPanels.add(key);
    }
    setOpenPanels(newOpenPanels);
  };

  const isOpen = (key: string) => openPanels.has(key);

  return {
    isOpen,
    togglePanel,
    openPanels,
  };
};
