import { afterEach, describe, expect, it, vi } from 'vitest';
import { htmlToText, lookupWiktionary, MAX_SENSES, parseDefinitions, WIKTIONARY_TIMEOUT_MS } from '../src/lib/wiktionary.ts';

/** A response shaped like the real one for किसान (checked with curl before writing this). */
const KISAN = {
  hi: [
    {
      partOfSpeech: 'Noun',
      language: 'Hindi',
      definitions: [
        { definition: '<a rel="mw:WikiLink" href="/wiki/farmer" title="farmer">farmer</a>, <a rel="mw:WikiLink" href="/wiki/peasant">peasant</a>' },
        { definition: '<span class="usage-label-sense"></span>' },
        { definition: 'a &quot;tiller&quot; of land &amp; soil' },
        { definition: 'fourth sense' },
        { definition: 'fifth sense' },
      ],
    },
  ],
  ne: [{ partOfSpeech: 'Noun', language: 'Nepali', definitions: [{ definition: 'Nepali sense' }] }],
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const memoryStorage = () => {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), map };
};

afterEach(() => {
  vi.useRealTimers();
});

describe('Wiktionary fallback', () => {
  it('success: returns up to 3 plain-text Hindi senses and a source link', async () => {
    const fetchImpl = vi.fn(async () => json(KISAN));
    const result = await lookupWiktionary('किसान', { fetchImpl, storage: null });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://en.wiktionary.org/api/rest_v1/page/definition/%E0%A4%95%E0%A4%BF%E0%A4%B8%E0%A4%BE%E0%A4%A8',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result).toEqual({
      word: 'किसान',
      url: 'https://en.wiktionary.org/wiki/%E0%A4%95%E0%A4%BF%E0%A4%B8%E0%A4%BE%E0%A4%A8#Hindi',
      senses: [
        { partOfSpeech: 'noun', definition: 'farmer, peasant' },
        { partOfSpeech: 'noun', definition: 'a "tiller" of land & soil' },
        { partOfSpeech: 'noun', definition: 'fourth sense' },
      ],
    });
    expect(result?.senses).toHaveLength(MAX_SENSES);
  });

  it('timeout: gives up after 4 s and returns null', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );
    const pending = lookupWiktionary('किसान', { fetchImpl, storage: null });
    await vi.advanceTimersByTimeAsync(WIKTIONARY_TIMEOUT_MS - 1);
    let settled = false;
    void pending.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toBeNull();
  });

  it('404: returns null and remembers it for the session', async () => {
    const storage = memoryStorage();
    const fetchImpl = vi.fn(async () => json({ status: 404, type: 'not_found' }, 404));
    await expect(lookupWiktionary('खखखख', { fetchImpl, storage })).resolves.toBeNull();
    await expect(lookupWiktionary('खखखख', { fetchImpl, storage })).resolves.toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('no hi section: returns null (other languages are ignored)', async () => {
    const fetchImpl = vi.fn(async () => json({ ne: KISAN.ne, other: [] }));
    await expect(lookupWiktionary('किसान', { fetchImpl, storage: null })).resolves.toBeNull();
  });

  it('server error: returns null and does not cache it (may be temporary)', async () => {
    const storage = memoryStorage();
    const fetchImpl = vi.fn(async () => json({}, 503));
    await expect(lookupWiktionary('किसान', { fetchImpl, storage })).resolves.toBeNull();
    expect(storage.map.size).toBe(0);
  });

  it('network failure: returns null instead of throwing', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(lookupWiktionary('किसान', { fetchImpl, storage: null })).resolves.toBeNull();
  });

  it('caches successful lookups per word in session storage', async () => {
    const storage = memoryStorage();
    const fetchImpl = vi.fn(async () => json(KISAN));
    const first = await lookupWiktionary('किसान', { fetchImpl, storage });
    const second = await lookupWiktionary('किसान।', { fetchImpl, storage });
    expect(second).toEqual(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('never calls the network for Latin queries or when offline', async () => {
    const fetchImpl = vi.fn(async () => json(KISAN));
    await expect(lookupWiktionary('kisan', { fetchImpl, storage: null })).resolves.toBeNull();
    await expect(lookupWiktionary('किसान', { fetchImpl, storage: null, online: false })).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('stops when the caller aborts (the user kept typing)', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );
    const pending = lookupWiktionary('किसान', { fetchImpl, storage: null, signal: controller.signal });
    controller.abort();
    await expect(pending).resolves.toBeNull();
  });
});

describe('htmlToText', () => {
  it('strips tags and decodes entities, so nothing is ever rendered as HTML', () => {
    expect(htmlToText('<a href="/wiki/x">water</a> <img src=x onerror=alert(1)>&lt;b&gt; &#2309; &#x905;')).toBe('water <b> अ अ');
    expect(parseDefinitions('x', { hi: [{ definitions: [{ definition: '<span></span>' }] }] })).toBeNull();
  });
});
