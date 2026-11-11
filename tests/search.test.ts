import { describe, expect, it } from 'vitest';
import { createSearchIndex, livePreview, search, type SearchResult } from '../src/lib/search.ts';
import { dataset, MIXED_QUERIES } from './fixtures.ts';

const index = createSearchIndex(dataset.entries);
const run = (query: string): SearchResult[] => search(index, query);
const top = (query: string) => run(query)[0];
const headwords = (query: string) => run(query).map((r) => r.entry.headword);

describe('search: PLAN.md C5 cases', () => {
  it.each([
    ['धर्म', 'धर्म'],
    ['dharam', 'धर्म'],
    ['dharm', 'धर्म'],
    ['dharmā', 'धर्म'],
    ['shanti', 'शांति'],
    ['santi', 'शांति'],
    ['shaanti', 'शांति'],
    ['gyan', 'ज्ञान'],
    ['jnana', 'ज्ञान'],
    ['vishwas', 'विश्वास'],
    ['vishvas', 'विश्वास'],
    ['vruksh', 'वृक्ष'],
    ['Shanti ', 'शांति'],
  ])('%s → %s', (query, expected) => {
    expect(top(query)?.entry.headword).toBe(expected);
  });

  it('prakesh → प्रकाश as a fuzzy (tier 5) match', () => {
    expect(top('prakesh')).toMatchObject({ tier: 5, entry: { headword: 'प्रकाश' } });
  });

  it('peace → शांति as an English (tier 3) match', () => {
    expect(top('peace')).toMatchObject({ tier: 3, entry: { headword: 'शांति' } });
  });

  it('ram does not return क्षमा', () => {
    expect(headwords('ram')).not.toContain('क्षमा');
  });

  it('xyzq returns nothing', () => {
    expect(run('xyzq')).toEqual([]);
  });

  it.each(['श', 'sh'])('%s returns prefix (tier 4) results only', (query) => {
    const results = run(query);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.tier === 4)).toBe(true);
    expect(results.map((r) => r.entry.headword)).toContain('शब्द');
  });

  it('every result for dharam is tier 1 or 2', () => {
    const results = run('dharam');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.tier <= 2)).toBe(true);
  });

  it('search over the full dataset averages under 2 ms', () => {
    for (const q of MIXED_QUERIES) run(q); // warm up
    const runs = 200;
    const start = performance.now();
    for (let i = 0; i < runs; i++) for (const q of MIXED_QUERIES) run(q);
    const average = (performance.now() - start) / (runs * MIXED_QUERIES.length);
    expect(average).toBeLessThan(2);
  });
});

describe('search: "why matched" chips, one per tier', () => {
  it.each([
    ['shanti', 'शांति', 1, 'exact'],
    ['धर्म', 'धर्म', 1, 'exact'],
    ['shaantii', 'शांति', 2, 'sounds like: shanti'],
    ['शान्ति', 'शांति', 2, 'sounds like: शांति'],
    ['peace', 'शांति', 3, 'English: peace'],
    ['prak', 'प्रकाश', 4, 'starts with'],
    ['prakesh', 'प्रकाश', 5, 'close to: prakash'],
  ] as const)('%s → %s, tier %i, chip "%s"', (query, headword, tier, reason) => {
    const hit = run(query).find((r) => r.entry.headword === headword);
    expect(hit).toMatchObject({ tier, reason });
  });
});

describe('search: ranking and limits', () => {
  it('drops fuzzy hits when a certain answer exists', () => {
    // "kahna" is an exact spelling of कहना; कहानी (kahani) is only a fuzzy neighbour.
    const results = run('kahna');
    expect(results[0]?.entry.headword).toBe('कहना');
    expect(results.some((r) => r.tier === 5)).toBe(false);
  });

  it('orders by tier, then score, then वर्णमाला', () => {
    const results = run('sun');
    expect(results.map((r) => r.tier)).toEqual([...results.map((r) => r.tier)].sort());
    expect(results[0]).toMatchObject({ tier: 3, entry: { headword: 'सूरज' } });
  });

  it('returns at most 20 results', () => {
    expect(run('a').length).toBeLessThanOrEqual(20);
    expect(run('स').length).toBeLessThanOrEqual(20);
  });

  it('ignores empty and punctuation-only queries', () => {
    expect(run('')).toEqual([]);
    expect(run('   ')).toEqual([]);
    expect(run('।')).toEqual([]);
  });

  it('treats chandrabindu, nukta and danda variants as the same word', () => {
    expect(top('गांव')?.entry.headword).toBe('गाँव');
    expect(top('जिंदगी')?.entry.headword).toBe('ज़िंदगी');
    expect(top('पानी।')?.entry.headword).toBe('पानी');
  });

  it('finds verbs by their English meaning with or without "to"', () => {
    expect(top('to eat')?.entry.headword).toBe('खाना');
    expect(top('eat')?.entry.headword).toBe('खाना');
  });

  it('does not match English filler words such as "to"', () => {
    expect(run('to').every((r) => r.tier === 4)).toBe(true);
  });
});

describe('livePreview', () => {
  it('shows query → headword for a certain Latin match', () => {
    expect(livePreview('dharam', run('dharam'))).toEqual({ query: 'dharam', headword: 'धर्म' });
    expect(livePreview('shaantii', run('shaantii'))).toEqual({ query: 'shaantii', headword: 'शांति' });
  });

  it('shows nothing for English, prefix, fuzzy or Devanagari input', () => {
    expect(livePreview('peace', run('peace'))).toBeNull();
    expect(livePreview('prak', run('prak'))).toBeNull();
    expect(livePreview('prakesh', run('prakesh'))).toBeNull();
    expect(livePreview('धर्म', run('धर्म'))).toBeNull();
    expect(livePreview('xyzq', run('xyzq'))).toBeNull();
  });
});

describe('every listed spelling finds its own entry first (validator check 3b)', () => {
  it.each(dataset.entries.flatMap((e) => e.romanised.map((s) => [s, e.headword] as const)))('%s → %s', (spelling, headword) => {
    expect(top(spelling)?.entry.headword).toBe(headword);
  });
});
