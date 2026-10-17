// =====================================================
// src/services/project/index.ts
// Реэкспорт модуля project
// =====================================================

export {
  normalizeProjectMeta,
  mergeMeta,
  sanitizeFileName,
} from './meta';

export {
  loadRecentProjects,
  saveRecentProjects,
  addRecentProject,
  updateRecentProject,
  removeRecentProject,
  clearRecentProjects,
  getLastProjectPath,
  getRecentProjectByPath,
} from './recent';

export { getProjectStats } from './stats';

export type { NewProjectPreset } from './presets';
export { NEW_PROJECT_PRESETS, getNewProjectPreset } from './presets';

export type { OpenedProject } from './read-write';
export {
  pickProjectFile,
  pickProjectSavePath,
  readProjectFile,
  writeProjectFile,
  fileExists,
  deleteProjectFile,
  buildProjectData,
} from './read-write';

// ⚡ Реэкспорт источников карт
// ВНИМАНИЕ: MAP_SOURCES переименован в BUILT_IN_MAP_SOURCES
export type {
  MapSourceId,
  MapSourceInfo,
  CustomMapSource,
  CountryFilter,
} from '../../types/map-sources';
export {
  BUILT_IN_MAP_SOURCES,
  DEFAULT_MAP_SOURCE,
  DEFAULT_MAP_SOURCE_SETTINGS,
  ESRI_WAYBACK_RELEASES,
  getAllMapSources,
  getFilteredMapSources,
  getMapSourceInfo,
  customToInfo,
  todayIso,
  resolveTimeMax,
  findWaybackRelease,
} from '../../types/map-sources';

// ⚡ Реэкспорт сервиса Wayback
export type { WaybackRelease } from '../map-sources/wayback';
export {
  loadCachedReleases,
  saveCachedReleases,
  isCacheFresh,
  getWaybackReleases,
  fetchWaybackReleases,
  findClosestRelease,
} from '../map-sources/wayback';

// -----------------------------------------------------
// Применение единиц проекта к настройкам
// -----------------------------------------------------
import type { AppSettings } from '../../types/settings';
import type { ProjectMeta } from '../../types/project';
import { DEFAULT_SETTINGS } from '../../types/settings';

export function applyProjectUnitsToSettings(
  settings: AppSettings,
  meta: ProjectMeta
): AppSettings {
  const next: AppSettings = { ...settings };
  if (meta.units) {
    next.distanceUnit = meta.units.distance;
    next.heightUnit = meta.units.height;
    next.coordinateFormat = meta.units.coordinate;
  }
  if (typeof next.sidebarWidth !== 'number') {
    next.sidebarWidth = DEFAULT_SETTINGS.sidebarWidth;
  }
  return next;
}