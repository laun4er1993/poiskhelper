// =====================================================
// src/types/settings.ts
// Глобальные настройки приложения
// =====================================================

import type {
  CoordinateFormat,
  DistanceUnit,
  HeightUnit,
} from './units';
import type { RecentProject } from './project';
import { DEFAULT_LABEL_SETTINGS } from './labels';
import type { LabelSettings } from './labels';
import { DEFAULT_MEASURE_SETTINGS } from './measure';
import type { MeasureSettings, MeasureRulerType } from './measure';

import type {
  MapSourceId,
  MapSourceSettings,
  CountryFilter,
  CustomMapSource,
} from './map-sources';
import {
  DEFAULT_MAP_SOURCE_SETTINGS,
  isKeptMapSource,
  DEFAULT_MAP_SOURCE,
} from './map-sources';

export type {
  MapSourceId,
  MapSourceSettings,
  CountryFilter,
  CustomMapSource,
};
export { DEFAULT_MAP_SOURCE_SETTINGS };

// -----------------------------------------------------
// Попап
// -----------------------------------------------------
export type MapPopupMode = 'always' | 'selected-only' | 'off';
export type MapPopupPosition = 'auto' | 'top' | 'bottom';

export interface MapPopupSettings {
  mode: MapPopupMode;
  delayMs: number;
  autoHideMs: number;
  width: number;
  position: MapPopupPosition;
  opacity: number;
  backdropDim: number;
  showCoords: boolean;
  showHeight: boolean;
  showDescription: boolean;
  showTypeBadge: boolean;
  descriptionMaxLines: number;
  autoOpenEditor: boolean;
}

export const DEFAULT_MAP_POPUP: MapPopupSettings = {
  mode: 'selected-only',
  delayMs: 220,
  autoHideMs: 0,
  width: 280,
  position: 'auto',
  opacity: 0.72,
  backdropDim: 0,
  showCoords: true,
  showHeight: true,
  showDescription: true,
  showTypeBadge: true,
  descriptionMaxLines: 3,
  autoOpenEditor: false,
};

// -----------------------------------------------------
// Дизайн
// -----------------------------------------------------
export type GlobeSkin = 'modern' | 'gep' | 'qgis' | 'minimal' | 'compact';
export type TreeDensity = 'compact' | 'normal' | 'comfortable';
export type ToolbarSize = 'small' | 'normal';

export interface DesignSettings {
  globeSkin: GlobeSkin;
  showGraticule: boolean;
  showFPS: boolean;
  selectedPulse: boolean;
  treeDensity: TreeDensity;
  treeIconSize: number;
  treeActionsOnHover: boolean;
  treeShowNote: boolean;
  treeShowOpacityBadge: boolean;
  treeShowLabelBadge: boolean;
  toolbarSize: ToolbarSize;
  radius: number;
  shadows: boolean;
  blur: boolean;
  popupBackground: string;
  popupAccentStripe: boolean;
  applyToDialogs: boolean;
}

export const DEFAULT_DESIGN: DesignSettings = {
  globeSkin: 'modern',
  showGraticule: false,
  showFPS: false,
  selectedPulse: false,
  treeDensity: 'compact',
  treeIconSize: 12,
  treeActionsOnHover: true,
  treeShowNote: true,
  treeShowOpacityBadge: true,
  treeShowLabelBadge: true,
  toolbarSize: 'normal',
  radius: 8,
  shadows: true,
  blur: true,
  popupBackground: '#14161c',
  popupAccentStripe: true,
  applyToDialogs: true,
};

// -----------------------------------------------------
// Скриншоты
// -----------------------------------------------------
export type ScreenshotFormat = 'png' | 'jpg';

export interface ScreenshotSettings {
  autoSaveDir: string | null;
  prefix: string;
  format: ScreenshotFormat;
  quality: number;
  showNotification: boolean;
  copyPathToClipboard: boolean;
  includeOverlays: boolean;
  scale: number;
}

