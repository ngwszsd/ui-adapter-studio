import React, { useMemo, Suspense } from 'react';
import ReactMarkdownLib from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { mdTextFormat } from './Markdown/utils';
import CodeLight from './Markdown/codeBlock/CodeLight';
import MdImage from './Markdown/img/Image';
import A from './Markdown/A';
import './index.css';

export interface IReactMarkdownProps {
  children: string;
  className?: string;
  isDisabled?: boolean;
  forbidZhFormat?: boolean;
}

const MarkdownRender = ({
  source = '',
  isDisabled,
  forbidZhFormat,
  className,
}: {
  source?: string;
  isDisabled?: boolean;
  forbidZhFormat?: boolean;
  className?: string;
}) => {
  const components = useMemo(() => {
    return {
      img: Image,
      pre: RewritePre,
      code: Code,
      a: (props: any) => (
        <Suspense fallback={<a {...props} />}>
          <A {...props} />
        </Suspense>
      ),
    };
  }, []);

  const formatSource = useMemo(() => {
    if (forbidZhFormat) return source;
    return mdTextFormat(source);
  }, [forbidZhFormat, source]);

  return (
    <div className={cn('relative', className)}>
      <ReactMarkdownLib
        remarkPlugins={[remarkGfm]}
        components={components as any}
      >
        {formatSource}
      </ReactMarkdownLib>
      {isDisabled && <div className="absolute inset-0" />}
    </div>
  );
};

export const ReactMarkdown: React.FC<IReactMarkdownProps> = React.memo(
  ({ children, className, isDisabled, forbidZhFormat }) => {
    if (!children) return null;
    const source = children;

    if (source.length < 200000) {
      return (
        <MarkdownRender
          className={cn('th_ReactMarkdown', className)}
          source={source}
          isDisabled={isDisabled}
          forbidZhFormat={forbidZhFormat}
        />
      );
    }

    return (
      <div className={cn('whitespace-pre-wrap th_ReactMarkdown', className)}>
        {source}
      </div>
    );
  },
);

/* Custom dom */
function Code(e: any) {
  const { className, codeBlock, children } = e;
  const match = /language-(\w+)/.exec(className || '');

  return (
    <Suspense fallback={<code className={className}>{children}</code>}>
      <CodeLight className={className} codeBlock={codeBlock} match={match}>
        {children}
      </CodeLight>
    </Suspense>
  );
}

function Image({ src }: { src?: string }) {
  return <MdImage src={src} />;
}

function RewritePre({ children }: any) {
  const modifiedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { codeBlock: true });
    }
    return child;
  });

  return <>{modifiedChildren}</>;
}
