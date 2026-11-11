/**
 * Latin "sound key" (PLAN.md C4). Two romanisations that a Hindi speaker would read aloud the
 * same way should get the same key: vishwas / vishvas / viśvāsa → "visvas".
 * The same function runs on the query, on every listed spelling and on the de-accented IAST,
 * so the rules only need to be consistent, not linguistically complete.
 */

/** Lowercase and strip diacritics: śānti → santi, vṛkṣa → vrksa, k͟husī → khusi. */
export function deaccent(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** What a typed Latin query is compared as: de-accented, letters and single spaces only. */
export function cleanLatin(text: string): string {
  return deaccent(text)
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const CONSONANT_START = /^([bcdfghjklmnpqrstvxyz]h?)r[iu]/;

export function soundKey(text: string): string {
  // 1. lowercase, strip combining marks, keep letters only
  let key = deaccent(text).replace(/[^a-z]/g, '');

  // 2. spellings of the same consonant
  key = key
    .replace(/chh/g, 'ch') // छ: chhota / chota
    .replace(/sh/g, 's') // श/ष/स: shanti / santi (this also turns ksh into ks)
    .replace(/x/g, 'ks') // क्ष typed as x: laxmi (addition to the plan)
    .replace(/jn/g, 'gy') // ज्ञ: jnana / gyan
    .replace(/w/g, 'v') // व: vishwas / vishvas
    .replace(/z/g, 'j') // ज़ typed without the nukta: zaroori / jaruri
    .replace(/q/g, 'k')
    .replace(/ph/g, 'f'); // फ / फ़: phool / fool-style spellings

  // 3. ऋ after a first consonant: vriksh / vruksh / vṛkṣa → vrks
  key = key.replace(CONSONANT_START, '$1r');

  // 4. long vowels and doubled letters
  key = key
    .replace(/aa/g, 'a')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/(.)\1+/g, '$1');

  // 5. anusvara written as m: sambandh / sanbandh
  key = key.replace(/m(?=[bcdfghjklnpqrstvxyz])/g, 'n');

  // 6. the final schwa people may or may not type: shabda / shabd
  if (key.endsWith('a') && key.length - 1 >= 3) key = key.slice(0, -1);

  return key;
}
