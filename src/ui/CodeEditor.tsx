import { useEffect, useRef } from 'react';
import { python } from '@codemirror/lang-python';
import { bracketMatching, defaultHighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { Annotation, EditorState } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';

// Marks a change that comes from the value prop. Such a change is not the learner's edit, so it
// must not call onChange: the echo could overwrite newer code that arrived in the same moment.
const FROM_PROP = Annotation.define<boolean>();

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
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
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
