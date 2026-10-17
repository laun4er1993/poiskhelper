// =====================================================
// src/theme/skins.ts
// Скины глобуса (стилизация элементов поверх Cesium)
// =====================================================

import type { GlobeSkinPreset } from './types';

export const GLOBE_SKIN_MODERN: GlobeSkinPreset = {
  id: 'modern',
  label: 'Современный',
  description: 'Стеклянные панели, мягкие тени, аккуратные углы',

  compassBg: 'rgba(20, 24, 32, 0.75)',
  compassBorder: 'rgba(255, 255, 255, 0.12)',
  compassText: '#f2f2f5',
  compassNorth: '#e74c3c',
  compassRingColor: 'rgba(255, 255, 255, 0.15)',
  compassSize: 56,
  compassShowTicks: true,

  navBg: 'rgba(20, 24, 32, 0.8)',
  navBorder: 'rgba(255, 255, 255, 0.12)',
  navText: '#f2f2f5',
  navHoverBg: 'rgba(74, 144, 217, 0.85)',
  navSize: 32,
  navRadius: 8,

  infobarBg: 'rgba(20, 24, 32, 0.85)',
  infobarBorder: 'rgba(255, 255, 255, 0.1)',
  infobarText: '#e6e8ec',
  infobarAccent: '#4a90d9',
  infobarHeight: 26,
  infobarShowFPS: false,
  infobarShowCoords: true,
  infobarShowCamera: true,

  popupBg: '#14161c',
  popupBorder: 'rgba(255, 255, 255, 0.12)',
  popupText: '#f2f2f5',
  popupTitle: '#ffffff',
  popupMuted: '#a0a4b0',
  popupAccent: '#4a90d9',
  popupRadius: 10,
  popupShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',

  accent: '#4a90d9',
  shadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
  blur: 14,
};

export const GLOBE_SKIN_GEP: GlobeSkinPreset = {
  id: 'gep',
  label: 'Google Earth Pro',
  description: 'Классический вид GEP — тёмные панели, простые формы',

  compassBg: 'rgba(0, 0, 0, 0.65)',
  compassBorder: 'rgba(255, 255, 255, 0.25)',
  compassText: '#ffffff',
  compassNorth: '#ff3b30',
  compassRingColor: 'rgba(255, 255, 255, 0.4)',
  compassSize: 60,
  compassShowTicks: true,

  navBg: 'rgba(0, 0, 0, 0.7)',
  navBorder: 'rgba(255, 255, 255, 0.2)',
  navText: '#ffffff',
  navHoverBg: 'rgba(70, 130, 180, 0.9)',
  navSize: 30,
  navRadius: 3,

  infobarBg: 'rgba(0, 0, 0, 0.72)',
  infobarBorder: 'rgba(255, 255, 255, 0.15)',
  infobarText: '#e0e0e0',
  infobarAccent: '#7cb3ff',
  infobarHeight: 24,
  infobarShowFPS: false,
  infobarShowCoords: true,
  infobarShowCamera: true,

  popupBg: '#1a1a1a',
  popupBorder: 'rgba(255, 255, 255, 0.2)',
  popupText: '#f0f0f0',
  popupTitle: '#ffffff',
  popupMuted: '#9a9a9a',
  popupAccent: '#7cb3ff',
  popupRadius: 4,
  popupShadow: '0 6px 24px rgba(0, 0, 0, 0.75)',

  accent: '#7cb3ff',
  shadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
  blur: 0,
};

export const GLOBE_SKIN_QGIS: GlobeSkinPreset = {
  id: 'qgis',
  label: 'QGIS',
  description: 'Строгий вид QGIS — плотные панели, холодные оттенки',

  compassBg: 'rgba(45, 55, 65, 0.85)',
  compassBorder: 'rgba(150, 180, 210, 0.35)',
  compassText: '#e8f0f8',
  compassNorth: '#ff5a4a',
  compassRingColor: 'rgba(120, 160, 200, 0.4)',
  compassSize: 54,
  compassShowTicks: true,

  navBg: 'rgba(45, 55, 65, 0.9)',
  navBorder: 'rgba(150, 180, 210, 0.25)',
  navText: '#e8f0f8',
  navHoverBg: 'rgba(90, 140, 180, 0.9)',
  navSize: 28,
  navRadius: 4,

  infobarBg: 'rgba(35, 45, 55, 0.92)',
  infobarBorder: 'rgba(150, 180, 210, 0.2)',
  infobarText: '#d8e4f0',
  infobarAccent: '#6ba3d4',
  infobarHeight: 24,
  infobarShowFPS: true,
  infobarShowCoords: true,
  infobarShowCamera: true,

  popupBg: '#2a323c',
  popupBorder: 'rgba(150, 180, 210, 0.3)',
  popupText: '#e8f0f8',
  popupTitle: '#ffffff',
  popupMuted: '#9ab0c4',
  popupAccent: '#6ba3d4',
  popupRadius: 4,
  popupShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',

  accent: '#6ba3d4',
  shadow: '0 4px 16px rgba(0, 0, 0, 0.55)',
  blur: 6,
};

