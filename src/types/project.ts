// =====================================================
// src/types/project.ts
// Метаданные проекта, камера, недавние проекты
// =====================================================

import type {
  CoordinateFormat,
  DistanceUnit,
  HeightUnit,
} from './units';

// ⚡ Импорт из map-sources.ts — разрываем цикл settings ↔ project
import type { MapSourceSettings } from './map-sources';

export interface ProjectUnits {
  distance: DistanceUnit;
  height: HeightUnit;
  coordinate: CoordinateFormat;
}

export interface HomeCamera {
  lon: number;
  lat: number;
  height: number;
  heading: number;
  pitch: number;
  roll: number;
}

export type ProjectCamera = HomeCamera;

export type DateFormat = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type AppLanguage = 'ru' | 'en';

export interface ProjectMeta {
  title: string;
  fileBaseName: string;
  author: string;
  organization: string;
  description: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  language: AppLanguage;
  dateFormat: DateFormat;
  homeCamera: HomeCamera | null;
  units: ProjectUnits;
  colorTag: string;

  /** ⚡ Настройки источника карты — override глобальных */
  mapSource?: Partial<MapSourceSettings>;
}

export function createDefaultProjectMeta(title?: string): ProjectMeta {
  const now = new Date().toISOString();
  const t = title && title.trim() ? title.trim() : 'Новый проект';
  return {
    title: t,
    fileBaseName: t.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60),
    author: '',
    organization: '',
    description: '',
    tags: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
    version: '2.0',
    language: 'ru',
    dateFormat: 'DD.MM.YYYY',
    homeCamera: null,
    units: {
      distance: 'metric',
      height: 'meters',
      coordinate: 'DD',
    },
    colorTag: '#4a90d9',
    mapSource: undefined,
  };
}

// =====================================================
// === Данные проекта ===
// =====================================================
import type { TreeItem } from './base';

export interface ProjectData {
  version: number;
  name: string;
  tree: TreeItem[];
  importedItems?: TreeItem[];
  camera?: ProjectCamera;
  meta?: ProjectMeta;
  savedAt: string;
}

export interface RecentProject {
  path: string;
  name: string;
  openedAt: string;
  sizeBytes?: number;
}

export interface ProjectStats {
  totalItems: number;
  folders: number;
  places: number;
  lines: number;
  polygons: number;
  kmlFiles: number;
  measures: number;
  importedItems: number;
}