import { Suspense, memo, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Header } from '@/components/Header';
import { LoaderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { LS_KEYS } from '@/constants';

function Layout() {
  const { fetchUserInfo, fetchUserTeamList } = useAuthStore();
  const location = useLocation();

  // 检查当前路由是否匹配 project-manage-detail/:project_id
  const isProjectDetailPage = location.pathname.includes(
    '/project-manage-detail',
  );
  // 获取基础数据信息
  useEffect(() => {
    const token = localStorage.getItem(LS_KEYS.TOKEN);
    if (token) {
      fetchUserInfo();
      fetchUserTeamList();
    }
  }, [fetchUserTeamList, fetchUserInfo]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <div
        className={cn('shrink-0 bg-card border-border border-b', {
          hidden: isProjectDetailPage,
        })}
      >
        <Header />
      </div>
      <div className="flex flex-1 min-h-0">
        <Suspense
          fallback={
            <div className="w-full h-full flex justify-center items-center">
              <LoaderIcon
                role="status"
                aria-label="Loading"
                className={cn('size-4 animate-spin')}
              />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

export default memo(Layout);
