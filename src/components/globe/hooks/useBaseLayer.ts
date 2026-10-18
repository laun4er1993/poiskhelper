// =====================================================
// src/components/globe/hooks/useBaseLayer.ts
// Базовый слой + наложения. Полная пересборка imageryLayers.
// =====================================================

import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import type { MapSourceId, MapSourceInfo } from '../../../types/map-sources';
import { getMapSourceInfo } from '../../../types/map-sources';
import type { MapSourceSettings } from '../../../types/settings';
import {
  findClosestRelease,
  getWaybackReleases,
} from '../../../services/map-sources/wayback';
import {
  OVERLAY_SOURCES,
  readOverlaySettings,
  type OverlayId,
} from '../../../types/overlay-sources';

// -----------------------------------------------------
// ⚡ Нормализация URL: {ts} — служебный маркер Locus,
// стандартному тайлеру он не нужен. Вырезаем.
// -----------------------------------------------------
function normalizeUrlTemplate(url: string): string {
  if (!url) return url;
  return url.replace(/\{ts\}/g, '');
}

// -----------------------------------------------------
// Esri ArcGIS
// -----------------------------------------------------
async function createEsriArcGis(
  url: string,
  credit: Cesium.Credit
): Promise<Cesium.ImageryProvider> {
  return Cesium.ArcGisMapServerImageryProvider.fromUrl(url, {
    credit: credit,
  });
}

// -----------------------------------------------------
// URL-template
// -----------------------------------------------------
function createUrlTemplate(
  urlTemplate: string,
  maxLevel: number | undefined,
  credit: Cesium.Credit
): Cesium.ImageryProvider {
  const url = normalizeUrlTemplate(urlTemplate);
  return new Cesium.UrlTemplateImageryProvider({
    url: url,
    minimumLevel: 0,
    maximumLevel: maxLevel || 19,
    tileWidth: 256,
    tileHeight: 256,
    credit: credit,
  });
}

// -----------------------------------------------------
// Esri Wayback
// -----------------------------------------------------
function createWayback(
  urlTemplate: string,
  dateIso: string,
  credit: Cesium.Credit
): Cesium.ImageryProvider {
  const releases = getWaybackReleases();
  const closest = findClosestRelease(releases, dateIso);
  const releaseNum = closest ? closest.release : 10;

  const url = urlTemplate.replace('{release}', String(releaseNum));

  return new Cesium.UrlTemplateImageryProvider({
    url: url,
    minimumLevel: 0,
    maximumLevel: 19,
    tileWidth: 256,
    tileHeight: 256,
    credit: credit,
  });
}

// -----------------------------------------------------
// Фабрика базового слоя
// -----------------------------------------------------
async function createBaseProvider(
  sourceId: MapSourceId,
  settings: MapSourceSettings
): Promise<Cesium.ImageryProvider> {
  const meta: MapSourceInfo = getMapSourceInfo(
    sourceId,
    settings.customSources || []
  );
  const credit = new Cesium.Credit(meta.attribution, true);

  if (meta.provider === 'esri-arcgis') {
    return createEsriArcGis(meta.url || '', credit);
  }
  if (meta.provider === 'url-template' || meta.provider === 'custom') {
    return createUrlTemplate(meta.url || '', meta.maxLevel, credit);
  }
  if (meta.provider === 'esri-wayback') {
    return createWayback(meta.url || '', settings.baseLayerDate, credit);
  }

  return createEsriArcGis(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    credit
  );
}

// -----------------------------------------------------
// Фабрика наложения
// -----------------------------------------------------
function createOverlayProvider(id: OverlayId): Cesium.ImageryProvider {
  let info = OVERLAY_SOURCES[0];
  for (let i = 0; i < OVERLAY_SOURCES.length; i++) {
    if (OVERLAY_SOURCES[i].id === id) {
      info = OVERLAY_SOURCES[i];
      break;
    }
  }
  const credit = new Cesium.Credit('Esri Reference', true);
  return new Cesium.UrlTemplateImageryProvider({
    url: normalizeUrlTemplate(info.urlTemplate),
    minimumLevel: 0,
    maximumLevel: info.maximumLevel,
    tileWidth: 256,
    tileHeight: 256,
    credit: credit,
  });
}

