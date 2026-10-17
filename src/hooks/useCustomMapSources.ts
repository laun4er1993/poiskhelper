// =====================================================
// src/hooks/useCustomMapSources.ts
// Управление кастомными источниками карт
// =====================================================

import { useCallback, useMemo } from 'react';
import type { CustomMapSource } from '../types/map-sources';

const STORAGE_KEY = 'poiskhelper_custom_map_sources_v1';

function loadFromStorage(): CustomMapSource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function (c: any) {
      return (
        c &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        typeof c.urlTemplate === 'string'
      );
    });
  } catch (e) {
    return [];
  }
}

function saveToStorage(sources: CustomMapSource[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  } catch (e) {
    console.warn('Не удалось сохранить кастомные источники:', e);
  }
}

function generateId(): string {
  return (
    'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
  );
}

export interface UseCustomMapSourcesResult {
  sources: CustomMapSource[];
  addSource: (source: Omit<CustomMapSource, 'id' | 'addedAt'>) => CustomMapSource;
  updateSource: (id: string, updates: Partial<CustomMapSource>) => void;
  removeSource: (id: string) => void;
  importFromXml: (xml: string) => CustomMapSource[];
}

export function useCustomMapSources(
  settingsSources: CustomMapSource[],
  updateSettings: (updater: { mapSource?: any }) => void
): UseCustomMapSourcesResult {
  // Используем sources из settings как единственный источник правды
  const sources = useMemo(
    function () {
      return settingsSources || [];
    },
    [settingsSources]
  );

  const persist = useCallback(
    function (next: CustomMapSource[]) {
      updateSettings({ mapSource: { customSources: next } });
    },
    [updateSettings]
  );

  const addSource = useCallback(
    function (
      source: Omit<CustomMapSource, 'id' | 'addedAt'>
    ): CustomMapSource {
      const newSource: CustomMapSource = {
        ...source,
        id: generateId(),
        addedAt: new Date().toISOString(),
      };
      persist(sources.concat([newSource]));
      return newSource;
    },
    [sources, persist]
  );

  const updateSource = useCallback(
    function (id: string, updates: Partial<CustomMapSource>) {
      const next = sources.map(function (s) {
        if (s.id !== id) return s;
        return { ...s, ...updates, id: s.id };
      });
      persist(next);
    },
    [sources, persist]
  );

  const removeSource = useCallback(
    function (id: string) {
      const next = sources.filter(function (s) {
        return s.id !== id;
      });
      persist(next);
    },
    [sources, persist]
  );

  // -----------------------------------------------------
  // Импорт XML (Locus providers.xml)
  // -----------------------------------------------------
  const importFromXml = useCallback(
    function (xml: string): CustomMapSource[] {
      const imported: CustomMapSource[] = [];
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');

        // Locus: <providers><provider>...</provider></providers>
        const providers = doc.getElementsByTagName('provider');
        for (let i = 0; i < providers.length; i++) {
          const p = providers[i];
          const nameEl = p.getElementsByTagName('name')[0];
          const urlEl = p.getElementsByTagName('url')[0];
          const maxEl = p.getElementsByTagName('zoomMax')[0];
          const minEl = p.getElementsByTagName('zoomMin')[0];

          const name = nameEl ? nameEl.textContent?.trim() || '' : '';
          let url = urlEl ? urlEl.textContent?.trim() || '' : '';
          const maxLevel = maxEl
            ? parseInt(maxEl.textContent || '19', 10)
            : 19;
          const minLevel = minEl
            ? parseInt(minEl.textContent || '0', 10)
            : 0;

          if (!name || !url) continue;

          // Приводим к формату Cesium: {z}/{x}/{y}
          // Locus может использовать {z}/{x}/{y} — как есть
          // Убираем возможные лишние пробелы
          url = url.replace(/\s+/g, '');

          imported.push({
            id: generateId(),
            name: name,
            urlTemplate: url,
            maxLevel: Math.max(1, Math.min(22, maxLevel)),
            minLevel: Math.max(0, Math.min(22, minLevel)),
            attribution: 'Импорт из Locus',
            category: 'satellite',
            previewColor: '#4a90d9',
            addedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error('Ошибка парсинга XML:', e);
      }

      if (imported.length > 0) {
        persist(sources.concat(imported));
      }
      return imported;
    },
    [sources, persist]
  );

  return {
    sources,
    addSource,
    updateSource,
    removeSource,
    importFromXml,
  };
}