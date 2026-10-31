import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkEntries, containsQuote, decodeEntities, fetchWithRetry, validateClaims, validateEntries, visibleText } from './quotes.mjs';

const PAGE = `<html><head><style>p { color: red }</style><script>var x = "not visible";</script></head>
<body><h1>Functions</h1><p>Use <code>len()</code> to count &amp; compare items.</p>
<p>The <em>default</em>   values are\nkept.</p></body></html>`;

test('visible text drops scripts and styles and decodes entities', () => {
  const text = visibleText(PAGE);
  assert.ok(text.includes('Use len() to count & compare items.'));
  assert.ok(!text.includes('not visible'));
  assert.ok(!text.includes('color: red'));
});

test('a quote matches across tags and collapsed whitespace', () => {
  assert.equal(containsQuote(PAGE, 'The default values are kept.'), true);
  assert.equal(containsQuote(PAGE, 'Use len() to count & compare items.'), true);
});

test('a changed word fails the verbatim check', () => {
  assert.equal(containsQuote(PAGE, 'The default values are removed.'), false);
});

test('entities decode, and bad code points are left alone', () => {
  assert.equal(decodeEntities('a&lt;b &#65; &#x42; &#x110000;'), 'a<b A B &#x110000;');
});

test('network errors are retried, then succeed', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls < 3) throw new Error('socket hang up');
    return { ok: true, status: 200, text: async () => 'hello' };
  };
  const sleeps = [];
  const result = await fetchWithRetry('https://example.org/', { fetchImpl, delays: [1, 2, 3], sleep: async (ms) => sleeps.push(ms) });
  assert.deepEqual(result, { kind: 'ok', text: 'hello' });
  assert.equal(calls, 3);
  assert.deepEqual(sleeps, [1, 2]);
});

test('exhausted network retries become a warning, not a failure', async () => {
  const fetchImpl = async () => {
    throw new Error('ENOTFOUND');
  };
  const results = await checkEntries(
    [{ id: 'q1', url: 'https://example.org/', quote: 'x' }],
    { fetchImpl, delays: [1, 1, 1], sleep: async () => undefined },
  );
  assert.equal(results[0].status, 'warning');
});

test('a 404 is a failure, because the page is missing', async () => {
  const fetchImpl = async () => ({ ok: false, status: 404, text: async () => '' });
  const results = await checkEntries([{ id: 'q2', url: 'https://example.org/gone', quote: 'x' }], { fetchImpl, delays: [1], sleep: async () => undefined });
  assert.equal(results[0].status, 'fail');
});

test('a quote that is no longer on the page fails', async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, text: async () => PAGE });
  const results = await checkEntries(
    [
      { id: 'good', url: 'https://example.org/', quote: 'The default values are kept.' },
      { id: 'stale', url: 'https://example.org/', quote: 'The default values were removed.' },
    ],
    { fetchImpl, delays: [1], sleep: async () => undefined },
  );
  assert.deepEqual(results.map((result) => result.status), ['ok', 'fail']);
});

test('entries are validated', () => {
  assert.deepEqual(validateEntries([]), []);
  const problems = validateEntries([{ id: 'a', url: 'http://insecure', quote: '' }, { id: 'a', url: 'https://ok', quote: 'q' }]);
  assert.ok(problems.some((problem) => problem.includes('https')));
  assert.ok(problems.some((problem) => problem.includes('quote is required')));
  assert.ok(problems.some((problem) => problem.includes('duplicate id')));
});

const QUOTES = [{ id: 'py-division', source: 'Python tutorial', url: 'https://docs.python.org/3/tutorial/introduction.html', quote: 'Division ( / ) always returns a float.' }];

function lesson(sections, jsNotes = []) {
  return { lesson: 'c01-foundations/types', sections, jsNotes };
}

test('a clean claims file has no problems', () => {
  const claims = [lesson([{ id: 'types-division', docClaim: true, quotes: ['py-division'] }], [{ id: 'js-division', quotes: ['py-division'] }])];
  assert.deepEqual(validateClaims(claims, QUOTES), []);
});

test('an empty quote file fails when lessons exist', () => {
  const problems = validateClaims([lesson([{ id: 'types-division', docClaim: false, quotes: [] }])], []);
  assert.ok(problems.some((problem) => problem.includes('docs/quotes.json is empty')));
});

test('a doc-dependent section without a quote fails, and a section without a doc claim may have none', () => {
  const failing = validateClaims([lesson([{ id: 'types-division', docClaim: true, quotes: [] }])], QUOTES);
  assert.ok(failing.some((problem) => problem.includes('has no quote')));
  assert.deepEqual(validateClaims([lesson([{ id: 'types-conversions', docClaim: false, quotes: [] }])], QUOTES), []);
});

test('a JavaScript note without a quote fails', () => {
  const problems = validateClaims([lesson([], [{ id: 'js-truthiness', quotes: [] }])], QUOTES);
  assert.ok(problems.some((problem) => problem.includes('JavaScript note has no quote')));
});

test('a cited quote id that is not in the quote file fails', () => {
  const problems = validateClaims([lesson([{ id: 'types-division', docClaim: true, quotes: ['py-missing'] }])], QUOTES);
  assert.ok(problems.some((problem) => problem.includes('py-missing is not in docs/quotes.json')));
});
