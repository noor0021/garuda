import { onLinkClick } from '../lib/router.ts';
import { GarudaMark } from './GarudaMark.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

export function Header() {
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
      <ThemeToggle />
    </header>
  );
}