// -----------------------------------------------------
// Хук
// -----------------------------------------------------
export interface UseBaseLayerParams {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  viewerReady: boolean;
  settings: MapSourceSettings;
}

export function useBaseLayer({
  viewerRef,
  viewerReady,
  settings,
}: UseBaseLayerParams): void {
  const {
    baseLayer,
    baseLayerDate,
    baseLayerOpacity,
    baseLayerBrightness,
    baseLayerContrast,
    customSources,
  } = settings;

  const baseLayerRef = useRef<Cesium.ImageryLayer | null>(null);

  const customKey = (customSources || [])
    .map(function (c) {
      return c.id + '|' + c.urlTemplate + '|' + c.maxLevel;
    })
    .join(';');

  const overlays = readOverlaySettings(settings.overlays);

  // -----------------------------------------------------
  // ⚡ Эффект 1: полная пересборка imageryLayers
  // -----------------------------------------------------
  useEffect(
    function () {
      if (!viewerReady) return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      let cancelled = false;

      const rebuild = async function () {
        try {
          const currentMeta = getMapSourceInfo(
            baseLayer,
            customSources || []
          );
          const allowOverlays =
            currentMeta.category === 'satellite' ||
            currentMeta.provider === 'esri-wayback';

          const baseProvider = await createBaseProvider(baseLayer, settings);
          if (cancelled) return;

          const v = viewerRef.current;
          if (!v || v.isDestroyed()) return;

          const overlayProviders: Cesium.ImageryProvider[] = [];
          if (allowOverlays) {
            const order: OverlayId[] = ['roads', 'reference', 'labels'];
            for (let i = 0; i < order.length; i++) {
              const id = order[i];
              if (!overlays[id]) continue;
              try {
                overlayProviders.push(createOverlayProvider(id));
              } catch (e) {
                console.warn(
                  'useBaseLayer: overlay "' + id + '" не создан',
                  e
                );
              }
            }
          }

          if (cancelled) return;

          v.imageryLayers.removeAll();

          const base = v.imageryLayers.addImageryProvider(baseProvider);
          base.alpha = Math.max(0, Math.min(1, baseLayerOpacity));
          base.brightness = Math.max(0.1, Math.min(3, baseLayerBrightness));
          base.contrast = Math.max(0.1, Math.min(3, baseLayerContrast));
          baseLayerRef.current = base;

          for (let i = 0; i < overlayProviders.length; i++) {
            const l = v.imageryLayers.addImageryProvider(
              overlayProviders[i]
            );
            l.alpha = 1;
            l.brightness = 1;
            l.contrast = 1;
          }
        } catch (err) {
          console.error('useBaseLayer: ошибка загрузки слоя:', err);
          if (cancelled) return;

          try {
            const v = viewerRef.current;
            if (!v || v.isDestroyed()) return;
            const fb =
              await Cesium.ArcGisMapServerImageryProvider.fromUrl(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
              );
            if (cancelled) return;
            v.imageryLayers.removeAll();
            const l = v.imageryLayers.addImageryProvider(fb);
            l.alpha = baseLayerOpacity;
            l.brightness = baseLayerBrightness;
            l.contrast = baseLayerContrast;
            baseLayerRef.current = l;
          } catch (e2) {
            console.error('useBaseLayer: fallback тоже упал:', e2);
          }
        }
      };

      rebuild();

      return function () {
        cancelled = true;
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      viewerReady,
      viewerRef,
      baseLayer,
      baseLayerDate,
      customKey,
      overlays.roads,
      overlays.reference,
      overlays.labels,
    ]
  );

  // -----------------------------------------------------
  // Эффект 2: alpha/brightness/contrast без пересборки
  // -----------------------------------------------------
  useEffect(
    function () {
      const layer = baseLayerRef.current;
      if (!layer) return;
      layer.alpha = Math.max(0, Math.min(1, baseLayerOpacity));
      layer.brightness = Math.max(0.1, Math.min(3, baseLayerBrightness));
      layer.contrast = Math.max(0.1, Math.min(3, baseLayerContrast));
    },
    [baseLayerOpacity, baseLayerBrightness, baseLayerContrast]
  );
}