export const GLOBE_SKIN_MINIMAL: GlobeSkinPreset = {
  id: 'minimal',
  label: 'Минимализм',
  description: 'Прозрачные панели без фона — максимум карты',

  compassBg: 'transparent',
  compassBorder: 'rgba(255, 255, 255, 0.35)',
  compassText: '#ffffff',
  compassNorth: '#ff4b3e',
  compassRingColor: 'rgba(255, 255, 255, 0.5)',
  compassSize: 46,
  compassShowTicks: false,

  navBg: 'transparent',
  navBorder: 'rgba(255, 255, 255, 0.25)',
  navText: '#ffffff',
  navHoverBg: 'rgba(255, 255, 255, 0.15)',
  navSize: 26,
  navRadius: 4,

  infobarBg: 'transparent',
  infobarBorder: 'transparent',
  infobarText: '#ffffff',
  infobarAccent: '#ffffff',
  infobarHeight: 22,
  infobarShowFPS: false,
  infobarShowCoords: true,
  infobarShowCamera: false,

  popupBg: 'rgba(20, 20, 20, 0.75)',
  popupBorder: 'rgba(255, 255, 255, 0.15)',
  popupText: '#f0f0f0',
  popupTitle: '#ffffff',
  popupMuted: '#a0a0a0',
  popupAccent: '#ffffff',
  popupRadius: 6,
  popupShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',

  accent: '#ffffff',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  blur: 0,
};

export const GLOBE_SKIN_COMPACT: GlobeSkinPreset = {
  id: 'compact',
  label: 'Компактный',
  description: 'Маленькие панели, много карты',

  compassBg: 'rgba(15, 18, 24, 0.85)',
  compassBorder: 'rgba(255, 255, 255, 0.1)',
  compassText: '#f2f2f5',
  compassNorth: '#ff5544',
  compassRingColor: 'rgba(255, 255, 255, 0.18)',
  compassSize: 40,
  compassShowTicks: false,

  navBg: 'rgba(15, 18, 24, 0.85)',
  navBorder: 'rgba(255, 255, 255, 0.1)',
  navText: '#e6e8ec',
  navHoverBg: 'rgba(74, 144, 217, 0.85)',
  navSize: 24,
  navRadius: 5,

  infobarBg: 'rgba(15, 18, 24, 0.88)',
  infobarBorder: 'rgba(255, 255, 255, 0.08)',
  infobarText: '#d8dce2',
  infobarAccent: '#4a90d9',
  infobarHeight: 22,
  infobarShowFPS: false,
  infobarShowCoords: true,
  infobarShowCamera: false,

  popupBg: '#101318',
  popupBorder: 'rgba(255, 255, 255, 0.1)',
  popupText: '#e8ecf0',
  popupTitle: '#ffffff',
  popupMuted: '#949aa4',
  popupAccent: '#4a90d9',
  popupRadius: 8,
  popupShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',

  accent: '#4a90d9',
  shadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
  blur: 8,
};

// -----------------------------------------------------
// Список всех скинов
// -----------------------------------------------------
export const GLOBE_SKINS: GlobeSkinPreset[] = [
  GLOBE_SKIN_MODERN,
  GLOBE_SKIN_GEP,
  GLOBE_SKIN_QGIS,
  GLOBE_SKIN_MINIMAL,
  GLOBE_SKIN_COMPACT,
];

export function getGlobeSkin(id: string): GlobeSkinPreset {
  const found = GLOBE_SKINS.find(function (s) {
    return s.id === id;
  });
  return found || GLOBE_SKIN_MODERN;
}