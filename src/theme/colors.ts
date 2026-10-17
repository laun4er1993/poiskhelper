// =====================================================
// src/theme/colors.ts
// Дефолтные цвета объектов на карте
// =====================================================

import type { ThemeColors } from './types';

export const DEFAULT_COLORS: ThemeColors = {
  markerDefault: '#e74c3c',
  lineColor: '#f1c40f',
  selectionColor: '#4a90d9',
  backgroundColor: '#0d0d12',
  polygonFill: '#4a90d9',
  polygonOutline: '#ffffff',
};

/**
 * Пресеты для быстрого выбора цвета метки.
 */
export const MARKER_COLOR_PRESETS: string[] = [
  '#e74c3c',
  '#f1c40f',
  '#27ae60',
  '#3498db',
  '#9b59b6',
  '#e67e22',
  '#1abc9c',
  '#ffffff',
];