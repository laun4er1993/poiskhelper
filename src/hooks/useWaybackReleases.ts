// =====================================================
// src/hooks/useWaybackReleases.ts
// React-хук для управления списком релизов Esri Wayback
// =====================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  WaybackRelease,
  loadCachedReleases,
  isCacheFresh,
  getWaybackReleases,
  fetchWaybackReleases,
} from '../services/map-sources/wayback';

// -----------------------------------------------------
// Состояние
// -----------------------------------------------------
export type WaybackStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseWaybackReleasesResult {
  releases: WaybackRelease[];
  status: WaybackStatus;
  errorMessage: string | null;
  lastFetchedAt: number | null;
  isFresh: boolean;
  refresh: () => Promise<void>;
}

// -----------------------------------------------------
// Хук
// -----------------------------------------------------
export function useWaybackReleases(
  autoLoad: boolean = true
): UseWaybackReleasesResult {
  const [releases, setReleases] = useState<WaybackRelease[]>(function () {
    return getWaybackReleases();
  });
  const [status, setStatus] = useState<WaybackStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(
    function () {
      const cached = loadCachedReleases();
      return cached ? cached.fetchedAt : null;
    }
  );

  const isFresh = useMemo(
    function () {
      const cached = loadCachedReleases();
      return isCacheFresh(cached);
    },
    [lastFetchedAt]
  );

  // -----------------------------------------------------
  // Обновление
  // -----------------------------------------------------
  const refresh = useCallback(async function () {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchWaybackReleases();
      setReleases(result.releases);
      setLastFetchedAt(result.fetchedAt);
      setStatus('success');
      // Автоскрытие статуса «успех» через 3 сек
      setTimeout(function () {
        setStatus(function (s) {
          return s === 'success' ? 'idle' : s;
        });
      }, 3000);
    } catch (err: any) {
      const msg = err?.message || 'Неизвестная ошибка';
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  // -----------------------------------------------------
  // Auto-load при монтировании
  // -----------------------------------------------------
  useEffect(
    function () {
      if (!autoLoad) return;
      const cached = loadCachedReleases();
      if (isCacheFresh(cached)) {
        // свежий кэш — не грузим
        return;
      }
      // нет кэша или устарел — тянем в фоне
      let cancelled = false;
      (async function () {
        try {
          const result = await fetchWaybackReleases();
          if (cancelled) return;
          setReleases(result.releases);
          setLastFetchedAt(result.fetchedAt);
        } catch (e) {
          // тихо игнорируем — покажется при нажатии «Обновить»
        }
      })();
      return function () {
        cancelled = true;
      };
    },
    [autoLoad]
  );

  return {
    releases,
    status,
    errorMessage,
    lastFetchedAt,
    isFresh,
    refresh,
  };
}