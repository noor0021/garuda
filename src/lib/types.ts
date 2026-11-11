/** One dictionary entry, in the format Garuda's brief supplied. Do not add or rename fields. */
export type Entry = {
  id: number;
  /** Devanagari headword. */
  headword: string;
  /** IAST, letter-based: keeps the inherent schwa (śabda, karanā). */
  transliteration: string;
  /** How people actually type the word in Latin letters: shabd, shabda. */
  romanised: string[];
  /** Part of speech, from POS_VALUES. Nouns carry their Hindi gender. */
  pos: string;
  /** English meanings, most common first. */
  meanings: string[];
  /** A Hindi sentence that contains the headword exactly. */
  example: string;
};

export type Dataset = {
  version: string;
  entries: Entry[];
};

export const POS_VALUES = [
  'noun (m.)',
  'noun (f.)',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'postposition',
  'conjunction',
  'interjection',
  'numeral',
] as const;

const isString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isStringList = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.every(isString);

/**
 * Checks the shape of one entry. Returns a list of problems (empty = fine).
 * Shared by the app (at load) and the validator script, so both agree on what "valid" means.
 */
export function entryShapeErrors(raw: unknown): string[] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return ['entry is not an object'];
  const e = raw as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof e.id !== 'number' || !Number.isInteger(e.id) || e.id < 1) errors.push('id must be a positive integer');
  for (const field of ['headword', 'transliteration', 'pos', 'example'] as const) {
    if (!isString(e[field])) errors.push(`${field} must be a non-empty string`);
  }
  for (const field of ['romanised', 'meanings'] as const) {
    if (!isStringList(e[field])) errors.push(`${field} must be a non-empty list of non-empty strings`);
  }
  return errors;
}

/**
 * Parses the JSON file into a Dataset, or throws with a message that names the first broken entry.
 * The app shows its "data load error" state when this throws.
 */
export function parseDataset(raw: unknown): Dataset {
  if (typeof raw !== 'object' || raw === null) throw new Error('Dictionary file is not an object');
  const data = raw as Record<string, unknown>;
  if (!isString(data.version)) throw new Error('Dictionary file has no version');
  if (!Array.isArray(data.entries) || data.entries.length === 0) {
    throw new Error('Dictionary file has no entries');
  }
  data.entries.forEach((entry, i) => {
    const errors = entryShapeErrors(entry);
    if (errors.length > 0) throw new Error(`Entry ${i + 1} is broken: ${errors.join('; ')}`);
  });
  return { version: data.version, entries: data.entries as Entry[] };
}
