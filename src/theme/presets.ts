// =====================================================
// src/theme/presets.ts
// Готовые темы оформления
// =====================================================

import type { Theme } from './types';

// -----------------------------------------------------
// Тёмная (по умолчанию)
// -----------------------------------------------------
export const DARK_THEME: Theme = {
  id: 'dark',
  label: 'Тёмная',
  dark: true,
  shadowLevel: 'medium',

  accent: '#4a90d9',
  accentHover: '#5aa0e9',
  accentText: '#ffffff',

  bgApp: '#0d0d12',
  bgSurface: '#15151c',
  bgSurfaceHover: '#1f1f28',
  bgInput: '#0d0d12',
  bgModal: '#1a1a22',
  bgPanel: '#15151c',
  bgPanelHeader: '#1a1a22',

  border: 'rgba(255, 255, 255, 0.08)',
  borderAccent: 'rgba(74, 144, 217, 0.5)',
  textPrimary: '#f2f2f5',
  textSecondary: '#b8b8c0',
  textMuted: '#707080',

  danger: '#e74c3c',
  warning: '#f1c40f',
  success: '#27ae60',
  info: '#3498db',

  radius: 8,
  radiusSmall: 5,
  fontSize: 13,
  iconSize: 15,
  opacity: 0.95,
  blur: 12,
};

// -----------------------------------------------------
// Светлая
// -----------------------------------------------------
export const LIGHT_THEME: Theme = {
  id: 'light',
  label: 'Светлая',
  dark: false,
  shadowLevel: 'light',

  accent: '#2b6cb0',
  accentHover: '#3182ce',
  accentText: '#ffffff',

  bgApp: '#e8e8ee',
  bgSurface: '#ffffff',
  bgSurfaceHover: '#f0f0f5',
  bgInput: '#f5f5f8',
  bgModal: '#ffffff',
  bgPanel: '#ffffff',
  bgPanelHeader: '#f5f5f8',

  border: 'rgba(0, 0, 0, 0.1)',
  borderAccent: 'rgba(43, 108, 176, 0.4)',
  textPrimary: '#1a1a20',
  textSecondary: '#4a4a55',
  textMuted: '#8888a0',

  danger: '#c53030',
  warning: '#b7791f',
  success: '#2f855a',
  info: '#3182ce',

  radius: 8,
  radiusSmall: 5,
  fontSize: 13,
  iconSize: 15,
  opacity: 0.95,
  blur: 12,
};

// -----------------------------------------------------
// Высокий контраст
// -----------------------------------------------------
export const HIGH_CONTRAST_THEME: Theme = {
  id: 'contrast',
  label: 'Высокий контраст',
  dark: true,
  shadowLevel: 'heavy',

  accent: '#ffd400',
  accentHover: '#ffdf33',
  accentText: '#000000',

  bgApp: '#000000',
  bgSurface: '#0a0a0a',
  bgSurfaceHover: '#1a1a1a',
  bgInput: '#000000',
  bgModal: '#111111',
  bgPanel: '#0a0a0a',
  bgPanelHeader: '#111111',

  border: 'rgba(255, 255, 255, 0.25)',
  borderAccent: 'rgba(255, 212, 0, 0.7)',
  textPrimary: '#ffffff',
  textSecondary: '#e0e0e0',
  textMuted: '#a0a0a0',

  danger: '#ff5252',
  warning: '#ffd400',
  success: '#00e676',
  info: '#40c4ff',

  radius: 4,
  radiusSmall: 3,
  fontSize: 14,
  iconSize: 16,
  opacity: 1,
  blur: 0,
};

// -----------------------------------------------------
// Мягкая
// -----------------------------------------------------
export const SOFT_THEME: Theme = {
  id: 'soft',
  label: 'Мягкая',
  dark: true,
  shadowLevel: 'medium',

  accent: '#9b87f5',
  accentHover: '#a996f7',
  accentText: '#ffffff',

  bgApp: '#1a1a24',
  bgSurface: '#22222e',
  bgSurfaceHover: '#2c2c3a',
  bgInput: '#1a1a24',
  bgModal: '#26262f',
  bgPanel: '#22222e',
  bgPanelHeader: '#26262f',

  border: 'rgba(255, 255, 255, 0.06)',
  borderAccent: 'rgba(155, 135, 245, 0.5)',
  textPrimary: '#eeecf5',
  textSecondary: '#b0aec0',
  textMuted: '#7b7996',

  danger: '#f87d6b',
  warning: '#f0c46b',
  success: '#7bd88f',
  info: '#7aa8f0',

  radius: 12,
  radiusSmall: 8,
  fontSize: 13,
  iconSize: 15,
  opacity: 0.96,
  blur: 14,
};

// -----------------------------------------------------
// Список всех пресетов
// -----------------------------------------------------
export const THEME_PRESETS: Theme[] = [
  DARK_THEME,
  LIGHT_THEME,
  HIGH_CONTRAST_THEME,
  SOFT_THEME,
];

export function getThemeById(id: string): Theme {
  const found = THEME_PRESETS.find(function (t) {
    return t.id === id;
  });
  return found || DARK_THEME;
}