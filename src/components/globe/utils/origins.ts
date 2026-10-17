// =====================================================
// src/components/globe/utils/origins.ts
// Преобразование числовых значений → enum Cesium
// =====================================================

import * as Cesium from 'cesium';

export function verticalOriginFromNumber(n: number): Cesium.VerticalOrigin {
  if (n === 0) return Cesium.VerticalOrigin.TOP;
  if (n === 1) return Cesium.VerticalOrigin.CENTER;
  if (n === 3) return Cesium.VerticalOrigin.BASELINE;
  return Cesium.VerticalOrigin.BOTTOM;
}

export function horizontalOriginFromNumber(
  n: number
): Cesium.HorizontalOrigin {
  if (n === 0) return Cesium.HorizontalOrigin.LEFT;
  if (n === 2) return Cesium.HorizontalOrigin.RIGHT;
  return Cesium.HorizontalOrigin.CENTER;
}

export function labelStyleFromString(s: string): Cesium.LabelStyle {
  if (s === 'FILL') return Cesium.LabelStyle.FILL;
  if (s === 'OUTLINE') return Cesium.LabelStyle.OUTLINE;
  return Cesium.LabelStyle.FILL_AND_OUTLINE;
}