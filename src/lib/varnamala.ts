/**
 * वर्णमाला order, used for the browse grid, for sorting and for previous/next.
 * क्ष, त्र and ज्ञ are listed as letters of their own, the way Hindi primers and many
 * printed dictionaries group them, so words such as क्षमा do not hide under क.
 */
import { normaliseDevanagari } from './indic.ts';

export const VARNAMALA = [
  'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ',
  'क', 'ख', 'ग', 'घ', 'ङ',
  'च', 'छ', 'ज', 'झ', 'ञ',
  'ट', 'ठ', 'ड', 'ढ', 'ण',
  'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म',
  'य', 'र', 'ल', 'व',
  'श', 'ष', 'स', 'ह',
  'क्ष', 'त्र', 'ज्ञ',
] as const;

const CONJUNCT_LETTERS = ['क्ष', 'त्र', 'ज्ञ'];
const RANK = new Map<string, number>(VARNAMALA.map((letter, i) => [letter, i]));

/** The वर्णमाला letter a headword is filed under ('' if it does not start with one). */
export function firstLetter(headword: string): string {
  const word = normaliseDevanagari(headword);
  const conjunct = CONJUNCT_LETTERS.find((c) => word.startsWith(c));
  if (conjunct) return conjunct;
  const first = [...word][0] ?? '';
  return RANK.has(first) ? first : '';
}

/**
 * Dictionary order for two headwords: by वर्णमाला letter first, then by code point.
 * Within one letter, Unicode order already matches Hindi dictionary order: anusvara forms,
 * then the bare consonant, then the matras ा ि ी ु ू ृ े ै ो ौ, then conjuncts.
 */
export function compareVarnamala(a: string, b: string): number {
  const rankA = RANK.get(firstLetter(a)) ?? VARNAMALA.length;
  const rankB = RANK.get(firstLetter(b)) ?? VARNAMALA.length;
  if (rankA !== rankB) return rankA - rankB;
  const normA = normaliseDevanagari(a);
  const normB = normaliseDevanagari(b);
  return normA < normB ? -1 : normA > normB ? 1 : 0;
}
