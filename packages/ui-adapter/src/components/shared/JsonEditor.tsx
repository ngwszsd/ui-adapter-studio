/**
 * JSON 编辑器，从 otter-flow 的 NodeJsonEditor 搬运核心功能。
 * 包含：CodeMirror 编辑器 + 模板变量装饰 + 变量选择器。
 * 去掉了 dark mode 支持（ui-adapter 当前不需要）。
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { createRoot, type Root } from 'react-dom/client';
import {
  type EditorState,
  type Extension,
  StateField,
  type Transaction,
} from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  WidgetType,
} from '@codemirror/view';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { cn } from '../../utils/cn';
import VariablePickerPanel, {
  type VariablePickerData,
} from '../variable/VariablePickerPanel';
import TemplateVariableChip from '../variable/TemplateVariableChip';

/* ------------------------------------------------------------------ */
/*  模板变量装饰                                                        */
/* ------------------------------------------------------------------ */

const TEMPLATE_RE = /\{\{([^.{}]+)\.([^{}]+)\}\}/g;
const TEMPLATE_FULL_RE = /^\{\{([^.{}]+)\.([^{}]+)\}\}$/;

const isNonEmptyText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const buildTemplateDecorations = (
  docText: string,
  picker: VariablePickerData | undefined
) => {
  const ranges: Array<{
    from: number;
    to: number;
    template: string;
    label: string;
    icon: React.ReactNode | undefined;
  }> = [];
  TEMPLATE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TEMPLATE_RE.exec(docText)) != null) {
    const template = m[0];
    const from = m.index;
    const to = m.index + template.length;
    const item = picker?.itemByTemplate?.[template];
    const label = isNonEmptyText(item?.chipLabel) ? item!.chipLabel : template;
    const icon = item?.icon;
    ranges.push({ from, to, template, label, icon });
  }
  return ranges;
};

type RootMountedElement = HTMLElement & { __cmReactRoot?: Root };

class TemplateChipWidget extends WidgetType {
  readonly template: string;
  readonly label: string;
  readonly icon: React.ReactNode | undefined;
  readonly from: number;
  readonly to: number;

  constructor(
    template: string,
    label: string,
    icon: React.ReactNode | undefined,
    from: number = 0,
    to: number = 0
  ) {
    super();
    this.template = template;
    this.label = label;
    this.icon = icon;
    this.from = from;
    this.to = to;
  }

  eq(other: TemplateChipWidget) {
    return (
      other.template === this.template &&
      other.label === this.label &&
      other.from === this.from &&
      other.to === this.to
    );
  }

  toDOM(view: EditorView) {
    const root = document.createElement('span') as RootMountedElement;
    const rr = createRoot(root);
    root.__cmReactRoot = rr;

    rr.render(
      <TemplateVariableChip
        variant="inline"
        template={this.template}
        icon={this.icon}
        label={this.label}
        onRemove={() => {
          const docLength = view.state.doc.length;
          if (docLength === 0) return;
          let from = this.from;
          let to = this.to;
          if (from < 0 || to > docLength || from >= to) return;
          if (view.state.doc.sliceString(from, to) !== this.template) {
            const docText = view.state.doc.toString();
            const start = Math.max(0, from - 50);
            const end = Math.min(docText.length, to + 50);
            const windowText = docText.slice(start, end);
            const idx = windowText.indexOf(this.template);
            if (idx < 0) return;
            from = start + idx;
            to = from + this.template.length;
            if (to > docLength) return;
          }
          view.dispatch({ changes: { from, to, insert: '' } });
          view.focus();
        }}
      />
    );

    return root;
  }

  destroy(dom: HTMLElement) {
    const el = dom as RootMountedElement;
    el.__cmReactRoot?.unmount();
    delete el.__cmReactRoot;
  }

