// Hash routes. The tickets view stays at the root, and the chapter pages use #/chapter, #/lesson,
// #/choice, #/ticket, and #/boss. Ids can contain slashes (lesson ids do), so the id is the rest.
import { useEffect, useState } from 'react';

export type Route =
  | { kind: 'tickets' }
  | { kind: 'chapter'; id: string }
  | { kind: 'lesson'; id: string }
  | { kind: 'choice'; id: string }
  | { kind: 'ticket'; id: string }
  | { kind: 'boss' };

export const CHAPTER1_HREF = '#/chapter/c01-foundations';

export function parseRoute(hash: string): Route {
  const [kind = '', ...rest] = hash.replace(/^#\/?/, '').split('/');
  const id = rest.join('/');
  if (kind === 'chapter' && id !== '') return { kind: 'chapter', id };
  if (kind === 'lesson' && id !== '') return { kind: 'lesson', id };
  if (kind === 'choice' && id !== '') return { kind: 'choice', id };
  if (kind === 'ticket' && id !== '') return { kind: 'ticket', id };
  if (kind === 'boss') return { kind: 'boss' };
  return { kind: 'tickets' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
    };
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
    };
  }, []);
  return route;
}
