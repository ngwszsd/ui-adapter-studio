import React, { createContext, useContext, useEffect, useState } from 'react';
import { LS_KEYS } from '@/constants';

// 主题类型定义
export type Theme = 'light' | 'dark';

// 主题上下文接口
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  themes: { value: Theme; label: string; icon: string }[];
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题配置
const themeConfig = [
  { value: 'light' as Theme, label: '亮色', icon: '☀️' },
  { value: 'dark' as Theme, label: '暗色', icon: '🌙' },
];

// 主题Provider组件
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>('light');

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem(LS_KEYS.THEME) as Theme;
    const initialTheme = savedTheme || 'light';

    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // 应用主题到DOM
  const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    // 同时设置class以支持Tailwind的dark模式
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 设置主题
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem(LS_KEYS.THEME, newTheme);
  };

  // 切换主题（在light和dark之间切换）
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    themes: themeConfig,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// 自定义Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
