/**
 * Devanagari helpers for search. Pure string functions, no DOM and no dependencies,
 * so the same code runs in the browser, the tests and the validator.
 */

const DEVANAGARI = /[ऀ-ॿ]/;
const NUKTA = '़';

/** A query counts as Devanagari if it has any character in U+0900–U+097F. */
export function isDevanagari(text: string): boolean {
  return DEVANAGARI.test(text);
}

/**
 * Normalises Devanagari so that visually identical spellings compare equal:
 * - NFC (this also splits the precomposed nukta letters such as U+095B into letter + nukta)
 * - zero-width joiner / non-joiner removed
 * - nukta dropped (ज़→ज, फ़→फ), except on ड and ढ, where ड़/ढ़ are different sounds in Hindi
 * - chandrabindu ँ → anusvara ं (people type either)
 * - dandas and surrounding spaces trimmed
 */
export function normaliseDevanagari(text: string): string {
  const chars = [...text.normalize('NFC').replace(/[‌‍]/g, '')];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === NUKTA) {
      const prev = chars[i - 1];
      if (prev === 'ड' || prev === 'ढ') out += ch;
      continue;
    }
    out += ch === 'ँ' ? 'ं' : ch;
  }
  return out.replace(/[।॥]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * A looser Devanagari key for "sounds like" matching. On top of normaliseDevanagari it folds
 * the three spelling habits that most often differ between writers of the same word:
 * - half nasal vs anusvara: शान्ति / शांति, हिन्दी / हिंदी
 * - long vs short i and u: शांती / शांति
 * - ड़/ढ़ typed without the nukta: पढना / पढ़ना
 */
export function devanagariSoundKey(text: string): string {
  return normaliseDevanagari(text)
    .replace(/[ङञणनम]्(?=[क-ह])/g, 'ं')
    .replace(/़/g, '')
    .replace(/ी/g, 'ि')
    .replace(/ू/g, 'ु')
    .replace(/ई/g, 'इ')
    .replace(/ऊ/g, 'उ');
}
