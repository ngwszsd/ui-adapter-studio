import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@teamhelper/ui';

export function UserGroupSkeleton() {
  return (
    <div className="flex flex-col min-h-0">
      {/* 全部成员骨架 */}
      <div className="flex items-center justify-between rounded-sm px-[14px] py-3 min-h-[45px] mb-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-8" />
      </div>

      {/* 分组列表骨架 */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-sm px-[14px] py-3 min-h-[45px] mb-1"
        >
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroupUserListSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 表格区域 - 可滚动 */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="w-[100px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="w-[124px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[200px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="w-[122px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="w-[90px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="w-[167px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[72px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-[18px] w-8 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分页区域 - 固定在底部 */}
      <div className="shrink-0 pt-4 flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>
    </div>
  );
}
