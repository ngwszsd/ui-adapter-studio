import React, { memo } from 'react';
import { useManageDetailContext } from '../context/ManageDetailContext.tsx';
import { AppManagement } from '../MenuPage/AppManagement';
import { GlobalWorkflow } from '../MenuPage/GlobalWorkflow';
import { Knowledge } from '../MenuPage/Knowledge';
import { LaunchDesign } from '../MenuPage/LaunchDesign';
import { AppsPermissions } from '../MenuPage/AppsPermissions';
import { AppTest } from '../MenuPage/AppTest';
import { AppTestDetail } from '../MenuPage/AppTest/AppTestDetail';
import { AppTestUsers } from '../MenuPage/AppTest/AppTestUsers';
import { VersionManagement } from '../MenuPage/VersionManagement';
import { VersionManagementDetail } from '../MenuPage/VersionManagement/VersionManagementDetail';
import { AppsPermissionsDetail } from '../MenuPage/AppsPermissions/AppsPermissionsDetail';
import { OfficialUsers } from '../MenuPage/OfficialUsers';
import { DeveloperCertificate } from '../MenuPage/DeveloperCertificate';
import { ApplicationPackaging } from '../MenuPage/ApplicationPackaging';
import McpServerDetail from '../MenuPage/McpService/McpServerDetail';
import ApiService from '../MenuPage/ApiService';
import McpService from '../MenuPage/McpService';

export const ContentArea: React.FC = memo(() => {
  const { activeTab, pageFlag } = useManageDetailContext();
  console.info('ContentArea render:', activeTab, pageFlag);
  const renderContent = () => {
    switch (activeTab) {
      case 'apps-design':
        return <AppManagement />; // 应用设计
      // case 'apps-test':
      //   switch (pageFlag) {
      //     case 'detail':
      //       return <AppTestDetail />; // 应用测试详情
      //     case 'users':
      //       return <AppTestUsers />; // 管理测试用户
      //     default:
      //       return <AppTest />; // 应用测试
      //   }
      // case 'version-management':
      //   switch (pageFlag) {
      //     case 'detail':
      //       return <VersionManagementDetail />; // 版本管理详情
      //     default:
      //       return <VersionManagement />; // 版本管理
      //   }
      // case 'official-users':
      //   switch (pageFlag) {
      //     default:
      //       return <OfficialUsers />; // 正式用户
      //   }
      case 'api-service':
        return <ApiService />; // API服务
      case 'mcp-service':
        switch (pageFlag) {
          case 'detail':
            return <McpServerDetail />; // MCP服务详情
          default:
            return <McpService />; // MCP服务
        }
      // case 'apps-permissions':
      //   switch (pageFlag) {
      //     case 'detail':
      //       return <AppsPermissionsDetail />; // 应用权限详情
      //     default:
      //       return <AppsPermissions />; // 应用权限
      //   }
      // case 'auto-design':
      //   return <LaunchDesign />; // 启动设计
      case 'workspace':
        return <GlobalWorkflow />; // 全局工作流
      case 'knowledge-base':
        return <Knowledge />; // 全局知识库
      case 'developer-certificate':
        return <DeveloperCertificate />; // 开发者证书
      case 'application-packaging':
        return <ApplicationPackaging />; // 应用打包
      default:
        return <div />;
    }
  };

  return <div className="flex-1 overflow-auto min_h-0">{renderContent()}</div>;
});
