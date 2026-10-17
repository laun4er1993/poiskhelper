// =====================================================
// src/components/measure/types.ts
// Типы для модуля измерения (линейка)
// =====================================================

import type {
  MeasurePoint,
  MeasureRulerType,
  MeasureMetrics,
  SegmentMetricsResult,
} from '../../types/measure';
import type { AppSettings } from '../../types/settings';

export interface MeasurePanelProps {
  points: MeasurePoint[];
  closed: boolean;
  settings: AppSettings;

  onClear: () => void;
  onUndo: () => void;
  onToggleClosed: () => void;

  /** Сохранить как объект-измерение */
  onSave: (name?: string) => void;

  onRemovePoint?: (index: number) => void;
  onSelectPoint?: (index: number | null) => void;
  onFlyToPoint?: (lat: number, lon: number, height: number) => void;
  onCopyCoordsToClipboard?: (text: string, label: string) => void;
  onSetRulerType?: (type: MeasureRulerType) => void;

  /** Индекс выделенной точки (управляется извне) */
  selectedIndex?: number | null;
}

export type MeasurePanelTab = 'points' | 'segments' | 'export';

export type {
  MeasurePoint,
  MeasureRulerType,
  MeasureMetrics,
  SegmentMetricsResult,
};