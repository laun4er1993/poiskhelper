// =====================================================
// src/services/project/stats.ts
// Статистика проекта (количество объектов по типам)
// =====================================================

import type { TreeItem } from '../../types/base';
import { isContainer } from '../../types/base';
import type { ProjectStats } from '../../types/project';

/**
 * Считает статистику по дереву проекта + импортированным.
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
      stats.totalItems++;
      if (item.type === 'folder') stats.folders++;
      else if (item.type === 'place') stats.places++;
      else if (item.type === 'kmlline') stats.lines++;
      else if (item.type === 'kmlpolygon') stats.polygons++;
      else if (item.type === 'kmlfile') stats.kmlFiles++;
      else if (item.type === 'measure') stats.measures++;
      if (isContainer(item)) walk(item.children);
    });
  }

  walk(tree);

  if (importedItems && importedItems.length > 0) {
    stats.importedItems = importedItems.length;
  }

  return stats;
}