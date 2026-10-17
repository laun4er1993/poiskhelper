// =====================================================
// src/components/globe/hooks/useStatusBar.ts
// Обновление статус-бара: мышь, камера, масштаб
// =====================================================

import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import type { StatusBarData } from '../../status-bar/types';
import { EVT_MOUSE_MOVE } from '../constants';

// =====================================================
// === Пропсы ===
// =====================================================
interface UseStatusBarParams {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  viewerReady: boolean;
  onStatusUpdate: (data: StatusBarData) => void;
}

// =====================================================
// === Результат ===
// =====================================================
export interface UseStatusBarResult {
  heading: number;
  cameraHeight: number;
  scaleMeters: number;
  fps: number;
}

// =====================================================
// === Хук ===
// =====================================================
export function useStatusBar({
  viewerRef,
  viewerReady,
  onStatusUpdate,
}: UseStatusBarParams): UseStatusBarResult {
  const [heading, setHeading] = useState(0);
  const [cameraHeight, setCameraHeight] = useState(20000000);
  const [scaleMeters, setScaleMeters] = useState(0);
  const [fps, setFps] = useState(0);

  const onStatusUpdateRef = useRef(onStatusUpdate);
  useEffect(
    function () {
      onStatusUpdateRef.current = onStatusUpdate;
    },
    [onStatusUpdate]
  );

  // =====================================================
  // === Периодический интервал: compass + statusbar ===
  // =====================================================
  useEffect(
    function () {
      if (!viewerReady) return;

      const id = window.setInterval(function () {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;

        // Азимут
        const newHeading = Math.round(
          Cesium.Math.toDegrees(v.camera.heading)
        );
        setHeading(function (prev) {
          return prev === newHeading ? prev : newHeading;
        });

        // Высота камеры
        const newH = Math.round(v.camera.positionCartographic.height);
        setCameraHeight(function (prev) {
          return prev === newH ? prev : newH;
        });

        // FPS
        const scene = v.scene;
        if (scene && scene.fps) {
          const newFps = Math.round(scene.fps);
          setFps(function (prev) {
            return prev === newFps ? prev : newFps;
          });
        }

        updatePopupPosition(v);
        updateCreateMenuPosition(v);
      }, 200);

      return function () {
        window.clearInterval(id);
      };
      // eslint-disable-next-line
    },
    [viewerReady, viewerRef]
  );

  // Заглушки — переопределяются снаружи через props/ref
  // (используются до момента, когда появятся реальные колбэки)
  const updatePopupPosition = function (_viewer: Cesium.Viewer) {};
  const updateCreateMenuPosition = function (_viewer: Cesium.Viewer) {};

  // =====================================================
  // === Обработчик движения мыши ===
  // =====================================================
  useEffect(
    function () {
      if (!viewerReady) return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const canvas = viewer.scene.canvas;
      if (!canvas) return;

      let lastUpdate = 0;
      let lastMouseTime = 0;
      const UPDATE_MS = 150;
      const IDLE_MS = 1500;
      let lastKey = '';

      const emit = function (
        lat: number | null,
        lon: number | null,
        h: number | null
      ) {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const camera = v.camera;
        const carto = camera.positionCartographic;
        let scale = 0;
        const canvasHeight = v.scene.canvas ? v.scene.canvas.clientHeight : 1;
        const frustum = camera.frustum;
        if (frustum instanceof Cesium.PerspectiveFrustum) {
          const distance = Math.max(1, carto.height);
          const visible = 2 * distance * Math.tan(frustum.fovy / 2);
          scale = (visible / canvasHeight) * 100;
        }
        setScaleMeters(scale);

        const headingDeg = Math.round(Cesium.Math.toDegrees(camera.heading));
        const camHeight = Math.round(carto.height);
        const key =
          (lat === null ? 'n' : lat.toFixed(5)) + '|' +
          (lon === null ? 'n' : lon.toFixed(5)) + '|' +
          (h === null ? 'n' : Math.round(h)) + '|' +
          headingDeg + '|' + camHeight + '|' + Math.round(scale);
        if (key === lastKey) return;
        lastKey = key;

        onStatusUpdateRef.current({
          mouseLat: lat,
          mouseLon: lon,
          mouseHeight: h,
          cameraHeading: headingDeg,
          cameraPitch: camera.pitch,
          cameraHeight: camHeight,
          scaleMeters: scale,
        });
      };

      const onMouseMove = function (movement: any) {
        const now = performance.now();
        lastMouseTime = now;
        if (now - lastUpdate < UPDATE_MS) return;
        lastUpdate = now;
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const position = movement.endPosition;
        const scene = v.scene;
        let cartesian: any = null;
        const ray = v.camera.getPickRay(position);
        if (ray) cartesian = scene.globe.pick(ray, scene) || null;
        if (!cartesian) {
          cartesian = v.camera.pickEllipsoid(position, scene.globe.ellipsoid) || null;
        }
        if (cartesian) {
          const carto = Cesium.Cartographic.fromCartesian(cartesian);
          emit(
            Cesium.Math.toDegrees(carto.latitude),
            Cesium.Math.toDegrees(carto.longitude),
            carto.height
          );
        } else {
          emit(null, null, null);
        }
      };

      const onCameraChanged = function () {
        const now = performance.now();
        if (now - lastUpdate < UPDATE_MS) return;
        lastUpdate = now;
        emit(null, null, null);
      };

      const idleId = window.setInterval(function () {
        const now = performance.now();
        if (now - lastMouseTime > IDLE_MS) emit(null, null, null);
      }, 1000);

      const handler = new Cesium.ScreenSpaceEventHandler(canvas);
      handler.setInputAction(onMouseMove, EVT_MOUSE_MOVE);
      viewer.camera.changed.addEventListener(onCameraChanged);

      emit(null, null, null);

      return function () {
        try {
          handler.destroy();
        } catch (e) {}
        try {
          viewer.camera.changed.removeEventListener(onCameraChanged);
        } catch (e) {}
        window.clearInterval(idleId);
      };
    },
    [viewerReady, viewerRef]
  );

  return { heading, cameraHeight, scaleMeters, fps };
}