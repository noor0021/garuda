/**
 * A small History API router (PLAN.md C6), no library. The URL plus history.state is the only
 * source of truth; components read it with useLocationState().
 *
 * history.state remembers two things per page, so they survive Back, Forward and reloads:
 *   from        the list (results, saved, letter, home) an entry was opened from: drawn behind
 *               the sheet on phones and in the left pane on desktop
 *   lastSearch  the latest search, so the "Search" tab returns to it from Saved
 */
import { useSyncExternalStore } from 'react';
import { isListRoute, parseRoute, type ListRoute, type Route } from './routes.ts';

type HistoryState = { inApp?: boolean; from?: string; lastSearch?: string } | null;

export type LocationState = {
  route: Route;
  /** The list behind the current page (the page itself when it is a list). */
  list: ListRoute | null;
  /** Href of the latest search, or null after returning home. */
  lastSearch: string | null;
};

const CHANGE = 'shabd:navigate';
const currentHref = () => window.location.pathname + window.location.search;
const readState = () => (window.history.state ?? null) as HistoryState;
const parseHref = (href: string): Route => {
  const url = new URL(href, window.location.origin);
  return parseRoute(url.pathname, url.search);
};

export function navigate(href: string, { replace = false } = {}): void {
  if (href === currentHref()) return;
  const here = parseRoute(window.location.pathname, window.location.search);
  const target = parseHref(href);
  const previous = readState();
  const state: HistoryState = {
    inApp: replace ? (previous?.inApp ?? false) : true,
    from: isListRoute(here) ? currentHref() : previous?.from,
    lastSearch: target.name === 'search' ? href : target.name === 'home' ? undefined : here.name === 'search' ? currentHref() : previous?.lastSearch,
  };
  if (replace) window.history.replaceState(state, '', href);
  else window.history.pushState(state, '', href);
  window.dispatchEvent(new Event(CHANGE));
}

/** Goes back if the previous page is ours (so Back and close agree); otherwise replaces the URL. */
export function goBackOr(fallback: string): void {
  if (readState()?.inApp) window.history.back();
  else navigate(fallback, { replace: true });
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(CHANGE, onChange);
  };
};

let cacheKey = '';
let cached: LocationState = { route: { name: 'home' }, list: { name: 'home' }, lastSearch: null };
const snapshot = (): LocationState => {
  const href = currentHref();
  const state = readState();
  const key = `${href}|${state?.from ?? ''}|${state?.lastSearch ?? ''}`;
  if (key !== cacheKey) {
    cacheKey = key;
    const route = parseRoute(window.location.pathname, window.location.search);
    let list: ListRoute | null = null;
    if (isListRoute(route)) list = route;
    else if (route.name === 'entry') {
      const from = state?.from ? parseHref(state.from) : null;
      list = from && isListRoute(from) ? from : { name: 'home' };
    }
    const lastSearch = route.name === 'search' ? href : route.name === 'home' ? null : (state?.lastSearch ?? null);
    cached = { route, list, lastSearch };
  }
  return cached;
};

export function useLocationState(): LocationState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Click handler for <a href>: keeps ctrl/cmd-click and middle-click working as normal links. */
export function onLinkClick(event: React.MouseEvent<HTMLAnchorElement>, options?: { replace?: boolean }): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(event.currentTarget.getAttribute('href') ?? '/', options);
}
