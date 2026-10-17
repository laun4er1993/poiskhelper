// =====================================================
// src/utils/terrain.ts
// Работа с рельефом — точные высоты для меток
// =====================================================

import * as Cesium from 'cesium';
import type { TreeItem, Place } from '../types/base';
import { isContainer, isPlace } from '../types/base';

interface LatLonHeight {
  lat: number;
  lon: number;
  height: number;
}

// =====================================================
// === Получение высот ===
// =====================================================
export async function sampleTerrainForPoints(
  terrainProvider: Cesium.TerrainProvider | null | undefined,
  points: Array<{ lat: number; lon: number; height?: number }>
): Promise<LatLonHeight[]> {
  if (!points || points.length === 0) return [];

  if (!terrainProvider) {
    console.warn('[terrain] нет terrainProvider');
    return points.map(function (p) {
      return {
        lat: p.lat,
        lon: p.lon,
        height: isFinite(p.height) ? p.height || 0 : 0,
      };
    });
  }

  try {
    const cartographics = points.map(function (p) {
      return Cesium.Cartographic.fromDegrees(p.lon, p.lat);
    });

    console.log(
      '[terrain] sampleTerrainMostDetailed для',
      points.length,
      'точек'
    );

    const sampled = await Cesium.sampleTerrainMostDetailed(
      terrainProvider,
      cartographics
    );

    if (!sampled || sampled.length !== points.length) {
      console.warn(
        '[terrain] sampleTerrainMostDetailed вернул',
        sampled ? sampled.length : 0,
        'вместо',
        points.length
      );
      return points.map(function (p) {
        return {
          lat: p.lat,
          lon: p.lon,
          height: isFinite(p.height) ? p.height || 0 : 0,
        };
      });
    }

    // Диагностика — сколько высот вернулось нулевых
    let zeroCount = 0;
    let nonZeroCount = 0;
    const result = sampled.map(function (carto, idx) {
      const p = points[idx];
      const h =
        carto && isFinite(carto.height)
          ? carto.height
          : isFinite(p.height)
          ? p.height || 0
          : 0;
      if (Math.abs(h) < 0.001) zeroCount++;
      else nonZeroCount++;
      return { lat: p.lat, lon: p.lon, height: h };
    });

    console.log(
      '[terrain] получено высот: ненулевых =',
      nonZeroCount,
      ', нулевых =',
      zeroCount
    );

    return result;
  } catch (e) {
    console.error('[terrain] ошибка sampleTerrainMostDetailed:', e);
    return points.map(function (p) {
      return {
        lat: p.lat,
        lon: p.lon,
        height: isFinite(p.height) ? p.height || 0 : 0,
      };
    });
  }
}

export async function sampleTerrainForPoint(
  terrainProvider: Cesium.TerrainProvider | null | undefined,
  lat: number,
  lon: number,
  fallbackHeight: number = 0
): Promise<number> {
  const result = await sampleTerrainForPoints(terrainProvider, [
    { lat, lon, height: fallbackHeight },
  ]);
  if (result.length > 0) return result[0].height;
  return fallbackHeight;
}

export function shouldUpdateHeight(height: number | undefined): boolean {
  if (height === undefined || height === null) return true;
  if (!isFinite(height)) return true;
  if (Math.abs(height) < 0.001) return true;
  return false;
}

export async function updateHeightsInBatches(
  terrainProvider: Cesium.TerrainProvider | null | undefined,
  points: Array<{ lat: number; lon: number; height?: number }>,
  chunkSize: number = 200,
  onProgress?: (processed: number, total: number) => void
): Promise<LatLonHeight[]> {
  if (!points || points.length === 0) return [];

  const result: LatLonHeight[] = [];
  const total = points.length;
  const size = Math.max(1, Math.min(500, chunkSize));

  for (let i = 0; i < total; i += size) {
    const chunk = points.slice(i, i + size);
    const updated = await sampleTerrainForPoints(terrainProvider, chunk);
    for (let k = 0; k < updated.length; k++) {
      result.push(updated[k]);
    }
    if (onProgress) {
      onProgress(Math.min(i + size, total), total);
    }
  }

  return result;
}

// =====================================================
// === Обход дерева и обновление высот ===
// =====================================================
interface PlaceToFix {
  id: string;
  lat: number;
  lon: number;
}

function collectPlacesToFix(items: TreeItem[]): PlaceToFix[] {
  const result: PlaceToFix[] = [];
  if (!Array.isArray(items)) return result;

  function walk(list: TreeItem[]) {
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item) continue;
      if (isPlace(item)) {
        const p = item as Place;
        if (shouldUpdateHeight(p.height)) {
          if (isFinite(p.lat) && isFinite(p.lon)) {
            result.push({ id: p.id, lat: p.lat, lon: p.lon });
          }
        }
      } else if (isContainer(item)) {
        walk(item.children);
      }
    }
  }
  walk(items);
  return result;
}

function applyHeightsMap(
  items: TreeItem[],
  heightById: Map<string, number>
): TreeItem[] {
  if (heightById.size === 0) return items;
  return items.map(function (item) {
    if (!item) return item;
    if (isPlace(item)) {
      const h = heightById.get(item.id);
      if (h !== undefined) {
        return { ...item, height: h } as TreeItem;
      }
      return item;
    }
    if (isContainer(item)) {
      return {
        ...item,
        children: applyHeightsMap(item.children, heightById),
      } as TreeItem;
    }
    return item;
  });
}

/**
 * Обходит дерево и обновляет высоты всех мест с h ≈ 0 через рельеф.
 *
 * НЕ ждёт tilesLoaded — полагается на то, что sampleTerrainMostDetailed
 * сам подгрузит необходимые тайлы. Возвращает новое дерево и счётчик.
 */
export async function applyTerrainHeightsToTree(
  terrainProvider: Cesium.TerrainProvider | null | undefined,
  items: TreeItem[],
  onProgress?: (processed: number, total: number) => void
): Promise<{ tree: TreeItem[]; updatedCount: number }> {
  const placesToFix = collectPlacesToFix(items);

  console.log(
    '[terrain] applyTerrainHeightsToTree: найдено',
    placesToFix.length,
    'точек с h≈0'
  );

  if (placesToFix.length === 0) {
    return { tree: items, updatedCount: 0 };
  }
  if (!terrainProvider) {
    console.warn('[terrain] terrainProvider отсутствует');
    return { tree: items, updatedCount: 0 };
  }

  const samples = await updateHeightsInBatches(
    terrainProvider,
    placesToFix.map(function (p) {
      return { lat: p.lat, lon: p.lon, height: 0 };
    }),
    200,
    onProgress
  );

  const heightById = new Map<string, number>();
  let updatedCount = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    if (s && isFinite(s.height) && Math.abs(s.height) > 0.001) {
      heightById.set(placesToFix[i].id, s.height);
      updatedCount++;
    }
  }

  console.log(
    '[terrain] applyTerrainHeightsToTree: обновлено',
    updatedCount,
    'из',
    placesToFix.length
  );

  if (heightById.size === 0) {
    return { tree: items, updatedCount: 0 };
  }
  return {
    tree: applyHeightsMap(items, heightById),
    updatedCount: updatedCount,
  };
}