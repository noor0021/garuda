/**
 * Search engine (PLAN.md C4). Pure TypeScript, no DOM: the app, the tests and the dataset
 * validator all run this same code.
 *
 * A query is matched against every entry in five tiers, best first:
 *   1 exact        the headword, a listed spelling or the IAST, as typed
 *   2 sounds like  same sound key (Latin) or same loose Devanagari key
 *   3 English      a whole English word or phrase from the meanings
 *   4 starts with  the beginning of a headword, spelling, key or English word
 *   5 close to     fuzzy (Fuse.js), only when tiers 1–3 found nothing
 */
import Fuse from 'fuse.js/basic';
import { devanagariSoundKey, isDevanagari, normaliseDevanagari } from './indic.ts';
import { cleanLatin, deaccent, soundKey } from './sound-key.ts';
import type { Entry } from './types.ts';
import { compareVarnamala } from './varnamala.ts';

export type Tier = 1 | 2 | 3 | 4 | 5;

export type SearchResult = {
  entry: Entry;
  tier: Tier;
  /** The "why matched" chip shown on the result row. */
  reason: string;
  /** Lower is better. 0 for tiers 1–3; prefix coverage for tier 4; Fuse score for tier 5. */
  score: number;
};

type IndexRecord = {
  entry: Entry;
  headwordNorm: string;
  devKey: string;
  spellings: string[];
  /** Tier 1 targets: listed spellings and the de-accented IAST. */
  exact: Set<string>;
  /** Tier 2 targets, each mapped to the spelling shown in the chip. */
  keys: Map<string, string>;
  /** Tier 3 targets: single English words and whole meanings ("to eat", "right now"). */
  englishWords: Set<string>;
};

export type SearchIndex = {
  records: IndexRecord[];
  latinFuse: Fuse<{ key: string; spelling: string; record: number }>;
  devanagariFuse: Fuse<{ key: string; record: number }>;
  /** Looser fuzzy matchers, only for "did you mean" on the no-results screen. */
  latinLoose: Fuse<{ key: string; spelling: string; record: number }>;
  devanagariLoose: Fuse<{ key: string; record: number }>;
};

export const MAX_RESULTS = 20;
const FUZZY_THRESHOLD = 0.3;
const FUZZY_BAND = 0.1;
const FUZZY_MIN_LENGTH = 4;
const SUGGEST_THRESHOLD = 0.5;

/** Words in meanings that would match almost every verb or phrase if searchable on their own. */
const ENGLISH_STOPWORDS = new Set(['a', 'an', 'the', 'to', 'of', 'for', 'with', 'oneself', 'around', 'up', 'at', 'in', 'on']);

function englishTargets(meanings: string[]): Set<string> {
  const targets = new Set<string>();
  for (const meaning of meanings) {
    for (const part of meaning.toLowerCase().split(',')) {
      const phrase = part.replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!phrase) continue;
      targets.add(phrase);
      for (const word of phrase.split(' ')) {
        if (!ENGLISH_STOPWORDS.has(word)) targets.add(word);
      }
    }
  }
  return targets;
}

/** Builds the index once, when the dataset loads. */
export function createSearchIndex(entries: readonly Entry[]): SearchIndex {
  const records: IndexRecord[] = entries.map((entry) => {
    const iastPlain = deaccent(entry.transliteration).replace(/[^a-z]/g, '');
    const keys = new Map<string, string>();
    for (const spelling of entry.romanised) {
      const key = soundKey(spelling);
      if (!keys.has(key)) keys.set(key, spelling);
    }
    const iastKey = soundKey(iastPlain);
    if (!keys.has(iastKey)) keys.set(iastKey, entry.romanised[0] ?? iastPlain);
    return {
      entry,
      headwordNorm: normaliseDevanagari(entry.headword),
      devKey: devanagariSoundKey(entry.headword),
      spellings: entry.romanised,
      exact: new Set([...entry.romanised, iastPlain]),
      keys,
      englishWords: englishTargets(entry.meanings),
    };
  });

  const latinDocs = records.flatMap((record, i) =>
    [...record.keys].map(([key, spelling]) => ({ key, spelling, record: i })),
  );
  const devDocs = records.map((record, i) => ({ key: record.devKey, record: i }));
  const strict = { keys: ['key'], includeScore: true, threshold: FUZZY_THRESHOLD };
  const loose = { ...strict, threshold: SUGGEST_THRESHOLD };
  return {
    records,
    latinFuse: new Fuse(latinDocs, strict),
    devanagariFuse: new Fuse(devDocs, strict),
    latinLoose: new Fuse(latinDocs, loose),
    devanagariLoose: new Fuse(devDocs, loose),
  };
}

/** Keeps the best match per entry. */
class Hits {
  private readonly best = new Map<number, SearchResult>();

  add(entry: Entry, tier: Tier, reason: string, score = 0): void {
    const current = this.best.get(entry.id);
    if (!current || tier < current.tier || (tier === current.tier && score < current.score)) {
      this.best.set(entry.id, { entry, tier, reason, score });
    }
  }

  has(id: number): boolean {
    return this.best.has(id);
  }

  hasTierAtMost(tier: Tier): boolean {
    for (const hit of this.best.values()) if (hit.tier <= tier) return true;
    return false;
  }

