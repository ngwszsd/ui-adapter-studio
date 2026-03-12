import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@teamhelper/ui';

export default function GlobalWorkflowSkeleton() {
  return (
    <div className="flex-1 h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[100px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="w-[150px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[150px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[100px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="w-[200px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[100px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="w-[160px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[160px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index}>
                {/* 名称 */}
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                {/* 创建者 */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </TableCell>
                {/* 创建时间 */}
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                {/* 更新时间 */}
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                {/* 状态 */}
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                {/* 引用 */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                {/* 版本 */}
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                {/* 可编辑 */}
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                {/* 操作 */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* 分页骨架 */}
      <div className="mt-4 flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-64" />
      </div>
    </div>
  );
}
