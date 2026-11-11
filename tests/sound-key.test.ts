import { describe, expect, it } from 'vitest';
import { cleanLatin, deaccent, soundKey } from '../src/lib/sound-key.ts';

describe('soundKey', () => {
  // One pair per rule in PLAN.md C4, using spellings people actually type.
  it.each([
    ['shanti', 'santi'], // sh → s
    ['śānti', 'santi'], // IAST de-accented to the same key
    ['chhota', 'chot'], // chh → ch, final a dropped
    ['jnana', 'gyan'], // jn → gy
    ['vishwas', 'visvas'], // w → v
    ['zaroori', 'jaruri'], // z → j, oo → u
    ['phool', 'ful'], // ph → f
    ['vruksh', 'vrks'], // ru after the first consonant → r
    ['vṛkṣa', 'vrks'], // the IAST lands on the same key
    ['shraddha', 'sradh'], // doubled letter collapsed
    ['sambandh', 'sanbandh'], // m before a consonant → n
    ['shabda', 'sabd'], // final schwa dropped
    ['laxmi', 'laksmi'], // x → ks
  ])('%s → %s', (input, key) => {
    expect(soundKey(input)).toBe(key);
  });

  it('keeps short keys whole: the final a is only dropped if 3 letters remain', () => {
    expect(soundKey('dara')).toBe('dar');
    expect(soundKey('aaj')).toBe('aj');
    expect(soundKey('aana')).toBe('ana');
  });

  it('leaves ri alone at the very start of a word', () => {
    expect(soundKey('rishi')).toBe('risi');
  });

  it('gives every listed spelling of a word the same key where the sounds agree', () => {
    expect(new Set(['vishwas', 'vishvas', 'viśvāsa'].map(soundKey)).size).toBe(1);
    expect(new Set(['shiksha', 'siksha', 'śikṣā'].map(soundKey)).size).toBe(1);
  });
});

describe('deaccent and cleanLatin', () => {
  it('strips diacritics, case and stray characters', () => {
    expect(deaccent('Dharmā')).toBe('dharma');
    expect(cleanLatin('  Shanti!  ')).toBe('shanti');
    expect(cleanLatin('to   eat')).toBe('to eat');
  });
});
