// =====================================================
// src/components/globe/hooks/useBaseLayer.ts
// Управление базовым слоем глобуса (вкл. кастомные)
// =====================================================

import { useEffect } from 'react';
import * as Cesium from 'cesium';
import type { MapSourceId, MapSourceInfo } from '../../../types/map-sources';
import { getMapSourceInfo, resolveTimeMax } from '../../../types/map-sources';
import type { MapSourceSettings } from '../../../types/settings';
import { findClosestRelease, getWaybackReleases } from '../../../services/map-sources/wayback';

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
// URL-template (OSM, Carto, MapTiler, Custom)
// -----------------------------------------------------
function createUrlTemplate(
  urlTemplate: string,
  maxLevel: number | undefined,
  credit: Cesium.Credit
): Cesium.ImageryProvider {
  return new Cesium.UrlTemplateImageryProvider({
    url: urlTemplate,
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
// Фабрика
// -----------------------------------------------------
async function createProvider(
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

  // fallback
  return createEsriArcGis(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    credit
  );
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

  // Хэш кастомных источников — чтобы пересоздавать провайдер при изменении
  const customKey = (customSources || [])
    .map(function (c) {
      return c.id + '|' + c.urlTemplate + '|' + c.maxLevel;
    })
    .join(';');

  useEffect(
    function () {
      if (!viewerReady) return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      let cancelled = false;

      const apply = async function () {
        try {
          const provider = await createProvider(baseLayer, settings);
          if (cancelled) return;
          const v = viewerRef.current;
          if (!v || v.isDestroyed()) return;

          v.imageryLayers.removeAll();
          const layer = v.imageryLayers.addImageryProvider(provider);
          layer.alpha = Math.max(0, Math.min(1, baseLayerOpacity));
          layer.brightness = Math.max(0.1, Math.min(3, baseLayerBrightness));
          layer.contrast = Math.max(0.1, Math.min(3, baseLayerContrast));
        } catch (err) {
          console.error('useBaseLayer: ошибка загрузки слоя:', err);
          try {
            const v = viewerRef.current;
            if (!v || v.isDestroyed()) return;
            const fallback =
              await Cesium.ArcGisMapServerImageryProvider.fromUrl(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
              );
            if (cancelled) return;
            v.imageryLayers.removeAll();
            const l = v.imageryLayers.addImageryProvider(fallback);
            l.alpha = baseLayerOpacity;
            l.brightness = baseLayerBrightness;
            l.contrast = baseLayerContrast;
          } catch (e2) {
            console.error('useBaseLayer: fallback тоже упал:', e2);
          }
        }
      };

      apply();

      return function () {
        cancelled = true;
      };
    },
    [
      viewerReady,
      viewerRef,
      baseLayer,
      baseLayerDate,
      baseLayerOpacity,
      baseLayerBrightness,
      baseLayerContrast,
      customKey,
    ]
  );
}