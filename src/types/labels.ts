// =====================================================
// src/types/labels.ts
// Настройки подписей (labels)
// =====================================================

export type LabelStyle = 'FILL' | 'OUTLINE' | 'FILL_AND_OUTLINE';

export interface LabelSettings {
  show: boolean;
  fontFamily: string;
  fontSize: number;
  scale: number;
  fillColor: string;
  outlineColor: string;
  outlineWidth: number;
  style: LabelStyle;
  showBackground: boolean;
  backgroundColor: string;
  backgroundAlpha: number;
  paddingX: number;
  paddingY: number;
  offsetX: number;
  offsetY: number;
  verticalOrigin: number;
  horizontalOrigin: number;
  opacity: number;
  hideAtDistance: number;
  fadeInAtDistance: number;
}

export type PartialLabelSettings = Partial<LabelSettings>;

export const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  show: true,
  fontFamily: 'Segoe UI',
  fontSize: 13,
  scale: 1,
  fillColor: '#ffffff',
  outlineColor: '#000000',
  outlineWidth: 3,
  style: 'FILL_AND_OUTLINE',
  showBackground: false,
  backgroundColor: '#0a0a0a',
  backgroundAlpha: 0.75,
  paddingX: 6,
  paddingY: 3,
  offsetX: 0,
  offsetY: -14,
  verticalOrigin: 2,
  horizontalOrigin: 1,
  opacity: 1,
  hideAtDistance: 0,
  fadeInAtDistance: 0,
};

export function mergeLabelSettings(
  base: LabelSettings,
  override?: PartialLabelSettings
): LabelSettings {
  if (!override) return base;
  return { ...base, ...override };
}