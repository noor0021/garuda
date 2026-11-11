import { useOnline } from '../lib/hooks.ts';
import { OfflineIcon } from './Icons.tsx';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <p className="offline-banner" role="status">
      <OfflineIcon /> Offline · all words still available
    </p>
  );
}
