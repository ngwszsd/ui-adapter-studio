import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import './index.css';
import { cn } from '@/lib/utils';
import { useMemo, type FC } from 'react';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';

import { javascript } from '@codemirror/lang-javascript';

import { useTheme } from '@/context/themeContext';

export interface IReactCodemirrorProps extends ReactCodeMirrorProps {
  codemirrorType?: 'json' | 'javascript';
  className?: string | undefined;
}

export const ReactCodemirror: FC<IReactCodemirrorProps> = ({
  codemirrorType,
  className,
  ...props
}) => {
  const { theme } = useTheme();

  const getExtensions = useMemo(() => {
    switch (codemirrorType) {
      case 'json':
        return [json(), lintGutter(), linter(jsonParseLinter())];
      case 'javascript':
        return [javascript()];
      default:
        return [];
    }
  }, [codemirrorType]);

  return (
    <CodeMirror
      className={cn('th_ReactCodemirror text-xs h-full', className)}
      extensions={getExtensions}
      theme={theme}
      {...props}
    />
  );
};
