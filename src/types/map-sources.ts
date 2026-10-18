// =====================================================
// src/types/map-sources.ts
// Каталог источников карт — только бесплатные
// =====================================================

import type { OverlaySettings } from './overlay-sources';

export type BuiltInMapSourceId =
  | 'esri-imagery'
  | 'esri-wayback'
  | 'bing-aerial'
  | 'eox-sentinel2'
  | 'osm'
  | 'opentopomap';

export type MapSourceId = string;

export type MapSourceCategory = 'satellite' | 'street' | 'topo' | 'history';

export type MapSourceProvider =
  | 'esri-arcgis'
  | 'cesium-ion'
  | 'url-template'
  | 'esri-wayback'
  | 'custom';

export interface MapSourceInfo {
  id: MapSourceId;
  label: string;
  shortLabel: string;
  description: string;
  category: MapSourceCategory;
  provider: MapSourceProvider;
  requiresKey?: 'maptiler' | 'cesium-ion' | 'sentinel-hub';
  attribution: string;
  previewColor: string;

  supportsTime: boolean;
  timeMin?: string;
  timeMax?: string;
  timeStepDays?: number;

  url?: string;
  layers?: string;
  ionAssetId?: number;
  maxLevel?: number;

  worksInRussia: boolean;
  priority: number;
  coverage: 'global' | 'russia' | 'other';

  isCustom?: boolean;
}

// -----------------------------------------------------
// Кастомный источник
// -----------------------------------------------------
export interface CustomMapSource {
  id: string;
  name: string;
  urlTemplate: string;
  maxLevel: number;
  minLevel?: number;
  attribution: string;
  category: MapSourceCategory;
  previewColor: string;
  addedAt: string;
}

// -----------------------------------------------------
// Встроенные — только бесплатные и качественные
// -----------------------------------------------------
export const BUILT_IN_MAP_SOURCES: MapSourceInfo[] = [
  {
    id: 'esri-imagery',
    label: 'Esri World Imagery',
    shortLabel: 'Esri',
    description: 'Основной спутник, свежие снимки, без ключа',
    category: 'satellite',
    provider: 'esri-arcgis',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    attribution: '© Esri, Maxar, Earthstar Geographics',
    previewColor: '#2d5016',
    supportsTime: false,
    maxLevel: 19,
    worksInRussia: true,
    priority: 1,
    coverage: 'global',
  },
  {
    id: 'eox-sentinel2',
    label: 'EOX Sentinel-2 Cloudless',
    shortLabel: 'Sentinel-2',
    description: 'Свежие снимки ESA Copernicus, 10 м, без ключа',
    category: 'satellite',
    provider: 'url-template',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: 'Sentinel-2 cloudless by EOX IT Services (modified Copernicus data)',
    previewColor: '#2a5e3b',
    supportsTime: false,
    maxLevel: 14,
    worksInRussia: true,
    priority: 2,
    coverage: 'global',
  },
  {
    id: 'bing-aerial',
    label: 'Bing Aerial',
    shortLabel: 'Bing',
    description: 'Спутник Bing, через бесплатный Cesium ion',
    category: 'satellite',
    provider: 'cesium-ion',
    requiresKey: 'cesium-ion',
    ionAssetId: 2,
    attribution: '© Microsoft / Cesium ion',
    previewColor: '#3c4a2a',
    supportsTime: false,
    maxLevel: 19,
    worksInRussia: true,
    priority: 3,
    coverage: 'global',
  },
  {
    id: 'esri-wayback',
    label: 'Esri Wayback (история)',
    shortLabel: 'Wayback',
    description: 'Исторические версии Esri с 2014 года',
    category: 'history',
    provider: 'esri-wayback',
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{release}/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics',
    previewColor: '#3a2a1a',
    supportsTime: true,
    timeMin: '2014-06-01',
    timeMax: 'today',
    timeStepDays: 180,
    maxLevel: 19,
    worksInRussia: true,
    priority: 4,
    coverage: 'global',
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    shortLabel: 'OSM',
    description: 'Классическая схема OSM',
    category: 'street',
    provider: 'url-template',
    url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    previewColor: '#e8e0d0',
    supportsTime: false,
    maxLevel: 19,
    worksInRussia: true,
    priority: 10,
    coverage: 'global',
  },
  {
    id: 'opentopomap',
    label: 'OpenTopoMap',
    shortLabel: 'Topo',
    description: 'Топографическая карта',
    category: 'topo',
    provider: 'url-template',
    url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap (CC-BY-SA)',
    previewColor: '#d8d0b0',
    supportsTime: false,
    maxLevel: 17,
    worksInRussia: true,
    priority: 11,
    coverage: 'global',
  },
];

export const DEFAULT_MAP_SOURCE: MapSourceId = 'esri-imagery';

// -----------------------------------------------------
// Список ID, которые «выживают» после миграции
// -----------------------------------------------------
const KEPT_IDS: Set<string> = new Set(
  BUILT_IN_MAP_SOURCES.map(function (s) {
    return s.id;
  })
);

