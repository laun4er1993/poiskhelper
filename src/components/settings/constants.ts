// =====================================================
// src/components/settings/constants.ts
// Пресеты подписей, константы, вспомогательные функции
// =====================================================

import type { LabelSettings } from '../../types/labels';

// -----------------------------------------------------
// Пресеты подписей
// -----------------------------------------------------
export interface LabelPreset {
  id: string;
  label: string;
  description: string;
  settings: Partial<LabelSettings>;
}

export const LABEL_PRESETS: LabelPreset[] = [
  {
    id: 'classic',
    label: 'Классика',
    description: 'Белый текст с чёрной обводкой, как в GEP',
    settings: {
      show: true,
      fontFamily: 'Segoe UI',
      fontSize: 13,
      fillColor: '#ffffff',
      outlineColor: '#000000',
      outlineWidth: 3,
      style: 'FILL_AND_OUTLINE',
      showBackground: false,
      offsetX: 0,
      offsetY: -6,
      verticalOrigin: 2,
      horizontalOrigin: 1,
      opacity: 1,
      hideAtDistance: 0,
    },
  },
  {
    id: 'compact',
    label: 'Компактные',
    description: 'Маленький шрифт без фона',
    settings: {
      show: true,
      fontSize: 11,
      outlineWidth: 2,
      showBackground: false,
      offsetY: -4,
      opacity: 0.9,
      hideAtDistance: 1500000,
    },
  },
  {
    id: 'large',
    label: 'Крупные',
    description: 'Жирный текст с фоном',
    settings: {
      show: true,
      fontSize: 15,
      showBackground: true,
      backgroundColor: '#0a0a0a',
      backgroundAlpha: 0.8,
      paddingX: 8,
      paddingY: 5,
      offsetY: -8,
      opacity: 1,
    },
  },
  {
    id: 'minimal',
    label: 'Минимализм',
    description: 'Только текст без обводки',
    settings: {
      show: true,
      fontSize: 12,
      fillColor: '#f1c40f',
      outlineWidth: 0,
      style: 'FILL',
      showBackground: false,
      hideAtDistance: 2000000,
    },
  },
  {
    id: 'hidden',
    label: 'Скрыть подписи',
    description: 'Полностью отключить подписи',
    settings: { show: false },
  },
];

// -----------------------------------------------------
// Вспомогательные функции
// -----------------------------------------------------
export function formatKm(meters: number): string {
  if (meters <= 0) return 'выкл';
  if (meters >= 1000) return (meters / 1000).toFixed(0) + ' км';
  return Math.round(meters) + ' м';
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || '#000000').replace('#', '');
  let r = '00';
  let g = '00';
  let b = '00';
  if (h.length === 6) {
    r = h.substring(0, 2);
    g = h.substring(2, 4);
    b = h.substring(4, 6);
  } else if (h.length === 3) {
    r = h[0] + h[0];
    g = h[1] + h[1];
    b = h[2] + h[2];
  }
  const ri = parseInt(r, 16);
  const gi = parseInt(g, 16);
  const bi = parseInt(b, 16);
  return (
    'rgba(' +
    (isNaN(ri) ? 0 : ri) + ', ' +
    (isNaN(gi) ? 0 : gi) + ', ' +
    (isNaN(bi) ? 0 : bi) + ', ' +
    alpha + ')'
  );
}