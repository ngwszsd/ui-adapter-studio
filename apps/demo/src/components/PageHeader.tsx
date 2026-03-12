import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

export interface EnhancedPageHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
  backIcon?: React.ReactNode | boolean;
  onBack?: (e: React.MouseEvent) => void;
  classNames?: Partial<
    Record<
      | 'box'
      | 'left'
      | 'extra'
      | 'icon'
      | 'titleBox'
      | 'title'
      | 'subTitleBox'
      | 'subTitle',
      string | undefined
    >
  >;
  avatar?: React.ReactNode;
}

const PageHeader: React.FC<EnhancedPageHeaderProps> = ({
  title,
  subTitle,
  extra,
  backIcon = true,
  onBack,
  classNames,
  avatar,
}) => {
  const navigate = useNavigate();

  const renderBackIcon = () => {
    if (!backIcon) return null;

    if (React.isValidElement(backIcon)) {
      return backIcon;
    }

    return <ChevronLeft className={cn('h-4 w-4 shrink-0', classNames?.icon)} />;
  };

  const renderTitle = () => {
    if (!title) return null;

    if (React.isValidElement(title)) {
      return title;
    }

    return (
      <div
        className={cn(
          'text-lg font-medium truncate text-foreground',
          classNames?.title,
        )}
      >
        {title}
      </div>
    );
  };

  const renderSubTitle = () => {
    if (!subTitle) return null;

    if (React.isValidElement(subTitle)) {
      return subTitle;
    }

    return (
      <div
        className={cn('text-base font-medium truncate', classNames?.subTitle)}
      >
        {subTitle}
      </div>
    );
  };

  const renderExtra = () => {
    if (!extra) return null;

    if (React.isValidElement(extra)) {
      return extra;
    }

    return (
      <div className={cn('flex items-center', classNames?.extra)}>{extra}</div>
    );
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-5 w-full',
        classNames?.box,
      )}
    >
      <div className={cn('flex items-center gap-4', classNames?.left)}>
        <div
          className={cn(
            'flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-muted-foreground/80',
            'flex-1 min-w-0',
            classNames?.subTitleBox,
          )}
          onClick={(e) => {
            e?.stopPropagation();

            if (!onBack) {
              return navigate(-1);
            }

            onBack?.(e);
          }}
        >
          {renderBackIcon()}
          {renderSubTitle()}
        </div>

        <div
          className={cn('flex items-center gap-[14px]', classNames?.titleBox)}
        >
          {avatar}
          {renderTitle()}
        </div>
      </div>

      {renderExtra()}
    </div>
  );
};

PageHeader.displayName = 'EnhancedPageHeader';

export { PageHeader };
