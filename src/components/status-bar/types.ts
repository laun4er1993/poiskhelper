// =====================================================
// src/components/status-bar/types.ts
// Тип данных статусной строки
// =====================================================

export interface StatusBarData {
  mouseLat: number | null;
  mouseLon: number | null;
  mouseHeight: number | null;
  cameraHeading: number;
  cameraPitch: number;
  cameraHeight: number;
  scaleMeters: number;
}