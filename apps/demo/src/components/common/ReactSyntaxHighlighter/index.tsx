import SyntaxHighlighter from '@/lib/syntax-highlighter';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import {
  coy,
  vscDarkPlus,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/context/themeContext';
import { useMemo } from 'react';

export interface IReactSyntaxHighlighterProps extends SyntaxHighlighterProps {
  theme?: 'dark' | 'light';
  language: 'json' | 'javascript' | 'python';
}

export const ReactSyntaxHighlighter: React.FC<IReactSyntaxHighlighterProps> = ({
  theme: propTheme,
  language,
  style,
  customStyle,
  children,
  ...props
}) => {
  const { theme: contextTheme } = useTheme();

  const themeInfo = useMemo(() => {
    const activeTheme = propTheme || contextTheme;
    return activeTheme === 'dark' ? vscDarkPlus : coy;
  }, [propTheme, contextTheme]);

  console.log(1111111111, themeInfo);
  return (
    <SyntaxHighlighter
      language={language}
      style={{
        ...themeInfo,
        ...style,
      }}
      customStyle={{
        margin: 0,
        padding: '8px 0',
        fontSize: 12,
        background: 'transparent',
        height: '100%',
        ...customStyle,
      }}
      showLineNumbers={true}
      {...props}
    >
      {children}
    </SyntaxHighlighter>
  );
};
