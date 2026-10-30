// Keeps the table markup pandas produces and drops everything else. Text stays text, so
// a learner's data cannot inject markup or script into the notebook output.
const ALLOWED = new Set(['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption']);

export function sanitizeTableHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const visit = (parent: Element): void => {
    for (const child of Array.from(parent.children)) {
      if (!ALLOWED.has(child.tagName.toLowerCase())) {
        child.replaceWith(document.createTextNode(child.textContent ?? ''));
        continue;
      }
      for (const attribute of Array.from(child.attributes)) {
        if (attribute.name !== 'class') child.removeAttribute(attribute.name);
      }
      visit(child);
    }
  };
  visit(document.body);
  return document.body.innerHTML;
}
