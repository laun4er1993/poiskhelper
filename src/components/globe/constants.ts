// =====================================================
// src/components/globe/constants.ts
// Константы для модуля GlobeViewer
// =====================================================

import * as Cesium from 'cesium';

// -----------------------------------------------------
// Токен Cesium Ion
// -----------------------------------------------------
export const CESIUM_ION_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6InVKYnJEMGo2UGRtQnpBS3IiLCJqdGkiOiIxMWIwZDFjOC0yOWU3LTQ5OTYtOTQ3Mi02NTVlNzNkM2YzZTUiLCJpZCI6NTI2MjI0LCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3OTIwODQ3Mzh9.wdcwFRH8oJtgxhnXDw2apbPME1mLDnXCD3pSqoOtFBA';

// -----------------------------------------------------
// Коды событий Cesium (числовые константы для скорости)
// -----------------------------------------------------
export const EVT_LEFT_DOWN = 0;
export const EVT_LEFT_UP = 1;
export const EVT_LEFT_CLICK = 2;
export const EVT_LEFT_DOUBLE_CLICK = 3;
export const EVT_MOUSE_MOVE = 15;

// -----------------------------------------------------
// Размеры и дефолты
// -----------------------------------------------------
export const DEFAULT_ICON_NATIVE_SIZE = 32;
export const DEFAULT_PIXEL_SIZE = 6;
export const HUGE_DISTANCE = 1e12;

export const DEFAULT_OUTLINE_COLOR = '#000000';
export const DEFAULT_OUTLINE_WIDTH = 0.05;

/** Множитель рендера canvas-кружка (для резкости) */
export const CIRCLE_RENDER_SCALE = 4;

/** Множитель размера выделенной метки */
export const SELECTED_SCALE_FACTOR = 1.2;

/** Порог движения мыши для определения drag */
export const DRAG_THRESHOLD = 4;

// -----------------------------------------------------
// Реинициализация токена
// -----------------------------------------------------
export function ensureIonToken(): void {
  if (Cesium.Ion.defaultAccessToken !== CESIUM_ION_TOKEN) {
    Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;
  }
}