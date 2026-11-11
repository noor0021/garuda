import { onLinkClick } from '../lib/router.ts';
import { GarudaMark } from './GarudaMark.tsx';
import { GearIcon } from './Icons.tsx';

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
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
      <button type="button" className="icon-button settings-button" onClick={onOpenSettings} aria-haspopup="dialog">
        <GearIcon />
        <span className="settings-button-label">Settings</span>
      </button>
    </header>
  );
}
