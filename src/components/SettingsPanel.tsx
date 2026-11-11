import { useState, type ReactNode } from 'react';
import type { Dictionary } from '../lib/dictionary.ts';
import { useHindiVoice } from '../lib/hooks.ts';
import { updateSettings, useSettings, type Settings } from '../lib/settings.ts';
import { saveThemePreference, useThemePreference, type ThemePreference } from '../lib/theme.ts';
import { useRecent, useSaved } from '../lib/user-data.ts';
import { CloseIcon } from './Icons.tsx';

/** A labelled group of radio buttons drawn as a segmented control. */
function Choice<T extends string>({ legend, hint, name, value, options, onChange }: {
  legend: string;
  hint?: string;
  name: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="setting">
      <legend className="setting-label">{legend}</legend>
      {hint && <p className="setting-hint">{hint}</p>}
      <div className="choice">
        {options.map(([option, label]) => (
          <label key={option} className="choice-option">
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Row({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="setting setting-row">
      <div className="setting-text">
        <span className="setting-label">{label}</span>
        {hint && <span className="setting-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** A destructive button that asks for a second tap instead of a blocking confirm(). */
function ConfirmButton({ label, confirmLabel, disabled, onConfirm }: { label: string; confirmLabel: string; disabled?: boolean; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      className={`small-button${armed ? ' small-button-danger' : ''}`}
      disabled={disabled}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          window.setTimeout(() => setArmed(false), 3000);
          return;
        }
        setArmed(false);
        onConfirm();
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

type Props = { dictionary: Dictionary | null; onClose: () => void; onReplayIntro: () => void };

/** Every setting in one place (opened from the gear in the header). */
export function SettingsPanel({ dictionary, onClose, onReplayIntro }: Props) {
  const settings = useSettings();
  const theme = useThemePreference();
  const voice = useHindiVoice();
  const saved = useSaved();
  const recent = useRecent();
  const set = (patch: Partial<Settings>) => updateSettings(patch);
  const offlineReady = typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller);

  return (
    <div className="settings">
      <div className="settings-head">
        <h2 id="settings-title" className="settings-title">
          Settings <span lang="hi">· सेटिंग्स</span>
        </h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings">
          <CloseIcon />
        </button>
      </div>

      <section className="settings-group" aria-labelledby="settings-look">
        <h3 id="settings-look" className="settings-group-title">Appearance</h3>
        <Choice<ThemePreference>
          legend="Theme"
          name="theme"
          value={theme}
          options={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]}
          onChange={(value) => {
            const root = document.documentElement;
            root.classList.add('theme-transition');
            window.setTimeout(() => root.classList.remove('theme-transition'), 350);
            saveThemePreference(value);
          }}
        />
        <Choice<Settings['textSize']>
          legend="Text size"
          hint="Larger headwords, meanings and examples."
          name="text-size"
          value={settings.textSize}
          options={[['default', 'Default'], ['large', 'Large']]}
          onChange={(textSize) => set({ textSize })}
        />
      </section>

      <section className="settings-group" aria-labelledby="settings-motion">
        <h3 id="settings-motion" className="settings-group-title">Motion and sound</h3>
        <Choice<Settings['motion']>
          legend="Animations"
          hint="System follows your device's reduce-motion setting."
          name="motion"
          value={settings.motion}
          options={[['system', 'System'], ['on', 'On'], ['off', 'Off']]}
          onChange={(motion) => set({ motion })}
        />
        <label className="setting setting-row" htmlFor="setting-intro">
          <span className="setting-text">
            <span className="setting-label" id="setting-intro-label">Intro when the app opens</span>
            <span className="setting-hint">Once per visit, on the home page only.</span>
          </span>
          <input
            id="setting-intro"
            aria-labelledby="setting-intro-label"
            type="checkbox"
            role="switch"
            className="switch"
            checked={settings.intro}
            aria-checked={settings.intro}
            onChange={(event) => set({ intro: event.target.checked })}
          />
        </label>
        {voice ? (
          <Choice<Settings['speechRate']>
            legend="Listen speed"
            name="speech-rate"
            value={settings.speechRate}
            options={[['slow', 'Slow'], ['normal', 'Normal']]}
            onChange={(speechRate) => set({ speechRate })}
          />
        ) : (
          <div className="setting">
            <span className="setting-label">Listen</span>
            <span className="setting-hint">This device has no Hindi voice, so the Listen button is hidden.</span>
          </div>
        )}
      </section>

      <section className="settings-group" aria-labelledby="settings-data">
        <h3 id="settings-data" className="settings-group-title">Your data</h3>
        <Row label="Recent searches" hint={`${recent.items.length} on this device`}>
          <ConfirmButton label="Clear" confirmLabel="Tap to confirm" disabled={recent.items.length === 0} onConfirm={recent.clear} />
        </Row>
        <Row label="Saved words" hint={`${saved.ids.length} on this device`}>
          <ConfirmButton label="Clear all" confirmLabel="Tap to confirm" disabled={saved.ids.length === 0} onConfirm={() => saved.ids.forEach(saved.remove)} />
        </Row>
        <p className="setting-hint settings-note">Everything stays on this device. There are no accounts and nothing is sent anywhere.</p>
      </section>

      <section className="settings-group" aria-labelledby="settings-about">
        <h3 id="settings-about" className="settings-group-title">About</h3>
        <Row
          label="Garuda Shabd"
          hint={dictionary ? `Dictionary version ${dictionary.version} · ${dictionary.ordered.length} words` : 'Loading dictionary…'}
        >
          <span className={`status${offlineReady ? ' status-ok' : ''}`}>{offlineReady ? 'Works offline' : 'Online'}</span>
        </Row>
        <Row label="Intro" hint="Watch the opening animation again.">
          <button type="button" className="small-button" onClick={onReplayIntro}>
            Replay
          </button>
        </Row>
        <p className="setting-hint settings-note">
          A Hindi–English dictionary for Garuda Prakashan. Words missing from it can be looked up on Wiktionary from the no-results screen.{' '}
          <a href="https://github.com/noor0021/garuda/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
            How editors add words
          </a>
          .
        </p>
      </section>
    </div>
  );
}
