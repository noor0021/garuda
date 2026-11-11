import { onLinkClick } from '../lib/router.ts';

export function NotFound() {
  return (
    <div className="empty">
      <p className="empty-hi" lang="hi">यह पन्ना नहीं मिला</p>
      <h1 className="empty-title">Page not found</h1>
      <p>The link may be old, or the word may have a new address.</p>
      <a className="button" href="/" onClick={onLinkClick}>Search the dictionary</a>
    </div>
  );
}

export function DataError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="empty" role="alert">
      <p className="empty-hi" lang="hi">शब्दकोश नहीं खुल पाया</p>
      <h1 className="empty-title">The dictionary could not load</h1>
      <p>{message}</p>
      <button type="button" className="button" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function Loading() {
  return (
    <p className="loading" role="status">
      Loading words…
    </p>
  );
}

/** Desktop right pane before any word is open. */
export function Intro({ count }: { count: number }) {
  return (
    <div className="intro">
      <p className="intro-mark" lang="hi">शब्द</p>
      <h2 className="intro-title">A Hindi–English dictionary that understands how you type</h2>
      <p>
        Search in Devanagari, in English, or in Hindi typed the way it is typed on a phone: <em>dharam</em>, <em>dharm</em> and{' '}
        <em>dharma</em> all find <span lang="hi">धर्म</span>. Each result says why it matched.
      </p>
      <p>
        Press <kbd>/</kbd> to search, <kbd>Enter</kbd> to open the top result, <kbd>Esc</kbd> to clear.
      </p>
      <p className="empty-note">{count} words, checked by hand · works offline once loaded</p>
    </div>
  );
}