export function isKeptMapSource(id: string): boolean {
  return KEPT_IDS.has(id);
}

// -----------------------------------------------------
// Custom → Info
// -----------------------------------------------------
export function customToInfo(c: CustomMapSource): MapSourceInfo {
  return {
    id: c.id,
    label: c.name,
    shortLabel: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
    description: 'Своя карта',
    category: c.category,
    provider: 'custom',
    attribution: c.attribution || '© Своя карта',
    previewColor: c.previewColor || '#4a90d9',
    supportsTime: false,
    url: c.urlTemplate,
    maxLevel: c.maxLevel,
    worksInRussia: true,
    priority: 100,
    coverage: 'global',
    isCustom: true,
  };
}

// -----------------------------------------------------
// Объединённый список
// -----------------------------------------------------
export function getAllMapSources(
  customSources: CustomMapSource[] = []
): MapSourceInfo[] {
  const customInfos = customSources.map(customToInfo);
  return BUILT_IN_MAP_SOURCES.concat(customInfos);
}

export function getMapSourceInfo(
  id: MapSourceId,
  customSources: CustomMapSource[] = []
): MapSourceInfo {
  const all = getAllMapSources(customSources);
  return (
    all.find(function (b) {
      return b.id === id;
    }) || BUILT_IN_MAP_SOURCES[0]
  );
}

// -----------------------------------------------------
// Фильтрация
// -----------------------------------------------------
export type CountryFilter = 'russia' | 'world';

export function getFilteredMapSources(
  filter: CountryFilter,
  customSources: CustomMapSource[] = []
): MapSourceInfo[] {
  const all = getAllMapSources(customSources);
  const filtered =
    filter === 'russia'
      ? all.filter(function (s) {
          return s.worksInRussia;
        })
      : all;
  return filtered.slice().sort(function (a, b) {
    return a.priority - b.priority;
  });
}

// -----------------------------------------------------
// Утилиты дат
// -----------------------------------------------------
export function todayIso(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

export function resolveTimeMax(value: string | undefined): string {
  if (!value) return todayIso();
  if (value === 'today') return todayIso();
  return value;
}

// -----------------------------------------------------
// Esri Wayback
// -----------------------------------------------------
export const ESRI_WAYBACK_RELEASES: Array<{
  date: string;
  release: number;
}> = [
  { date: '2014-06-01', release: 10 },
  { date: '2014-09-01', release: 18 },
  { date: '2015-03-01', release: 54 },
  { date: '2015-09-01', release: 145 },
  { date: '2016-03-01', release: 218 },
  { date: '2016-09-01', release: 262 },
  { date: '2017-03-01', release: 298 },
  { date: '2017-09-01', release: 330 },
  { date: '2018-03-01', release: 362 },
  { date: '2018-09-01', release: 393 },
  { date: '2019-03-01', release: 422 },
  { date: '2019-09-01', release: 447 },
  { date: '2020-03-01', release: 472 },
  { date: '2020-09-01', release: 496 },
  { date: '2021-03-01', release: 522 },
  { date: '2021-09-01', release: 547 },
  { date: '2022-03-01', release: 573 },
  { date: '2022-09-01', release: 598 },
  { date: '2023-03-01', release: 623 },
  { date: '2023-09-01', release: 648 },
  { date: '2024-03-01', release: 673 },
  { date: '2024-09-01', release: 698 },
  { date: '2025-03-01', release: 723 },
];

export function findWaybackRelease(dateIso: string): number {
  const releases = ESRI_WAYBACK_RELEASES;
  if (releases.length === 0) return 10;
  let bestRelease = releases[0].release;
  let bestDiff = Infinity;
  const target = new Date(dateIso + 'T00:00:00Z').getTime();
  for (let i = 0; i < releases.length; i++) {
    const d = new Date(releases[i].date + 'T00:00:00Z').getTime();
    const diff = Math.abs(d - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestRelease = releases[i].release;
    }
  }
  return bestRelease;
}

// -----------------------------------------------------
// Настройки источника карты
// -----------------------------------------------------
export interface MapSourceSettings {
  baseLayer: MapSourceId;
  baseLayerDate: string;
  baseLayerOpacity: number;
  baseLayerBrightness: number;
  baseLayerContrast: number;
  countryFilter: CountryFilter;
  customSources: CustomMapSource[];
  /** ⚡ Наложения поверх базового слоя (только для спутника) */
  overlays: OverlaySettings;
}

export const DEFAULT_MAP_SOURCE_SETTINGS: MapSourceSettings = {
  baseLayer: DEFAULT_MAP_SOURCE,
  baseLayerDate: todayIso(),
  baseLayerOpacity: 1,
  baseLayerBrightness: 1,
  baseLayerContrast: 1,
  countryFilter: 'russia',
  customSources: [],
  overlays: { roads: false, reference: false, labels: false },
};