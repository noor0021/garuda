import { EntryRow } from '../components/EntryRow.tsx';
import type { Dictionary } from '../lib/dictionary.ts';
import { onLinkClick } from '../lib/router.ts';
import { routeHref } from '../lib/routes.ts';
import type { Entry } from '../lib/types.ts';
import { VARNAMALA } from '../lib/varnamala.ts';

export function Letter({ letter, dictionary, currentId, onOpen }: { letter: string; dictionary: Dictionary; currentId?: number; onOpen: (entry: Entry) => void }) {
  const entries = dictionary.byLetter.get(letter) ?? [];
  const withWords = VARNAMALA.filter((l) => dictionary.byLetter.has(l));
  const i = withWords.indexOf(letter as (typeof VARNAMALA)[number]);
  const prev = withWords[i - 1];
  const next = withWords[i + 1];

  return (
    <div className="letter-screen">
      <h1 className="screen-title">
        <span className="letter-title" lang="hi">{letter}</span>
        <span className="screen-sub">{entries.length === 0 ? 'No words yet' : `${entries.length} word${entries.length === 1 ? '' : 's'}`}</span>
      </h1>
      {entries.length > 0 && (
        <ul className="rows" aria-label={`Words starting with ${letter}`}>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} current={entry.id === currentId} onOpen={() => onOpen(entry)} />
          ))}
        </ul>
      )}
      <nav className="entry-nav" aria-label="Other letters">
        {prev ? <a href={routeHref({ name: 'letter', letter: prev })} onClick={(e) => onLinkClick(e, { replace: true })}>← <span lang="hi">{prev}</span></a> : <span />}
        <a href="/" onClick={onLinkClick}>All letters</a>
        {next ? <a href={routeHref({ name: 'letter', letter: next })} onClick={(e) => onLinkClick(e, { replace: true })}><span lang="hi">{next}</span> →</a> : <span />}
      </nav>
    </div>
  );
}
