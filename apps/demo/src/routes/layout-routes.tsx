import { type AppRoute } from './types';
import { lazyElement } from './utils';
import { Navigate, useSearchParams } from 'react-router';
import { LS_KEYS, REDIRECT_WHITE_LIST_KEYS } from '@/constants';
import { AuthGuard } from './AuthGuard';

// 首页重定向组件：只保留白名单内的参数（如 invite-code），过滤掉登录状态等无关参数
const IndexRedirect = () => {
  const [searchParams] = useSearchParams();
  const newParams = new URLSearchParams();

  REDIRECT_WHITE_LIST_KEYS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      newParams.set(key, value);
    }
  });

  const search = newParams.toString();
  const token = localStorage.getItem(LS_KEYS.TOKEN);

  if (!token) {
    if (search) {
      return (
        <Navigate
          to={`/login?redirect=${encodeURIComponent('/manage-project?' + search)}`}
          replace
        />
      );
    }
    return <Navigate to="/login" replace />;
  }

  const to = `/manage-project${search ? `?${search}` : ''}`;

  return <Navigate to={to} replace />;
};

export const LayoutRoutes: AppRoute[] = [
  {
    index: true,
    hidden: true,
    element: <IndexRedirect />,
  }, // 👈 默认进入项目管理，并精准保留参数
  {
    path: 'manage-project',
    element: (
      <AuthGuard>{lazyElement(() => import('@/pages/Manage'))}</AuthGuard>
    ),
    name: 'router.manageProject',
  },
  {
    path: 'manage-team',
    element: (
      <AuthGuard>{lazyElement(() => import('@/pages/Manage'))}</AuthGuard>
    ),
    name: 'router.manageTeam',
  },
  {
    path: 'project-manage-detail/:project_id',
    name: 'router.projectManageDetail',
    children: [
      { path: '', element: lazyElement(() => import('@/pages/ManageDetail')) },
      {
        path: 'knowledge-base',
        name: 'router.knowledgeBase',
        children: [
          { index: true, element: <Navigate to="detail" replace /> },
          {
            path: 'detail',
            element: lazyElement(
              () =>
                import('@/pages/ManageDetail/MenuPage/Knowledge/KnowledgeDetail'),
            ),
            name: 'router.knowledgeBaseDetail',
          },
          {
            path: 'text-dataset',
            element: lazyElement(
              () =>
                import('@/pages/ManageDetail/MenuPage/Knowledge/KnowledgeTextDataset'),
            ),
            name: 'router.textDataset',
          },
          {
            path: 'image-dataset',
            element: lazyElement(
              () =>
                import('@/pages/ManageDetail/MenuPage/Knowledge/KnowledgeImageDataset'),
            ),
            name: 'router.imageDataset',
          },
          {
            path: 'dataset-detail',
            element: lazyElement(
              () =>
                import('@/pages/ManageDetail/MenuPage/Knowledge/KnowledgeDatasetDetail'),
            ),
            name: 'router.datasetDetail',
          },
        ],
      },
      {
        path: 'application-packaging',
        name: 'router.applicationPackaging',
        children: [
          { index: true, element: <Navigate to="create" replace /> },
          {
            path: 'create',
            element: lazyElement(
              () =>
                import('@/pages/ManageDetail/MenuPage/ApplicationPackaging/CreatePackage'),
            ),
            name: 'router.createPackage',
          },
          {
            path: 'detail',
            element: lazyElement(
              () =>
                import('@/pages/ManageDetail/MenuPage/ApplicationPackaging/CreatePackage'),
            ),
            name: 'router.packageDetail',
          },
        ],
      },
      {
        path: 'global-workflow',
        name: 'router.workflow',
        children: [
          { index: true, element: <Navigate to="edit" replace /> },
          {
            path: 'edit',
            element: lazyElement(
              () =>
                import('@/pages/ManageDetail/MenuPage/GlobalWorkflow/WorkflowEdit'),
            ),
            name: 'router.workflow',
          },
        ],
      },
    ],
  },
  {
    path: 'user-info',
    element: lazyElement(() => import('@/pages/UserInfo')),
    name: 'router.userInfo',
  },
];
