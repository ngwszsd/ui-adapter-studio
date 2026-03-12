/**
 * Multi-line template textarea with variable chip support.
 * Adapted from otter-flow's TemplateMultilineInput for the property panel context.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { FaExpandAlt } from 'react-icons/fa';
import VariablePickerPanel, { type VariablePickerData } from './VariablePickerPanel';
import TemplateEditorDialog from './TemplateEditorDialog';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view';
import { createTemplateExtension } from './templateEditorUtils';
import { type Extension } from '@codemirror/state';
import { cn } from '../../utils/cn';

export type TemplateTextareaProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  picker: VariablePickerData;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
  rows?: number;
  /** Extra className for VariablePickerPanel (e.g. z-index override inside modals) */
  pickerPanelClassName?: string;
  /** 控制变量面板挂载位置：设计器根节点 / body / 当前 DOM 内联 */
  pickerPortalTarget?: 'designer' | 'body' | 'inline';
};

/**
 * Pure multi-line editor without expand button.
 * Used directly inside expand dialogs to avoid nested expand buttons.
 */
export const TemplateTextareaInner = React.memo(
  ({
    value,
    onChange,
    placeholder,
    picker,
    disabled,
    className,
    minHeight,
    rows = 2,
    pickerPanelClassName,
    pickerPortalTarget = 'designer',
  }: TemplateTextareaProps) => {
    const editorRef = useRef<ReactCodeMirrorRef | null>(null);
    const editingRangeRef = useRef<{ from: number; to: number } | null>(null);
    const pickerAnchorRef = useRef<{ from: number } | 'selection' | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<string>(
      () => picker.groups[0]?.id ?? 'globals'
    );

    const handleContainerMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        const target = e.target as Node | null;
        if (!target) return;
        const view = editorRef.current?.view;
        const editorDom = view?.dom;
        if (editorDom && editorDom.contains(target)) return;

        if (view && target === e.currentTarget) {
          requestAnimationFrame(() => view.focus());
        }
      },
      [disabled]
    );

    useEffect(() => {
      if (!pickerOpen) return;
      if (picker.groups.some((g) => g.id === activeGroupId)) return;
      setActiveGroupId(picker.groups[0]?.id ?? 'globals');
    }, [activeGroupId, picker.groups, pickerOpen]);

    const floating = useFloating({
      open: pickerOpen,
      onOpenChange: setPickerOpen,
      placement: 'bottom-start',
      strategy: 'fixed',
      whileElementsMounted: autoUpdate,
      middleware: [
        floatingOffset(6),
        flip({ padding: 5 }),
        shift({ padding: 5 }),
      ],
    });
    const floatingRole = useRole(floating.context, { role: 'dialog' });
    const floatingDismiss = useDismiss(floating.context, {
      outsidePress: (event) => {
        const path =
          typeof event.composedPath === 'function' ? event.composedPath() : [];
        const clickedInsidePicker = path.some(
          (item) =>
            item instanceof HTMLElement &&
            item.dataset.variablePickerPanel === 'true'
        );
        return !clickedInsidePicker;
      },
    });
    const interactions = useInteractions([floatingRole, floatingDismiss]);

    const insertAtCursor = useCallback(
      (template: string) => {
        const view = editorRef.current?.view;
        if (!view) {
          onChange(`${value ?? ''}${template}`);
          return;
        }
        const sel = editingRangeRef.current || view.state.selection.main;
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: template },
          selection: { anchor: sel.from + template.length },
        });
        view.focus();
        editingRangeRef.current = null;
        pickerAnchorRef.current = null;
      },
      [onChange, value]
    );

    const openPickerAtCursor = useCallback(
      (
        _rect?: { left: number; bottom: number },
        range?: { from: number; to: number }
      ) => {
        if (disabled) return;
        const view = editorRef.current?.view;
        if (!view) return;

        const currentSelection = view.state.selection.main;
        editingRangeRef.current = range ?? {
          from: currentSelection.from,
          to: currentSelection.to,
        };
        pickerAnchorRef.current = range ? { from: range.from } : 'selection';

        const virtualRect = {
          getBoundingClientRect: () => {
            const currentView = editorRef.current?.view;
            if (!currentView) {
              return new DOMRect(0, 0, 0, 0);
            }

            const anchor = pickerAnchorRef.current;
            const anchorPos =
              anchor && anchor !== 'selection'
                ? Math.min(anchor.from, currentView.state.doc.length)
                : currentView.state.selection.main.head;
            const liveRect = currentView.coordsAtPos(anchorPos);
            if (liveRect) {
              return new DOMRect(liveRect.left, liveRect.bottom, 0, 0);
            }

            const domRect = currentView.dom.getBoundingClientRect();
            return new DOMRect(domRect.left, domRect.bottom, 0, 0);
          },
          contextElement: view.dom,
        };

        floating.refs.setReference(virtualRect);
        requestAnimationFrame(() => setPickerOpen(true));
      },
      [disabled, floating.refs]
    );

    const handleChipClick = useCallback(
      (view: EditorView, from: number, template: string) => {
        const rect = view.coordsAtPos(from);
        if (rect) {
          openPickerAtCursor(rect, { from, to: from + template.length });
        }
      },
      [openPickerAtCursor]
    );

    const extensions = useMemo<Extension[]>(() => {
      const exts: Extension[] = [
        createTemplateExtension(picker, 'inline', handleChipClick, disabled),
        EditorView.theme({
          '&': { backgroundColor: 'transparent !important' },
          '&.cm-focused': { outline: 'none !important' },
          '.cm-cursor, .cm-dropCursor': {
            borderLeft: '2px solid currentColor !important',
          },
          '.cm-content': {
            minHeight: '22px',
            fontFamily: 'inherit',
            fontSize: '12px',
            lineHeight: '22px',
            cursor: 'text',
          },
          '.cm-line': {
            padding: '0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            minHeight: '22px',
          },
          '.cm-scroller': {
            fontFamily: 'inherit',
            cursor: 'text',
          },
        }),
        EditorView.lineWrapping,
        keymap.of([
          {
            key: '{',
            run: () => {
              if (disabled) return false;
              openPickerAtCursor();
              return true;
            },
          },
        ]),
      ];

      if (placeholder) {
        exts.push(placeholderExt(placeholder));
      }

      return exts;
    }, [disabled, picker, placeholder, openPickerAtCursor, handleChipClick]);

    const computedMinHeight = minHeight ?? `${Math.max(rows * 22 + 12, 56)}px`;

    return (
      <div className="relative">
        <div
          className={cn(
            'w-full max-w-full min-w-0 px-2 py-1.5 text-xs',
            'border border-slate-200 rounded-md bg-white',
            'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100',
            'transition-all resize-y overflow-auto',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-50',
            className
          )}
          style={{ minHeight: computedMinHeight }}
          onMouseDown={handleContainerMouseDown}
        >
          <CodeMirror
            ref={editorRef}
            className="w-full max-w-full min-w-0 h-full bg-transparent cursor-text"
            value={value}
            theme="light"
            extensions={extensions}
            editable={!disabled}
            readOnly={disabled}
            basicSetup={{
              lineNumbers: false,
              highlightActiveLineGutter: false,
              highlightActiveLine: false,
              foldGutter: false,
              history: true,
              drawSelection: true,
              bracketMatching: false,
              closeBrackets: false,
              autocompletion: false,
              highlightSpecialChars: false,
            }}
            onChange={onChange}
            height="auto"
          />
        </div>

        <VariablePickerPanel
          open={pickerOpen}
          refs={floating.refs}
          floatingStyles={floating.floatingStyles}
          getFloatingProps={interactions.getFloatingProps}
          groups={picker.groups}
          activeGroupId={activeGroupId}
          onActiveGroupIdChange={setActiveGroupId}
          onPick={(template) => {
            insertAtCursor(template);
            setPickerOpen(false);
          }}
          className={pickerPanelClassName}
          x={floating.x}
          y={floating.y}
          portalTarget={pickerPortalTarget}
        />
      </div>
    );
  }
);

