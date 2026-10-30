// Verbatim quote checking for lessons. A quote passes when its exact text appears in the
// visible text of the live page, after tags are removed, entities decoded, and
// whitespace collapsed. Network trouble is a warning. A missing page or a changed quote
// is a failure.

export const RETRY_DELAYS_MS = [2000, 4000, 8000];

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(text) {
  return text.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body) => {
    if (body.startsWith('#')) {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

// The text a reader sees: scripts and styles removed, tags replaced by spaces.
export function visibleText(html) {
  const withoutCode = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  const withoutTags = withoutCode.replace(/<[^>]+>/g, ' ');
  return decodeEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

export function normalizeQuote(quote) {
  return decodeEntities(quote).replace(/\s+/g, ' ').trim();
}

export function containsQuote(html, quote) {
  return visibleText(html).includes(normalizeQuote(quote));
}

// Fetches a page, retrying network errors and server errors. Other HTTP errors (for
// example 404) are not retried: the page is missing, which is a content problem.
export async function fetchWithRetry(url, { fetchImpl = fetch, delays = RETRY_DELAYS_MS, sleep = (ms) => new Promise((done) => setTimeout(done, ms)) } = {}) {
  let reason = 'no attempt made';
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      const response = await fetchImpl(url, { headers: { 'user-agent': 'larkspur-quote-check/1.0' }, redirect: 'follow' });
      if (response.ok) return { kind: 'ok', text: await response.text() };
      if (response.status === 404 || response.status === 410) return { kind: 'missing', reason: `HTTP ${response.status}` };
      reason = `HTTP ${response.status}`;
    } catch (error) {
      reason = error instanceof Error ? error.message : String(error);
    }
    if (attempt < delays.length) await sleep(delays[attempt]);
  }
  return { kind: 'network', reason };
}

export function validateEntries(entries) {
  const problems = [];
  if (!Array.isArray(entries)) return ['docs/quotes.json must be an array'];
  const ids = new Set();
  entries.forEach((entry, index) => {
    const where = `entry ${index}`;
    if (typeof entry.id !== 'string' || entry.id === '') problems.push(`${where}: id is required`);
    else if (ids.has(entry.id)) problems.push(`${where}: duplicate id ${entry.id}`);
    else ids.add(entry.id);
    if (typeof entry.url !== 'string' || !entry.url.startsWith('https://')) problems.push(`${where}: url must be an https address`);
    if (typeof entry.quote !== 'string' || entry.quote.trim() === '') problems.push(`${where}: quote is required`);
  });
  return problems;
}

// Checks every entry and returns one result per quote.
export async function checkEntries(entries, { fetchImpl, delays, sleep } = {}) {
  const pages = new Map();
  const results = [];
  for (const entry of entries) {
    if (!pages.has(entry.url)) pages.set(entry.url, await fetchWithRetry(entry.url, { fetchImpl, delays, sleep }));
    const page = pages.get(entry.url);
    if (page.kind === 'network') {
      results.push({ id: entry.id, status: 'warning', reason: `could not reach ${entry.url}: ${page.reason}` });
    } else if (page.kind === 'missing') {
      results.push({ id: entry.id, status: 'fail', reason: `source page is missing (${page.reason}): ${entry.url}` });
    } else if (containsQuote(page.text, entry.quote)) {
      results.push({ id: entry.id, status: 'ok', reason: '' });
    } else {
      results.push({ id: entry.id, status: 'fail', reason: `quote not found verbatim on ${entry.url}` });
    }
  }
  return results;
}
