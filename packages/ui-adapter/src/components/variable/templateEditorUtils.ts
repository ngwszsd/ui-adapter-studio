import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  type EditorState,
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
import TemplateVariableChip from './TemplateVariableChip';
import type { VariablePickerData } from './VariablePickerPanel';

export const TEMPLATE_RE = /\{\{([^.{}]+)\.([^{}]+)\}\}/g;
export const TEMPLATE_FULL_RE = /^\{\{([^.{}]+)\.([^{}]+)\}\}$/;

const isNonEmptyText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const buildTemplateDecorations = (
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

export class TemplateChipWidget extends WidgetType {
  readonly template: string;
  readonly label: string;
  readonly icon: React.ReactNode | undefined;
  readonly variant: 'inline' | 'input';
  readonly disabled: boolean;
  readonly onClick?: (view: EditorView, from: number, template: string) => void;
  readonly from: number;
  readonly to: number;

  constructor(
    template: string,
    label: string,
    icon: React.ReactNode | undefined,
    variant: 'inline' | 'input' = 'inline',
    disabled: boolean = false,
    onClick?: (view: EditorView, from: number, template: string) => void,
    from: number = 0,
    to: number = 0
  ) {
    super();
    this.template = template;
    this.label = label;
    this.icon = icon;
    this.variant = variant;
    this.disabled = disabled;
    this.onClick = onClick;
    this.from = from;
    this.to = to;
  }

  eq(other: TemplateChipWidget) {
    return (
      other.template === this.template &&
      other.label === this.label &&
      other.variant === this.variant &&
      other.disabled === this.disabled &&
      other.onClick === this.onClick &&
      other.from === this.from &&
      other.to === this.to
    );
  }

  toDOM(view: EditorView) {
    const root = document.createElement('span') as RootMountedElement;
    root.className = 'cm-template-chip-root';
    root.dataset.variant = this.variant;
    const rr = createRoot(root);
    root.__cmReactRoot = rr;

    rr.render(
      React.createElement(TemplateVariableChip, {
        contentEditable: false,
        variant: this.variant,
        appearance: this.variant === 'input' ? 'compact' : 'default',
        template: this.template,
        icon: this.icon,
        label: this.label,
        onRemove: this.disabled
          ? undefined
          : () => {
              try {
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
              } catch (e) {
                console.error('TemplateChipWidget: Error removing chip', e);
              }
            },
        onMouseDown: (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        },
        onClick: (e: React.MouseEvent) => {
          if (this.onClick) {
            e.preventDefault();
            e.stopPropagation();
            this.onClick(view, this.from, this.template);
          }
        },
      })
    );

    return root;
  }

  destroy(dom: HTMLElement) {
    const el = dom as RootMountedElement;
    setTimeout(() => {
      if (el.__cmReactRoot) {
        el.__cmReactRoot.unmount();
        delete el.__cmReactRoot;
      }
    }, 0);
  }

  ignoreEvent() {
    return false;
  }
}

export function createTemplateExtension(
  picker: VariablePickerData | undefined,
  variant: 'inline' | 'input' = 'inline',
  onChipClick?: (view: EditorView, from: number, template: string) => void,
  disabled: boolean = false
) {
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
            variant,
            disabled,
            onChipClick,
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
            variant,
            disabled,
            onChipClick,
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

  return [
    field,
    EditorView.atomicRanges.of(
      (view: EditorView) => view.state.field(field, false) ?? Decoration.none
    ),
    keymap.of([
      {
        key: 'Backspace',
        run(view: EditorView) {
          if (disabled || view.state.readOnly) return false;
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
    ]),
  ];
}
