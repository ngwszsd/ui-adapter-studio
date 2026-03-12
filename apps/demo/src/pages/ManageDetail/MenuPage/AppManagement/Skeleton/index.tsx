import { Skeleton } from '@teamhelper/ui';

export function AppManagementSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-card rounded-[18px] border overflow-hidden"
        >
          {/* 卡片主体 */}
          <div className="p-6 pb-3.5">
            {/* 右上角更多菜单骨架 */}
            <div className="flex items-start justify-end mb-0">
              <Skeleton className="w-8 h-[18px] rounded-full" />
            </div>

            {/* 应用图标与标题（居中） */}
            <div className="flex flex-col items-center mb-6">
              {/* 应用图标 */}
              <Skeleton className="h-15 w-15 rounded-[12px] mb-1" />
              {/* 应用名称 */}
              <Skeleton className="h-5 w-32" />
            </div>

            {/* 作者信息 */}
            <div className="flex flex-col">
              <div className="flex items-center mb-2">
                <Skeleton className="w-[26px] h-[26px] rounded-full mr-1.5" />
                <Skeleton className="h-3 w-16" />
              </div>

              {/* 更新时间 */}
              <Skeleton className="h-3 w-40" />
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="px-5 py-1.5 flex items-center justify-end border-t border-border">
            <Skeleton className="h-7 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
