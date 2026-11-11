import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from '../src/lib/settings.ts';

describe('settings', () => {
  it('uses the defaults when nothing (or garbage) is stored', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('large')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and replaces only the invalid ones', () => {
    expect(parseSettings({ textSize: 'large', motion: 'sideways', intro: false, speechRate: 1 })).toEqual({
      textSize: 'large',
      motion: 'system',
      intro: false,
      speechRate: 'slow',
    });
  });

  it('matches the keys the inline script in index.html reads', async () => {
    const { readFileSync } = await import('node:fs');
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain("'shabd.settings'");
    expect(html).toContain("'shabd.intro'");
    expect(html).toContain('data-text-size');
    expect(html).toContain('data-motion');
  });
});
