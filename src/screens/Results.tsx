import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EntryRow } from '../components/EntryRow.tsx';
import type { Dictionary } from '../lib/dictionary.ts';
import { onLinkClick } from '../lib/router.ts';
import { routeHref } from '../lib/routes.ts';
import { animateFadeIn, animateRows } from '../lib/motion.ts';
import { livePreview, suggestions, type SearchResult } from '../lib/search.ts';
import { useOnline } from '../lib/hooks.ts';
import { isDevanagari } from '../lib/indic.ts';
import type { Entry } from '../lib/types.ts';
import { lookupWiktionary, type WiktionaryResult } from '../lib/wiktionary.ts';

/** Network lookups wait until typing pauses; local search does not (it is instant). */
const WIKTIONARY_DELAY_MS = 400;

/**
 * Wiktionary lookup for a Devanagari word with no local results (PLAN.md C9). Returns null while
 * loading, offline, on any error, or when Wiktionary has no Hindi entry.
 */
function useWiktionary(query: string): { loading: boolean; result: WiktionaryResult | null } {
  const online = useOnline();
  const enabled = online && isDevanagari(query);
  const [state, setState] = useState<{ query: string; loading: boolean; result: WiktionaryResult | null }>({ query: '', loading: false, result: null });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setState({ query, loading: true, result: null });
      void lookupWiktionary(query, { signal: controller.signal, online }).then((result) => {
        if (!controller.signal.aborted) setState({ query, loading: false, result });
      });
    }, WIKTIONARY_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled, online]);

  return enabled && state.query === query ? state : { loading: false, result: null };
}

function WiktionaryFallback({ query }: { query: string }) {
  const { loading, result } = useWiktionary(query);
  if (loading) return <p className="empty-note wikt-loading">Looking it up on Wiktionary…</p>;
  if (!result) return null;
  return (
    <section className="wikt" aria-labelledby="wikt-title">
      <h3 id="wikt-title" className="wikt-label">
        Not in Garuda’s dictionary yet · from Wiktionary (
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA</a>)
      </h3>
      <p className="wikt-word" lang="hi">{result.word}</p>
      <ol className="wikt-senses">
        {result.senses.map((sense) => (
          <li key={sense.definition}>
            {sense.partOfSpeech && <span className="wikt-pos">{sense.partOfSpeech}</span>} {sense.definition}
          </li>
        ))}
      </ol>
      <a className="wikt-source" href={result.url} target="_blank" rel="noopener noreferrer">
        Read the full entry on Wiktionary <span aria-hidden="true">↗</span>
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
    </section>
  );
}

type Props = {
  query: string;
  results: SearchResult[];
  dictionary: Dictionary;
  currentId?: number;
  onOpen: (entry: Entry) => void;
};

export function Results({ query, results, dictionary, currentId, onOpen }: Props) {
  const preview = livePreview(query, results);
  const sure = results.filter((r) => r.tier < 5);
  const fuzzy = results.filter((r) => r.tier === 5);
  const q = query.trim();

  // Motion runs after React has already put the rows on screen, so it never delays them.
  // Only rows that were not showing before animate: typing "dhar" → "dharm" does not flicker.
  const container = useRef<HTMLDivElement>(null);
  // `before` is the list that was showing before this one. Re-running the effect for the same
  // list (React StrictMode does this in development) compares against the same `before`.
  const seen = useRef<{ key: string; ids: Set<number>; before: Set<number> }>({ key: '', ids: new Set(), before: new Set() });
  const idsKey = results.map((r) => r.entry.id).join(',');
  useLayoutEffect(() => {
    const ids = idsKey ? idsKey.split(',').map(Number) : [];
    if (seen.current.key !== idsKey) seen.current = { key: idsKey, ids: new Set(ids), before: seen.current.ids };
    const { before } = seen.current;
    const rows = [...(container.current?.querySelectorAll<HTMLElement>('[data-row]') ?? [])];
    const fresh = rows.filter((_, i) => !before.has(ids[i] ?? -1));
    return animateRows(container.current, fresh);
  }, [idsKey]);

  const previewRef = useRef<HTMLSpanElement>(null);
  const previewKey = preview?.headword ?? '';
  useLayoutEffect(() => (previewKey ? animateFadeIn(previewRef.current) : undefined), [previewKey]);

  return (
    <div className="results" ref={container}>
      {results.length > 0 && (
        <p className="preview" data-preview>
          {preview && (
            <span ref={previewRef}>
              <span>{preview.query}</span> <span aria-hidden="true">→</span> <span lang="hi">{preview.headword}</span>
            </span>
          )}
        </p>
      )}
      <p className="visually-hidden" role="status">
        {results.length === 0 ? `No results for ${q}` : `${results.length} result${results.length === 1 ? '' : 's'}`}
      </p>

      {results.length === 0 ? (
        <NoResults query={q} dictionary={dictionary} onOpen={onOpen} />
      ) : (
        <>
          {sure.length > 0 && (
            <ul className="rows" aria-label={`Results for ${q}`}>
              {sure.map((r) => (
                <EntryRow key={r.entry.id} entry={r.entry} chip={r.reason} current={r.entry.id === currentId} onOpen={() => onOpen(r.entry)} />
              ))}
            </ul>
          )}
          {fuzzy.length > 0 && (
            <>
              <h2 className={`divider${sure.length === 0 ? ' divider-first' : ''}`}>Did you mean</h2>
              <ul className="rows" aria-label="Close matches">
                {fuzzy.map((r) => (
                  <EntryRow key={r.entry.id} entry={r.entry} chip={r.reason} current={r.entry.id === currentId} onOpen={() => onOpen(r.entry)} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

function NoResults({ query, dictionary, onOpen }: { query: string; dictionary: Dictionary; onOpen: (entry: Entry) => void }) {
  const close = suggestions(dictionary.index, query);
  return (
    <div className="empty">
      <p className="empty-hi" lang="hi">हमें ‘{query}’ नहीं मिला</p>
      <h2 className="empty-title">We couldn’t find ‘{query}’</h2>

      <WiktionaryFallback query={query} />

      {close.length > 0 && (
        <>
          <h3 className="divider">Did you mean</h3>
          <ul className="rows">
            {close.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onOpen={() => onOpen(entry)} />
            ))}
          </ul>
        </>
      )}

      <h3 className="entry-label">Tips</h3>
      <ul className="tips">
        <li>Type fewer letters: <em>shant</em> already finds <span lang="hi">शांति</span>.</li>
        <li>Try the word in Devanagari, or its English meaning.</li>
        <li>
          <a href={routeHref({ name: 'home' })} onClick={onLinkClick}>Browse by letter</a> to see every word in the dictionary.
        </li>
      </ul>
      <p className="empty-note">
        Garuda Shabd has {dictionary.ordered.length} words so far, chosen and checked by hand. More are being added.
      </p>
    </div>
  );
}
