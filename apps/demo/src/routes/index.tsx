import { createBrowserRouter } from 'react-router';
import { LayoutRoutes } from './layout-routes';
import i18n from '@/i18n';
import { type AppRoute } from './types';
import { lazyElement } from './utils';

export const routes: AppRoute[] = [
  {
    path: '/',
    element: lazyElement(() => import('@/layout')),
    children: LayoutRoutes,
  },
  {
    path: '/login',
    element: lazyElement(() => import('@/pages/Login')),
    name: 'router.login',
  },
  {
    path: '/forgot-password',
    element: lazyElement(() => import('@/pages/ForgetPassword')),
    name: 'router.forgotPassword',
  },
  {
    path: '/components-demo',
    element: lazyElement(() => import('@/pages/ComponentsDemo')),
    name: 'router.componentsDemo',
  },
  {
    path: '/editor-demo',
    element: lazyElement(() => import('@/pages/EditorDemo')),
    name: 'router.editorDemo',
  },
  {
    path: '*',
    element: lazyElement(() => import('@/pages/NotFound')),
    name: 'router.notFound',
  },
];
export { LayoutRoutes } from './layout-routes';
export const router = createBrowserRouter(routes);

const updateTitle = (matches: typeof router.state.matches) => {
  for (let i = matches.length - 1; i >= 0; i--) {
    const route = matches[i].route as AppRoute;
    if (route.name) {
      document.title = i18n.t(route.name);
      break;
    }
  }
};

// 路由切换时更新标题并检查版本
router.subscribe((state) => {
  updateTitle(state.matches);
});

// 初始化标题和版本检查
if (router.state?.matches?.length) {
  updateTitle(router.state.matches);
}

// 监听语言切换，更新标题
i18n.on('languageChanged', () => {
  if (router.state?.matches?.length) {
    updateTitle(router.state.matches);
  }
});
