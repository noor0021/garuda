/**
 * The app's mark: a shirorekha (the headline Devanagari letters hang from) in ink, and hanging
 * from it one vermilion stroke that sweeps into a wing-tip, for Garuda. Original geometry; the
 * same two paths are public/logo.svg and the source of the app icons.
 */
export function GarudaMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path fill="var(--ink)" d="M3 5h26v5H3z" />
      <path fill="var(--accent)" d="M16.5 10h5v7c0 8-7.5 11.5-17.5 11 7-1.5 12.5-5 12.5-11z" />
    </svg>
  );
}
