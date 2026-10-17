// =====================================================
// src/components/globe/hooks/useCesiumViewer.ts
// Инициализация Cesium Viewer и очистка при unmount
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
            requestRenderMode: false,
          });

          // Скрываем кредиты
          const creditContainer = localViewer.cesiumWidget
            .creditContainer as HTMLElement;
          if (creditContainer) creditContainer.style.display = 'none';

          // ⚡ Убираем дефолтное поведение двойного клика
          // (оно ставит trackedEntity и делает zoomTo — это и есть
          // «привязка камеры к точке» и «зум при двойном клике»)
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

          // ⚡ Отключаем zoomTo при двойном клике на пустом месте
          // (это делает screenSpaceCameraController по умолчанию)
          try {
            // Ничего не настраиваем здесь — отключение обработчика
            // LEFT_DOUBLE_CLICK достаточно
          } catch (e) {}

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