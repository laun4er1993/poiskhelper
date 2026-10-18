// =====================================================
// src/services/project/stats.ts
// Статистика проекта: leaf-объекты отдельно, контейнеры отдельно
// =====================================================

import type { TreeItem } from '../../types/base';
import { isContainer } from '../../types/base';
import type { ProjectStats } from '../../types/project';

/**
 * Считает статистику по дереву проекта + импортированным.
 *
 * ⚡ totalItems — только leaf-объекты (place/line/poly/measure),
 *   контейнеры (folders, kmlFiles) считаются отдельно.
 *   Импортированные объекты ВХОДЯТ в totalItems (по типам),
 *   а importedItems — это количество корней в importedItems.
 */
export function getProjectStats(
  tree: TreeItem[],
  importedItems?: TreeItem[]
): ProjectStats {
  const stats: ProjectStats = {
    totalItems: 0,
    folders: 0,
    places: 0,
    lines: 0,
    polygons: 0,
    kmlFiles: 0,
    measures: 0,
    importedItems: 0,
  };

  function walk(list: TreeItem[]) {
    list.forEach(function (item) {
      if (!item) return;
      if (item.type === 'folder') {
        stats.folders++;
      } else if (item.type === 'place') {
        stats.places++;
        stats.totalItems++;
      } else if (item.type === 'kmlline') {
        stats.lines++;
        stats.totalItems++;
      } else if (item.type === 'kmlpolygon') {
        stats.polygons++;
        stats.totalItems++;
      } else if (item.type === 'kmlfile') {
        stats.kmlFiles++;
      } else if (item.type === 'measure') {
        stats.measures++;
        stats.totalItems++;
      }
      if (isContainer(item)) walk(item.children);
    });
  }

  walk(tree);

  if (importedItems && importedItems.length > 0) {
    stats.importedItems = importedItems.length;
    // ⚡ Leaf-объекты из импортированных тоже считаются
    walk(importedItems);
  }

  return stats;
}