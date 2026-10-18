// =====================================================
// src/services/map-sources/wayback.ts
// Загрузка и кэширование релизов Esri Wayback
// =====================================================

import { ESRI_WAYBACK_RELEASES } from '../../types/map-sources';

const WAYBACK_CONFIG_URL =
  'https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json';

const STORAGE_KEY = 'poiskhelper_wayback_releases_v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface WaybackRelease {
  date: string;
  release: number;
}

interface CachedPayload {
  releases: WaybackRelease[];
  fetchedAt: number;
}

export function loadCachedReleases(): CachedPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.releases) ||
      typeof parsed.fetchedAt !== 'number'
    ) {
      return null;
    }
    const valid = parsed.releases.filter(function (r: any) {
      return (
        r &&
        typeof r.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
        typeof r.release === 'number' &&
        isFinite(r.release)
      );
    });
    if (valid.length === 0) return null;
    return {
      releases: valid,
      fetchedAt: parsed.fetchedAt,
    };
  } catch (e) {
    return null;
  }
}

export function saveCachedReleases(releases: WaybackRelease[]): void {
  try {
    const payload: CachedPayload = {
      releases: releases,
      fetchedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Не удалось сохранить релизы Wayback:', e);
  }
}

export function isCacheFresh(cached: CachedPayload | null): boolean {
  if (!cached) return false;
  return Date.now() - cached.fetchedAt < CACHE_TTL_MS;
}

export function getWaybackReleases(): WaybackRelease[] {
  const cached = loadCachedReleases();
  if (cached && cached.releases.length > 0) {
    return cached.releases;
  }
  // ⚡ N17: хардкод ESRI_WAYBACK_RELEASES устаревает.
  //   Используется как «первичный» список до фетча. Как только
  //   useWaybackReleases.fetchWaybackReleases() вернёт актуальный
  //   список — он сохранится в кэш и перекроет хардкод.
  //   TODO: при старте приложения вызывать фоновый fetch один раз.
  return ESRI_WAYBACK_RELEASES.slice();
}

function parseWaybackResponse(raw: any): WaybackRelease[] {
  if (!raw) return [];
  let items: any[] = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && Array.isArray(raw.wayback)) {
    items = raw.wayback;
  } else if (raw && Array.isArray(raw.releases)) {
    items = raw.releases;
  }

  const result: WaybackRelease[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    let date: string | null = null;
    let release: number | null = null;

    if (typeof item.releaseDate === 'string') {
      const m = item.releaseDate.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) date = m[1];
    }
    if (!date && typeof item.itemTitle === 'string') {
      const m = item.itemTitle.match(/\(Wayback (\d{4}-\d{2}-\d{2})\)/);
      if (m) date = m[1];
    }
    if (!date && typeof item.metadataLayerItemTitle === 'string') {
      const m = item.metadataLayerItemTitle.match(
        /\(Wayback (\d{4}-\d{2}-\d{2})\)/
      );
      if (m) date = m[1];
    }
    if (!date) {
      const keys = Object.keys(item);
      for (let k = 0; k < keys.length; k++) {
        const v = item[keys[k]];
        if (typeof v === 'string') {
          const m = v.match(/(\d{4}-\d{2}-\d{2})/);
          if (m) {
            date = m[1];
            break;
          }
        }
      }
    }

    if (typeof item.itemReleaseNum === 'number') {
      release = item.itemReleaseNum;
    } else if (typeof item.releaseNum === 'number') {
      release = item.releaseNum;
    } else if (typeof item.release === 'number') {
      release = item.release;
    }

    if (date && release !== null && isFinite(release)) {
      result.push({ date: date, release: release });
    }
  }

  result.sort(function (a, b) {
    return a.date.localeCompare(b.date);
  });

  const seen = new Set<number>();
  return result.filter(function (r) {
    if (seen.has(r.release)) return false;
    seen.add(r.release);
    return true;
  });
}

export interface FetchResult {
  releases: WaybackRelease[];
  fetchedAt: number;
  count: number;
  latest: WaybackRelease | null;
}

export async function fetchWaybackReleases(
  signal?: AbortSignal
): Promise<FetchResult> {
  // ⚡ N18: поддержка отмены — если компонент размонтирован или
  //   пользователь закрыл панель, fetch прерывается.
  const response = await fetch(WAYBACK_CONFIG_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: signal,
  });

  if (!response.ok) {
    throw new Error(
      'Esri Wayback вернул HTTP ' + response.status + ' ' + response.statusText
    );
  }

  const json = await response.json();

  if (signal && signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const releases = parseWaybackResponse(json);

  if (releases.length === 0) {
    throw new Error('Не удалось распарсить ответ Esri Wayback (0 релизов)');
  }

  saveCachedReleases(releases);

  return {
    releases: releases,
    fetchedAt: Date.now(),
    count: releases.length,
    latest: releases.length > 0 ? releases[releases.length - 1] : null,
  };
}

export function findClosestRelease(
  releases: WaybackRelease[],
  dateIso: string
): WaybackRelease | null {
  if (!releases || releases.length === 0) return null;
  let best = releases[0];
  let bestDiff = Infinity;
  const target = new Date(dateIso + 'T00:00:00Z').getTime();
  if (!isFinite(target)) return best;

  for (let i = 0; i < releases.length; i++) {
    const d = new Date(releases[i].date + 'T00:00:00Z').getTime();
    const diff = Math.abs(d - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = releases[i];
    }
  }
  return best;
}