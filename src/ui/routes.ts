// Hash routes. The tickets view stays at the root. Chapter pages use #/chapter/<id>, and the
// lesson, practice, ticket, and boss pages use their own ids. Ids can contain slashes (lesson ids
// do), so the id is the rest of the path.
import { useEffect, useState } from 'react';

export type Route =
  | { kind: 'tickets' }
  | { kind: 'chapter'; id: string }
  | { kind: 'lesson'; id: string }
  | { kind: 'choice'; id: string }
  | { kind: 'ticket'; id: string }
  | { kind: 'boss'; id: string };

export function chapterHref(id: string): string {
  return `#/chapter/${id}`;
}

export function bossHref(id: string): string {
  return `#/boss/${id}`;
}

export function parseRoute(hash: string): Route {
  const [kind = '', ...rest] = hash.replace(/^#\/?/, '').split('/');
  const id = rest.join('/');
  if (kind === 'chapter' && id !== '') return { kind: 'chapter', id };
  if (kind === 'lesson' && id !== '') return { kind: 'lesson', id };
  if (kind === 'choice' && id !== '') return { kind: 'choice', id };
  if (kind === 'ticket' && id !== '') return { kind: 'ticket', id };
  if (kind === 'boss' && id !== '') return { kind: 'boss', id };
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
