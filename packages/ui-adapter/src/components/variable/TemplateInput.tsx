/**
 * Single-line template input with variable chip support.
 * Adapted from otter-flow's TemplateChipsInput for the property panel context.
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
import { TemplateTextareaInner } from './TemplateTextarea';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
} from '@codemirror/view';
import { createTemplateExtension } from './templateEditorUtils';
import { type Extension } from '@codemirror/state';
import { cn } from '../../utils/cn';

export type TemplateInputProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  picker: VariablePickerData;
  disabled?: boolean;
  className?: string;
};

const TemplateInput = React.memo(
  ({ value, onChange, placeholder, picker, disabled, className }: TemplateInputProps) => {
    const editorRef = useRef<ReactCodeMirrorRef | null>(null);
    const expandButtonRef = useRef<HTMLButtonElement | null>(null);
    const editingRangeRef = useRef<{ from: number; to: number } | null>(null);
    const pickerAnchorRef = useRef<{ from: number } | 'selection' | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<string>(
      () => picker.groups[0]?.id ?? 'globals'
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogDraft, setDialogDraft] = useState(value ?? '');

    const handleContainerMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        const target = e.target as Node | null;
        if (!target) return;

        if (expandButtonRef.current?.contains(target)) return;

        const view = editorRef.current?.view;
        const editorDom = view?.dom;
        if (editorDom && editorDom.contains(target)) return;

        if (view) {
          requestAnimationFrame(() => view.focus());
        }
      },
      [disabled]
    );

    useEffect(() => {
      if (dialogOpen) return;
      setDialogDraft(value ?? '');
    }, [dialogOpen, value]);

    useEffect(() => {
      if (!pickerOpen) return;
      if (picker.groups.some((g) => g.id === activeGroupId)) return;
      setActiveGroupId(picker.groups[0]?.id ?? 'globals');
    }, [activeGroupId, pickerOpen, picker.groups]);

    const pickerFloating = useFloating({
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
    const pickerRole = useRole(pickerFloating.context, { role: 'dialog' });
    const pickerDismiss = useDismiss(pickerFloating.context, {
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
    const pickerInteractions = useInteractions([pickerRole, pickerDismiss]);

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

        pickerFloating.refs.setReference(virtualRect);
        requestAnimationFrame(() => setPickerOpen(true));
      },
      [disabled, pickerFloating.refs]
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
        createTemplateExtension(picker, 'input', handleChipClick, disabled),
        EditorView.theme({
          '&': { backgroundColor: 'transparent !important' },
          '&.cm-focused': { outline: 'none !important' },
          '.cm-cursor, .cm-dropCursor': {
            borderLeft: '2px solid currentColor !important',
          },
          '.cm-content': {
            padding: '0',
            minHeight: '20px',
            width: '100%',
            maxWidth: '100%',
            minWidth: '0',
            boxSizing: 'border-box',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            fontFamily: 'inherit',
            fontSize: '12px',
            lineHeight: '20px',
            cursor: 'text',
          },
          '.cm-template-chip-root[data-variant="input"]': {
            marginLeft: '2px',
            marginRight: '2px',
          },
          '.cm-line': {
            padding: '0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            alignContent: 'flex-start',
            minWidth: '0',
            maxWidth: '100%',
          },
          '.cm-scroller': {
            overflow: 'hidden',
            maxWidth: '100%',
            minWidth: '0',
            fontFamily: 'inherit',
            display: 'block',
            cursor: 'text',
          },
        }),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ class: 'min-w-0 max-w-full' }),
        keymap.of([
          { key: 'Enter', run: () => true },
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

    return (
      <>
        <div
          className={cn(
            'relative w-full max-w-full min-w-0 min-h-[28px] px-2 pr-7 py-1 text-xs',
            'border border-slate-200 rounded-md bg-white',
            'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100',
            'transition-all overflow-hidden flex items-start cursor-text',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-50',
            className
          )}
          onMouseDown={handleContainerMouseDown}
        >
          <CodeMirror
            ref={editorRef}
            className="flex-1 w-full max-w-full min-w-0 overflow-hidden bg-transparent cursor-text"
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
            onChange={(nextText) => onChange(nextText)}
            height="auto"
          />

          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-0.5">
            <button
              type="button"
              disabled={disabled}
              ref={expandButtonRef}
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

        <VariablePickerPanel
          open={pickerOpen}
          refs={pickerFloating.refs}
          floatingStyles={pickerFloating.floatingStyles}
          getFloatingProps={pickerInteractions.getFloatingProps}
          groups={picker.groups}
          activeGroupId={activeGroupId}
          onActiveGroupIdChange={setActiveGroupId}
          onPick={(template) => {
            insertAtCursor(template);
            setPickerOpen(false);
          }}
          x={pickerFloating.x}
          y={pickerFloating.y}
        />

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
            rows={8}
            disabled={disabled}
            pickerPanelClassName="z-[10010]"
            pickerPortalTarget="body"
          />
        </TemplateEditorDialog>
      </>
    );
  }
);

TemplateInput.displayName = 'TemplateInput';

export default TemplateInput;
