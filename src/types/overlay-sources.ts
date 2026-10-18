// =====================================================
// src/types/overlay-sources.ts
// Наложения поверх базового слоя (дороги, контуры, названия)
// Используются только для спутниковых базовых слоёв
// =====================================================

/**
 * Идентификатор наложения.
 * Порядок рендера: roads → reference → labels (снизу вверх).
 */
export type OverlayId = 'roads' | 'reference' | 'labels';

/**
 * Метаданные одного наложения.
 */
export interface OverlayInfo {
  id: OverlayId;
  label: string;
  description: string;
  urlTemplate: string;
  maximumLevel: number;
}

/**
 * Каталог стандартных Esri-наложений.
 * Работают через UrlTemplateImageryProvider (прозрачные PNG-тайлы).
 */
export const OVERLAY_SOURCES: OverlayInfo[] = [
  {
    id: 'roads',
    label: 'Дороги',
    description: 'Автодороги, магистрали, улицы',
    urlTemplate:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    maximumLevel: 19,
  },
  {
    id: 'reference',
    label: 'Контуры и вода',
    description: 'Береговые линии, реки, ж/д',
    urlTemplate:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}',
    maximumLevel: 16,
  },
  {
    id: 'labels',
    label: 'Названия и границы',
    description: 'Названия городов, стран, границы',
    urlTemplate:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    maximumLevel: 19,
  },
];

/**
 * Состояние включённости наложений.
 * Все поля независимы.
 */
export interface OverlaySettings {
  roads: boolean;
  reference: boolean;
  labels: boolean;
}

/** По умолчанию всё выключено — не меняем текущее поведение. */
export const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  roads: false,
  reference: false,
  labels: false,
};

/**
 * Безопасно достаёт настройки наложений из произвольного объекта
 * (в т.ч. когда поля ещё нет в старом проекте).
 */
export function readOverlaySettings(
  raw: Partial<OverlaySettings> | undefined | null
): OverlaySettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_OVERLAY_SETTINGS };
  return {
    roads: raw.roads === true,
    reference: raw.reference === true,
    labels: raw.labels === true,
  };
}

/** Поиск по id с фолбэком на первое наложение. */
export function getOverlaySource(id: OverlayId): OverlayInfo {
  for (let i = 0; i < OVERLAY_SOURCES.length; i++) {
    if (OVERLAY_SOURCES[i].id === id) return OVERLAY_SOURCES[i];
  }
  return OVERLAY_SOURCES[0];
}