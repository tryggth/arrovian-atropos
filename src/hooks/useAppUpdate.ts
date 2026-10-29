import { useState, useEffect, useCallback, useRef } from 'react';
import pkg from '../../package.json';

export const DEFAULT_APP_VERSION = pkg.version.startsWith('v')
  ? pkg.version
  : `v${pkg.version}`;

export interface AppUpdateState {
  readonly appVersion: string;
  readonly hasUpdate: boolean;
  readonly latestVersion: string | null;
  readonly applyUpdate: () => void;
  readonly checkForUpdate: () => Promise<void>;
}

interface VersionPayload {
  version?: string;
  buildVersion?: string;
  timestamp?: number;
}

/**
 * Live Source-Driven PWA Auto-Update Hook
 *
 * Pattern modeled on sibling projects (`rummikube` & `triarch`):
 * 1. Inspects Service Worker registration (`reg.waiting`, `reg.update()`, `reg.onupdatefound`).
 * 2. Polls `./version.json?t=...` with `cache: 'no-store'` on mount, every 20s, and on window focus/online.
 * 3. When the source version or buildVersion changes, sets `hasUpdate = true` and automatically
 *    invalidates stale caches, sends `SKIP_WAITING`, and reloads the local PWA.
 */
export function useAppUpdate(
  initialVersion: string = DEFAULT_APP_VERSION
): AppUpdateState {
  const [appVersion, setAppVersion] = useState<string>(initialVersion);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const currentBuildRef = useRef<string | null>(null);
  const currentSemverRef = useRef<string | null>(null);
  const autoUpdatingRef = useRef<boolean>(false);

  const applyUpdate = useCallback(() => {
    if (autoUpdatingRef.current) return;
    autoUpdatingRef.current = true;

    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    } else if (
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      navigator.serviceWorker.controller
    ) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }

    const safeReload = () => {
      if (
        typeof navigator !== 'undefined' &&
        /jsdom/i.test(navigator.userAgent || '')
      ) {
        return;
      }
      window.location.reload();
    };

    if (typeof caches !== 'undefined') {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {})
        .finally(() => {
          safeReload();
        });
    } else {
      safeReload();
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    // 1. Check Service Worker registration state
    if (
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      typeof navigator.serviceWorker.getRegistration === 'function'
    ) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          if (reg.waiting) {
            waitingWorkerRef.current = reg.waiting;
            setHasUpdate(true);
            applyUpdate();
            return;
          }

          reg.update().catch(() => {});

          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (
                  installingWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  waitingWorkerRef.current = installingWorker;
                  setHasUpdate(true);
                  applyUpdate();
                }
              };
            }
          };
        }
      } catch {
        // Ignore SW errors in test or unsupported environments
      }
    }

    // 2. HTTP Poll version.json (NetworkOnly, no-store)
    if (typeof fetch !== 'function') return;

    try {
      const response = await fetch(`./version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as VersionPayload;
        const remoteVer = data.version
          ? data.version.startsWith('v')
            ? data.version
            : `v${data.version}`
          : null;
        const remoteBuild = data.buildVersion ?? remoteVer;

        if (remoteVer) {
          setAppVersion(remoteVer);
        }

        if (remoteBuild) {
          if (!currentBuildRef.current) {
            currentBuildRef.current = remoteBuild;
            currentSemverRef.current = remoteVer;
          } else if (
            currentBuildRef.current !== remoteBuild ||
            (remoteVer && currentSemverRef.current !== remoteVer)
          ) {
            setLatestVersion(remoteVer);
            setHasUpdate(true);
            applyUpdate();
          }
        }
      }
    } catch {
      // Offline or running in unit test environment without version.json server
    }
  }, [applyUpdate]);

  useEffect(() => {
    checkForUpdate();

    const interval = setInterval(checkForUpdate, 20000);
    const handleFocus = () => {
      checkForUpdate();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', checkForUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', checkForUpdate);
    };
  }, [checkForUpdate]);

  return {
    appVersion,
    hasUpdate,
    latestVersion,
    applyUpdate,
    checkForUpdate,
  };
}
