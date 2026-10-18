// =====================================================
// src/services/project/meta.ts
// Метаданные проекта: нормализация, слияние
// =====================================================

import type { ProjectMeta } from '../../types/project';
import { createDefaultProjectMeta } from '../../types/project';
import type { MapSourceSettings } from '../../types/map-sources';
import { readOverlaySettings } from '../../types/overlay-sources';

function normalizeMapSource(
  raw: any
): Partial<MapSourceSettings> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const result: Partial<MapSourceSettings> = {};

  if (typeof raw.baseLayer === 'string' && raw.baseLayer.trim()) {
    result.baseLayer = raw.baseLayer.trim();
  }

  if (
    typeof raw.baseLayerDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw.baseLayerDate)
  ) {
    result.baseLayerDate = raw.baseLayerDate;
  }
  if (
    typeof raw.baseLayerOpacity === 'number' &&
    isFinite(raw.baseLayerOpacity)
  ) {
    result.baseLayerOpacity = Math.max(0.1, Math.min(1, raw.baseLayerOpacity));
  }
  if (
    typeof raw.baseLayerBrightness === 'number' &&
    isFinite(raw.baseLayerBrightness)
  ) {
    result.baseLayerBrightness = Math.max(
      0.5,
      Math.min(1.5, raw.baseLayerBrightness)
    );
  }
  if (
    typeof raw.baseLayerContrast === 'number' &&
    isFinite(raw.baseLayerContrast)
  ) {
    result.baseLayerContrast = Math.max(
      0.5,
      Math.min(1.5, raw.baseLayerContrast)
    );
  }

  // ⚡ N1: overlays (дороги/контуры/названия) должны пережить сохранение
  result.overlays = readOverlaySettings(raw.overlays);

  // Кастомные источники
  if (Array.isArray(raw.customSources)) {
    result.customSources = raw.customSources
      .filter(function (c: any) {
        return (
          c &&
          typeof c.id === 'string' &&
          typeof c.name === 'string' &&
          typeof c.urlTemplate === 'string'
        );
      })
      .map(function (c: any) {
        return {
          id: c.id,
          name: c.name,
          urlTemplate: c.urlTemplate,
          maxLevel:
            typeof c.maxLevel === 'number' && isFinite(c.maxLevel)
              ? Math.max(1, Math.min(22, c.maxLevel))
              : 19,
          minLevel:
            typeof c.minLevel === 'number' && isFinite(c.minLevel)
              ? Math.max(0, Math.min(22, c.minLevel))
              : undefined,
          attribution:
            typeof c.attribution === 'string' ? c.attribution : '',
          category:
            c.category === 'satellite' ||
            c.category === 'street' ||
            c.category === 'topo' ||
            c.category === 'history'
              ? c.category
              : 'satellite',
          previewColor:
            typeof c.previewColor === 'string'
              ? c.previewColor
              : '#4a90d9',
          addedAt:
            typeof c.addedAt === 'string'
              ? c.addedAt
              : new Date().toISOString(),
        };
      });
  }

  if (
    raw.countryFilter === 'russia' ||
    raw.countryFilter === 'world'
  ) {
    result.countryFilter = raw.countryFilter;
  }

  if (Object.keys(result).length === 0) return undefined;
  return result;
}

export function normalizeProjectMeta(
  raw: any,
  fallbackTitle?: string
): ProjectMeta {
  const base = createDefaultProjectMeta(fallbackTitle);
  if (!raw || typeof raw !== 'object') return base;

  const meta: ProjectMeta = {
    title:
      typeof raw.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : base.title,
    fileBaseName:
      typeof raw.fileBaseName === 'string' && raw.fileBaseName.trim()
        ? raw.fileBaseName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60)
        : base.fileBaseName,
    author: typeof raw.author === 'string' ? raw.author : base.author,
    organization:
      typeof raw.organization === 'string'
        ? raw.organization
        : base.organization,
    description:
      typeof raw.description === 'string' ? raw.description : base.description,
    tags: Array.isArray(raw.tags)
      ? raw.tags
          .filter(function (t: any) {
            return typeof t === 'string' && t.trim();
          })
          .map(function (t: string) {
            return t.trim();
          })
          .slice(0, 20)
      : base.tags,
    notes: typeof raw.notes === 'string' ? raw.notes : base.notes,
    createdAt:
      typeof raw.createdAt === 'string' && raw.createdAt
        ? raw.createdAt
        : base.createdAt,
    updatedAt:
      typeof raw.updatedAt === 'string' && raw.updatedAt
        ? raw.updatedAt
        : base.updatedAt,
    version:
      typeof raw.version === 'string' && raw.version
        ? raw.version
        : base.version,
    language:
      raw.language === 'en' ? 'en' : raw.language === 'ru' ? 'ru' : base.language,
    dateFormat:
      raw.dateFormat === 'MM/DD/YYYY' || raw.dateFormat === 'YYYY-MM-DD'
        ? raw.dateFormat
        : 'DD.MM.YYYY',
    homeCamera:
      raw.homeCamera &&
      typeof raw.homeCamera === 'object' &&
      typeof raw.homeCamera.lon === 'number' &&
      typeof raw.homeCamera.lat === 'number'
        ? {
            lon: raw.homeCamera.lon,
            lat: raw.homeCamera.lat,
            height:
              typeof raw.homeCamera.height === 'number'
                ? raw.homeCamera.height
                : 0,
            heading:
              typeof raw.homeCamera.heading === 'number'
                ? raw.homeCamera.heading
                : 0,
            pitch:
              typeof raw.homeCamera.pitch === 'number'
                ? raw.homeCamera.pitch
                : -Math.PI / 2,
            roll:
              typeof raw.homeCamera.roll === 'number' ? raw.homeCamera.roll : 0,
          }
        : null,
    units: {
      distance:
        raw.units && raw.units.distance === 'imperial'
          ? 'imperial'
          : 'metric',
      height:
        raw.units &&
        (raw.units.height === 'kilometers' ||
          raw.units.height === 'feet' ||
          raw.units.height === 'miles')
          ? raw.units.height
          : 'meters',
      coordinate:
        raw.units &&
        (raw.units.coordinate === 'DMS' || raw.units.coordinate === 'DDM')
          ? raw.units.coordinate
          : 'DD',
    },
    colorTag:
      typeof raw.colorTag === 'string' && raw.colorTag
        ? raw.colorTag
        : base.colorTag,
    mapSource: normalizeMapSource(raw.mapSource),
  };

  // Legacy: старые поля baseLayer/maptilerKey
  if (!meta.mapSource) {
    const legacy = normalizeMapSource({
      baseLayer: raw.baseLayer,
      maptilerKey: raw.maptilerKey,
    });
    if (legacy) meta.mapSource = legacy;
  }

  return meta;
}

export function mergeMeta(
  current: ProjectMeta,
  updates: Partial<ProjectMeta>
): ProjectMeta {
  const next: ProjectMeta = { ...current, ...updates };
  next.updatedAt = new Date().toISOString();
  if (updates.units) {
    next.units = { ...current.units, ...updates.units };
  }
  if (updates.mapSource) {
    next.mapSource = { ...(current.mapSource || {}), ...updates.mapSource };
  }
  return next;
}

export function sanitizeFileName(name: string): string {
  return (name || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\.(poiskhelper|json)$/i, '')
    .trim()
    .slice(0, 80);
}