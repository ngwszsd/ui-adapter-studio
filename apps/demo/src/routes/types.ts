import React from 'react';
import { resources } from '@/i18n';

type RouterKeys = keyof (typeof resources)['zh']['translation']['router'];
type RouterNamespaceKey = `router.${RouterKeys}`;

import { type RouteObject } from 'react-router';

type AppRouteBase = {
  name?: RouterNamespaceKey; // 菜单标题（限制为 router.* 的 key）
  icon?: React.ReactNode; // 菜单图标
  hidden?: boolean; // 是否在菜单中隐藏
};

export type AppRoute = RouteObject &
  AppRouteBase & {
    children?: AppRoute[];
  };
