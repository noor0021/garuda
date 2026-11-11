/**
 * Reader settings, kept on the device. Theme has its own key (src/lib/theme.ts) because the
 * inline script in index.html reads it before first paint; the inline script also applies
 * textSize and motion from this key, so nothing jumps when the page loads.
 */
import { useSyncExternalStore } from 'react';
import { STORAGE_KEYS } from './storage.ts';

export type Settings = {
  /** "large" scales reading text (headwords, meanings, examples) by 1.15. */
  textSize: 'default' | 'large';
  /** "system" follows prefers-reduced-motion; "off" disables every animation; "on" keeps them. */
  motion: 'system' | 'on' | 'off';
  /** Show the animated intro when the app is opened (once per session, home page only). */
  intro: boolean;
  /** Speed of the Listen button. */
  speechRate: 'slow' | 'normal';
};

export const DEFAULT_SETTINGS: Settings = { textSize: 'default', motion: 'system', intro: true, speechRate: 'slow' };
export const SPEECH_RATE: Record<Settings['speechRate'], number> = { slow: 0.75, normal: 0.95 };

const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;

/** Reads whatever is stored, keeping valid fields and replacing anything else with the default. */
export function parseSettings(raw: unknown): Settings {
  const s = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    textSize: oneOf(s.textSize, ['default', 'large'], DEFAULT_SETTINGS.textSize),
    motion: oneOf(s.motion, ['system', 'on', 'off'], DEFAULT_SETTINGS.motion),
    intro: typeof s.intro === 'boolean' ? s.intro : DEFAULT_SETTINGS.intro,
    speechRate: oneOf(s.speechRate, ['slow', 'normal'], DEFAULT_SETTINGS.speechRate),
  };
}

let current: Settings | null = null;
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  if (current) return current;
  try {
    current = parseSettings(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.settings) ?? '{}'));
  } catch {
    current = DEFAULT_SETTINGS;
  }
  return current;
}

/** Mirrors the settings onto <html> as data attributes, which the CSS and motion code read. */
export function applySettings(settings: Settings): void {
  const root = document.documentElement;
  if (settings.textSize === 'large') root.dataset.textSize = 'large';
  else delete root.dataset.textSize;
  if (settings.motion === 'system') delete root.dataset.motion;
  else root.dataset.motion = settings.motion;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...getSettings(), ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(current));
  } catch {
    // Storage blocked: the change still applies for this visit.
  }
  applySettings(current);
  listeners.forEach((listener) => listener());
}

/** Settings as a store; during hydration React uses the defaults the prerendered HTML was built with. */
export function useSettings(): Settings {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSettings,
    () => DEFAULT_SETTINGS,
  );
}

/** True when animations should not run: the in-app setting wins over the system preference. */
export function motionDisabled(): boolean {
  const choice = document.documentElement.dataset.motion;
  if (choice === 'off') return true;
  if (choice === 'on') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
