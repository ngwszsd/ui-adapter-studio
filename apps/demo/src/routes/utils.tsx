import React, { lazy } from 'react';

// 懒加载页面
export function lazyElement(
  factory: () => Promise<{ default: React.ComponentType<any> }>,
) {
  const Comp = lazy(factory);
  return <Comp />;
}
