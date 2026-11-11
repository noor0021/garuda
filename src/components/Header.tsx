import { onLinkClick } from '../lib/router.ts';
import { GarudaMark } from './GarudaMark.tsx';
import { GearIcon } from './Icons.tsx';

export function Header({ onOpenSettings, onStartTour }: { onOpenSettings: () => void; onStartTour: () => void }) {
  return (
    <header className="topbar">
      <a href="/" className="brand" onClick={onLinkClick}>
        <GarudaMark />
        <span className="brand-text">
          <span className="brand-name">
            <span lang="hi">शब्द</span> · Shabd
          </span>
          <span className="brand-by">Garuda Prakashan</span>
        </span>
      </a>
      <div className="topbar-actions" data-tour="theme">
        <button type="button" className="icon-button tour-button-open" onClick={onStartTour} aria-haspopup="dialog" aria-label="Take the guided tour" title="Take the tour">
          <span aria-hidden="true">?</span>
        </button>
        <button type="button" className="icon-button settings-button" onClick={onOpenSettings} aria-haspopup="dialog">
          <GearIcon />
          <span className="settings-button-label">Settings</span>
        </button>
      </div>
    </header>
  );
}
