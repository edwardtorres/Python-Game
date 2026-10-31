import { useEffect, useRef } from 'react';
import { python } from '@codemirror/lang-python';
import { bracketMatching, HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { Annotation, EditorState } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
import { tags } from '@lezer/highlight';

// Marks a change that comes from the value prop. Such a change is not the learner's edit, so it
// must not call onChange: the echo could overwrite newer code that arrived in the same moment.
const FROM_PROP = Annotation.define<boolean>();

// CodeMirror's default style colours special strings and escapes (the f of an f-string) #ee4400, which
// is 3.8:1 on white. This style keeps the default colours and uses a darker orange for those tokens,
// which is 6.4:1 on white. A complete style is used, because a fallback style would be dropped once
// another highlighter is registered.
const READABLE_ORANGE = '#a83a00';
const editorHighlightStyle = HighlightStyle.define([
  { tag: tags.meta, color: '#404740' },
  { tag: tags.link, textDecoration: 'underline' },
  { tag: tags.heading, textDecoration: 'underline', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.keyword, color: '#708' },
  { tag: [tags.atom, tags.bool, tags.url, tags.contentSeparator, tags.labelName], color: '#219' },
  { tag: [tags.literal, tags.inserted], color: '#164' },
  { tag: [tags.string, tags.deleted], color: '#a11' },
  { tag: [tags.regexp, tags.escape, tags.special(tags.string)], color: READABLE_ORANGE },
  { tag: tags.definition(tags.variableName), color: '#00f' },
  { tag: tags.local(tags.variableName), color: '#30a' },
  { tag: [tags.typeName, tags.namespace], color: '#085' },
  { tag: tags.className, color: '#167' },
  { tag: [tags.special(tags.variableName), tags.macroName], color: '#256' },
  { tag: tags.definition(tags.propertyName), color: '#00c' },
  { tag: tags.comment, color: '#940' },
  { tag: tags.invalid, color: '#b00' },
]);

interface CodeEditorProps {
  // Changing the id creates a fresh editor (a new challenge or cell).
  id: string;
  value: string;
  label: string;
  onChange: (code: string) => void;
  onRun?: () => void;
}

export function CodeEditor({ id, value, label, onChange, onRun }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef({ value, label, onChange, onRun });

  useEffect(() => {
    latest.current = { value, label, onChange, onRun };
  });

  useEffect(() => {
    const parent = host.current;
    if (parent === null) return undefined;
    const instance = new EditorView({
      parent,
      state: EditorState.create({
        doc: latest.current.value,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          drawSelection(),
          history(),
          bracketMatching(),
          indentUnit.of('    '),
          EditorState.tabSize.of(4),
          syntaxHighlighting(editorHighlightStyle),
          python(),
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                latest.current.onRun?.();
                return true;
              },
            },
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.contentAttributes.of({ 'aria-label': latest.current.label, 'aria-multiline': 'true' }),
          EditorView.updateListener.of((update) => {
            const fromProp = update.transactions.some((transaction) => transaction.annotation(FROM_PROP) === true);
            if (update.docChanged && !fromProp) latest.current.onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    // CodeMirror's scroller can scroll sideways on a phone. Make it keyboard reachable.
    instance.scrollDOM.setAttribute('tabindex', '0');
    view.current = instance;
    return () => {
      instance.destroy();
      view.current = null;
    };
  }, [id]);

  useEffect(() => {
    const instance = view.current;
    if (instance === null) return;
    if (instance.state.doc.toString() !== value) {
      instance.dispatch({ changes: { from: 0, to: instance.state.doc.length, insert: value }, annotations: FROM_PROP.of(true) });
    }
  }, [value]);

  return (
    <div
      ref={host}
      data-editor={id}
      className="min-h-48 overflow-hidden rounded-lg border border-slate-300 bg-white text-left"
    />
  );
}
