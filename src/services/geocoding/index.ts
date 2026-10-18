// =====================================================
// src/services/geocoding/index.ts
// Поиск мест: координаты + Cesium Ion + Nominatim (OSM)
// =====================================================

import * as Cesium from 'cesium';
import {
  tryParseCoordinate,
  type ParsedCoordinate,
} from '../../utils/coordinate-parser';

export type GeocodeSource = 'coordinate' | 'cesium' | 'nominatim';

export interface GeocodeResult {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
  height: number;
  source: GeocodeSource;
  /** [west, south, east, north] */
  bbox?: [number, number, number, number];
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// -----------------------------------------------------
// Координаты
// -----------------------------------------------------
function coordinateResult(coord: ParsedCoordinate): GeocodeResult {
  const lat = coord.lat;
  const lon = coord.lon;
  return {
    id:
      'coord-' +
      Date.now() +
      '-' +
      Math.random().toString(36).slice(2, 8),
    displayName:
      lat.toFixed(6) +
      ', ' +
      lon.toFixed(6) +
      (coord.height !== undefined
        ? ' (h = ' + coord.height.toFixed(1) + ' м)'
        : ''),
    lat,
    lon,
    height: coord.height || 0,
    source: 'coordinate',
  };
}

// -----------------------------------------------------
// Cesium Ion Geocoder
// -----------------------------------------------------
async function searchCesiumIon(
  query: string,
  viewer: Cesium.Viewer
): Promise<GeocodeResult[]> {
  const results: GeocodeResult[] = [];
  try {
    const service = new Cesium.IonGeocoderService({
      scene: viewer.scene,
    });
    const raw = await service.geocode(query);
    if (!raw || raw.length === 0) return [];

    for (let i = 0; i < raw.length; i++) {
      const r = raw[i];
      try {
        const carto = Cesium.Cartographic.fromCartesian(
          r.destination as Cesium.Cartesian3
        );
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const lon = Cesium.Math.toDegrees(carto.longitude);
        if (!isFinite(lat) || !isFinite(lon)) continue;

        let bbox: [number, number, number, number] | undefined;
        if (r.boundingBox) {
          try {
            // boundingBox — это Cesium.Rectangle (radians)
            const west = Cesium.Math.toDegrees(r.boundingBox.west);
            const south = Cesium.Math.toDegrees(r.boundingBox.south);
            const east = Cesium.Math.toDegrees(r.boundingBox.east);
            const north = Cesium.Math.toDegrees(r.boundingBox.north);
            if (
              isFinite(west) &&
              isFinite(south) &&
              isFinite(east) &&
              isFinite(north)
            ) {
              bbox = [west, south, east, north];
            }
          } catch (e) {}
        }

        results.push({
          id: 'cesium-' + i + '-' + Date.now(),
          displayName: r.displayName || query,
          lat,
          lon,
          height: 0,
          source: 'cesium',
          bbox,
        });
      } catch (e) {
        // Игнорируем отдельные невалидные результаты
      }
    }
  } catch (e) {
    console.warn('[geocoding] Cesium Ion error:', e);
  }
  return results;
}

// -----------------------------------------------------
// Nominatim (OpenStreetMap)
// -----------------------------------------------------
async function searchNominatim(
  query: string,
  signal?: AbortSignal
): Promise<GeocodeResult[]> {
  try {
    const url =
      NOMINATIM_URL +
      '?format=jsonv2&addressdetails=0&limit=15&accept-language=ru,en&q=' +
      encodeURIComponent(query);

    const resp = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!resp.ok) {
      console.warn(
        '[geocoding] Nominatim HTTP ' + resp.status + ' ' + resp.statusText
      );
      return [];
    }

    const data = await resp.json();
    if (!Array.isArray(data)) return [];

    const results: GeocodeResult[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item) continue;

      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (!isFinite(lat) || !isFinite(lon)) continue;

      let bbox: [number, number, number, number] | undefined;
      if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
        const south = parseFloat(item.boundingbox[0]);
        const north = parseFloat(item.boundingbox[1]);
        const west = parseFloat(item.boundingbox[2]);
        const east = parseFloat(item.boundingbox[3]);
        if (
          isFinite(west) &&
          isFinite(south) &&
          isFinite(east) &&
          isFinite(north)
        ) {
          bbox = [west, south, east, north];
        }
      }

      results.push({
        id:
          'nom-' +
          (item.place_id || i) +
          '-' +
          Math.random().toString(36).slice(2, 6),
        displayName: item.display_name || query,
        lat,
        lon,
        height: 0,
        source: 'nominatim',
        bbox,
      });
    }

    return results;
  } catch (e: any) {
    if (e && e.name === 'AbortError') {
      // Отменённый запрос — не считаем ошибкой
      return [];
    }
    console.warn('[geocoding] Nominatim error:', e);
    return [];
  }
}

// -----------------------------------------------------
// Публичный API
// -----------------------------------------------------
export interface SearchPlacesOptions {
  viewer?: Cesium.Viewer | null;
  signal?: AbortSignal;
  /** true — искать только координаты */
  coordinatesOnly?: boolean;
}

export async function searchPlaces(
  query: string,
  options: SearchPlacesOptions = {}
): Promise<GeocodeResult[]> {
  const trimmed = (query || '').trim();
  if (!trimmed) return [];

  // 1) Координаты — приоритет, никакой сети
  const coord = tryParseCoordinate(trimmed);
  if (coord) {
    return [coordinateResult(coord)];
  }

  if (options.coordinatesOnly) return [];

  // 2) Cesium Ion и Nominatim параллельно
  const promises: Promise<GeocodeResult[]>[] = [];

  if (options.viewer) {
    promises.push(searchCesiumIon(trimmed, options.viewer));
  }
  promises.push(searchNominatim(trimmed, options.signal));

  const allResults = await Promise.all(promises);

  // Склеиваем и дедуплицируем по (lat.toFixed(4), lon.toFixed(4))
  const merged: GeocodeResult[] = [];
  const seen = new Set<string>();

  // Приоритет: cesium > nominatim
  for (let i = 0; i < allResults.length; i++) {
    const arr = allResults[i];
    for (let j = 0; j < arr.length; j++) {
      const r = arr[j];
      const key =
        r.lat.toFixed(4) + '|' + r.lon.toFixed(4) + '|' + r.source;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }
  }

  // Сортируем: cesium первее (обычно лучше), потом nominatim
  merged.sort(function (a, b) {
    const order: Record<GeocodeSource, number> = {
      coordinate: 0,
      cesium: 1,
      nominatim: 2,
    };
    return order[a.source] - order[b.source];
  });

  return merged.slice(0, 15);
}