TemplateTextareaInner.displayName = 'TemplateTextareaInner';

/**
 * Multi-line template textarea with expand dialog.
 */
const TemplateTextarea = React.memo(
  (props: TemplateTextareaProps) => {
    const { value, onChange, picker, placeholder, disabled } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogDraft, setDialogDraft] = useState(value ?? '');

    useEffect(() => {
      if (dialogOpen) return;
      setDialogDraft(value ?? '');
    }, [dialogOpen, value]);

    return (
      <>
        <div className="relative">
          <TemplateTextareaInner {...props} />
          <div className="absolute right-0 top-0 flex items-center pr-0.5 pt-0.5">
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors',
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDialogDraft(value ?? '');
                setDialogOpen(true);
              }}
            >
              <FaExpandAlt size={10} />
            </button>
          </div>
        </div>

        <TemplateEditorDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="多行编辑"
          widthClassName="w-[620px]"
          bodyClassName="py-4"
          onOk={() => {
            onChange(dialogDraft);
          }}
          onCancel={() => {}}
        >
          <TemplateTextareaInner
            value={dialogDraft}
            onChange={setDialogDraft}
            picker={picker}
            placeholder={placeholder}
            rows={10}
            disabled={disabled}
            pickerPanelClassName="z-[10010]"
            pickerPortalTarget="body"
          />
        </TemplateEditorDialog>
      </>
    );
  }
);

TemplateTextarea.displayName = 'TemplateTextarea';

export default TemplateTextarea;
