/**
 * Wiktionary fallback (PLAN.md C9): for a Devanagari word that is not in Garuda's dictionary,
 * fetch its Hindi definitions from Wiktionary's REST API. Kept strictly apart from search
 * results and clearly labelled in the UI.
 *
 * Pure apart from the injected fetch and storage, so the tests run it with mocks.
 * Returns null whenever there is nothing to show: not Devanagari, offline, timeout, HTTP error,
 * 404, or no Hindi section. The UI then shows the normal no-results state and nothing else.
 */
import { isDevanagari } from './indic.ts';

export type WiktionarySense = { partOfSpeech: string; definition: string };
export type WiktionaryResult = { word: string; url: string; senses: WiktionarySense[] };

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
type Options = {
  fetchImpl?: typeof fetch;
  storage?: StorageLike | null;
  timeoutMs?: number;
  /** Aborts the lookup, e.g. when the user keeps typing. */
  signal?: AbortSignal;
  online?: boolean;
};

export const WIKTIONARY_TIMEOUT_MS = 4000;
export const MAX_SENSES = 3;
const API = 'https://en.wiktionary.org/api/rest_v1/page/definition/';
const CACHE_PREFIX = 'shabd.wiktionary:';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

/** Wiktionary definitions are HTML. The app only ever shows plain text (never innerHTML). */
export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code: string) => {
      if (code[0] === '#') {
        const n = code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : match;
      }
      return ENTITIES[code.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** The word as a Wiktionary page title: NFC, no danda, nukta kept (ज़िंदगी and जिंदगी are separate pages). */
export function wiktionaryTitle(query: string): string {
  return query.normalize('NFC').replace(/[।॥]/g, ' ').replace(/\s+/g, ' ').trim();
}

export const wiktionaryPageUrl = (word: string) => `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}#Hindi`;

type ApiEntry = { partOfSpeech?: unknown; definitions?: { definition?: unknown }[] };

export function parseDefinitions(word: string, body: unknown): WiktionaryResult | null {
  const hindi = (body as { hi?: unknown } | null)?.hi;
  if (!Array.isArray(hindi)) return null;
  const senses: WiktionarySense[] = [];
  for (const entry of hindi as ApiEntry[]) {
    const partOfSpeech = typeof entry.partOfSpeech === 'string' ? entry.partOfSpeech.toLowerCase() : '';
    for (const def of entry.definitions ?? []) {
      if (typeof def.definition !== 'string') continue;
      const definition = htmlToText(def.definition);
      if (definition) senses.push({ partOfSpeech, definition });
      if (senses.length === MAX_SENSES) break;
    }
    if (senses.length === MAX_SENSES) break;
  }
  return senses.length > 0 ? { word, url: wiktionaryPageUrl(word), senses } : null;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function readCache(storage: StorageLike | null, word: string): WiktionaryResult | null | undefined {
  try {
    const raw = storage?.getItem(CACHE_PREFIX + word);
    return raw == null ? undefined : (JSON.parse(raw) as WiktionaryResult | null);
  } catch {
    return undefined;
  }
}

function writeCache(storage: StorageLike | null, word: string, value: WiktionaryResult | null): void {
  try {
    storage?.setItem(CACHE_PREFIX + word, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the next lookup simply fetches again.
  }
}

export async function lookupWiktionary(query: string, options: Options = {}): Promise<WiktionaryResult | null> {
  const { fetchImpl = globalThis.fetch, timeoutMs = WIKTIONARY_TIMEOUT_MS, signal, online = true } = options;
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const word = wiktionaryTitle(query);
  if (!word || !isDevanagari(word) || word.length > 40 || !online) return null;

  const cached = readCache(storage, word);
  if (cached !== undefined) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  try {
    const response = await fetchImpl(API + encodeURIComponent(word), {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'Api-User-Agent': 'GarudaShabd/1.0 (Hindi-English dictionary PWA)' },
    });
    if (response.status === 404) {
      writeCache(storage, word, null); // a definite "no such page": do not ask again this session
      return null;
    }
    if (!response.ok) return null; // 5xx or rate limit: maybe temporary, so not cached
    const result = parseDefinitions(word, await response.json());
    writeCache(storage, word, result);
    return result;
  } catch {
    return null; // timeout, abort, offline, CORS or bad JSON: show nothing extra
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
