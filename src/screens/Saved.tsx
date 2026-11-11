import { EntryRow } from '../components/EntryRow.tsx';
import { CloseIcon, StarIcon } from '../components/Icons.tsx';
import type { Dictionary } from '../lib/dictionary.ts';
import type { Entry } from '../lib/types.ts';
import { useSaved } from '../lib/user-data.ts';

export function Saved({ dictionary, currentId, onOpen }: { dictionary: Dictionary; currentId?: number; onOpen: (entry: Entry) => void }) {
  const saved = useSaved();
  const byId = new Map(dictionary.ordered.map((e) => [e.id, e]));
  // Ids of words removed from a later dataset version are skipped, not shown as broken rows.
  const entries = saved.ids.map((id) => byId.get(id)).filter((e): e is Entry => Boolean(e));

  return (
    <div className="saved">
      <h1 className="screen-title">Saved words</h1>
      {entries.length === 0 ? (
        <div className="empty">
          <span className="empty-icon"><StarIcon size={28} /></span>
          <p>Tap ☆ on any word to save it here.</p>
          <p className="empty-note">Saved words stay on this device and work offline.</p>
        </div>
      ) : (
        <ul className="rows" aria-label="Saved words">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              current={entry.id === currentId}
              onOpen={() => onOpen(entry)}
              action={
                <button type="button" className="icon-button row-remove" onClick={() => saved.remove(entry.id)} aria-label={`Remove ${entry.headword} from saved words`}>
                  <CloseIcon size={18} />
                </button>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
