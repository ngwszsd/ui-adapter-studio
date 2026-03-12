import { useSize } from 'ahooks';
import { useMemo } from 'react';

export interface BreadcrumbConfig {
  width?: number; // 生效的最大宽度（小于此宽度时生效）
  maxItems: number;
  itemsAfter: number;
  itemsBefore?: number;
}

const DEFAULT_CONFIGS: BreadcrumbConfig[] = [
  { width: 1000, maxItems: 2, itemsAfter: 1, itemsBefore: 0 },
  { width: 1200, maxItems: 3, itemsAfter: 1, itemsBefore: 1 },
  { width: Infinity, maxItems: 4, itemsAfter: 2, itemsBefore: 1 },
];

export const useResponsiveBreadcrumb = (
  configs: BreadcrumbConfig[] = DEFAULT_CONFIGS,
) => {
  const size = useSize(document.body);
  const width = size?.width ?? window.innerWidth;

  return useMemo(() => {
    // 确保按宽度从小到大排序
    const sortedConfigs = [...configs].sort(
      (a, b) => (a.width ?? Infinity) - (b.width ?? Infinity),
    );

    // 查找第一个满足当前宽度小于配置宽度的项
    const match = sortedConfigs.find(
      (config) => width < (config.width ?? Infinity),
    );

    // 如果找到匹配项则返回，否则返回最后一项（通常是默认/大屏配置）
    return match || sortedConfigs[sortedConfigs.length - 1];
  }, [width, configs]);
};
