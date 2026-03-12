import React, { useState, useEffect, memo } from 'react';
import { CirclePlus, MoreHorizontal, Package } from 'lucide-react';
import { openCreateMcpDialog } from './CreateMcpDialog.tsx';
import {
  EnhancedInput as Input,
  EnhancedAvatar as Avatar,
  EnhancedButton as Button,
  EnhancedTooltip,
  openModalError,
  EnhancedSelect as Select,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dropdown,
  Empty,
  message,
} from '@teamhelper/ui';
import { MCPServerCardSkeleton } from './Skeleton';
import { useManageDetailLayoutControlStore } from '@/pages/ManageDetail/store';
import {
  getMcpListApi,
  delMcpListApi,
  type McpListDto,
  type McpListParams,
} from './server';
import { useDebounceEffect } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { getUserListApi } from '@/common/server.ts';
import { useParams } from 'react-router';

export const MCPServer = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { setPageFlag } = useManageDetailLayoutControlStore();
  const [loading, setLoading] = useState(true);
  const [mcpServices, setMcpServices] = useState<McpListDto[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const { t } = useTranslation('manageDetail');
  const { project_id } = useParams<{ project_id: string }>();
  // 获取MCP服务列表
  const fetchMcpList = async () => {
    try {
      setLoading(true);
      const params: McpListParams = {
        name: searchQuery || undefined,
        project_id: Number(project_id),
      };
      if (selectedFilter !== 'all') {
        params.user_id = Number(selectedFilter);
      }
      const response = await getMcpListApi(params);
      setMcpServices(response.data);
    } catch (error) {
      console.error(t('mcpService.fetch.error'), error);
    } finally {
      setLoading(false);
    }
  };

  useDebounceEffect(
    () => {
      fetchMcpList();
    },
    [searchQuery, selectedFilter, project_id],
    { wait: 300 },
  );

  useEffect(() => {
    const fetchUserListInfo = async () => {
      try {
        const res = await getUserListApi({});
        const data = res.data.map((u) => ({
          label: u.user_name,
          value: String(u.user_id),
        }));
        data.unshift({
          label: t('mcpService.filter.allPersonnel'),
          value: 'all',
        });
        setUserList(data);
      } catch (e) {
        console.log(e);
      }
    };
    fetchUserListInfo();
  }, []);
  return (
    <div className="flex flex-col h-full">
      {/* 头部操作区 - 固定 */}
      <div className="shrink-0 p-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select
              options={userList}
              value={selectedFilter}
              onChange={(value) => setSelectedFilter(value ?? 'all')}
              placeholder={t('mcpService.filter.placeholder')}
              className="w-50"
              searchable={false}
              allowClear={false}
              contentWidth={136}
              showCheck={false}
            />
            <Input.Search
              placeholder={t('mcpService.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </div>

          <Button
            onClick={async () => {
              const bool = await openCreateMcpDialog({
                project_id: Number(project_id),
              });
              if (bool) await fetchMcpList();
            }}
            type="primary"
          >
            <CirclePlus />
            {t('mcpService.actions.addMcp')}
          </Button>
        </div>
      </div>

      {/* MCP服务卡片网格 - 可滚动区域 */}
      <div className="flex-1 overflow-auto p-5 pt-0">
        {loading ? (
          <MCPServerCardSkeleton />
        ) : mcpServices.length === 0 ? (
          <Empty description={t('common.nodata')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {mcpServices.map((service, i) => {
              return (
                <Card
                  key={service.id}
                  className="relative hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setPageFlag('detail', {
                      id: service.id,
                    });
                  }}
                >
                  <CardHeader className="pb-3 space-y-0">
                    <div className="flex items-start justify-between">
                      <Avatar
                        src={service.icon_url}
                        icon={
                          !service.icon_url ? (
                            <Package className="h-5 w-5 text-primary" />
                          ) : undefined
                        }
                        autoColor={false}
                        className="bg-primary/10 h-10 w-10 rounded-[8px]"
                        shape="square"
                      />

                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'edit',
                              label: t('mcpService.dropdown.edit'),
                              cursorPointer: true,
                            },
                            {
                              key: 'delete',
                              label: t('mcpService.dropdown.delete'),
                              danger: true,
                              cursorPointer: true,
                            },
                          ],
                          async onClick({ key }) {
                            switch (key) {
                              case 'edit':
                                const bool = await openCreateMcpDialog({
                                  id: service.id as number,
                                  project_id: Number(project_id),
                                });
                                if (bool) fetchMcpList();
                                return;
                              case 'delete':
                                openModalError({
                                  title: t('mcpService.delete.title'),
                                  content: t('mcpService.delete.content', {
                                    name: service.name,
                                  }),
                                  onOkBeforeFunction: async () => {
                                    const statusData = await delMcpListApi(
                                      service.id as number,
                                    );
                                    await fetchMcpList();
                                    message.success(t('toast.delete.success'));
                                    return !!statusData.data;
                                  },
                                });
                                return;
                            }
                          },
                        }}
                        placement="bottomRight"
                        overlayClassName="min-w-20"
                      >
                        <Button className="rounded-full w-8 h-[18px] flex items-center justify-center bg-muted hover:bg-muted-foreground/10">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </Dropdown>
                    </div>
                    <CardTitle className="text-lg font-semibold mt-3">
                      {service.name || t('mcpService.card.unnamed')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <EnhancedTooltip
                      title={service?.description}
                      overlayClassName="max-w-[280px]"
                    >
                      <CardDescription className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-8 break-all">
                        {service.description ||
                          t('mcpService.card.noDescription')}
                      </CardDescription>
                    </EnhancedTooltip>
                    <div className="flex items-center justify-between border-t border-border py-3.5 gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Avatar
                          size="26"
                          initialOnly
                          src={service.user_icon_url}
                          className="shrink-0"
                        >
                          {service?.created_name}
                        </Avatar>

                        <div className="text-sm font-medium text-foreground truncate">
                          {service.created_name ||
                            t('mcpService.card.unknownUser')}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground shrink-0">
                        {service.created_time
                          ? format(service.created_time, 'yyyy-MM-dd')
                          : ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
export default MCPServer;
