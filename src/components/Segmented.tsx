import { onLinkClick } from '../lib/router.ts';

type Props = { active: 'search' | 'saved'; searchHref: string; savedCount: number };

/** Search | Saved switch under the search bar (PLAN.md C7). Links, so they work as URLs too. */
export function Segmented({ active, searchHref, savedCount }: Props) {
  return (
    <nav className="segmented" aria-label="Sections">
      <a href={searchHref} onClick={onLinkClick} aria-current={active === 'search' ? 'page' : undefined}>
        Search
      </a>
      <a href="/saved" onClick={onLinkClick} aria-current={active === 'saved' ? 'page' : undefined}>
        Saved{savedCount > 0 && <span className="segmented-count">{savedCount}</span>}
      </a>
    </nav>
  );
}