  ignoreEvent() {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  JsonEditor 组件                                                    */
/* ------------------------------------------------------------------ */

export type JsonEditorProps = {
  value: string;
  height?: string;
  onChange: (nextText: string) => void;
  onFormat?: () => void;
  formatText?: React.ReactNode;
  errorText?: React.ReactNode;
  className?: string;
  picker?: VariablePickerData;
  insertText?: React.ReactNode;
  readOnly?: boolean;
};

const JsonEditor = ({
  value,
  height = '100px',
  onChange,
  onFormat,
  formatText,
  errorText,
  className,
  picker,
  insertText,
  readOnly,
}: JsonEditorProps) => {
  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const insertBtnRef = useRef<HTMLButtonElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string>(
    () => picker?.groups[0]?.id ?? 'globals'
  );

  useEffect(() => {
    if (!pickerOpen) return;
    if (!picker?.groups?.length) return;
    if (picker.groups.some((g) => g.id === activeGroupId)) return;
    setActiveGroupId(picker.groups[0]?.id ?? 'globals');
  }, [activeGroupId, picker?.groups, pickerOpen]);

  const pickerFloating = useFloating({
    open: pickerOpen,
    onOpenChange: setPickerOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [
      floatingOffset(6),
      flip({ padding: 6 }),
      shift({ padding: 6 }),
    ],
  });
  const pickerRole = useRole(pickerFloating.context, { role: 'dialog' });
  const pickerDismiss = useDismiss(pickerFloating.context);
  const pickerInteractions = useInteractions([pickerRole, pickerDismiss]);

  const insertAtCursor = useCallback(
    (template: string) => {
      const view = editorRef.current?.view;
      if (!view) {
        onChange(`${value ?? ''}${template}`);
        return;
      }
      const sel = view.state.selection.main;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: template },
        selection: { anchor: sel.from + template.length },
      });
      view.focus();
    },
    [onChange, value]
  );

  const editorExtensions = React.useMemo<Extension[]>(() => {
    const base: Extension[] = [
      json(),
      EditorView.theme({
        '.cm-content': { cursor: 'text' },
        '.cm-scroller': { cursor: 'text' },
        '.cm-content, .cm-gutter, .cm-gutters': {
          fontSize: '12px',
          lineHeight: '1.55',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent',
        },
      }),
    ];
    if (!picker) return base;

    const field = StateField.define<DecorationSet>({
      create(state: EditorState) {
        const docText = state.doc.toString();
        const templates = buildTemplateDecorations(docText, picker);
        const decos = templates.map((t) =>
          Decoration.replace({
            widget: new TemplateChipWidget(
              t.template,
              t.label,
              t.icon,
              t.from,
              t.to
            ),
            inclusive: false,
          }).range(t.from, t.to)
        );
        return Decoration.set(decos, true);
      },
      update(decos: DecorationSet, tr: Transaction) {
        if (!tr.docChanged) return decos;
        const docText = tr.state.doc.toString();
        const templates = buildTemplateDecorations(docText, picker);
        const next = templates.map((t) =>
          Decoration.replace({
            widget: new TemplateChipWidget(
              t.template,
              t.label,
              t.icon,
              t.from,
              t.to
            ),
            inclusive: false,
          }).range(t.from, t.to)
        );
        return Decoration.set(next, true);
      },
      provide: (f: StateField<DecorationSet>) => EditorView.decorations.from(f),
    });

    base.push(field);
    base.push(
      EditorView.atomicRanges.of(
        (view: EditorView) => view.state.field(field, false) ?? Decoration.none
      )
    );
    base.push(
      keymap.of([
        {
          key: 'Backspace',
          run(view: EditorView) {
            const sel = view.state.selection.main;
            if (!sel.empty) return false;
            if (sel.from <= 0) return false;
            const prev = sel.from - 1;
            const prevChar = view.state.doc.sliceString(prev, sel.from);
            if (prevChar !== '}') return false;
            const left = Math.max(0, sel.from - 200);
            const windowText = view.state.doc.sliceString(left, sel.from);
            const idx = windowText.lastIndexOf('{{');
            if (idx < 0) return false;
            const from = left + idx;
            const candidate = view.state.doc.sliceString(from, sel.from);
            if (!TEMPLATE_FULL_RE.test(candidate)) return false;
            view.dispatch({ changes: { from, to: sel.from, insert: '' } });
            return true;
          },
        },
      ])
    );

    return base;
  }, [picker]);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="relative border border-slate-200 rounded-md overflow-hidden bg-white text-left cursor-text focus-within:border-primary">
        {(picker != null || (onFormat && formatText != null)) && (
          <div className="absolute right-1 top-1 z-10 flex items-center gap-1">
            {picker != null && (
              <button
                ref={insertBtnRef}
                type="button"
                onClick={() => {
                  if (pickerOpen) {
                    setPickerOpen(false);
                    return;
                  }
                  const el = insertBtnRef.current;
                  if (el) pickerFloating.refs.setReference(el);
                  requestAnimationFrame(() => {
                    setPickerOpen(true);
                  });
                }}
                className="px-2 py-1 text-[10px] font-semibold text-gray-600 bg-white/95 border border-gray-200 rounded-md hover:bg-white hover:border-gray-300 transition-all shadow-sm"
              >
                {insertText ?? '插入变量'}
              </button>
            )}
            {onFormat && formatText != null && (
              <button
                type="button"
                onClick={onFormat}
                className="px-2 py-1 text-[10px] font-semibold text-gray-600 bg-white/95 border border-gray-200 rounded-md hover:bg-white hover:border-gray-300 transition-all shadow-sm"
              >
                {formatText}
              </button>
            )}
          </div>
        )}
        <CodeMirror
          ref={editorRef}
          className="text-left cursor-text"
          value={value}
          height={height}
          extensions={editorExtensions}
          readOnly={readOnly}
          editable={!readOnly}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: false,
          }}
          onChange={(nextText: string) => onChange(nextText)}
        />
      </div>
      {errorText ? (
        <div className="text-[10px] text-destructive">{errorText}</div>
      ) : null}

      {picker != null && (
        <VariablePickerPanel
          open={pickerOpen}
          refs={pickerFloating.refs}
          floatingStyles={pickerFloating.floatingStyles}
          getFloatingProps={pickerInteractions.getFloatingProps}
          groups={picker.groups}
          activeGroupId={activeGroupId}
          onActiveGroupIdChange={setActiveGroupId}
          onPick={(template) => {
            setPickerOpen(false);
            insertAtCursor(template);
          }}
          x={pickerFloating.x}
          y={pickerFloating.y}
        />
      )}
    </div>
  );
};

export default React.memo(JsonEditor);
