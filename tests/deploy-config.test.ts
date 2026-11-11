import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync('index.html', 'utf8');
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  rewrites: { source: string; destination: string }[];
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const globalHeaders = new Map(vercel.headers.find((h) => h.source === '/(.*)')?.headers.map((h) => [h.key, h.value]));
const csp = globalHeaders.get('Content-Security-Policy') ?? '';

describe('deployment config (vercel.json)', () => {
  it("allows the inline theme script by its exact hash (edit index.html → update the CSP)", () => {
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1] ?? '');
    expect(inline).toHaveLength(1);
    const hash = createHash('sha256').update(inline[0] ?? '').digest('base64');
    expect(csp).toContain(`'sha256-${hash}'`);
  });

  it('keeps the CSP strict: no unsafe-inline scripts, no eval, no third-party scripts', () => {
    const scriptSrc = /script-src ([^;]+)/.exec(csp)?.[1] ?? '';
    expect(scriptSrc).not.toMatch(/unsafe-inline|unsafe-eval|https?:/);
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/connect-src 'self' https:\/\/en\.wiktionary\.org/);
  });

  it('sends the other security headers from PLAN.md C8', () => {
    expect(globalHeaders.get('X-Content-Type-Options')).toBe('nosniff');
    expect(globalHeaders.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(globalHeaders.get('X-Frame-Options')).toBe('DENY');
    expect(globalHeaders.get('Permissions-Policy')).toBeTruthy();
  });

  it('rewrites app routes to index.html but not real files', () => {
    const rewrite = vercel.rewrites[0];
    expect(rewrite?.destination).toBe('/index.html');
    const pattern = new RegExp(`^${rewrite?.source ?? ''}$`);
    for (const path of ['/', '/search', '/w/shabd', '/saved', '/letter/क', '/nope']) expect(pattern.test(path)).toBe(true);
    for (const path of ['/assets/index-abc.js', '/data/entries.json', '/sw.js', '/manifest.webmanifest', '/icons/icon-192.png']) {
      expect(pattern.test(path)).toBe(false);
    }
  });

  it('caches hashed assets for a year and never caches the service worker', () => {
    const cache = (source: string) => vercel.headers.find((h) => h.source === source)?.headers.find((h) => h.key === 'Cache-Control')?.value;
    expect(cache('/assets/(.*)')).toBe('public, max-age=31536000, immutable');
    expect(cache('/sw.js')).toBe('no-cache');
  });
});
