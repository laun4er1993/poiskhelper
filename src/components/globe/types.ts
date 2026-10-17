// =====================================================
// src/components/globe/types.ts
// Типы для модуля GlobeViewer
// =====================================================

import type * as Cesium from 'cesium';
import type {
  TreeItem,
  Place,
  AppSettings,
  MeasurePoint,
  MapCreateAction,
  MeasureRulerType,
} from '../../types';
import type { CustomMapSource } from '../../types/map-sources';
import type { MapSourceSettings } from '../../types/settings';
import type { StatusBarData } from '../status-bar/types';
import type { ThemeColors } from '../../theme/types';

export interface GlobeViewerProps {
  items: TreeItem[];
  importedItems: TreeItem[];
  clickMode: 'select' | 'add-marker' | 'measure';
  settings: AppSettings;
  colors: ThemeColors;
  measurePoints: MeasurePoint[];
  measureClosed: boolean;
  selectedId: string | null;
  selectedItem: TreeItem | null;
  editingItemId: string | null;
  selectedMeasureIndex: number | null;

  mapSource: MapSourceSettings;
  onMapSourceChange: (updater: Partial<MapSourceSettings>) => void;
  onNeedCustomDialog: (edit?: CustomMapSource | null) => void;
  onDeleteCustom: (id: string) => void;

  onViewerReady: (viewer: Cesium.Viewer) => void;
  onMapClick: (lat: number, lon: number, height: number) => void;
  onSelectPlace: (placeId: string) => void;
  onSelectMeasurePoint: (index: number | null) => void;
  onStatusUpdate: (data: StatusBarData) => void;
  onClearMeasure: () => void;
  onUndoMeasure: () => void;
  onRemoveMeasurePoint?: (index: number) => void;
  onToggleClosed: () => void;
  onSave: (name?: string) => void;
  onSetRulerType?: (type: MeasureRulerType) => void;
  onMovePlace: (id: string, lat: number, lon: number, height: number) => void;
  onMoveMeasurePoint: (
    index: number,
    lat: number,
    lon: number,
    height: number
  ) => void;
  onMoveSavedMeasurePoint?: (
    measureId: string,
    index: number,
    lat: number,
    lon: number,
    height: number
  ) => void;
  onDragEnd?: (
    kind: 'place' | 'measure' | 'saved-measure',
    id: string,
    index: number | null,
    lat: number,
    lon: number,
    height: number
  ) => void;
  onCopyMeasureCoords?: (text: string, label: string) => void;
  onEditItem: (item: TreeItem) => void;
  onHideItem?: (id: string) => void;
  onCreateAction: (
    action: MapCreateAction,
    lat: number,
    lon: number,
    height: number
  ) => void;
}

export interface BillboardInfo {
  entity: Cesium.Entity;
  baseScale: number;
  ownerId: string;
}

export interface CreateMenuAnchor {
  worldPos: Cesium.Cartesian3;
  lat: number;
  lon: number;
  height: number;
  screenX: number;
  screenY: number;
}

export interface ProjectBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  count: number;
  avgLon: number;
}

export type { Place, StatusBarData, ThemeColors };