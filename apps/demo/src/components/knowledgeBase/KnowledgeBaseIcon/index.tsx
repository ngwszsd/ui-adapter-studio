import { cn } from '@/lib/utils';
import {
  Check,
  FileImage,
  FileText,
  FolderOpen,
  X,
  type LucideProps,
} from 'lucide-react';
import KnowledgeIcon from '@/assets/icon/knowledge_icon.svg?react';
import KnowledgeDefaultAvatar from '@/assets/icon/knowledge_default_avatar.svg?react';
import TIcon from '@/assets/icon/t.svg?react';
import KbCsvIcon from '@/assets/icon/kb_csv.svg?react';
import KbDocIcon from '@/assets/icon/kb_doc.svg?react';
import KbFileIcon from '@/assets/icon/kb_file.svg?react';
import KbHtmlIcon from '@/assets/icon/kb_html.svg?react';
import KbImageIcon from '@/assets/icon/kb_image.svg?react';
import KbMarkdownIcon from '@/assets/icon/kb_markdown.svg?react';
import KbPdfIcon from '@/assets/icon/kb_pdf.svg?react';
import KbPptIcon from '@/assets/icon/kb_ppt.svg?react';
import KbTxtIcon from '@/assets/icon/kb_txt.svg?react';
import KbXlsxIcon from '@/assets/icon/kb_xlsx.svg?react';
import ThFolderIcon from '@/assets/icon/th_folder.svg?react';

export interface IKnowledgeBaseIconProps {
  type:
    | 'folder'
    | 'text'
    | 'image'
    | 'default_knowledgeBase'
    | 'default_knowledgeBase_avatar'
    | 't'
    | 'Check'
    | 'X'
    | 'pdf'
    | 'ppt'
    | 'xlsx'
    | 'csv'
    | 'doc'
    | 'txt'
    | 'markdown'
    | 'html'
    | 'file'
    | 'kbImage';
  className?: string;
  lucideProps?: Omit<LucideProps, 'ref'>;
}

export const KnowledgeBaseIcon: React.FC<IKnowledgeBaseIconProps> = ({
  className,
  type = 'folder',
  lucideProps,
}) => {
  switch (type) {
    case 'folder':
      return (
        <ThFolderIcon
          className={cn('w-4.5 h-4.5 shrink-0', className)}
          {...lucideProps}
        />
      );
    case 'text':
      return (
        <FileText
          className={cn(
            'w-[18px] h-[18px] shrink-0 fill-green-500 text-muted',
            className,
          )}
          strokeWidth={1}
          {...lucideProps}
        />
      );
    case 'image':
      return (
        <FileImage
          className={cn(
            'w-[18px] h-[18px] shrink-0 fill-orange-400 text-muted',
            className,
          )}
          strokeWidth={1}
          {...lucideProps}
        />
      );
    case 'default_knowledgeBase':
      return (
        <KnowledgeIcon
          className={cn('w-[42px] h-[42px]', className)}
          {...lucideProps}
        />
      );
    case 'default_knowledgeBase_avatar':
      return (
        <KnowledgeDefaultAvatar
          className={cn('w-[42px] h-[42px] rounded-lg', className)}
          {...lucideProps}
        />
      );
    case 't':
      return (
        <TIcon
          className={cn('w-3.5 h-3.5 fill-foreground', className)}
          {...lucideProps}
        />
      );
    case 'Check':
      return (
        <div
          className={cn(
            'flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500',
            className,
          )}
        >
          <Check
            {...lucideProps}
            className={cn('w-2.5 h-2.5 text-white', lucideProps?.className)}
          />
        </div>
      );
    case 'X':
      return (
        <div
          className={cn(
            'flex items-center justify-center w-3.5 h-3.5 rounded-full bg-destructive',
            className,
          )}
        >
          <X
            {...lucideProps}
            className={cn('w-2.5 h-2.5 text-white', lucideProps?.className)}
          />
        </div>
      );
    case 'pdf':
      return (
        <KbPdfIcon
          className={cn('w-5 h-5 shrink-0 -ml-0.5', className)}
          {...lucideProps}
        />
      );
    case 'ppt':
      return (
        <KbPptIcon
          className={cn('w-4 h-4 shrink-0', className)}
          {...lucideProps}
        />
      );
    case 'xlsx':
      return (
        <KbXlsxIcon
          className={cn('w-4 h-4 shrink-0', className)}
          {...lucideProps}
        />
      );
    case 'csv':
      return (
        <KbCsvIcon
          className={cn('w-4 h-4 shrink-0', className)}
          {...lucideProps}
        />
      );
    case 'doc':
      return (
        <KbDocIcon
          className={cn('w-4 h-4 shrink-0', className)}
          {...lucideProps}
        />
      );
    case 'txt':
      return (
        <KbTxtIcon
          className={cn('w-4 h-4 shrink-0', className)}
          {...lucideProps}
        />
      );
    case 'kbImage':
      return (
        <KbImageIcon
          className={cn('w-5 h-5 shrink-0', className)}
          {...lucideProps}
        />
      );
    case 'markdown':
      return (
        <KbMarkdownIcon
          className={cn('w-4 h-4 shrink-0', className)}
          {...lucideProps}
        />
      );
    case 'html':
      return (
        <KbHtmlIcon
          className={cn('w-4 h-4 shrink-0', className)}
          {...lucideProps}
        />
      );
    case 'file':
      return (
        <KbFileIcon
          className={cn('w-[18px] h-[18px] shrink-0', className)}
          {...lucideProps}
        />
      );
  }
};
