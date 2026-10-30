import type { GradeResult } from '../engine/types';

interface FeedbackProps {
  result: GradeResult | null;
  notice: string | null;
  mode: 'run' | 'submit' | null;
}

export function Feedback({ result, notice, mode }: FeedbackProps) {
  if (result === null && notice === null) return null;
  const headline =
    result === null
      ? null
      : result.status === 'error'
        ? 'Your code could not be graded yet.'
        : result.status === 'pass'
          ? mode === 'submit'
            ? 'Submitted. Every check passed.'
            : 'The visible checks passed. Submit to run the hidden checks.'
          : `${result.passed} of ${result.total} checks passed.`;
  return (
    <section aria-labelledby="feedback-heading" className="space-y-3">
      <h2 id="feedback-heading" className="text-lg font-semibold">
        Feedback
      </h2>
      {notice !== null && (
        <p role="status" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          {notice}
        </p>
      )}
      {result !== null && headline !== null && (
        <div className="space-y-3">
          <p role="status" className={result.status === 'pass' ? 'font-medium text-emerald-800' : 'font-medium text-slate-900'}>
            {headline}
          </p>
          {result.error !== null && (
            <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-900">
              {result.error.type}
              {result.error.line !== null ? ` on line ${result.error.line}` : ''}: {result.error.message}
            </p>
          )}
          {result.cases.length > 0 && (
            <ul className="space-y-2">
              {result.cases.map((item) => (
                <li key={item.id} className="rounded-md border border-slate-200 bg-white p-3">
                  <span className="font-medium">
                    <span aria-hidden="true" className={item.ok ? 'text-emerald-700' : 'text-rose-700'}>
                      {item.ok ? '✓ ' : '✗ '}
                    </span>
                    <span className="sr-only">{item.ok ? 'Passed: ' : 'Failed: '}</span>
                    {item.label}
                  </span>
                  {item.visibility === 'hidden' && <span className="ml-2 text-xs text-slate-500">(hidden check)</span>}
                  {item.message !== '' && <span className="mt-1 block text-sm text-slate-700">{item.message}</span>}
                </li>
              ))}
            </ul>
          )}
          {result.matched.map((mistake) => (
            <aside key={mistake.variantId} aria-label="A likely mistake" className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
              <p className="font-semibold text-indigo-900">Likely mistake: {mistake.title}</p>
              <p className="mt-1 text-sm text-indigo-950">{mistake.explanation}</p>
              <p className="mt-1 text-xs text-indigo-800">Mistake type: {mistake.tag}</p>
            </aside>
          ))}
        </div>
      )}
    </section>
  );
}
