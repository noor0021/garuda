import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Registers the service worker. When a new version (new code or new words) has been downloaded,
 * offers a refresh instead of reloading by itself mid-search.
 */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      // No service worker (unsupported, private mode, or blocked): the app still works online.
    },
  });

  if (!needRefresh) return null;
  return (
    <div className="toast" role="status">
      <span>New version available</span>
      <button type="button" className="text-button" onClick={() => void updateServiceWorker(true)}>
        Refresh
      </button>
      <button type="button" className="text-button toast-dismiss" onClick={() => setNeedRefresh(false)} aria-label="Dismiss">
        Later
      </button>
    </div>
  );
}
