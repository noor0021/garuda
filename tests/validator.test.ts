import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateDataset } from '../scripts/validate-core.ts';
import { createSearchIndex, search } from '../src/lib/search.ts';
import type { Dataset, Entry } from '../src/lib/types.ts';

const dataset = JSON.parse(readFileSync('public/data/entries.json', 'utf8')) as Dataset;

/** Returns the validator's errors after applying one deliberate mistake to a copy of the data. */
function errorsAfter(mutate: (entries: Entry[]) => void): string[] {
  const copy = structuredClone(dataset);
  mutate(copy.entries);
  return validateDataset(copy).errors;
}

const entry = (entries: Entry[], headword: string): Entry => {
  const found = entries.find((e) => e.headword === headword);
  if (!found) throw new Error(`test setup: ${headword} is not in the dataset`);
  return found;
};

describe('dataset validator', () => {
  it('accepts the real dataset', () => {
    expect(validateDataset(dataset).errors).toEqual([]);
  });

  // Mutation tests: each one plants a single mistake and expects exactly that mistake to be reported.
  const mutations: [name: string, mutate: (entries: Entry[]) => void, expected: RegExp][] = [
    ['wrong IAST', (e) => { entry(e, 'शांति').transliteration = 'shanti'; }, /शांति: transliteration is "shanti", expected "śānti"/],
    ['IAST with anusvara left as ṃ', (e) => { entry(e, 'मंदिर').transliteration = 'maṃdira'; }, /मंदिर: transliteration is "maṃdira", expected "mandira"/],
    ['duplicate id', (e) => { entry(e, 'धर्म').id = 3; }, /धर्म: duplicate id \(also used by शब्द\)/],
    ['duplicate headword', (e) => { entry(e, 'धर्म').headword = 'शब्द'; }, /duplicate headword/],
    ['example without the headword', (e) => { entry(e, 'पानी').example = 'मुझे एक गिलास जल चाहिए।'; }, /पानी: example does not contain the headword/],
    ['uppercase spelling', (e) => { entry(e, 'ज्ञान').romanised[0] = 'Gyan'; }, /ज्ञान: spelling "Gyan" must be lowercase a–z only/],
    ['spelling with a diacritic', (e) => { entry(e, 'ज्ञान').romanised[0] = 'jñāna'; }, /must be lowercase a–z only/],
    ['pos not in the list', (e) => { entry(e, 'करना').pos = 'verb (transitive)'; }, /करना: pos "verb \(transitive\)" is not allowed/],
    ['noun without a gender', (e) => { entry(e, 'पानी').pos = 'noun'; }, /पानी: pos "noun" is not allowed/],
    ['spelling claimed by two entries', (e) => { entry(e, 'जीवन').romanised.push('zindagi'); }, /spelling "zindagi" collides with id \d+ ज़िंदगी/],
    ['spelling that is an English word', (e) => { entry(e, 'काम').romanised[1] = 'man'; }, /spelling "man" is a common English word/],
    ['empty meanings', (e) => { entry(e, 'पानी').meanings = []; }, /meanings must be a non-empty list/],
    ['missing field', (e) => { delete (entry(e, 'पानी') as Partial<Entry>).example; }, /example must be a non-empty string/],
    ['only one spelling', (e) => { entry(e, 'पानी').romanised = ['pani']; }, /पानी: needs 2–4 romanised spellings, has 1/],
  ];

  it.each(mutations)('catches: %s', (_name, mutate, expected) => {
    const errors = errorsAfter(mutate);
    expect(errors.join('\n')).toMatch(expected);
  });

  it('reports a planted mistake once, without side-effect errors on other entries', () => {
    const errors = errorsAfter((e) => { entry(e, 'पानी').example = 'मुझे एक गिलास जल चाहिए।'; });
    expect(errors).toHaveLength(1);
  });

  it('check 4: catches a spelling that equals another word\'s IAST (a tie at tier 1)', () => {
    // कपड़ा is kapar̤a in IAST, so "kapara" is already an exact match for it.
    const errors = errorsAfter((e) => { entry(e, 'किताब').romanised.push('kapara'); });
    expect(errors.join('\n')).toMatch(/किताब: spelling "kapara" is the IAST of id \d+ कपड़ा/);
  });

  it('check 3b: reports a spelling whose search does not return its own entry first', () => {
    const topResult = (query: string, entries: Entry[]) => search(createSearchIndex(entries), query)[0]?.entry.headword;
    expect(validateDataset(dataset, topResult).errors).toEqual([]);
    // Every real spelling is an exact match, so plant a search engine that ranks one word wrongly.
    const wrongForPani = (query: string, entries: Entry[]) => (query === 'paani' ? 'जल' : topResult(query, entries));
    expect(validateDataset(dataset, wrongForPani).errors).toEqual([
      expect.stringMatching(/पानी: searching "paani" returns जल first/),
    ]);
  });
});
