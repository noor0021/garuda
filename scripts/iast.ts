// Editor helper: prints the IAST the validator expects for each word given.
// Usage: npm run iast -- शब्द करना
import { toIast } from '../src/lib/iast.ts';

const words = process.argv.slice(2);
if (words.length === 0) {
  console.error('Usage: npm run iast -- <Devanagari word> [more words]');
  process.exit(1);
}
for (const word of words) console.log(`${word}\t${toIast(word)}`);
