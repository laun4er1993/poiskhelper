// =====================================================
// src/hooks/useSettings.ts
// Глобальные настройки приложения (с автосохранением в localStorage)
// =====================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppSettings } from '../types/settings';
import { DEFAULT_SETTINGS, mergeSettings } from '../types/settings';

const SETTINGS_KEY = 'poiskhelper_settings_v1';

function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergeSettings(parsed);
    }
  } catch (e) {
    console.warn('useSettings: ошибка чтения настроек', e);
  }
  return DEFAULT_SETTINGS;
}

export interface UseSettingsResult {
  settings: AppSettings;
  /** Мягкое обновление (merge с prev) */
  updateSettings: (updater: Partial<AppSettings>) => void;
  /** Полная замена настроек (например, при сбросе) */
  replaceSettings: (next: AppSettings) => void;
  /** Установка конкретного поля */
  setField: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;
  /** Сброс к дефолтным настройкам */
  resetSettings: () => void;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(loadSettingsFromStorage);

  // Автосохранение при любом изменении
  useEffect(
    function () {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {
        console.warn('useSettings: не удалось сохранить настройки', e);
      }
    },
    [settings]
  );

  const updateSettings = useCallback(function (updater: Partial<AppSettings>) {
    setSettings(function (prev) {
      return { ...prev, ...updater };
    });
  }, []);

  const replaceSettings = useCallback(function (next: AppSettings) {
    setSettings(next);
  }, []);

  const setField = useCallback(function <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) {
    setSettings(function (prev) {
      return { ...prev, [key]: value };
    });
  }, []);

  const resetSettings = useCallback(function () {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return useMemo(
    function () {
      return {
        settings,
        updateSettings,
        replaceSettings,
        setField,
        resetSettings,
      };
    },
    [settings, updateSettings, replaceSettings, setField, resetSettings]
  );
}