// Measures average search time over the full dataset: 1,000 runs of 20 mixed queries.
// Usage: npm run bench
import { createSearchIndex, search } from '../src/lib/search.ts';
import { dataset, MIXED_QUERIES } from '../tests/fixtures.ts';

const buildStart = performance.now();
const index = createSearchIndex(dataset.entries);
const buildMs = performance.now() - buildStart;

for (let i = 0; i < 50; i++) for (const q of MIXED_QUERIES) search(index, q); // warm up the JIT

const RUNS = 1000;
const perQuery = new Map<string, number>();
const start = performance.now();
for (let i = 0; i < RUNS; i++) {
  for (const q of MIXED_QUERIES) {
    const t = performance.now();
    search(index, q);
    perQuery.set(q, (perQuery.get(q) ?? 0) + performance.now() - t);
  }
}
const total = performance.now() - start;
const avg = total / (RUNS * MIXED_QUERIES.length);
const slowest = [...perQuery].sort((a, b) => b[1] - a[1]).slice(0, 3);

console.log(`Entries: ${dataset.entries.length} · Node ${process.version}`);
console.log(`Index build: ${buildMs.toFixed(2)} ms (once, at load)`);
console.log(`Average search: ${(avg * 1000).toFixed(1)} µs (${avg.toFixed(3)} ms) over ${RUNS * MIXED_QUERIES.length} searches`);
console.log('Slowest queries: ' + slowest.map(([q, ms]) => `"${q.trim()}" ${((ms / RUNS) * 1000).toFixed(1)} µs`).join(' · '));
