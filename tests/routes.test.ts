import { describe, expect, it } from 'vitest';
import { parseRoute, routeHref, type Route } from '../src/lib/routes.ts';
import { buildDictionary, neighbours, slugOf } from '../src/lib/dictionary.ts';
import { dataset } from './fixtures.ts';

describe('routes', () => {
  it.each([
    ['/', '', { name: 'home' }],
    ['/search', '?q=dharam', { name: 'search', q: 'dharam' }],
    ['/search', '?q=%E0%A4%A7%E0%A4%B0%E0%A5%8D%E0%A4%AE', { name: 'search', q: 'धर्म' }],
    ['/search', '?q=', { name: 'home' }],
    ['/w/shabd', '', { name: 'entry', slug: 'shabd' }],
    ['/saved/', '', { name: 'saved' }],
    ['/letter/%E0%A4%95', '', { name: 'letter', letter: 'क' }],
    ['/letter/%E0%A4%95%E0%A5%8D%E0%A4%B7', '', { name: 'letter', letter: 'क्ष' }],
    ['/letter/x', '', { name: 'notFound', path: '/letter/x' }],
    ['/w/Bad%Slug', '', { name: 'notFound', path: '/w/Bad%Slug' }],
    ['/anything', '', { name: 'notFound', path: '/anything' }],
  ] as [string, string, Route][])('%s%s', (path, search, route) => {
    expect(parseRoute(path, search)).toEqual(route);
  });

  it('round-trips every route through its href', () => {
    const routes: Route[] = [
      { name: 'home' },
      { name: 'search', q: 'शांति peace' },
      { name: 'entry', slug: 'dharm' },
      { name: 'saved' },
      { name: 'letter', letter: 'ज्ञ' },
    ];
    for (const route of routes) {
      const url = new URL(routeHref(route), 'https://example.test');
      expect(parseRoute(url.pathname, url.search)).toEqual(route);
    }
  });
});

describe('dictionary', () => {
  const dictionary = buildDictionary(dataset);

  it('gives every entry a unique slug', () => {
    expect(dictionary.bySlug.size).toBe(dataset.entries.length);
    expect(dictionary.bySlug.get('shabd')?.headword).toBe('शब्द');
  });

  it('orders entries by वर्णमाला and links previous/next', () => {
    expect(dictionary.ordered[0]?.headword).toBe('अग्नि');
    expect(dictionary.ordered.at(-1)?.headword).toBe('ज्ञान');
    const shabd = dictionary.bySlug.get('shabd');
    if (!shabd) throw new Error('missing शब्द');
    const { prev, next } = neighbours(dictionary, shabd);
    expect(prev && slugOf(prev)).toBeTruthy();
    expect(next && neighbours(dictionary, next).prev).toBe(shabd);
  });

  it('rejects a broken file with a readable message', () => {
    expect(() => buildDictionary({ version: '1.0.0', entries: [{ id: 1 }] })).toThrow(/Entry 1 is broken/);
    expect(() => buildDictionary(null)).toThrow(/not an object/);
  });
});
