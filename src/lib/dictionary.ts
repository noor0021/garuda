/**
 * The loaded dictionary: entries, search index and lookups, built once from entries.json.
 */
import { createSearchIndex, type SearchIndex } from './search.ts';
import { parseDataset, type Entry } from './types.ts';
import { compareVarnamala, firstLetter } from './varnamala.ts';

export type Dictionary = {
  version: string;
  /** Entries in वर्णमाला order. */
  ordered: Entry[];
  index: SearchIndex;
  bySlug: Map<string, Entry>;
  byLetter: Map<string, Entry[]>;
  /** Position of each entry in `ordered`, for previous/next. */
  position: Map<number, number>;
};

/** The URL slug of an entry: its first romanised spelling (PLAN.md C6). */
export const slugOf = (entry: Entry): string => entry.romanised[0] ?? String(entry.id);

export function buildDictionary(raw: unknown): Dictionary {
  const { version, entries } = parseDataset(raw);
  const ordered = [...entries].sort((a, b) => compareVarnamala(a.headword, b.headword));
  const byLetter = new Map<string, Entry[]>();
  for (const entry of ordered) {
    const letter = firstLetter(entry.headword);
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), entry]);
  }
  return {
    version,
    ordered,
    index: createSearchIndex(ordered),
    bySlug: new Map(ordered.map((e) => [slugOf(e), e])),
    byLetter,
    position: new Map(ordered.map((e, i) => [e.id, i])),
  };
}

export function neighbours(dictionary: Dictionary, entry: Entry): { prev?: Entry; next?: Entry } {
  const i = dictionary.position.get(entry.id);
  if (i === undefined) return {};
  return { prev: dictionary.ordered[i - 1], next: dictionary.ordered[i + 1] };
}

export async function loadDictionary(signal?: AbortSignal): Promise<Dictionary> {
  const response = await fetch('/data/entries.json', { signal });
  if (!response.ok) throw new Error(`The dictionary file could not be loaded (HTTP ${response.status}).`);
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new Error('The dictionary file is not valid JSON.');
  }
  return buildDictionary(raw);
}
