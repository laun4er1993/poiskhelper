// =====================================================
// src/components/globe/utils/bounds.ts
// Обход дерева, поиск элементов, вычисление bounds
// =====================================================

import type { TreeItem, Place } from '../../../types/base';
import { isPlace, isContainer } from '../../../types/base';
import type { ProjectBounds } from '../types';

// =====================================================
// === findItemById ===
// =====================================================
export function findItemById(items: TreeItem[], id: string): TreeItem | null {
  if (!Array.isArray(items) || typeof id !== 'string') return null;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    if (it.id === id) return it;
    if (isContainer(it)) {
      const found = findItemById((it as any).children, id);
      if (found) return found;
    }
  }
  return null;
}

// =====================================================
// === findPlaceById ===
// =====================================================
export function findPlaceById(items: TreeItem[], id: string): Place | null {
  if (!Array.isArray(items) || typeof id !== 'string') return null;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    if (it.id === id && isPlace(it)) return it as Place;
    if (isContainer(it)) {
      const found = findPlaceById((it as any).children, id);
      if (found) return found;
    }
  }
  return null;
}

// =====================================================
// === computeProjectBounds ===
// =====================================================
/**
 * Вычисляет bounding box всех видимых меток в дереве.
 * Использует сферическое среднее для долготы (чтобы не было скачка через 180°).
 */
export function computeProjectBounds(
  items: TreeItem[],
  parentVisible: boolean
): ProjectBounds | null {
  let minLat = 90,
    maxLat = -90,
    minLon = 180,
    maxLon = -180;
  let count = 0;
  let sumCosLon = 0;
  let sumSinLon = 0;

  function walk(list: TreeItem[], parentVis: boolean) {
    list.forEach(function (it) {
      const visible = parentVis && it.visible !== false;
      if (!visible) return;
      if (isPlace(it)) {
        const p = it as Place;
        if (isFinite(p.lat) && isFinite(p.lon)) {
          if (p.lat < minLat) minLat = p.lat;
          if (p.lat > maxLat) maxLat = p.lat;
          if (p.lon < minLon) minLon = p.lon;
          if (p.lon > maxLon) maxLon = p.lon;
          const radLon = (p.lon * Math.PI) / 180;
          sumCosLon += Math.cos(radLon);
          sumSinLon += Math.sin(radLon);
          count++;
        }
      } else if (isContainer(it)) {
        walk((it as any).children, visible);
      }
    });
  }

  walk(items, parentVisible);

  if (count === 0) return null;
  const avgLon = (Math.atan2(sumSinLon, sumCosLon) * 180) / Math.PI;
  return { minLat, maxLat, minLon, maxLon, count, avgLon };
}