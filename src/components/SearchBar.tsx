import { forwardRef } from 'react';
import { CloseIcon, SearchIcon } from './Icons.tsx';

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Enter: open the top result. */
  onSubmit: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar({ value, onChange, onSubmit, onClear, disabled }, ref) {
  return (
    <form
      role="search"
      className="searchbar"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="search-input" className="visually-hidden">
        Search the dictionary in Hindi, romanised Hindi or English
      </label>
      <span className="searchbar-icon">
        <SearchIcon />
      </span>
      <input
        ref={ref}
        id="search-input"
        className="searchbar-input"
        type="search"
        value={value}
        placeholder="धर्म, dharam, peace…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        disabled={disabled}
        aria-describedby="search-hint"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault();
            event.stopPropagation();
            onClear();
          }
        }}
      />
      {value && (
        <button type="button" className="icon-button searchbar-clear" onClick={onClear} aria-label="Clear search">
          <CloseIcon size={18} />
        </button>
      )}
      <span id="search-hint" className="visually-hidden">
        Any spelling works. Press Enter to open the top result.
      </span>
    </form>
  );
});
