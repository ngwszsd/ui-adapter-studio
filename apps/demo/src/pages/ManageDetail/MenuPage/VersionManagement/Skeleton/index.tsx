import { Skeleton } from '@teamhelper/ui';

export function VersionManagementSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-card rounded-[18px] border overflow-hidden"
        >
          {/* 左上角版本/状态标识骨架 */}
          <div className="absolute top-0 left-0 hidden">
            <Skeleton className="h-7 w-32 rounded-br-[16px]" />
          </div>

          {/* 右上角更多菜单骨架 */}
          <div className="p-5 pb-0 flex items-start justify-end">
            <Skeleton className="w-8 h-[18px] rounded-full" />
          </div>

          {/* 图标与名称 */}
          <div className="px-5 pt-3.5 pb-8 flex flex-col items-center">
            {/* 应用图标 */}
            <Skeleton className="h-15 w-15 rounded-[12px] mb-3" />
            {/* 应用名称 */}
            <Skeleton className="h-5 w-32 mb-2" />
            {/* New 标签 */}
            <Skeleton className="h-5 w-[46px] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
