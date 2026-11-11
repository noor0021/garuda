import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EntrySheet } from './components/EntrySheet.tsx';
import { EntryView } from './components/EntryView.tsx';
import { Header } from './components/Header.tsx';
import { OfflineBanner } from './components/OfflineBanner.tsx';
import { SearchBar } from './components/SearchBar.tsx';
import { Segmented } from './components/Segmented.tsx';
import { loadDictionary, slugOf, type Dictionary } from './lib/dictionary.ts';
import { useIsDesktop } from './lib/hooks.ts';
import { animateSaved, animateSheetIn, preloadMotion } from './lib/motion.ts';
import { goBackOr, navigate, useLocationState } from './lib/router.ts';
import { routeHref, SITE_NAME, type Route } from './lib/routes.ts';
import { search } from './lib/search.ts';
import type { Entry } from './lib/types.ts';
import { useRecent, useSaved } from './lib/user-data.ts';
import { Home } from './screens/Home.tsx';
import { Letter } from './screens/Letter.tsx';
import { DataError, Intro, Loading, NotFound } from './screens/Messages.tsx';
import { Results } from './screens/Results.tsx';
import { Saved } from './screens/Saved.tsx';

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; dictionary: Dictionary };

function useDictionary() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const run = useCallback((signal?: AbortSignal) => {
    loadDictionary(signal)
      .then((dictionary) => setLoad({ status: 'ready', dictionary }))
      .catch((error: unknown) => {
        if (signal?.aborted) return;
        setLoad({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error.' });
      });
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort();
  }, [run]);
  const retry = useCallback(() => {
    setLoad({ status: 'loading' });
    run();
  }, [run]);
  return { load, retry };
}

function pageTitle(route: Route, entry: Entry | undefined): string {
  if (entry) return `${entry.headword} (${entry.transliteration}) · ${SITE_NAME}`;
  switch (route.name) {
    case 'search':
      return `${route.q} · Search · ${SITE_NAME}`;
    case 'saved':
      return `Saved words · ${SITE_NAME}`;
    case 'letter':
      return `${route.letter} · Browse · ${SITE_NAME}`;
    case 'notFound':
    case 'entry':
      return `Page not found · ${SITE_NAME}`;
    case 'home':
      return `${SITE_NAME} · Hindi–English dictionary`;
  }
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export function App() {
  const { load, retry } = useDictionary();
  const dictionary = load.status === 'ready' ? load.dictionary : null;
  const { route, list: listRoute, lastSearch } = useLocationState();
  const isDesktop = useIsDesktop();
  const saved = useSaved();
  const recent = useRecent();
  const input = useRef<HTMLInputElement>(null);

  // What the user typed. The box shows it while it agrees with the URL; when the URL changes from
  // elsewhere (Back, a chip, a recent search) the URL wins. Trailing spaces survive typing.
  const [typed, setTyped] = useState(route.name === 'search' ? route.q : '');
  const listQuery = listRoute?.name === 'search' ? listRoute.q : '';
  const query = typed.trim() === listQuery ? typed : listQuery;

  // Search runs on every keystroke, synchronously: results are never behind the input.
  const results = useMemo(() => (dictionary && query.trim() ? search(dictionary.index, query) : []), [dictionary, query]);

  const entry = route.name === 'entry' ? dictionary?.bySlug.get(route.slug) : undefined;
  const missingEntry = route.name === 'entry' && dictionary !== null && !entry;
  // On desktop the right pane previews the top result while typing; Enter or a click opens it.
  const paneEntry = entry ?? (isDesktop && listRoute?.name === 'search' ? results[0]?.entry : undefined);
  const [focusEntry, setFocusEntry] = useState(false);

  // GSAP is fetched only after the words are on screen, so it never competes with first paint.
  useEffect(() => {
    if (dictionary) preloadMotion();
  }, [dictionary]);

  useEffect(() => {
    document.title = pageTitle(missingEntry ? { name: 'notFound', path: '' } : route, entry);
  }, [route, entry, missingEntry]);

  const onChange = (value: string) => {
    setTyped(value);
    setFocusEntry(false);
    const q = value.trim();
    navigate(q ? routeHref({ name: 'search', q }) : '/', { replace: route.name === 'search' });
  };

  const clear = () => {
    setTyped('');
    navigate('/', { replace: route.name === 'search' });
    input.current?.focus();
  };

  const remember = () => {
    if (listRoute?.name === 'search') recent.add(listRoute.q);
  };

  const openTop = () => {
    const top = results[0];
    if (!top) return;
    recent.add(query);
    input.current?.blur(); // closes the phone keyboard
    setFocusEntry(true);
    navigate(`/w/${slugOf(top.entry)}`);
  };

  const backTo = listRoute ? routeHref(listRoute) : '/';
  const closeEntry = useCallback(() => goBackOr(backTo), [backTo]);

  // "/" focuses the search box (desktop keyboards); Esc closes the entry pane on desktop.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isTyping(event.target) && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
      } else if (event.key === 'Escape' && isDesktop && route.name === 'entry' && !isTyping(event.target)) {
        closeEntry();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isDesktop, route.name, closeEntry]);

  const sheetOpen = !isDesktop && entry !== undefined && dictionary !== null;
  const segment = listRoute?.name === 'saved' ? 'saved' : 'search';
  const searchHref = lastSearch ?? '/';

  let list: React.ReactNode;
  if (load.status === 'error') list = <DataError message={load.message} onRetry={retry} />;
  else if (!dictionary) list = <Loading />;
  else if (route.name === 'notFound' || missingEntry || !listRoute) list = <NotFound />;
  else if (listRoute.name === 'home') list = <Home dictionary={dictionary} />;
  else if (listRoute.name === 'search')
    list = <Results query={query || listRoute.q} results={results} dictionary={dictionary} currentId={paneEntry?.id} onOpen={remember} />;
  else if (listRoute.name === 'saved') list = <Saved dictionary={dictionary} currentId={entry?.id} onOpen={() => undefined} />;
  else list = <Letter letter={listRoute.letter} dictionary={dictionary} currentId={entry?.id} onOpen={() => undefined} />;

  return (
    <>
      <div className="app">
        <OfflineBanner />
        <Header />
        <main className="layout" id="main">
          <section className="pane-list" aria-label="Search and word lists">
            <h1 className="visually-hidden">
              {listRoute?.name === 'search' ? `Results for ${listRoute.q}` : 'Garuda Shabd, Hindi–English dictionary'}
            </h1>
            <div className="search-area">
              <SearchBar ref={input} value={query} onChange={onChange} onSubmit={openTop} onClear={clear} disabled={!dictionary} />
              <Segmented active={segment} searchHref={searchHref} savedCount={saved.ids.length} />
            </div>
            <div className="list-content">{list}</div>
          </section>
          {isDesktop && (
            <section className="pane-entry" aria-label="Word">
              {dictionary && paneEntry ? (
                <EntryView
                  key={paneEntry.id}
                  entry={paneEntry}
                  dictionary={dictionary}
                  headingId="pane-headword"
                  focusHeading={focusEntry && entry !== undefined}
                  onClose={entry ? closeEntry : undefined}
                  onSaved={animateSaved}
                />
              ) : (
                <Intro count={dictionary?.ordered.length ?? 0} />
              )}
            </section>
          )}
        </main>
      </div>
      {sheetOpen && entry && dictionary && (
        <EntrySheet labelledBy="sheet-headword" onClose={closeEntry} onOpen={animateSheetIn}>
          <EntryView key={entry.id} entry={entry} dictionary={dictionary} headingId="sheet-headword" onClose={closeEntry} focusHeading onSaved={animateSaved} />
        </EntrySheet>
      )}
    </>
  );
}
