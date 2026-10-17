// =====================================================
// src/hooks/useTheme.ts
// Тема + цвета объектов + автосохранение + применение к :root
// =====================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Theme, ThemeColors } from '../theme/types';
import { DARK_THEME } from '../theme/presets';
import { DEFAULT_COLORS } from '../theme/colors';
import { applyTheme } from '../theme/apply';
import type { DesignSettings } from '../types/settings';

const THEME_KEY = 'poiskhelper_theme_v1';
const COLORS_KEY = 'poiskhelper_colors_v1';

// Debounce: 200 мс — достаточно, чтобы не спамить applyTheme при вводе,
// но пользователь не замечает задержки визуальной реакции.
const APPLY_THEME_DEBOUNCE_MS = 200;

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) return { ...DARK_THEME, ...JSON.parse(raw) };
  } catch (e) {}
  return DARK_THEME;
}

function loadColors(): ThemeColors {
  try {
    const raw = localStorage.getItem(COLORS_KEY);
    if (raw) return { ...DEFAULT_COLORS, ...JSON.parse(raw) };
  } catch (e) {}
  return DEFAULT_COLORS;
}

export interface UseThemeResult {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (t: Theme) => void;
  setColors: (c: ThemeColors) => void;
  resetTheme: () => void;
  resetColors: () => void;
}

export function useTheme(design: DesignSettings): UseThemeResult {
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [colors, setColorsState] = useState<ThemeColors>(loadColors);

  // Стабильная ссылка на design — чтобы не дёргать applyTheme, если
  // объект пересоздан, но поля те же.
  const designRef = useRef<DesignSettings>(design);

  // Автосохранение темы
  useEffect(
    function () {
      try {
        localStorage.setItem(THEME_KEY, JSON.stringify(theme));
      } catch (e) {}
    },
    [theme]
  );

  // Автосохранение цветов
  useEffect(
    function () {
      try {
        localStorage.setItem(COLORS_KEY, JSON.stringify(colors));
      } catch (e) {}
    },
    [colors]
  );

  // ⚡ Debounce applyTheme
  useEffect(
    function () {
      designRef.current = design;

      const id = window.setTimeout(function () {
        applyTheme(theme, colors, designRef.current);
      }, APPLY_THEME_DEBOUNCE_MS);

      return function () {
        window.clearTimeout(id);
      };
    },
    [theme, colors, design]
  );

  const setTheme = useCallback(function (t: Theme) {
    setThemeState(t);
  }, []);

  const setColors = useCallback(function (c: ThemeColors) {
    setColorsState(c);
  }, []);

  const resetTheme = useCallback(function () {
    setThemeState(DARK_THEME);
  }, []);

  const resetColors = useCallback(function () {
    setColorsState(DEFAULT_COLORS);
  }, []);

  return useMemo(
    function () {
      return {
        theme,
        colors,
        setTheme,
        setColors,
        resetTheme,
        resetColors,
      };
    },
    [theme, colors, setTheme, setColors, resetTheme, resetColors]
  );
}