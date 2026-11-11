import type { ReactNode } from 'react';
import { slugOf } from '../lib/dictionary.ts';
import { onLinkClick } from '../lib/router.ts';
import type { Entry } from '../lib/types.ts';

type Props = {
  entry: Entry;
  chip?: string;
  current?: boolean;
  onOpen?: () => void;
  /** Extra control at the end of the row (the Saved screen's remove button). */
  action?: ReactNode;
};

/** One dictionary row: headword · IAST · first meaning · why-matched chip. */
export function EntryRow({ entry, chip, current, onOpen, action }: Props) {
  return (
    <li className="row" data-row>
      <a
        className="row-link"
        href={`/w/${slugOf(entry)}`}
        aria-current={current ? 'true' : undefined}
        onClick={(event) => {
          onOpen?.();
          onLinkClick(event);
        }}
      >
        <span className="row-headword" lang="hi">{entry.headword}</span>
        <span className="row-text">
          <span className="row-iast">{entry.transliteration}</span>
          <span className="row-meaning">{entry.meanings[0]}</span>
        </span>
        {chip && <span className={`chip${chip === 'exact' ? ' chip-quiet' : ''}`}>{chip}</span>}
      </a>
      {action}
    </li>
  );
}
