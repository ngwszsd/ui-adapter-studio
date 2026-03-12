import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Context类型定义（精简后）
interface ManageContextType {}

// 创建Context
const ManageContext = createContext<ManageContextType | undefined>(undefined);

// Provider组件
export const ManageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 精简后的 Provider，不再承载创建项目弹窗相关状态与方法
  const contextValue: ManageContextType = {};

  return (
    <ManageContext.Provider value={contextValue}>
      {children}
    </ManageContext.Provider>
  );
};

// Hook for using context
export const useManageContext = () => {
  const context = useContext(ManageContext);
  if (context === undefined) {
    throw new Error('useManageContext must be used within a ManageProvider');
  }
  return context;
};
