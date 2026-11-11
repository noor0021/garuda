import { EntryRow } from '../components/EntryRow.tsx';
import type { Dictionary } from '../lib/dictionary.ts';
import { onLinkClick } from '../lib/router.ts';
import { routeHref } from '../lib/routes.ts';
import { livePreview, suggestions, type SearchResult } from '../lib/search.ts';
import type { Entry } from '../lib/types.ts';

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

  return (
    <div className="results">
      {results.length > 0 && (
        <p className="preview" data-preview>
          {preview && (
            <>
              <span>{preview.query}</span> <span aria-hidden="true">→</span> <span lang="hi">{preview.headword}</span>
            </>
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
