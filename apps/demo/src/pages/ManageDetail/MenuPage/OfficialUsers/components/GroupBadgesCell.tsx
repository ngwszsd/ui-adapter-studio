import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge, EnhancedButton as Button } from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';

type GroupBadgesCellProps = {
  groups?: string[];
  badgeClasssName?: string;
};

const GroupBadgesCell: React.FC<GroupBadgesCellProps> = ({
  groups,
  badgeClasssName,
}) => {
  if (!Array.isArray(groups) || !groups.length) return null;
  const { t } = useTranslation('manageDetail');
  const [expanded, setExpanded] = useState(false);

  const visibleGroups = expanded ? groups : groups.slice(0, 1);

  return (
    <div className="flex items-baseline">
      <div className="flex flex-col gap-2">
        {visibleGroups.map((item, idx) => {
          if (!item) return null;
          return (
            <Badge
              key={`${item}-${idx}`}
              className={cn(
                'px-3 py-0 h-[26px] rounded-full flex items-center justify-center w-fit border-0',
                badgeClasssName,
              )}
              variant="outline"
            >
              <div className="text-xs">{item}</div>
            </Badge>
          );
        })}
      </div>

      {groups.length > 1 && (
        <Button
          type="link"
          className="text-xs hover:no-underline hover:text-primary/70"
          size="small"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t('common.collapse') : t('common.expand')}
        </Button>
      )}
    </div>
  );
};

export default GroupBadgesCell;
