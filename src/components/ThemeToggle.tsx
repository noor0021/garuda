import { useEffect, useRef, useState } from 'react';
import { readThemePreference, saveThemePreference, watchSystemTheme, type ThemePreference } from '../lib/theme.ts';
import { MoonIcon, SunIcon, SystemIcon } from './Icons.tsx';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];
const LABEL: Record<ThemePreference, string> = { system: 'System', light: 'Light', dark: 'Dark' };
const ICON = { system: SystemIcon, light: SunIcon, dark: MoonIcon };

/** Cycles System → Light → Dark. The choice is saved; "System" follows the OS live. */
export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(readThemePreference);
  const latest = useRef(preference);

  useEffect(() => {
    latest.current = preference;
  }, [preference]);
  useEffect(() => watchSystemTheme(() => latest.current), []);

  const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length] ?? 'system';
  const Icon = ICON[preference];

  const onClick = () => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 350);
    saveThemePreference(next);
    setPreference(next);
  };

  return (
    <button type="button" className="icon-button theme-toggle" onClick={onClick} aria-label={`Theme: ${LABEL[preference]}. Switch to ${LABEL[next]}`}>
      <Icon />
      <span className="theme-toggle-label" aria-hidden="true">{LABEL[preference]}</span>
    </button>
  );
}
