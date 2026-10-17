// =====================================================
// src/theme/types.ts
// Типы для темы оформления и скинов
// =====================================================

import type { GlobeSkin, TreeDensity, ToolbarSize } from '../types/settings';

// -----------------------------------------------------
// Основная тема (цвета интерфейса)
// -----------------------------------------------------
export interface Theme {
  // Акцент
  accent: string;
  accentHover: string;
  accentText: string;

  // Фоны
  bgApp: string;
  bgSurface: string;
  bgSurfaceHover: string;
  bgInput: string;
  bgModal: string;
  bgPanel: string;
  bgPanelHeader: string;

  // Границы и текст
  border: string;
  borderAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Семантика
  danger: string;
  warning: string;
  success: string;
  info: string;

  // Размеры
  radius: number;
  radiusSmall: number;
  fontSize: number;
  iconSize: number;

  // Эффекты
  opacity: number;
  blur: number;

  // Метаданные
  id?: string;
  label?: string;
  dark: boolean;

  // Новые поля (для мягкой темы и акцентов)
  /** Базовая яркость теней: 'light' | 'medium' | 'heavy' */
  shadowLevel?: 'light' | 'medium' | 'heavy';
}

// -----------------------------------------------------
// Скин глобуса (стилизация элементов поверх Cesium)
// -----------------------------------------------------
export interface GlobeSkinPreset {
  id: GlobeSkin;
  label: string;
  description: string;

  // Компас
  compassBg: string;
  compassBorder: string;
  compassText: string;
  compassNorth: string;
  compassRingColor: string;
  compassSize: number;
  compassShowTicks: boolean;

  // Кнопки управления камерой
  navBg: string;
  navBorder: string;
  navText: string;
  navHoverBg: string;
  navSize: number;
  navRadius: number;

  // Нижняя инфо-линейка
  infobarBg: string;
  infobarBorder: string;
  infobarText: string;
  infobarAccent: string;
  infobarHeight: number;
  infobarShowFPS: boolean;
  infobarShowCoords: boolean;
  infobarShowCamera: boolean;

  // Попап на карте
  popupBg: string;
  popupBorder: string;
  popupText: string;
  popupTitle: string;
  popupMuted: string;
  popupAccent: string;
  popupRadius: number;
  popupShadow: string;

  // Общее
  accent: string;
  shadow: string;
  blur: number;
}

// -----------------------------------------------------
// Размер тулбара
// -----------------------------------------------------
export interface ToolbarSizePreset {
  id: ToolbarSize;
  label: string;
  height: number;
  padding: number;
  gap: number;
  btnSize: number;
  iconSize: number;
  radius: number;
  brandFontSize: number;
  brandDotSize: number;
}

// -----------------------------------------------------
// Плотность дерева
// -----------------------------------------------------
export interface TreeDensityPreset {
  id: TreeDensity;
  label: string;
  rowHeight: number;
  paddingX: number;
  paddingY: number;
  fontSize: number;
  iconSize: number;
  checkboxSize: number;
  expanderSize: number;
  gap: number;
  childIndent: number;
  minHeight: number;
}

// -----------------------------------------------------
// Цвета объектов на карте
// -----------------------------------------------------
export interface ThemeColors {
  markerDefault: string;
  lineColor: string;
  selectionColor: string;
  backgroundColor: string;
  polygonFill: string;
  polygonOutline: string;
}