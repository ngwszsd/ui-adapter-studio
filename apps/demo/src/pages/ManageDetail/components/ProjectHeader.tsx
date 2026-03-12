import { type FC, memo } from 'react';
import { cn } from '@/lib/utils.ts';
import { ChevronLeft, CirclePlus, MoreHorizontal } from 'lucide-react';
import { useManageDetailContext } from '../context/ManageDetailContext.tsx';
import { useTranslation } from 'react-i18next';
import {
  Dropdown,
  EnhancedButton,
  Separator,
  Skeleton,
  EnhancedTooltip,
  EnhancedAvatar,
} from '@teamhelper/ui';
import { openAddDesignersModal } from './AddDesignersDialog.tsx';
import { useNavigate, useParams } from 'react-router';
const classNameHeader =
  'border-b border-border bg-card px-5 h-[48px] flex items-center';
function SkeletonHeader() {
  return (
    <div className={classNameHeader}>
      <div className="flex items-center justify-between w-full">
        {/* 左侧：返回按钮 + 项目信息 */}
        <div className="flex items-center space-x-4">
          {/* 返回按钮骨架 */}
          <Skeleton className="h-4 w-12" />

          {/* 项目信息骨架 */}
          <div className="flex items-center gap-1.5">
            {/* 项目名称 */}
            <Skeleton className="h-5 w-24" />
            {/* 分隔符 */}
            <Skeleton className="h-4 w-px" />
            {/* 项目描述 */}
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* 右侧：成员信息 */}
        <div className="flex items-center space-x-2">
          {/* "成员：" 标签 */}
          <Skeleton className="h-4 w-12" />
          {/* 成员头像组 */}
          <div className="flex items-center space-x-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            {/* 更多按钮 */}
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
export const ProjectHeader: FC = memo(() => {
  const { project, fetchingProjectDetail, refreshProjectDetail } =
    useManageDetailContext();
  const navigate = useNavigate();
  const { t } = useTranslation('manageDetail');
  const { project_id } = useParams<{ project_id: string }>();
  if (fetchingProjectDetail) return <SkeletonHeader />;
  return (
    <div className={cn(classNameHeader, 'justify-between pl-4')}>
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* 返回按钮 */}
        <div
          onClick={() => navigate('/manage-project')}
          className="flex items-center gap-1 hover:opacity-80 text-primary font-medium text-sm cursor-pointer shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('header.back')}
        </div>

        {/* 项目信息 */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <div className="text-sm font-semibold text-foreground  shrink-0">
            <EnhancedTooltip title={project?.name}>
              <span className="truncate block max-w-[180px]">
                {project?.name}
              </span>
            </EnhancedTooltip>
          </div>

          <Separator
            orientation="vertical"
            className={cn('h-4! shrink-0', {
              hidden: !project?.description,
            })}
          />

          <div className="text-xs text-muted-foreground leading-relaxed truncate flex-1 min-w-0">
            <EnhancedTooltip title={project?.description}>
              <span className="truncate block pr-5">
                {project?.description}
              </span>
            </EnhancedTooltip>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <div className="font-medium text-sm text-foreground">
          {t('header.members')}：
        </div>
        <div className="flex items-center space-x-2">
          {/* 显示前5个设计师头像 */}
          {project?.designers?.slice(0, 6).map((designer) => (
            <div
              key={designer.user_id}
              className="w-8 h-8 rounded-full overflow-hidden"
            >
              <EnhancedAvatar src={designer?.avatar} initialOnly>
                {designer?.name}
              </EnhancedAvatar>
            </div>
          ))}

          <Dropdown
            menu={{
              items:
                project?.designers?.map((designer) => ({
                  key: designer.user_id,
                  icon: (
                    <EnhancedAvatar size="26" src={designer.avatar} initialOnly>
                      {designer.name}
                    </EnhancedAvatar>
                  ),
                  label: `${designer.name}${designer.owner ? `（${t('app.add.member.creator')}）` : ''}`,
                })) || [],
            }}
            placement="bottomLeft"
            overlayClassName="min-w-20"
            cursorPointer={false}
            dropdownRender={(menu) => {
              return (
                <div>
                  <div className="px-2 py-1.5">
                    <EnhancedButton
                      className={cn(
                        'border border-primary text-primary bg-transparent',
                        'hover:border-primary/70 hover:text-primary/70 hover:bg-transparent',
                        'w-full',
                      )}
                      onClick={async () => {
                        const bool = await openAddDesignersModal({
                          designers: project?.designers || [],
                          project_id: Number(project_id),
                        });
                        if (bool) {
                          refreshProjectDetail();
                        }
                      }}
                    >
                      <CirclePlus className="h-3.5 w-3.5" />
                      {t('app.add.designer')}
                    </EnhancedButton>
                  </div>

                  {menu}
                </div>
              );
            }}
          >
            <EnhancedButton
              shape="circle"
              className="w-8 h-8 shadow-none bg-muted text-foreground border-0 hover:bg-foreground/10"
            >
              <MoreHorizontal className="h-4 w-4" />
            </EnhancedButton>
          </Dropdown>
        </div>
      </div>
    </div>
  );
});
