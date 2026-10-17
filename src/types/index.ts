// =====================================================
// src/types/index.ts
// Единая точка входа для всех типов и утилит
// =====================================================

// -----------------------------------------------------
// Базовые типы дерева
// -----------------------------------------------------
export type {
  ItemType,
  SortField,
  SortOrder,
  BaseItem,
  Folder,
  Place,
  KmlLine,
  KmlPolygon,
  KmlFile,
  MeasureItem,
  MeasureRulerType,
  TreeItem,
} from './base';

export {
  isFolder,
  isPlace,
  isKmlFile,
  isKmlLine,
  isKmlPolygon,
  isMeasure,
  isContainer,
  isGeoItem,
  isVisible,
  getItemTypeLabel,
  getItemTypeIcon,
} from './base';

// -----------------------------------------------------
// Подписи
// -----------------------------------------------------
export type {
  LabelStyle,
  LabelSettings,
  PartialLabelSettings,
} from './labels';

export {
  DEFAULT_LABEL_SETTINGS,
  mergeLabelSettings,
} from './labels';

// -----------------------------------------------------
// Измерения
// -----------------------------------------------------
export type {
  MeasurePoint,
  MeasureRulerInfo,
  MeasureSettings,
  MeasureMetrics,
  SegmentMetrics,
  SegmentMetricsResult,
  LineDashStyle,
  MeasurePointShape,
} from './measure';

export {
  MEASURE_RULERS,
  getRulerInfo,
  DEFAULT_MEASURE_SETTINGS,
  EMPTY_METRICS,
} from './measure';

// -----------------------------------------------------
// Иконки
// -----------------------------------------------------
export type { PlacemarkIcon } from './icons';
export { PLACEMARK_ICONS, findPlacemarkIcon } from './icons';

// -----------------------------------------------------
// Утилиты (IDs, цвета)
// -----------------------------------------------------
export { generateId, clamp, hexToRgba, isHexColor } from './ids';

// -----------------------------------------------------
// Геометрия
// -----------------------------------------------------
export {
  computeBearing,
  haversineMeters,
  computePolygonArea,
  computeMeasureMetrics,
  computeSegmentMetrics,
} from './geometry';

// -----------------------------------------------------
// Единицы измерения
// -----------------------------------------------------
export type {
  CoordinateFormat,
  DistanceUnit,
  HeightUnit,
} from './units';

// -----------------------------------------------------
// Проект
// -----------------------------------------------------
export type {
  ProjectUnits,
  HomeCamera,
  ProjectCamera,
  DateFormat,
  AppLanguage,
  ProjectMeta,
  ProjectData,
  RecentProject,
  ProjectStats,
} from './project';

export { createDefaultProjectMeta } from './project';

// -----------------------------------------------------
// Настройки
// -----------------------------------------------------
export type {
  MapPopupMode,
  MapPopupPosition,
  MapPopupSettings,
  GlobeSkin,
  TreeDensity,
  ToolbarSize,
  DesignSettings,
  ScreenshotFormat,
  ScreenshotSettings,
  MapCreateAction,
  MapCreateMenuSettings,
  SidebarOrder,
  AppSettings,
} from './settings';

export {
  DEFAULT_MAP_POPUP,
  DEFAULT_DESIGN,
  DEFAULT_SCREENSHOT,
  formatScreenshotName,
  DEFAULT_MAP_CREATE_MENU,
  DEFAULT_SETTINGS,
  mergeSettings,
} from './settings';

// -----------------------------------------------------
// Форматирование
// -----------------------------------------------------
export {
  formatCoordinate,
  formatLatLon,
  formatPlainLatLon,
  formatHeight,
  formatDistance,
  formatAngle,
  formatArea,
  formatFileSize,
  formatRelativeDate,
  formatDate,
} from './format';

// -----------------------------------------------------
// Утилиты дерева
// -----------------------------------------------------
export {
  findItem,
  getBreadcrumbPath,
  flattenIds,
  collectDescendantIds,
  updateItemInTree,
  removeItemFromTree,
  removeManyFromTree,
  addItemToFolder,
  setVisibleCascade,
  setVisibleUpward,
  setVisibleDeepAndOpenAncestors,
  expandAncestorsInTree,
  setExpandedDeepInTree,
  collapseAllInTree,
  moveWithinParent,
  getCheckedState,
  sortChildren,
  getSortField,
  getSortOrder,
  normalizeTree,
  getItemOpacity,
  collectPlaces,
  collectGeoItems,
  collectContainers,
} from './tree-utils';

// -----------------------------------------------------
// Логи
// -----------------------------------------------------
export type {
  LogType,
  LogEntry,
  ClipboardData,
} from './logs';

// -----------------------------------------------------
// Экспорт типа для измерения (используется в App.tsx и др.)
// -----------------------------------------------------
export type { MeasureItem as MeasureItemExport } from './base';