/**
 * Dataset checks from PLAN.md C3. Pure function: takes the parsed JSON, returns every problem found.
 * The CLI (validate-data.ts) and the mutation tests (tests/validator.test.ts) both call this.
 */
import { toIast } from '../src/lib/iast.ts';
import { normaliseDevanagari } from '../src/lib/indic.ts';
import { entryShapeErrors, POS_VALUES, type Entry } from '../src/lib/types.ts';
import { firstLetter, VARNAMALA } from '../src/lib/varnamala.ts';

/**
 * Common English words a romanised spelling must not be (PLAN.md C2). A reader who types
 * "mat" or "pet" wants the English word, so a Hindi entry must not claim that spelling.
 * Loanwords that mean the same thing in both languages (guru, yoga) are fine and not listed.
 */
const ENGLISH_WORDS = new Set(
  `a an and are as at bad bag ban bar bat bed bet bin bit box boy bus but by can cap car cat chain
   dam day did die dig dill dim din do dog door dot dull fan far fat fit fool for fun gap gas get git go
   god gun had ham hand has hat hath he her him his hit hot hum in is it jab jam jar job jug kit lab lag
   lap led leg let lid log lot mad main man mat me men more mud nag net no nor not of on or our out pal
   pan par pass pat pen per pet pin pit pita pot put rag ram ran rang rat raw red rib rid rim rip rob rod
   rot rub rug run sad sag sat sham she sin sir sit so sob son sum sun sunder tab tag tan tap tar tea ten
   the tin tip to toe ton too top toy tub tug up us use van wed wet win wit yes yet you`
    .split(/\s+/)
    .filter(Boolean),
);

export type Summary = {
  total: number;
  byPos: Record<string, number>;
  byLetter: Record<string, number>;
};

export type ValidationResult = { errors: string[]; summary: Summary };

/** Optional hook for check 3b: given a spelling, return the headword search ranks first. */
export type TopResult = (query: string, entries: Entry[]) => string | undefined;

export function validateDataset(raw: unknown, topResult?: TopResult): ValidationResult {
  const errors: string[] = [];
  const summary: Summary = { total: 0, byPos: {}, byLetter: {} };

  if (typeof raw !== 'object' || raw === null) return { errors: ['file is not a JSON object'], summary };
  const data = raw as Record<string, unknown>;
  if (typeof data.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(data.version)) {
    errors.push('version must be a semver string such as "1.0.0"');
  }
  if (!Array.isArray(data.entries) || data.entries.length === 0) {
    errors.push('entries must be a non-empty array');
    return { errors, summary };
  }

  // Check 1: shape. Entries that fail it are skipped by the later checks.
  const entries: Entry[] = [];
  data.entries.forEach((rawEntry, i) => {
    const shape = entryShapeErrors(rawEntry);
    if (shape.length > 0) {
      const id = (rawEntry as { id?: unknown } | null)?.id;
      errors.push(`entry #${i + 1} (id ${String(id)}): ${shape.join('; ')}`);
    } else {
      entries.push(rawEntry as Entry);
    }
  });

  const seenIds = new Map<number, string>();
  const seenHeadwords = new Map<string, number>();
  const seenSpellings = new Map<string, Entry>();

  for (const entry of entries) {
    const where = `id ${entry.id} ${entry.headword}`;

    // Check 1: unique ids and headwords.
    const idOwner = seenIds.get(entry.id);
    if (idOwner !== undefined) errors.push(`${where}: duplicate id (also used by ${idOwner})`);
    seenIds.set(entry.id, entry.headword);

    const headwordNorm = normaliseDevanagari(entry.headword);
    const headwordOwner = seenHeadwords.get(headwordNorm);
    if (headwordOwner !== undefined) errors.push(`${where}: duplicate headword (also id ${headwordOwner})`);
    seenHeadwords.set(headwordNorm, entry.id);

    if (!/^[ऀ-ॿ]+$/.test(entry.headword)) {
      errors.push(`${where}: headword must be a single Devanagari word`);
    }
    if (entry.headword !== entry.headword.normalize('NFC')) {
      errors.push(`${where}: headword is not NFC-normalised`);
    }

    // Check 2: IAST matches the transliteration helper.
    const expected = toIast(entry.headword);
    if (entry.transliteration !== expected) {
      errors.push(`${where}: transliteration is "${entry.transliteration}", expected "${expected}"`);
    }

    // Checks 3a and 4: spellings are plain lowercase, realistic in number, and owned by one entry.
    if (entry.romanised.length < 2 || entry.romanised.length > 4) {
      errors.push(`${where}: needs 2–4 romanised spellings, has ${entry.romanised.length}`);
    }
    for (const spelling of entry.romanised) {
      if (!/^[a-z]+$/.test(spelling)) {
        errors.push(`${where}: spelling "${spelling}" must be lowercase a–z only`);
        continue;
      }
      if (spelling.length < 2) errors.push(`${where}: spelling "${spelling}" is too short`);
      if (ENGLISH_WORDS.has(spelling)) {
        errors.push(`${where}: spelling "${spelling}" is a common English word`);
      }
      const owner = seenSpellings.get(spelling);
      if (owner && owner.id === entry.id) {
        errors.push(`${where}: spelling "${spelling}" is listed twice`);
      } else if (owner) {
        errors.push(`${where}: spelling "${spelling}" collides with id ${owner.id} ${owner.headword}`);
      }
      seenSpellings.set(spelling, entry);
    }

    // Check 5: the example uses the headword exactly.
    if (!entry.example.normalize('NFC').includes(entry.headword.normalize('NFC'))) {
      errors.push(`${where}: example does not contain the headword`);
    }
    if (!/[।?!]$/.test(entry.example.trim())) {
      errors.push(`${where}: example must end with । ? or !`);
    }

    // Check 6: part of speech from the allowed list (nouns therefore always carry a gender).
    if (!(POS_VALUES as readonly string[]).includes(entry.pos)) {
      errors.push(`${where}: pos "${entry.pos}" is not allowed (use one of: ${POS_VALUES.join(', ')})`);
    }

    const meanings = entry.meanings.map((m) => m.trim().toLowerCase());
    if (new Set(meanings).size !== meanings.length) errors.push(`${where}: a meaning is listed twice`);
    if (entry.meanings.some((m) => m !== m.trim())) errors.push(`${where}: a meaning has stray spaces`);

    const letter = firstLetter(entry.headword);
    if (!(VARNAMALA as readonly string[]).includes(letter)) {
      errors.push(`${where}: headword does not start with a वर्णमाला letter`);
    }

    summary.byPos[entry.pos] = (summary.byPos[entry.pos] ?? 0) + 1;
    summary.byLetter[letter] = (summary.byLetter[letter] ?? 0) + 1;
  }
  summary.total = entries.length;

  // Check 3b: typing any listed spelling must bring up its own entry first.
  // TODO(Step 3): the CLI passes the real search engine in as `topResult`.
  if (topResult) {
    for (const entry of entries) {
      for (const spelling of entry.romanised) {
        if (!/^[a-z]+$/.test(spelling)) continue;
        const top = topResult(spelling, entries);
        if (top !== entry.headword) {
          errors.push(
            `id ${entry.id} ${entry.headword}: searching "${spelling}" returns ${top ?? 'nothing'} first`,
          );
        }
      }
    }
  }

  return { errors, summary };
}
