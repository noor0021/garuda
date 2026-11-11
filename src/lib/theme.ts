/**
 * Theme preference: system (default), light or dark. The inline script in index.html applies the
 * same logic before first paint; keep the two in step (the key and the meta colours).
 */
import { useSyncExternalStore } from 'react';
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

// The preference in memory, so a choice still works for this visit when storage is blocked.
let current: ThemePreference | null = null;
const listeners = new Set<() => void>();

export function saveThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') window.localStorage.removeItem(STORAGE_KEYS.theme);
    else window.localStorage.setItem(STORAGE_KEYS.theme, preference);
  } catch {
    // Not saved; the choice still applies until the page is closed.
  }
  current = preference;
  applyTheme(preference);
  listeners.forEach((listener) => listener());
}

export const currentThemePreference = (): ThemePreference => (current ??= readThemePreference());

/**
 * The saved preference as a store. During hydration React uses the server value ("system", as in
 * the prerendered HTML), then re-renders with the saved one: no hydration mismatch.
 */
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    currentThemePreference,
    () => 'system',
  );
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
