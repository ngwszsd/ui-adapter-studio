import React, { useMemo } from 'react';
import SyntaxHighlighter from '@/lib/syntax-highlighter';
import { Copy, Check } from 'lucide-react';
import copy from 'copy-to-clipboard';
import { message } from '@teamhelper/ui';
import i18n from '@/i18n';

export const codeLight: { [key: string]: React.CSSProperties } = {
  'code[class*=language-]': {
    color: '#d4d4d4',
    textShadow: 'none',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  },
  'pre[class*=language-]': {
    color: '#d4d4d4',
    textShadow: 'none',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
    background: '#1e1e1e',
  },
  'code[class*=language-] ::selection': {
    textShadow: 'none',
    background: '#264f78',
  },
  'code[class*=language-]::selection': {
    textShadow: 'none',
    background: '#264f78',
  },
  'pre[class*=language-] ::selection': {
    textShadow: 'none',
    background: '#264f78',
  },
  'pre[class*=language-]::selection': {
    textShadow: 'none',
    background: '#264f78',
  },
  ':not(pre)>code[class*=language-]': {
    padding: '.1em .3em',
    borderRadius: '.3em',
    color: '#db4c69',
    background: '#1e1e1e',
  },
  '.namespace': {
    opacity: '0.7',
  },
  'doctype.doctype-tag': {
    color: '#569cd6',
  },
  'doctype.name': {
    color: '#9cdcfe',
  },
  comment: {
    color: '#6a9955',
  },
  prolog: {
    color: '#6a9955',
  },
  '.language-html .language-css .token.punctuation': {
    color: '#d4d4d4',
  },
  '.language-html .language-javascript .token.punctuation': {
    color: '#d4d4d4',
  },
  punctuation: {
    color: '#d4d4d4',
  },
  boolean: {
    color: '#569cd6',
  },
  constant: {
    color: '#9cdcfe',
  },
  inserted: {
    color: '#b5cea8',
  },
  number: {
    color: '#b5cea8',
  },
  property: {
    color: '#9cdcfe',
  },
  symbol: {
    color: '#b5cea8',
  },
  tag: {
    color: '#569cd6',
  },
  unit: {
    color: '#b5cea8',
  },
  'attr-name': {
    color: '#9cdcfe',
  },
  builtin: {
    color: '#ce9178',
  },
  char: {
    color: '#ce9178',
  },
  deleted: {
    color: '#ce9178',
  },
  selector: {
    color: '#d7ba7d',
  },
  string: {
    color: '#ce9178',
  },
  '.language-css .token.string.url': {
    textDecoration: 'underline',
  },
  entity: {
    color: '#569cd6',
  },
  operator: {
    color: '#d4d4d4',
  },
  'operator.arrow': {
    color: '#569cd6',
  },
  atrule: {
    color: '#ce9178',
  },
  'atrule.rule': {
    color: '#c586c0',
  },
  'atrule.url': {
    color: '#9cdcfe',
  },
  'atrule.url.function': {
    color: '#dcdcaa',
  },
  'atrule.url.punctuation': {
    color: '#d4d4d4',
  },
  keyword: {
    color: '#569cd6',
  },
  'keyword.control-flow': {
    color: '#c586c0',
  },
  'keyword.module': {
    color: '#c586c0',
  },
  function: {
    color: '#dcdcaa',
  },
  'function.maybe-class-name': {
    color: '#dcdcaa',
  },
  regex: {
    color: '#d16969',
  },
  important: {
    color: '#569cd6',
  },
  italic: {
    fontStyle: 'italic',
  },
  'class-name': {
    color: '#4ec9b0',
  },
  'maybe-class-name': {
    color: '#4ec9b0',
  },
  console: {
    color: '#9cdcfe',
  },
  parameter: {
    color: '#9cdcfe',
  },
  interpolation: {
    color: '#9cdcfe',
  },
  'punctuation.interpolation-punctuation': {
    color: '#569cd6',
  },
  'exports.maybe-class-name': {
    color: '#9cdcfe',
  },
  'imports.maybe-class-name': {
    color: '#9cdcfe',
  },
  variable: {
    color: '#9cdcfe',
  },
  escape: {
    color: '#d7ba7d',
  },
  'tag.punctuation': {
    color: 'grey',
  },
  cdata: {
    color: 'grey',
  },
  'attr-value': {
    color: '#ce9178',
  },
  'attr-value.punctuation': {
    color: '#ce9178',
  },
  'attr-value.punctuation.attr-equals': {
    color: '#d4d4d4',
  },
  namespace: {
    color: '#4ec9b0',
  },
  'code[class*=language-javascript]': {
    color: '#9cdcfe',
  },
  'code[class*=language-jsx]': {
    color: '#9cdcfe',
  },
  'code[class*=language-tsx]': {
    color: '#9cdcfe',
  },
  'code[class*=language-typescript]': {
    color: '#9cdcfe',
  },
  'pre[class*=language-javascript]': {
    color: '#9cdcfe',
  },
  'pre[class*=language-jsx]': {
    color: '#9cdcfe',
  },
  'pre[class*=language-tsx]': {
    color: '#9cdcfe',
  },
  'pre[class*=language-typescript]': {
    color: '#9cdcfe',
  },
  'code[class*=language-css]': {
    color: '#ce9178',
  },
  'pre[class*=language-css]': {
    color: '#ce9178',
  },
  'code[class*=language-html]': {
    color: '#d4d4d4',
  },
  'pre[class*=language-html]': {
    color: '#d4d4d4',
  },
  '.language-regex .token.anchor': {
    color: '#dcdcaa',
  },
  '.language-html .token.punctuation': {
    color: 'grey',
  },
  'pre[class*=language-]>code[class*=language-]': {
    position: 'relative',
    zIndex: '1',
  },
  '.line-highlight.line-highlight': {
    background: '#f7ebc6',
    boxShadow: 'inset 5px 0 0 #f7d87c',
    zIndex: '0',
  },
};

const CodeLight = ({
  children,
  className,
  codeBlock,
  match,
}: {
  children: React.ReactNode & React.ReactNode[];
  className?: string;
  codeBlock?: boolean;
  match: RegExpExecArray | null;
}) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = () => {
    copy(String(children));
    setIsCopied(true);
    message.success(i18n.t('components:markdown.copySuccess'));
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  if (codeBlock) {
    const codeBoxName = useMemo(() => {
      const input = match?.['input'] || '';
      if (!input) return match?.[1];

      const splitInput = input.split('#');
      return splitInput[1] || match?.[1];
    }, [match]);

    return (
      <div className="my-3 rounded-md overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center py-2 px-5 bg-[#485264] text-white text-sm select-none">
          <div className="flex-1">{codeBoxName}</div>
          <div
            className="flex items-center cursor-pointer gap-1"
            onClick={handleCopy}
          >
            {isCopied ? <Check size={15} /> : <Copy size={15} />}
            <div className="ml-1">{i18n.t('components:markdown.copy')}</div>
          </div>
        </div>
        <SyntaxHighlighter
          style={codeLight as any}
          language={match?.[1]}
          PreTag="pre"
        >
          {String(children).replace(/&nbsp;/g, ' ')}
        </SyntaxHighlighter>
      </div>
    );
  }

  return <code className={className}>{children}</code>;
};

export default React.memo(CodeLight);
