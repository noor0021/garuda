import { useEffect, useRef, type ReactNode } from 'react';
import { neighbours, slugOf, type Dictionary } from '../lib/dictionary.ts';
import { speakHindi, useHindiVoice } from '../lib/hooks.ts';
import { navigate, onLinkClick } from '../lib/router.ts';
import { routeHref } from '../lib/routes.ts';
import type { Entry } from '../lib/types.ts';
import { useSaved } from '../lib/user-data.ts';
import { ChevronLeft, ChevronRight, CloseIcon, SpeakerIcon, StarIcon } from './Icons.tsx';

const POS_LABEL: Record<string, string> = {
  'noun (m.)': 'noun · masculine',
  'noun (f.)': 'noun · feminine',
};

/** The example sentence with the headword marked, e.g. "इस <mark>शब्द</mark> का अर्थ…". */
function highlight(example: string, headword: string): ReactNode[] {
  const parts = example.split(headword);
  return parts.flatMap((part, i) => (i === 0 ? [part] : [<mark key={i}>{headword}</mark>, part]));
}

type Props = {
  entry: Entry;
  dictionary: Dictionary;
  headingId: string;
  onClose?: () => void;
  /** Move focus to the headword when the entry opens (keyboard and screen-reader users). */
  focusHeading?: boolean;
  /** Called when the save star is toggled on, for the save animation. */
  onSaved?: (star: HTMLElement) => void;
};

export function EntryView({ entry, dictionary, headingId, onClose, focusHeading, onSaved }: Props) {
  const voice = useHindiVoice();
  const saved = useSaved();
  const isSaved = saved.isSaved(entry.id);
  const heading = useRef<HTMLHeadingElement>(null);
  const star = useRef<HTMLButtonElement>(null);
  const { prev, next } = neighbours(dictionary, entry);

  // The parent remounts this view per entry (key={entry.id}), so this runs once per word.
  useEffect(() => {
    if (focusHeading) heading.current?.focus({ preventScroll: true });
  }, [focusHeading]);

  return (
    <article className="entry" aria-labelledby={headingId}>
      <div className="entry-top">
        <h2 id={headingId} ref={heading} tabIndex={-1} className="entry-headword" lang="hi">
          {entry.headword}
        </h2>
        <div className="entry-actions">
          {voice && (
            <button type="button" className="icon-button" onClick={() => speakHindi(entry.headword, voice)} aria-label={`Listen to ${entry.headword}`}>
              <SpeakerIcon />
            </button>
          )}
          <button
            ref={star}
            type="button"
            className="icon-button star-button"
            aria-pressed={isSaved}
            aria-label={isSaved ? `Remove ${entry.headword} from saved words` : `Save ${entry.headword}`}
            onClick={() => {
              saved.toggle(entry.id);
              if (!isSaved && star.current) onSaved?.(star.current);
            }}
          >
            <StarIcon filled={isSaved} />
          </button>
          {onClose && (
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      <p className="entry-iast">{entry.transliteration}</p>
      <p className="pill">{POS_LABEL[entry.pos] ?? entry.pos}</p>

      <h3 className="entry-label">Meaning</h3>
      <ol className="entry-meanings">
        {entry.meanings.map((meaning) => (
          <li key={meaning}>{meaning}</li>
        ))}
      </ol>

      <h3 className="entry-label">Example</h3>
      <blockquote className="entry-example" lang="hi">
        {highlight(entry.example, entry.headword)}
      </blockquote>

      <h3 className="entry-label">Also spelled</h3>
      <ul className="chips" aria-label="Spellings that find this word">
        {entry.romanised.map((spelling) => (
          <li key={spelling}>
            <a className="chip chip-link" href={routeHref({ name: 'search', q: spelling })} onClick={(event) => onLinkClick(event)}>
              {spelling}
            </a>
          </li>
        ))}
      </ul>

      <nav className="entry-nav" aria-label="वर्णमाला order">
        {prev ? (
          <a href={`/w/${slugOf(prev)}`} onClick={(event) => { event.preventDefault(); navigate(`/w/${slugOf(prev)}`, { replace: true }); }} rel="prev">
            <ChevronLeft />
            <span lang="hi">{prev.headword}</span>
          </a>
        ) : <span />}
        {next ? (
          <a href={`/w/${slugOf(next)}`} onClick={(event) => { event.preventDefault(); navigate(`/w/${slugOf(next)}`, { replace: true }); }} rel="next">
            <span lang="hi">{next.headword}</span>
            <ChevronRight />
          </a>
        ) : <span />}
      </nav>
    </article>
  );
}