export const DEFAULT_SCREENSHOT: ScreenshotSettings = {
  autoSaveDir: null,
  prefix: 'poiskhelper',
  format: 'png',
  quality: 0.92,
  showNotification: true,
  copyPathToClipboard: false,
  includeOverlays: false,
  scale: 1,
};

export function formatScreenshotName(
  prefix: string,
  format: ScreenshotFormat
): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const p = (prefix || 'poiskhelper').replace(/[\\/:*?"<>|]/g, '_');
  const ext = format === 'jpg' ? 'jpg' : 'png';
  return (
    p + '-' + yyyy + '-' + mm + '-' + dd + '-' + hh + '-' + mi + '-' + ss + '.' + ext
  );
}

// -----------------------------------------------------
// Меню на карте
// -----------------------------------------------------
export type MapCreateAction =
  | 'place'
  | 'line'
  | 'polygon'
  | 'folder'
  | 'measure'
  | 'cancel';

export interface MapCreateMenuSettings {
  enabled: boolean;
  showPlace: boolean;
  showLine: boolean;
  showPolygon: boolean;
  showFolder: boolean;
  showMeasure: boolean;
  autoActivateMode: boolean;
}

export const DEFAULT_MAP_CREATE_MENU: MapCreateMenuSettings = {
  enabled: true,
  showPlace: true,
  showLine: false,
  showPolygon: false,
  showFolder: true,
  showMeasure: true,
  autoActivateMode: true,
};

export type SidebarOrder = 'imported-first' | 'tree-first';

// -----------------------------------------------------
// Настройки приложения
// -----------------------------------------------------
export interface AppSettings {
  coordinateFormat: CoordinateFormat;
  distanceUnit: DistanceUnit;
  heightUnit: HeightUnit;
  highPrecision: boolean;

  showStatusBar: boolean;
  showScaleLegend: boolean;
  showCompass: boolean;
  showMouseCoords: boolean;
  showTerrainHeight: boolean;
  showCameraInfo: boolean;
  sidebarWidth: number;
  sidebarOrder: SidebarOrder;
  showBreadcrumbs: boolean;
  showSaveNotifications: boolean;

  labelDefaults: LabelSettings;
  labelShowForContainers: boolean;
  hideAllLabelsOnZoomOut: boolean;
  zoomOutLabelThreshold: number;

  recentProjects: RecentProject[];
  showWelcomeScreen: boolean;
  autoLoadLastProject: boolean;
  autoSaveIntervalSec: number;

  mapPopup: MapPopupSettings;
  design: DesignSettings;
  screenshot: ScreenshotSettings;
  mapCreateMenu: MapCreateMenuSettings;
  measure: MeasureSettings;

  mapSource: MapSourceSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  coordinateFormat: 'DD',
  distanceUnit: 'metric',
  heightUnit: 'meters',
  highPrecision: true,

  showStatusBar: true,
  showScaleLegend: true,
  showCompass: true,
  showMouseCoords: true,
  showTerrainHeight: true,
  showCameraInfo: true,
  sidebarWidth: 320,
  sidebarOrder: 'imported-first',
  showBreadcrumbs: true,
  showSaveNotifications: true,

  labelDefaults: DEFAULT_LABEL_SETTINGS,
  labelShowForContainers: false,
  hideAllLabelsOnZoomOut: false,
  zoomOutLabelThreshold: 2000000,

  recentProjects: [],
  showWelcomeScreen: true,
  autoLoadLastProject: false,
  autoSaveIntervalSec: 30,

  mapPopup: DEFAULT_MAP_POPUP,
  design: DEFAULT_DESIGN,
  screenshot: DEFAULT_SCREENSHOT,
  mapCreateMenu: DEFAULT_MAP_CREATE_MENU,
  measure: DEFAULT_MEASURE_SETTINGS,
  mapSource: DEFAULT_MAP_SOURCE_SETTINGS,
};

// -----------------------------------------------------
// Миграции
// -----------------------------------------------------
function migrateMeasureSettings(raw: any): MeasureSettings {
  const base: any = { ...DEFAULT_MEASURE_SETTINGS, ...(raw || {}) };
  delete base.lineOutlineWidth;
  delete base.lineOutlineColor;
  if (base.rulerType === 'profile') base.rulerType = 'path';
  return base as MeasureSettings;
}

function migrateMapSourceSettings(raw: any): MapSourceSettings {
  const base: any = { ...DEFAULT_MAP_SOURCE_SETTINGS, ...(raw || {}) };

  // legacy: старые поля верхнего уровня
  if (typeof raw?.baseLayer === 'string' && !raw?.mapSource) {
    base.baseLayer = raw.baseLayer;
  }

  // Валидация countryFilter
  if (base.countryFilter !== 'russia' && base.countryFilter !== 'world') {
    base.countryFilter = 'russia';
  }

  // Валидация customSources
  if (!Array.isArray(base.customSources)) {
    base.customSources = [];
  } else {
    base.customSources = base.customSources
      .filter(function (c: any) {
        return (
          c &&
          typeof c.id === 'string' &&
          typeof c.name === 'string' &&
          typeof c.urlTemplate === 'string'
        );
      })
      .map(function (c: any) {
        return {
          id: c.id,
          name: c.name,
          urlTemplate: c.urlTemplate,
          maxLevel:
            typeof c.maxLevel === 'number' && isFinite(c.maxLevel)
              ? Math.max(1, Math.min(22, c.maxLevel))
              : 19,
          minLevel:
            typeof c.minLevel === 'number' && isFinite(c.minLevel)
              ? Math.max(0, Math.min(22, c.minLevel))
              : undefined,
          attribution:
            typeof c.attribution === 'string' ? c.attribution : '',
          category:
            c.category === 'satellite' ||
            c.category === 'street' ||
            c.category === 'topo' ||
            c.category === 'history'
              ? c.category
              : 'satellite',
          previewColor:
            typeof c.previewColor === 'string'
              ? c.previewColor
              : '#4a90d9',
          addedAt:
            typeof c.addedAt === 'string'
              ? c.addedAt
              : new Date().toISOString(),
        };
      });
  }

  // ⚡ Если baseLayer больше не в списке (carto-dark, maptiler и т.д.) —
  // и это не кастомный источник — сбросить на esri-imagery
  const isCustomActive = base.customSources.some(function (c: any) {
    return c.id === base.baseLayer;
  });
  if (!isKeptMapSource(base.baseLayer) && !isCustomActive) {
    console.log(
      '[migrate] baseLayer "' + base.baseLayer + '" больше не поддерживается, сбрасываю на Esri'
    );
    base.baseLayer = DEFAULT_MAP_SOURCE;
  }

  return base as MapSourceSettings;
}

// -----------------------------------------------------
// Слияние
// -----------------------------------------------------
export function mergeSettings(raw: any): AppSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    labelDefaults: {
      ...DEFAULT_LABEL_SETTINGS,
      ...(raw.labelDefaults || {}),
    },
    mapPopup: {
      ...DEFAULT_MAP_POPUP,
      ...(raw.mapPopup || {}),
    },
    design: {
      ...DEFAULT_DESIGN,
      ...(raw.design || {}),
    },
    screenshot: {
      ...DEFAULT_SCREENSHOT,
      ...(raw.screenshot || {}),
    },
    mapCreateMenu: {
      ...DEFAULT_MAP_CREATE_MENU,
      ...(raw.mapCreateMenu || {}),
    },
    measure: migrateMeasureSettings(raw.measure),
    mapSource: migrateMapSourceSettings(
      raw.mapSource || {
        baseLayer: raw.baseLayer,
      }
    ),
    recentProjects: Array.isArray(raw.recentProjects) ? raw.recentProjects : [],
  };
}

export type { MeasureRulerType };