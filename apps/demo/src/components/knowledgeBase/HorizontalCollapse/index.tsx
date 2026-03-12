import { cn } from '@/lib/utils';
import React from 'react';

export interface HorizontalCollapseProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  width?: string | number;
}

export const HorizontalCollapse: React.FC<HorizontalCollapseProps> = ({
  isOpen,
  width = 280,
  children,
  className,
  ...props
}) => {
  const widthVal = typeof width === 'number' ? `${width}px` : width;

  return (
    <div
      className={cn(
        'shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden',
        className,
        !isOpen && 'w-0! border-none! opacity-0! p-0! m-0!',
      )}
      style={{
        width: isOpen ? widthVal : 0,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
