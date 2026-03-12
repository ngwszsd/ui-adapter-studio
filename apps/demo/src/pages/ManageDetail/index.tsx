import { type FC, memo, useEffect, useMemo } from 'react';
import {
  ManageDetailProvider,
  useManageDetailContext,
} from './context/ManageDetailContext';
import { ProjectHeader } from '@/pages/ManageDetail/components/ProjectHeader.tsx';
import { ProjectSidebar } from '@/pages/ManageDetail/components/ProjectSidebar.tsx';
import { ContentArea } from '@/pages/ManageDetail/components/ContentArea.tsx';
import { useManageDetailLayoutControlStore } from '@/pages/ManageDetail/store';
import { cn } from '@/lib/utils';
import { useParams, useSearchParams } from 'react-router';

const ManageDetailBase: FC = memo(() => {
  const { project_id } = useParams<{ project_id: string }>();
  const [searchParams] = useSearchParams();
  const showSidebar = useManageDetailLayoutControlStore(
    (state) => state.showSidebar,
  );
  const setShowSidebar = useManageDetailLayoutControlStore(
    (state) => state.setShowSidebar,
  );
  const showProjectHeader = useManageDetailLayoutControlStore(
    (state) => state.showProjectHeader,
  );
  const setShowProjectHeader = useManageDetailLayoutControlStore(
    (state) => state.setShowProjectHeader,
  );
  const { activeTab } = useManageDetailContext();

  const pageFlag = useMemo(() => {
    const parentId = searchParams?.get?.('parentId') || '';
    return Boolean(parentId);
  }, [searchParams]);

  useEffect(() => {
    if (['knowledge-base'].includes(activeTab)) {
      if (pageFlag) {
        setShowSidebar(false);
        setShowProjectHeader(false);
        return;
      }
    }

    setShowSidebar(true);
    setShowProjectHeader(true);
  }, [activeTab, pageFlag, setShowSidebar, setShowProjectHeader]);

  return (
    <div
      datatype="manage-detail"
      className="h-full bg-background w-full flex flex-col"
    >
      {/* 顶部项目信息 */}
      <div className={cn('shrink-0', showProjectHeader ? 'block' : 'hidden')}>
        <ProjectHeader />
      </div>

      {/* 主体内容区域 */}
      <div className="flex flex-1 min-h-0">
        {/* 左侧菜单 */}
        <ProjectSidebar className={showSidebar ? 'flex' : 'hidden'} />

        {/* 右侧内容区域 */}
        <ContentArea />
      </div>
    </div>
  );
});

const ManageDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindSearchParams } = useManageDetailLayoutControlStore();

  useEffect(() => {
    bindSearchParams(searchParams, setSearchParams);
  }, [bindSearchParams, searchParams, setSearchParams]);

  return (
    <ManageDetailProvider>
      <ManageDetailBase />
    </ManageDetailProvider>
  );
};
export default memo(ManageDetail);
