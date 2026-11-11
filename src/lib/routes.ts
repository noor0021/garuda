/**
 * Routes (PLAN.md C6) as data. Pure functions, so they are unit-tested without a browser.
 *   /               home
 *   /search?q=      results
 *   /w/:slug        entry (slug = the entry's first romanised spelling)
 *   /saved          saved words
 *   /letter/:letter browse one वर्णमाला letter
 *   anything else   404
 */
import { VARNAMALA } from './varnamala.ts';

export type Route =
  | { name: 'home' }
  | { name: 'search'; q: string }
  | { name: 'entry'; slug: string }
  | { name: 'saved' }
  | { name: 'letter'; letter: string }
  | { name: 'notFound'; path: string };

/** Routes that fill the list pane (everything except an entry and the 404). */
export type ListRoute = Extract<Route, { name: 'home' | 'search' | 'saved' | 'letter' }>;

const safeDecode = (part: string): string | null => {
  try {
    return decodeURIComponent(part);
  } catch {
    return null;
  }
};

export function parseRoute(pathname: string, search = ''): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { name: 'home' };
  if (path === '/saved') return { name: 'saved' };
  if (path === '/search') {
    const q = (new URLSearchParams(search).get('q') ?? '').trim();
    return q ? { name: 'search', q } : { name: 'home' };
  }
  const entry = /^\/w\/([^/]+)$/.exec(path);
  if (entry?.[1]) {
    const slug = safeDecode(entry[1]);
    if (slug && /^[a-z]+$/.test(slug)) return { name: 'entry', slug };
  }
  const letter = /^\/letter\/([^/]+)$/.exec(path);
  if (letter?.[1]) {
    const value = safeDecode(letter[1])?.normalize('NFC');
    if (value && (VARNAMALA as readonly string[]).includes(value)) return { name: 'letter', letter: value };
  }
  return { name: 'notFound', path: pathname };
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'search':
      return `/search?q=${encodeURIComponent(route.q)}`;
    case 'entry':
      return `/w/${encodeURIComponent(route.slug)}`;
    case 'saved':
      return '/saved';
    case 'letter':
      return `/letter/${encodeURIComponent(route.letter)}`;
    case 'notFound':
      return route.path;
  }
}

export const isListRoute = (route: Route): route is ListRoute =>
  route.name === 'home' || route.name === 'search' || route.name === 'saved' || route.name === 'letter';

export const SITE_NAME = 'Garuda Shabd';
