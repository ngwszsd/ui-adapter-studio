import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CirclePlus, MoreHorizontal, PackageOpen } from 'lucide-react';
import { useRequest, useThrottleEffect } from 'ahooks';
import { openCreateProjectDialog } from './CreateProjectDialog.tsx';
import BoxFilledIcon from '@/assets/icon/boxFilled.svg?react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store';
import {
  queryProjectPermissionApi,
  switchTeamsApi,
  type UserTeamListDto,
} from '@/common/server';
import { LS_KEYS } from '@/constants';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  EnhancedButton as Button,
  EnhancedInput as Input,
  Dropdown,
  Empty,
  openModalError,
  EnhancedTooltip,
  EnhancedSpinner,
  Spinner,
  EnhancedAvatar,
  EnhancedSelect,
  type EnhancedSelectOption,
  message,
} from '@teamhelper/ui';
import { CardSkeleton } from '../../Skeleton';
import {
  getProjectDataApi,
  type ProjectInformation,
  deleteProjectApi,
} from '@/pages/Manage/server';
import { cn } from '@/lib/utils.ts';

type TeamInfo = {
  team_id?: number;
  dataList: EnhancedSelectOption<number, UserTeamListDto>[];
};

export const ProjectsContent = () => {
  const { t } = useTranslation('manage');
  const navigate = useNavigate();
  const { userInfo, userTeamList } = useAuthStore();
  const { team_id } = userInfo ?? {};

  const [teamInfo, setTeamInfo] = useState<TeamInfo>({
    team_id: undefined,
    dataList: [],
  });

  useEffect(() => {
    setTeamInfo({
      team_id: team_id,
      dataList: userTeamList.map((team) => ({
        value: team.team_id,
        label: team.team_name,
        ...team,
      })),
    });
  }, [team_id, userTeamList]);

  const changeTeam = async (team_id: number) => {
    try {
      const res = await switchTeamsApi(team_id);
      // 存储 Token 和过期时间
      const { token, expire_time } = res.data;
      localStorage.setItem(LS_KEYS.TOKEN, token);
      setTimeout(() => {
        window.location.reload();
      }, 0);
    } catch (e) {}
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  const [projectData, setProjectData] = useState<ProjectInformation[]>([]);

  const initData = async () => {
    try {
      setPageLoading(true);
      const res = await getProjectDataApi({
        name: searchQuery,
        page: 0,
        size: 9999,
      });
      setProjectData(res.data?.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setPageLoading(false);
    }
  };

  useThrottleEffect(
    () => {
      initData();
    },
    [searchQuery],
    { wait: 500 },
  );

  const onDeleteProjectClick = async (project_id: number) => {
    await openModalError({
      title: t('tips.delete.title'),
      content: t('tips.delete.description'),
      onOkBeforeFunction: async () => {
        const statusData = await deleteProjectApi(project_id);
        initData();
        return !!statusData.data;
      },
    });
  };

  const handleProjectForm = async (project?: ProjectInformation) => {
    const bool = await openCreateProjectDialog({ project });
    if (bool) await initData();
  };

  const { data: projectPermissionInfo, run: runQueryProjectPermission } =
    useRequest(
      (projectId: string | number | null) => {
        return queryProjectPermissionApi(projectId);
      },
      {
        manual: true,
      },
    );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="shrink-0 px-5 pb-0 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{t('projects.pageTitle')}</h1>

            <div className="flex items-center space-x-2">
              <div className="font-medium text-sm ">
                {t('projects.currentTeam')}
              </div>

              <div className="w-66">
                <EnhancedSelect
                  value={teamInfo.team_id}
                  onChange={(value) => {
                    if (teamInfo?.team_id === value) return;

                    changeTeam(Number(value));
                  }}
                  options={teamInfo.dataList}
                  placeholder={t('projects.teamSelector.placeholder')}
                  searchable={false}
                  allowClear={false}
                  listHeight="auto"
                  className="bg-card"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input.Search
              placeholder={t('projects.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Button type="primary" onClick={() => handleProjectForm()}>
              <CirclePlus />
              {t('projects.addProject')}
            </Button>
          </div>
        </div>
      </div>
      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {
          <>
            <EnhancedSpinner
              spinning={pageLoading}
              className={cn('h-full', {
                hidden: !pageLoading,
              })}
            ></EnhancedSpinner>
            {Array.isArray(projectData) && projectData.length ? (
              <div
                className={cn(
                  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1',
                  {
                    hidden: pageLoading,
                  },
                )}
              >
                {projectData.map((project, index) =>
                  pageLoading ? (
                    <CardSkeleton></CardSkeleton>
                  ) : (
                    <Card
                      key={project.project_id}
                      className="hover:shadow-md transition-shadow rounded-[18px] flex flex-col cursor-pointer border border-border"
                      onClick={() =>
                        navigate(
                          `/project-manage-detail/${project.project_id}?tab=apps-design`,
                        )
                      }
                    >
                      <CardHeader className="pb-4 flex-row justify-between">
                        <CardTitle className="text-base mb-0">
                          {project.name}
                        </CardTitle>

                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'edit',
                                label: t('projects.dropdown.edit'),
                              },
                              {
                                key: 'delete',
                                label: t('projects.dropdown.delete'),
                                danger: true,
                              },
                            ],
                            onClick({ key, domEvent }) {
                              domEvent.stopPropagation();
                              if (!projectPermissionInfo?.editable) {
                                return message.error(t('tips.noPermission'));
                              }

                              switch (key) {
                                case 'edit':
                                  handleProjectForm(project);
                                  break;
                                case 'delete':
                                  onDeleteProjectClick(project.project_id);
                                  break;
                              }
                            },
                          }}
                          placement="bottomRight"
                          overlayClassName="min-w-20"
                          cursorPointer
                          onOpenChange={(open) => {
                            if (open) {
                              runQueryProjectPermission(project?.project_id);
                            }
                          }}
                        >
                          <Button className="rounded-full w-8 h-[18px] flex items-center justify-center bg-muted hover:bg-muted-foreground/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </Dropdown>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <EnhancedTooltip
                          title={project?.description}
                          overlayClassName="max-w-[280px]"
                        >
                          <p className="text-sm text-muted-foreground mb-3.5 line-clamp-2 h-[42px] break-all">
                            {project.description}
                          </p>
                        </EnhancedTooltip>

                        <div className="flex items-center">
                          <div className="text-xs font-medium mr-2">
                            {t('projects.members.label')}
                          </div>

                          <div className="flex -space-x-2 items-center">
                            {project.members?.slice(0, 6).map((member) => (
                              <EnhancedAvatar
                                key={member?.user_id}
                                src={member?.avatar}
                                alt={member?.name}
                                size="26"
                                className="bg-muted hover:bg-muted"
                                initialOnly
                              >
                                {member?.name}
                              </EnhancedAvatar>
                            ))}
                            {(project.members?.length || 0) > 6 && (
                              <Dropdown
                                menu={{
                                  items:
                                    project?.members?.map?.((item) => {
                                      return {
                                        key: item?.user_id,
                                        icon: (
                                          <EnhancedAvatar
                                            src={item?.avatar}
                                            alt={item?.name}
                                            size="26"
                                            initialOnly
                                          >
                                            {item?.name}
                                          </EnhancedAvatar>
                                        ),
                                        label: item?.name,
                                      };
                                    }) || [],
                                }}
                                placement="bottomLeft"
                                overlayClassName="min-w-20"
                                cursorPointer={false}
                              >
                                <Button
                                  shape="circle"
                                  className="w-[26px] h-[26px] shadow-none bg-muted text-muted-foreground/70"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </Dropdown>
                            )}
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pb-0">
                        <div className="h-[52px] w-full flex items-center border-t border-border">
                          <BoxFilledIcon
                            width={14}
                            height={14}
                            className="mr-1"
                          />

                          <div className="text-xs flex items-center">
                            <div className="text-primary">
                              {t('projects.appsCount', {
                                count: project.app_count ?? 0,
                              })}
                            </div>
                            <div className="text-primary mx-0.5">/</div>
                            <div className="text-muted-foreground">
                              {t('projects.publishedCount', {
                                count: project.published_app_count ?? 0,
                              })}
                            </div>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  ),
                )}
              </div>
            ) : (
              <Empty
                classNames={{
                  root: '-translate-y-[92px]',
                }}
                image={
                  <div className="flex items-center justify-center w-12 h-12 mb-2 bg-muted rounded-xl">
                    <PackageOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                }
                title={t('projects.empty.title')}
                description={t('projects.empty.desc')}
                footer={
                  <Button
                    onClick={() => handleProjectForm()}
                    type="text"
                    className="text-primary border border-primary hover:text-primary/70 hover:border-primary/70"
                  >
                    <CirclePlus />
                    {t('projects.addProject')}
                  </Button>
                }
              />
            )}
          </>
        }
      </div>
    </div>
  );
};
