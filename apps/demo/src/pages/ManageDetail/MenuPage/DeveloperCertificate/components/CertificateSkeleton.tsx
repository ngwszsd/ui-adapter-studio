import React from 'react';
import { EnhancedCard, DivSkeleton } from '@teamhelper/ui';
import { cn } from '@/lib/utils';

export const CertificateSkeleton: React.FC = () => {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <EnhancedCard
          key={index}
          hoverable={false}
          className={cn('w-full cursor-auto pointer-events-none select-none')}
          headerClassName="pb-4"
          headerWrapperClassName="w-full"
          titleWrapperClassName="min-w-0"
          title={
            <DivSkeleton isSkeleton={true} className="h-6 w-40 rounded-md">
              <></>
            </DivSkeleton>
          }
          extra={
            <DivSkeleton isSkeleton={true} className="w-8 h-4.5 rounded-full">
              <></>
            </DivSkeleton>
          }
          contentClassName="pb-3"
        >
          <div className="flex flex-col gap-3.5">
            <DivSkeleton isSkeleton={true} className="h-5 w-64 rounded-md">
              <></>
            </DivSkeleton>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <DivSkeleton isSkeleton={true} className="h-4 w-48 rounded-md">
                <></>
              </DivSkeleton>

              <DivSkeleton isSkeleton={true} className="h-5 w-24 rounded-md">
                <></>
              </DivSkeleton>
            </div>
          </div>
        </EnhancedCard>
      ))}
    </>
  );
};
