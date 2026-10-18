// =====================================================
// src/components/globe/hooks/useCesiumViewer.ts
// Инициализация Cesium Viewer + requestRenderMode
// =====================================================

import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { ensureIonToken } from '../constants';

export interface UseCesiumViewerResult {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  viewerReady: boolean;
}

export function useCesiumViewer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onViewerReady: (viewer: Cesium.Viewer) => void
): UseCesiumViewerResult {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const onViewerReadyRef = useRef(onViewerReady);

  useEffect(
    function () {
      onViewerReadyRef.current = onViewerReady;
    },
    [onViewerReady]
  );

  useEffect(
    function () {
      if (!containerRef.current) return;
      if (viewerRef.current) return;

      ensureIonToken();

      let disposed = false;
      let localViewer: Cesium.Viewer | null = null;

      const init = async function () {
        try {
          const terrain = await Cesium.createWorldTerrainAsync();
          if (disposed) return;

          let imagery;
          try {
            imagery = await Cesium.IonImageryProvider.fromAssetId(2);
          } catch (e) {
            imagery = await Cesium.IonImageryProvider.fromAssetId(3954);
          }
          if (disposed || !containerRef.current) return;

          localViewer = new Cesium.Viewer(containerRef.current, {
            terrainProvider: terrain,
            baseLayer: new Cesium.ImageryLayer(imagery),
            animation: false,
            timeline: false,
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            fullscreenButton: false,
            infoBox: false,
            selectionIndicator: false,
            // ⚡ requestRenderMode — рендерим по требованию.
            //   maximumRenderTimeChange: 0.5 — fallback-рендер раз в 0.5 с,
            //   чтобы картинка не застывала, если requestRender() пропущен.
            //   Это устраняет «дёрганность» при плавном движении камеры.
            requestRenderMode: true,
            maximumRenderTimeChange: 0.5,
          });

          // Скрываем кредиты
          const creditContainer = localViewer.cesiumWidget
            .creditContainer as HTMLElement;
          if (creditContainer) creditContainer.style.display = 'none';

          // Убираем дефолтный двойной клик
          try {
            const evtHandler =
              localViewer.cesiumWidget.screenSpaceEventHandler;
            if (evtHandler) {
              evtHandler.removeInputAction(
                Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
              );
            }
          } catch (e) {
            console.warn('Не удалось отключить двойной клик:', e);
          }

          // ⚡ requestRender() на любое движение камеры.
          //   Это главный фикс «дёрганности»: пока камера двигается —
          //   рендер идёт каждый кадр, а не раз в 0.5 с.
          try {
            localViewer.camera.percentageChanged = 0.001;
            localViewer.camera.changed.addEventListener(function () {
              if (localViewer && !localViewer.isDestroyed()) {
                try {
                  localViewer.scene.requestRender();
                } catch (e) {}
              }
            });
          } catch (e) {
            console.warn('camera.changed listener error:', e);
          }

          // Первый рендер
          setTimeout(function () {
            if (localViewer && !localViewer.isDestroyed()) {
              try {
                localViewer.scene.requestRender();
              } catch (e) {}
            }
          }, 100);

          viewerRef.current = localViewer;
          onViewerReadyRef.current(localViewer);
          setViewerReady(true);
        } catch (err) {
          console.error('Ошибка Cesium:', err);
        }
      };

      init();

      return function () {
        disposed = true;
        if (localViewer && !localViewer.isDestroyed()) {
          try {
            localViewer.destroy();
          } catch (e) {}
        }
        viewerRef.current = null;
      };
    },
    [containerRef]
  );

  return { viewerRef, viewerReady };
}