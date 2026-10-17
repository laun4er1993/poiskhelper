// =====================================================
// src/components/properties/types.ts
// Типы для панели свойств объекта
// =====================================================

import type { TreeItem, Place, MeasurePoint } from '../../types/base';
import type {
  LabelSettings,
  PartialLabelSettings,
} from '../../types/labels';
import type { AppSettings } from '../../types/settings';
import type {
  MeasureRulerType,
  MeasureLineDash,
  MeasurePointShape,
  MeasureNumberStyle,
} from '../../types/measure';

export type { LabelSettings, PartialLabelSettings };

export interface Draft {
  name?: string;
  note?: string;
  opacity?: number;
  labelSettings?: PartialLabelSettings;

  // Place
  lat?: number;
  lon?: number;
  height?: number;
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

  // Line (kmlline)
  width?: number;

  // Polygon
  fillColor?: string;
  polygonOutlineColor?: string;
  polygonOutlineWidth?: number;

  // Container
  sortField?: string;
  sortOrder?: string;

  // Measure
  positions?: MeasurePoint[];
  closed?: boolean;
  rulerType?: MeasureRulerType;
  lineOpacity?: number;
  lineDash?: MeasureLineDash;

  pointShape?: MeasurePointShape;
  pointSize?: number;
  pointOpacity?: number;
  pointFillColor?: string;
  pointOutlineColor?: string;
  pointOutlineWidth?: number;

  showNumbers?: boolean;
  numberFontSize?: number;
  numberColor?: string;
  numberOutlineColor?: string;
  numberOutlineWidth?: number;
  numberStyle?: MeasureNumberStyle;

  showHeights?: boolean;
  showSegmentLengths?: boolean;
  showAzimuths?: boolean;
  highlightEndpoints?: boolean;
}

export interface PropertiesPanelProps {
  item: TreeItem;
  settings: AppSettings;
  hasPreview: boolean;
  onDelete: (id: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onFlyTo: (place: Place) => void;
  onClose: () => void;
  onDuplicate: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCopyCoords: (text: string, label: string) => void;
  onAddFolder: (parentId: string) => void;
  onAddPlace: (parentId: string) => void;
  onPreview: (id: string, updates: Partial<any>) => void;
  onCancelPreviewFor: (id: string) => void;
  onSaveItem: (id: string, updates: Partial<any>) => void;
}

export const DEFAULT_PIXEL_SIZE = 6;
export const DEFAULT_OUTLINE_COLOR = '#000000';
export const DEFAULT_OUTLINE_WIDTH = 0.05;