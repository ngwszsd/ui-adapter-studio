import { cn } from '@/lib/utils';
import {
  EnhancedPopover as Popover,
  type EnhancedPopoverProps,
} from '@teamhelper/ui';
import { HelpCircle } from 'lucide-react';

export interface HelpPopoverProps extends Omit<
  EnhancedPopoverProps,
  'children'
> {
  children?: React.ReactNode;
  iconClassName?: string;
}

export const HelpPopover: React.FC<HelpPopoverProps> = ({
  children,
  iconClassName,
  popoverContentClassName,
  content,
  ...props
}) => (
  <Popover
    trigger="hover"
    placement="top"
    popoverContentClassName={cn('px-3 py-2', popoverContentClassName)}
    content={
      <div className="text-xs text-foreground font-medium">{content}</div>
    }
    {...props}
  >
    {children || (
      <HelpCircle
        className={cn(
          'w-4 h-4 text-muted-foreground cursor-pointer',
          iconClassName,
        )}
      />
    )}
  </Popover>
);
