/**
 * Theme preference: system (default), light or dark. The inline script in index.html applies the
 * same logic before first paint; keep the two in step (the key and the meta colours).
 */
import { STORAGE_KEYS } from './storage.ts';

export type ThemePreference = 'system' | 'light' | 'dark';
export const THEME_COLORS = { light: '#FAF6EE', dark: '#141312' } as const;

const isPreference = (v: unknown): v is ThemePreference => v === 'system' || v === 'light' || v === 'dark';
const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export function readThemePreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(STORAGE_KEYS.theme);
    return isPreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(preference: ThemePreference): void {
  const dark = preference === 'dark' || (preference === 'system' && systemDark());
  const theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') window.localStorage.removeItem(STORAGE_KEYS.theme);
    else window.localStorage.setItem(STORAGE_KEYS.theme, preference);
  } catch {
    // Not saved; the choice still applies until the page is closed.
  }
  applyTheme(preference);
}

/** Follows OS theme changes while the preference is "system". Returns an unsubscribe function. */
export function watchSystemTheme(getPreference: () => ThemePreference): () => void {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (getPreference() === 'system') applyTheme('system');
  };
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
