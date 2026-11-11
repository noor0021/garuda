// Dataset validator CLI (PLAN.md C3). Exits 1 on any error, so `npm run check` and CI fail.
// Usage: npm run validate            (checks public/data/entries.json)
//        npm run validate -- <file>  (checks another file)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSearchIndex, search } from '../src/lib/search.ts';
import type { Entry } from '../src/lib/types.ts';
import { VARNAMALA } from '../src/lib/varnamala.ts';
import { validateDataset } from './validate-core.ts';

const file = resolve(process.argv[2] ?? 'public/data/entries.json');

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  console.error(`✖ Could not read ${file}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

// Check 3b uses the real search engine: the spelling an editor lists must find its own word first.
let cachedIndex: { entries: Entry[]; index: ReturnType<typeof createSearchIndex> } | undefined;
const topResult = (query: string, entries: Entry[]): string | undefined => {
  if (cachedIndex?.entries !== entries) cachedIndex = { entries, index: createSearchIndex(entries) };
  return search(cachedIndex.index, query)[0]?.entry.headword;
};

const { errors, summary } = validateDataset(raw, topResult);

console.log(`Dataset: ${file}`);
console.log(`Entries: ${summary.total}`);
console.log(
  'By part of speech: ' +
    Object.entries(summary.byPos)
      .sort((a, b) => b[1] - a[1])
      .map(([pos, n]) => `${pos} ${n}`)
      .join(' · '),
);
console.log(
  'By first letter:   ' +
    VARNAMALA.filter((letter) => summary.byLetter[letter])
      .map((letter) => `${letter} ${summary.byLetter[letter]}`)
      .join(' · '),
);
const empty = VARNAMALA.filter((letter) => !summary.byLetter[letter]);
if (empty.length > 0) console.log(`No words yet for:  ${empty.join(' ')}`);

if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log('\n✓ Dataset is valid');