  sorted(): SearchResult[] {
    return [...this.best.values()]
      .sort((a, b) => a.tier - b.tier || a.score - b.score || compareVarnamala(a.entry.headword, b.entry.headword))
      .slice(0, MAX_RESULTS);
  }
}

/** Tier 4 score: how much of the target is still untyped (0 = the whole word). */
const prefixScore = (query: string, target: string): number => 1 - query.length / target.length;

function searchLatin(index: SearchIndex, raw: string, hits: Hits): void {
  const query = cleanLatin(raw);
  if (!query) return;
  const compact = query.replace(/ /g, '');
  const key = soundKey(compact);

  for (const record of index.records) {
    const { entry } = record;

    if (record.exact.has(compact)) {
      hits.add(entry, 1, 'exact');
      continue;
    }
    const spelling = record.keys.get(key);
    if (spelling !== undefined) {
      hits.add(entry, 2, `sounds like: ${spelling}`);
      continue;
    }
    if (record.englishWords.has(query)) {
      hits.add(entry, 3, `English: ${query}`);
      continue;
    }

    // Tier 4: what the user has typed so far is the start of something in the entry.
    let best = Infinity;
    if (compact.length >= 2) {
      for (const target of record.exact) if (target.startsWith(compact)) best = Math.min(best, prefixScore(compact, target));
    }
    if (key.length >= 2) {
      for (const target of record.keys.keys()) if (target.startsWith(key)) best = Math.min(best, prefixScore(key, target));
    }
    if (query.length >= 3) {
      for (const word of record.englishWords) if (word.startsWith(query)) best = Math.min(best, prefixScore(query, word));
    }
    if (best < Infinity) hits.add(entry, 4, 'starts with', best);
  }

  // Tier 5 only when nothing certain was found: no fuzzy noise next to a correct answer.
  if (compact.length >= FUZZY_MIN_LENGTH && !hits.hasTierAtMost(3)) {
    const fuzzy = index.latinFuse.search(key);
    const top = fuzzy[0]?.score;
    if (top === undefined) return;
    for (const { item, score = 1 } of fuzzy) {
      if (score - top > FUZZY_BAND) break;
      const record = index.records[item.record];
      if (record && !hits.has(record.entry.id)) hits.add(record.entry, 5, `close to: ${item.spelling}`, score);
    }
  }
}

function searchDevanagari(index: SearchIndex, raw: string, hits: Hits): void {
  const query = normaliseDevanagari(raw);
  if (!query) return;
  const key = devanagariSoundKey(query);

  for (const record of index.records) {
    const { entry } = record;
    if (record.headwordNorm === query) {
      hits.add(entry, 1, 'exact');
    } else if (record.devKey === key) {
      hits.add(entry, 2, `sounds like: ${entry.headword}`);
    } else if (record.headwordNorm.startsWith(query)) {
      // A single Devanagari letter is already meaningful (श → शब्द, शांति…), so no minimum length.
      hits.add(entry, 4, 'starts with', prefixScore(query, record.headwordNorm));
    } else if (record.devKey.startsWith(key)) {
      hits.add(entry, 4, 'starts with', prefixScore(key, record.devKey));
    }
  }

  if ([...query].length >= FUZZY_MIN_LENGTH && !hits.hasTierAtMost(3)) {
    const fuzzy = index.devanagariFuse.search(key);
    const top = fuzzy[0]?.score;
    if (top === undefined) return;
    for (const { item, score = 1 } of fuzzy) {
      if (score - top > FUZZY_BAND) break;
      const record = index.records[item.record];
      if (record && !hits.has(record.entry.id)) hits.add(record.entry, 5, `close to: ${record.entry.headword}`, score);
    }
  }
}

/** Searches the index. Returns at most 20 results, best first. */
export function search(index: SearchIndex, query: string): SearchResult[] {
  const hits = new Hits();
  if (isDevanagari(query)) searchDevanagari(index, query, hits);
  else searchLatin(index, query, hits);
  return hits.sorted();
}

/**
 * Up to three looser guesses for the no-results screen ("Did you mean…"). Separate from search()
 * so that ordinary results never carry low-confidence noise.
 */
export function suggestions(index: SearchIndex, query: string, limit = 3): Entry[] {
  const devanagari = isDevanagari(query);
  const key = devanagari ? devanagariSoundKey(query) : soundKey(cleanLatin(query));
  if ([...key].length < 3) return [];
  const hits = devanagari ? index.devanagariLoose.search(key) : index.latinLoose.search(key);
  const seen = new Set<number>();
  const out: Entry[] = [];
  const first = [...key][0];
  const top = hits[0]?.score ?? 0;
  for (const { item, score = 1 } of hits) {
    if (score - top > FUZZY_BAND) break;
    const record = index.records[item.record];
    // People rarely get the first sound of a word wrong; this keeps gibberish from matching.
    if (!record || seen.has(record.entry.id) || [...item.key][0] !== first) continue;
    seen.add(record.entry.id);
    out.push(record.entry);
    if (out.length === limit) break;
  }
  return out;
}

/**
 * The "dharam → धर्म" line above the results. Only shown for Latin input when the top result is
 * certain (tier 1–2); otherwise nothing, never a guessed transliteration.
 */
export function livePreview(query: string, results: readonly SearchResult[]): { query: string; headword: string } | null {
  const top = results[0];
  if (!top || top.tier > 2 || isDevanagari(query) || !query.trim()) return null;
  return { query: query.trim(), headword: top.entry.headword };
}
