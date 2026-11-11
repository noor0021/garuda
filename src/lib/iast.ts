/**
 * Devanagari → IAST for dictionary entries.
 *
 * Kept apart from indic.ts on purpose: this file pulls in Sanscript (about 190 kB of scheme
 * tables), which only the validator and editor scripts need. The app reads the IAST straight
 * from entries.json, so Sanscript never ships to the browser.
 */
import Sanscript from '@indic-transliteration/sanscript';

const NUKTA = '़';
// Sanscript only understands the precomposed nukta letters, and NFC always splits them.
const PRECOMPOSED_NUKTA: Record<string, string> = {
  क: 'क़',
  ख: 'ख़',
  ग: 'ग़',
  ज: 'ज़',
  ड: 'ड़',
  फ: 'फ़',
  य: 'य़',
};

const HOMORGANIC_NASAL: [RegExp, string][] = [
  [/ṃ(?=[kgṅ])/g, 'ṅ'],
  [/ṃ(?=[cjñ])/g, 'ñ'],
  [/ṃ(?=[ṭḍṇ])/g, 'ṇ'],
  [/ṃ(?=[tdn])/g, 'n'],
  [/ṃ(?=[pbm])/g, 'm'],
];

/**
 * The transliteration every entry must carry (validator check 2).
 *
 * Sanscript does the letter-by-letter work. Three Hindi-specific fixes are applied around it:
 * 1. Anusvara before a stop becomes the homorganic nasal (शांति → śānti, not śāṃti), which is
 *    how the starter entries in Garuda's brief are written. Elsewhere it stays ṃ (संस्कृति → saṃskṛti).
 * 2. Chandrabindu is written m̐ (Sanscript emits "~").
 * 3. Nukta letters: ज़ → z, फ़ → f, ड़ → r̤, ढ़ → r̤h. ISO 15919 writes ड़ as ṛ, but in IAST ṛ is
 *    already ऋ, so Sanscript's r̤ is kept to keep the two apart.
 */
export function toIast(devanagari: string): string {
  const chars = [...devanagari.normalize('NFC').replace(/[‌‍]/g, '')];
  let prepared = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] as string;
    if (chars[i + 1] === NUKTA) {
      if (ch === 'ढ') {
        prepared += 'ड़्ह'; // ढ़ = ड़ + virama + ह, so Sanscript gives r̤h
        i++;
        continue;
      }
      const composed = PRECOMPOSED_NUKTA[ch];
      if (composed) {
        prepared += composed;
        i++;
        continue;
      }
    }
    prepared += ch;
  }
  let iast = Sanscript.t(prepared, 'devanagari', 'iast').normalize('NFC').replace(/~/g, 'm̐');
  for (const [pattern, nasal] of HOMORGANIC_NASAL) iast = iast.replace(pattern, nasal);
  return iast;
}
