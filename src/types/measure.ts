// =====================================================
// src/types/measure.ts
// Типы и настройки для линеек измерения
// =====================================================

export interface MeasurePoint {
  lat: number;
  lon: number;
  height: number;
}

export type MeasureRulerType = 'simple' | 'path' | 'area';

export interface MeasureRulerInfo {
  id: MeasureRulerType;
  label: string;
  description: string;
  allowClose: boolean;
  computeArea: boolean;
  maxPoints: number;
}

export const MEASURE_RULERS: MeasureRulerInfo[] = [
  {
    id: 'simple',
    label: 'Простая',
    description: 'Расстояние между двумя точками A→B',
    allowClose: false,
    computeArea: false,
    maxPoints: 2,
  },
  {
    id: 'path',
    label: 'Путь',
    description: 'Многоточечная ломаная: длина и азимуты сегментов',
    allowClose: false,
    computeArea: false,
    maxPoints: 0,
  },
  {
    id: 'area',
    label: 'Площадь',
    description: 'Замкнутая фигура: длина + площадь + высоты',
    allowClose: true,
    computeArea: true,
    maxPoints: 0,
  },
];

export function getRulerInfo(id: MeasureRulerType): MeasureRulerInfo {
  const found = MEASURE_RULERS.find(function (r) {
    return r.id === id;
  });
  return found || MEASURE_RULERS[1];
}

export type LineDashStyle = 'solid' | 'dashed' | 'dotted';
export type MeasurePointShape = 'double-circle' | 'circle' | 'square';
export type NumberStyle = 'fill' | 'outline' | 'fill-and-outline';

export interface MeasureSettings {
  rulerType: MeasureRulerType;

  // --- Линия (без обводки) ---
  lineColor: string;
  lineWidth: number;
  lineOpacity: number;
  lineDash: LineDashStyle;

  // --- Точки ---
  pointShape: MeasurePointShape;
  pointSize: number;
  pointOpacity: number;
  pointFillColor: string;
  pointOutlineColor: string;
  pointOutlineWidth: number;

  // --- Цифры на точках ---
  showNumbers: boolean;
  numberFontSize: number;
  numberColor: string;
  numberOutlineColor: string;
  numberOutlineWidth: number;
  numberStyle: NumberStyle;

  // --- Подписи ---
  showHeights: boolean;
  showSegmentLengths: boolean;
  showAzimuths: boolean;
  highlightEndpoints: boolean;

  // --- Поведение ---
  autoClose: boolean;
  autoCloseRadiusPx: number;
  escFinishesOnly: boolean;
  showAutoCloseHint: boolean;

  // --- Расчёты ---
  walkingSpeed: number;
  showWalkingTime: boolean;
}

// =====================================================
// ⚡ Дефолты: чёрно-белый стиль, как классический
// =====================================================
export const DEFAULT_MEASURE_SETTINGS: MeasureSettings = {
  rulerType: 'path',

  // Линия — тёмно-серая, полупрозрачная
  lineColor: '#1a1a1a',
  lineWidth: 2,
  lineOpacity: 0.7,
  lineDash: 'solid',

  // Точки — белый круг с чёрной обводкой
  pointShape: 'double-circle',
  pointSize: 14,
  pointOpacity: 1,
  pointFillColor: '#ffffff',
  pointOutlineColor: '#1a1a1a',
  pointOutlineWidth: 2,

  // Цифры — чёрные с белой обводкой
  showNumbers: true,
  numberFontSize: 10,
  numberColor: '#1a1a1a',
  numberOutlineColor: '#ffffff',
  numberOutlineWidth: 1,
  numberStyle: 'fill-and-outline',

  showHeights: false,
  showSegmentLengths: true,
  showAzimuths: true,
  highlightEndpoints: false, // выкл по умолчанию для ч/б стиля

  autoClose: false,
  autoCloseRadiusPx: 15,
  escFinishesOnly: true,
  showAutoCloseHint: true,

  walkingSpeed: 5,
  showWalkingTime: true,
};

// =====================================================
// === Метрики ===
// =====================================================
export interface MeasureMetrics {
  totalDist: number;
  area: number;
  minHeight: number;
  maxHeight: number;
  avgHeight: number;
  hasHeights: boolean;
  segmentCount: number;
}

export const EMPTY_METRICS: MeasureMetrics = {
  totalDist: 0,
  area: 0,
  minHeight: 0,
  maxHeight: 0,
  avgHeight: 0,
  hasHeights: false,
  segmentCount: 0,
};

export interface SegmentMetrics {
  index: number;
  fromNumber: number;
  toNumber: number;
  from: MeasurePoint;
  to: MeasurePoint;
  distance: number;
  distance3D: number;
  azimuth: number;
  slopeDeg: number;
  slopePercent: number;
  deltaHeight: number;
}

export interface SegmentMetricsResult {
  segments: SegmentMetrics[];
  totalDistance: number;
  totalDistance3D: number;
  totalDeltaHeight: number;
  minHeight: number;
  maxHeight: number;
  avgHeight: number;
  hasHeights: boolean;
}