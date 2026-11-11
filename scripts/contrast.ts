// Prints the WCAG contrast ratio of every text/background pair in src/styles/tokens.css,
// for both themes, and exits 1 if any pair is below its target.
// Usage: npm run contrast
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No "${selector}" block in tokens.css`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minimum, what it is used for]
const PAIRS: [string, string, number, string][] = [
  ['ink', 'bg', 4.5, 'body text'],
  ['ink', 'surface', 4.5, 'text on cards and the sheet'],
  ['ink-2', 'bg', 4.5, 'secondary text, hints'],
  ['ink-2', 'surface', 4.5, 'secondary text on cards'],
  ['accent', 'bg', 4.5, 'links, IAST, active tab'],
  ['accent', 'surface', 4.5, 'IAST and links on the sheet'],
  ['accent', 'accent-soft', 4.5, 'selected segment, preview line'],
  ['on-accent', 'accent', 4.5, 'text on teal buttons'],
  ['mark-ink', 'mark-soft', 4.5, 'chip text'],
  ['mark-ink', 'surface', 4.5, 'highlighted headword in the example'],
  ['danger', 'bg', 4.5, 'error text'],
  ['danger', 'surface', 4.5, 'error text on cards'],
  ['accent', 'bg', 3, 'focus ring (non-text)'],
  ['mark', 'surface', 3, 'saved star (non-text)'],
  ['line-strong', 'surface', 3, 'search input border (non-text)'],
  ['line-strong', 'bg', 3, 'button borders (non-text)'],
];

let failures = 0;
for (const [theme, selector] of [['light', ':root'], ['dark', ":root[data-theme='dark']"]] as const) {
  const tokens = { ...block(':root'), ...block(selector) };
  console.log(`\n${theme}`);
  for (const [fg, bg, min, use] of PAIRS) {
    const a = tokens[fg];
    const b = tokens[bg];
    if (!a || !b) throw new Error(`Missing token --${fg} or --${bg}`);
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(`  ${ok ? '✓' : '✖'} ${`--${fg} on --${bg}`.padEnd(30)} ${r.toFixed(2).padStart(5)}:1  (≥${min}) ${use}`);
  }
  // Hairlines are decorative separators, not component boundaries, so they have no target.
  console.log(`  · --line on --bg (decorative hairline)  ${ratio(tokens.line ?? '', tokens.bg ?? '').toFixed(2)}:1`);
}
if (failures > 0) {
  console.error(`\n✖ ${failures} pair${failures === 1 ? '' : 's'} below target`);
  process.exit(1);
}
console.log('\n✓ All pairs meet WCAG AA');
