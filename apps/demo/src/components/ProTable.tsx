import * as React from 'react';
import { cn } from '@/lib/utils';
import i18n from '@/i18n';
import {
  EnhancedSpinner,
  EnhancedPagination as Pagination,
  EnhancedTable as Table,
  type EnhancedPaginationProps,
  type EnhancedTableProps,
} from '@teamhelper/ui';

type PaginationState = {
  current: number;
  pageSize: number;
  total: number;
};

export type ProTablePaginationConfig = Omit<
  EnhancedPaginationProps,
  'current' | 'pageSize' | 'total' | 'onChange'
> & {
  current?: number;
  pageSize?: number;
  total?: number;
  onChange?: (page: number, pageSize: number) => void;
  position?: 'top' | 'bottom' | 'both';
};

export interface ProTableProps<T = any> extends Omit<
  EnhancedTableProps<T>,
  'onChange'
> {
  pagination?: false | ProTablePaginationConfig;
  /** 默认前端分页；设为 false 用于服务端分页（不切片） */
  clientSide?: boolean;
  /** 兼容 antd Table 的签名 */
  onChange?: (
    pagination: PaginationState,
    filters: any,
    sorter: any,
    extra: { currentDataSource: T[]; action: string },
  ) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ProTable = <T extends Record<string, any> = any>({
  dataSource = [],
  pagination,
  clientSide = false,
  onChange,
  className,
  style,
  loading = false,
  ...restProps
}: ProTableProps<T>) => {
  const isPaginationEnabled = pagination !== false;
  const userPagination =
    isPaginationEnabled && typeof pagination === 'object' ? pagination : {};

  // 内部状态（非受控模式使用）
  const [innerCurrent, setInnerCurrent] = React.useState(0);
  const [innerPageSize, setInnerPageSize] = React.useState(10);

  // 判断是否受控
  const isCurrentControlled = typeof userPagination.current === 'number';
  const isPageSizeControlled = typeof userPagination.pageSize === 'number';

  // 计算最终使用的分页参数
  const current = isCurrentControlled ? userPagination.current! : innerCurrent;
  const pageSize = isPageSizeControlled
    ? userPagination.pageSize!
    : innerPageSize;
  const total =
    typeof userPagination.total === 'number'
      ? userPagination.total
      : dataSource.length;

  // 计算当前页数据（仅前端分页有效）
  const pageData = React.useMemo(() => {
    if (!clientSide || !isPaginationEnabled) return dataSource;
    const start = current * pageSize;
    return dataSource.slice(start, start + pageSize);
  }, [dataSource, clientSide, isPaginationEnabled, current, pageSize]);

  const handleTableChange = (
    filters: any,
    sorter: any,
    extra: { currentDataSource: T[]; action: string },
  ) => {
    onChange?.({ current, pageSize, total }, filters, sorter, extra);
  };

  const handlePageChange = (nextPage: number, nextSize: number) => {
    // Pagination 组件通常返回 1-based 的页码，这里转换为 0-based
    const adjustedPage = nextPage - 1;

    // 触发用户的 onChange
    userPagination.onChange?.(adjustedPage, nextSize);

    // 非受控模式下更新内部状态
    if (!isCurrentControlled) setInnerCurrent(adjustedPage);
    if (!isPageSizeControlled) setInnerPageSize(nextSize);

    // 触发 ProTable 的 onChange
    const start = adjustedPage * nextSize;
    const nextData =
      clientSide && isPaginationEnabled
        ? dataSource.slice(start, start + nextSize)
        : dataSource;

    onChange?.(
      { current: adjustedPage, pageSize: nextSize, total },
      {},
      {},
      { currentDataSource: nextData, action: 'paginate' },
    );
  };

  const handleSizeChange = (nextPage: number, nextSize: number) => {
    // 切换 pageSize 通常回到第一页
    const newCurrent = 0;

    userPagination.onShowSizeChange?.(nextPage - 1, nextSize);
    userPagination.onChange?.(newCurrent, nextSize);

    if (!isCurrentControlled) setInnerCurrent(newCurrent);
    if (!isPageSizeControlled) setInnerPageSize(nextSize);

    const nextData =
      clientSide && isPaginationEnabled
        ? dataSource.slice(0, nextSize)
        : dataSource;

    onChange?.(
      { current: newCurrent, pageSize: nextSize, total },
      {},
      {},
      { currentDataSource: nextData, action: 'paginate' },
    );
  };

  const pos = userPagination.position || 'bottom';

  const paginationNode = isPaginationEnabled ? (
    <Pagination
      showSizeChanger={false}
      showQuickJumper={false}
      showTotal={(t, [rangeStart, rangeEnd]) => {
        const pageCount = t > 0 ? rangeEnd - rangeStart + 1 : 0;
        return (
          <div className="text-sm text-muted-foreground">
            {i18n.t('components:pagination.rangePrefix')}
            <span className="font-medium mx-1">{current + 1}</span>
            {i18n.t('components:pagination.pageSuffix')}
            <span className="font-medium mx-1">{pageCount}</span>
            {i18n.t('components:pagination.countSuffix')}
            <span className="font-medium mx-1">{t}</span>
            {i18n.t('components:pagination.totalSuffix')}
          </div>
        );
      }}
      {...userPagination}
      current={current + 1}
      pageSize={pageSize}
      total={total}
      onChange={handlePageChange}
      onShowSizeChange={handleSizeChange}
    />
  ) : null;

  return (
    <EnhancedSpinner
      spinning={loading}
      wrapperClassName="flex-1 min-h-0"
      childrenClassName="h-full"
    >
      <div
        className={cn('w-full h-full flex flex-col', className)}
        style={style}
      >
        {isPaginationEnabled && (pos === 'top' || pos === 'both') ? (
          <div className="mb-3">{paginationNode}</div>
        ) : null}

        <Table<T>
          {...restProps}
          dataSource={pageData}
          onChange={handleTableChange}
        />

        {isPaginationEnabled && (pos === 'bottom' || pos === 'both') ? (
          <div className="mt-3">{paginationNode}</div>
        ) : null}
      </div>
    </EnhancedSpinner>
  );
};

ProTable.displayName = 'ProTable';

export { ProTable };
