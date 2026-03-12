import { Skeleton } from '@teamhelper/ui';

export function MCPServerCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-card rounded-[18px] border hover:shadow-md transition-shadow"
        >
          {/* 卡片头部 */}
          <div className="p-6 pb-3 space-y-0">
            <div className="flex items-start justify-between mb-3">
              {/* 应用图标 */}
              <Skeleton className="h-10 w-10 rounded-[8px]" />
              {/* 更多菜单 */}
              <Skeleton className="w-8 h-[18px] rounded-full" />
            </div>
            {/* 标题 */}
            <Skeleton className="h-6 w-32" />
          </div>

          {/* 卡片内容 */}
          <div className="px-6 py-0">
            {/* 描述文本 */}
            <div className="mb-3 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>

            {/* 底部信息 */}
            <div className="flex items-center justify-between border-t border-border py-3.5">
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-[26px] h-[26px] rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
