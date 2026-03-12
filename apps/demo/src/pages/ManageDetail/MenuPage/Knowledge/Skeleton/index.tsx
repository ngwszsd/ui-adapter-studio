import { Skeleton } from '@teamhelper/ui';

export function KnowledgeSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bg-card rounded-[18px] border flex flex-col justify-between"
        >
          {/* 卡片头部 */}
          <div className="p-6 pb-3.5 flex justify-between">
            <div className="flex items-center flex-1 min-w-0">
              {/* 图标 */}
              <Skeleton className="w-[54px] h-[54px] rounded-[10px] shrink-0" />

              {/* 标题和描述 */}
              <div className="flex-1 ml-3.5 space-y-2 min-w-0 flex flex-col">
                <Skeleton className="h-5 max-w-32" />
                <Skeleton className="h-3 max-w-48" />
              </div>
            </div>

            {/* 更多菜单 */}
            <Skeleton className="w-8 h-[18px] rounded-full ml-2" />
          </div>

          {/* 创建者信息 */}
          <div className="px-6 py-3.5 flex items-center gap-1.5">
            <Skeleton className="w-[26px] h-[26px] rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* 底部信息 */}
          <div className="py-3.5 px-6 border-t border-border">
            <div className="flex w-full justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
