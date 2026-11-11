import type { Dictionary } from '../lib/dictionary.ts';
import { slugOf } from '../lib/dictionary.ts';
import { onLinkClick } from '../lib/router.ts';
import { routeHref } from '../lib/routes.ts';
import { useRecent } from '../lib/user-data.ts';
import { isDevanagari } from '../lib/indic.ts';
import { VARNAMALA } from '../lib/varnamala.ts';

const VOWELS = VARNAMALA.slice(0, 11);
const CONSONANTS = VARNAMALA.slice(11);
/** Queries that show what the search can do: a typed spelling, a Hindi variant, English. */
const TRY = ['dharam', 'शान्ति', 'peace', 'vruksh', 'gyan'];

/** Same word all day, a different one each day; no server needed. */
function wordOfTheDay(dictionary: Dictionary) {
  const day = Math.floor(Date.now() / 86_400_000);
  return dictionary.ordered[(day * 37) % dictionary.ordered.length];
}

function LetterGrid({ letters, dictionary, label }: { letters: readonly string[]; dictionary: Dictionary; label: string }) {
  return (
    <ul className="letter-grid" aria-label={label}>
      {letters.map((letter) => {
        const count = dictionary.byLetter.get(letter)?.length ?? 0;
        return (
          <li key={letter}>
            {count > 0 ? (
              <a className="letter" href={routeHref({ name: 'letter', letter })} onClick={onLinkClick} aria-label={`${letter}, ${count} word${count === 1 ? '' : 's'}`}>
                <span lang="hi">{letter}</span>
              </a>
            ) : (
              <span className="letter letter-empty" aria-label={`${letter}, no words yet`} aria-disabled="true">
                <span lang="hi">{letter}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The top of Home. It needs no dictionary data, so it is also prerendered into index.html at build
 * time (scripts/prerender.tsx) and paints before any JavaScript has run.
 */
function HomeIntro() {
  return (
    <>
      <p className="home-hint">Any spelling works — Hindi or English</p>
      <ul className="chips" aria-label="Try a search">
        {TRY.map((q) => (
          <li key={q}>
            <a className="chip chip-link" href={routeHref({ name: 'search', q })} onClick={onLinkClick} lang={isDevanagari(q) ? 'hi' : undefined}>
              {q}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Home. Without a dictionary yet (still loading, or prerendering) it shows only the intro. */
export function Home({ dictionary }: { dictionary: Dictionary | null }) {
  const recent = useRecent();
  const today = dictionary ? wordOfTheDay(dictionary) : undefined;

  return (
    <div className="home">
      <HomeIntro />

      {recent.items.length > 0 && (
        <section className="section" aria-labelledby="recent-title">
          <div className="section-head">
            <h2 id="recent-title" className="section-title">Recent</h2>
            <button type="button" className="text-button" onClick={recent.clear}>
              Clear
            </button>
          </div>
          <ul className="chips">
            {recent.items.map((q) => (
              <li key={q}>
                <a className="chip chip-link chip-plain" href={routeHref({ name: 'search', q })} onClick={onLinkClick}>
                  {q}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {today && (
        <section className="section" aria-labelledby="today-title">
          <h2 id="today-title" className="section-title">
            <span lang="hi">आज का शब्द</span> · Word of the day
          </h2>
          <a className="today" href={`/w/${slugOf(today)}`} onClick={onLinkClick}>
            <span className="today-headword" lang="hi">{today.headword}</span>
            <span className="today-text">
              <span className="row-iast">{today.transliteration}</span>
              <span>{today.meanings.join(', ')}</span>
            </span>
          </a>
        </section>
      )}

      {!dictionary && <p className="loading section">Loading words…</p>}

      {dictionary && (
      <section className="section" aria-labelledby="browse-title">
        <h2 id="browse-title" className="section-title">
          Browse by letter · <span lang="hi">वर्णमाला</span>
        </h2>
        <h3 className="letter-group" lang="hi">स्वर <span lang="en">· vowels</span></h3>
        <LetterGrid letters={VOWELS} dictionary={dictionary} label="Vowels" />
        <h3 className="letter-group" lang="hi">व्यंजन <span lang="en">· consonants</span></h3>
        <LetterGrid letters={CONSONANTS} dictionary={dictionary} label="Consonants" />
      </section>
      )}

      {dictionary && <p className="home-count">{dictionary.ordered.length} words · dictionary version {dictionary.version}</p>}
    </div>
  );
}
