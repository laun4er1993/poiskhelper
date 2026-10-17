// =====================================================
// src/types/base.ts
// Базовые типы дерева объектов
// =====================================================

export type ItemType =
  | 'folder'
  | 'place'
  | 'kmlfile'
  | 'kmlline'
  | 'kmlpolygon'
  | 'measure';

// Режим высоты KML
export type AltitudeMode = 'clampToGround' | 'relativeToGround' | 'absolute';

export type SortField = 'name' | 'type' | 'date' | 'manual';
export type SortOrder = 'asc' | 'desc';

export interface BaseItem {
  id: string;
  name: string;
  type: ItemType;
  visible?: boolean;
  opacity?: number;
  labelSettings?: Partial<import('./labels').LabelSettings>;
  note?: string;
  createdAt?: string;
  pinned?: boolean;
}

export interface Folder extends BaseItem {
  type: 'folder';
  children: TreeItem[];
  expanded: boolean;
  sortField?: SortField;
  sortOrder?: SortOrder;
}

export interface Place extends BaseItem {
  type: 'place';
  lat: number;
  lon: number;
  height?: number;
  altitudeMode?: AltitudeMode;
  description?: string;

  color?: string;
  showFill?: boolean;
  fillOpacity?: number;

  outlineColor?: string;
  showOutline?: boolean;
  outlineWidth?: number;
  outlineOpacity?: number;

  pixelSize?: number;
  iconHref?: string;
}

export interface KmlLine extends BaseItem {
  type: 'kmlline';
  positions: Array<{ lat: number; lon: number; height?: number }>;
  altitudeMode?: AltitudeMode;
  color?: string;
  width?: number;
  description?: string;
}

export interface KmlPolygon extends BaseItem {
  type: 'kmlpolygon';
  positions: Array<{ lat: number; lon: number; height?: number }>;
  altitudeMode?: AltitudeMode;
  fillColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  description?: string;
}

export interface KmlFile extends BaseItem {
  type: 'kmlfile';
  children: TreeItem[];
  expanded: boolean;
  sourceFile: string;
  importedAt: string;
  sortField?: SortField;
  sortOrder?: SortOrder;
}

// -----------------------------------------------------
// Измерение (линейка)
// -----------------------------------------------------
export type MeasureRulerType = 'simple' | 'path' | 'area';
export type MeasureLineDash = 'solid' | 'dashed' | 'dotted';
export type MeasurePointShape = 'double-circle' | 'circle' | 'square';
export type MeasureNumberStyle = 'fill' | 'outline' | 'fill-and-outline';

export interface MeasureItem extends BaseItem {
  type: 'measure';
  rulerType: MeasureRulerType;
  positions: Array<{ lat: number; lon: number; height: number }>;
  closed: boolean;

  // --- Линия (без обводки) ---
  color?: string;
  width?: number;
  lineOpacity?: number;
  lineDash?: MeasureLineDash;

  // --- Точки ---
  pointShape?: MeasurePointShape;
  pointSize?: number;
  pointOpacity?: number;
  pointFillColor?: string;
  pointOutlineColor?: string;
  pointOutlineWidth?: number;

  // --- Цифры ---
  showNumbers?: boolean;
  numberFontSize?: number;
  numberColor?: string;
  numberOutlineColor?: string;
  numberOutlineWidth?: number;
  numberStyle?: MeasureNumberStyle;

  // --- Подписи ---
  showHeights?: boolean;
  showSegmentLengths?: boolean;
  showAzimuths?: boolean;
  highlightEndpoints?: boolean;

  description?: string;
}

export type TreeItem =
  | Folder
  | Place
  | KmlFile
  | KmlLine
  | KmlPolygon
  | MeasureItem;

export function isFolder(item: TreeItem): item is Folder {
  return item.type === 'folder';
}

export function isPlace(item: TreeItem): item is Place {
  return item.type === 'place';
}

export function isKmlFile(item: TreeItem): item is KmlFile {
  return item.type === 'kmlfile';
}

export function isKmlLine(item: TreeItem): item is KmlLine {
  return item.type === 'kmlline';
}

export function isKmlPolygon(item: TreeItem): item is KmlPolygon {
  return item.type === 'kmlpolygon';
}

export function isMeasure(item: TreeItem): item is MeasureItem {
  return item.type === 'measure';
}

export function isContainer(item: TreeItem): item is Folder | KmlFile {
  return item.type === 'folder' || item.type === 'kmlfile';
}

export function isGeoItem(
  item: TreeItem
): item is Place | KmlLine | KmlPolygon | MeasureItem {
  return (
    item.type === 'place' ||
    item.type === 'kmlline' ||
    item.type === 'kmlpolygon' ||
    item.type === 'measure'
  );
}

export function isVisible(item: TreeItem): boolean {
  return item.visible !== false;
}

export function getItemTypeLabel(type: ItemType): string {
  if (type === 'folder') return 'Папка';
  if (type === 'place') return 'Метка';
  if (type === 'kmlfile') return 'KML-файл';
  if (type === 'kmlline') return 'Линия';
  if (type === 'kmlpolygon') return 'Полигон';
  if (type === 'measure') return 'Измерение';
  return type;
}

export function getItemTypeIcon(type: ItemType): string {
  if (type === 'folder') return 'folder';
  if (type === 'place') return 'pin';
  if (type === 'kmlfile') return 'file';
  if (type === 'kmlline') return 'line';
  if (type === 'kmlpolygon') return 'polygon';
  if (type === 'measure') return 'ruler';
  return 'circle';
}