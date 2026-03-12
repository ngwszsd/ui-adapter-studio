import { Skeleton } from '@teamhelper/ui';

export function AppsPermissionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-card rounded-[18px] border">
          {/* 卡片主体 */}
          <div className="p-6">
            {/* 图标与标题（居中） */}
            <div className="flex flex-col items-center">
              {/* 应用图标 */}
              <Skeleton className="h-15 w-15 rounded-[12px] mb-3" />
              {/* 应用名称 */}
              <Skeleton className="h-5 w-32" />
            </div>
          </div>

          {/* 底部信息 */}
          <div className="flex flex-col px-5 py-3.5">
            {/* 作者信息 */}
            <div className="flex items-center mb-1">
              <Skeleton className="w-[26px] h-[26px] rounded-full mr-1.5" />
              <Skeleton className="h-3 w-16" />
            </div>

            {/* 版本和发布时间 */}
            <div className="space-y-1 mt-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
