/**
 * localStorage that never throws. Safari private mode, blocked cookies and full quotas all make
 * storage access throw; the app must keep working (PLAN.md C7), just without remembering things.
 */
export function readJson<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: keep the in-memory value for this session.
  }
}

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string');

export const STORAGE_KEYS = {
  theme: 'shabd.theme',
  saved: 'shabd.saved',
  recent: 'shabd.recent',
  settings: 'shabd.settings',
  /** sessionStorage: set once the intro has played in this session. */
  introSeen: 'shabd.intro',
} as const;
