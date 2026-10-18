// =====================================================
// src/components/globe/hooks/useDragHandlers.ts
// Drag с throttle через requestAnimationFrame
// =====================================================

import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import type { TreeItem } from '../../../types/base';
import {
  EVT_LEFT_DOWN,
  EVT_LEFT_UP,
  EVT_MOUSE_MOVE,
  DRAG_THRESHOLD,
} from '../constants';

interface UseDragHandlersParams {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  viewerReady: boolean;
  editingItemId: string | null;
  selectedMeasureIndex: number | null;
  clickMode: 'select' | 'add-marker' | 'measure';
  onMovePlace: (id: string, lat: number, lon: number, height: number) => void;
  onMoveMeasurePoint: (
    index: number,
    lat: number,
    lon: number,
    height: number
  ) => void;
  onMoveSavedMeasurePoint?: (
    measureId: string,
    index: number,
    lat: number,
    lon: number,
    height: number
  ) => void;
  onDragEnd?: (
    kind: 'place' | 'measure' | 'saved-measure',
    id: string,
    index: number | null,
    lat: number,
    lon: number,
    height: number
  ) => void;
  onEditItem?: (item: TreeItem) => void;
  items: TreeItem[];
  importedItems: TreeItem[];
}

export interface UseDragHandlersResult {
  dragging: boolean;
}

export function useDragHandlers({
  viewerRef,
  viewerReady,
  editingItemId,
  selectedMeasureIndex,
  clickMode,
  onMovePlace,
  onMoveMeasurePoint,
  onMoveSavedMeasurePoint,
  onDragEnd,
  onEditItem,
  items,
  importedItems,
}: UseDragHandlersParams): UseDragHandlersResult {
  const [dragging, setDragging] = useState(false);

  const editingItemIdRef = useRef<string | null>(editingItemId);
  const selectedMeasureIndexRef = useRef<number | null>(selectedMeasureIndex);
  const clickModeRef = useRef(clickMode);
  const onMovePlaceRef = useRef(onMovePlace);
  const onMoveMeasurePointRef = useRef(onMoveMeasurePoint);
  const onMoveSavedMeasurePointRef = useRef(onMoveSavedMeasurePoint);
  const onDragEndRef = useRef(onDragEnd);
  const onEditItemRef = useRef(onEditItem);
  const itemsRef = useRef(items);
  const importedItemsRef = useRef(importedItems);

  useEffect(
    function () {
      editingItemIdRef.current = editingItemId;
    },
    [editingItemId]
  );
  useEffect(
    function () {
      selectedMeasureIndexRef.current = selectedMeasureIndex;
    },
    [selectedMeasureIndex]
  );
  useEffect(
    function () {
      clickModeRef.current = clickMode;
    },
    [clickMode]
  );
  useEffect(
    function () {
      onMovePlaceRef.current = onMovePlace;
    },
    [onMovePlace]
  );
  useEffect(
    function () {
      onMoveMeasurePointRef.current = onMoveMeasurePoint;
    },
    [onMoveMeasurePoint]
  );
  useEffect(
    function () {
      onMoveSavedMeasurePointRef.current = onMoveSavedMeasurePoint;
    },
    [onMoveSavedMeasurePoint]
  );
  useEffect(
    function () {
      onDragEndRef.current = onDragEnd;
    },
    [onDragEnd]
  );
  useEffect(
    function () {
      onEditItemRef.current = onEditItem;
    },
    [onEditItem]
  );
  useEffect(
    function () {
      itemsRef.current = items;
    },
    [items]
  );
  useEffect(
    function () {
      importedItemsRef.current = importedItems;
    },
    [importedItems]
  );

  useEffect(
    function () {
      if (!viewerReady) return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const canvas = viewer.scene.canvas;
      if (!canvas) return;

      let downPos: { x: number; y: number } | null = null;
      let dragCandidate:
        | { type: 'place'; id: string }
        | { type: 'measure'; index: number }
        | { type: 'saved-measure'; measureId: string; index: number }
        | null = null;
      let dragActive = false;
      let movedDistance = 0;
      let lastLat: number | null = null;
      let lastLon: number | null = null;
      let lastHeight: number | null = null;
      let cameraLocked = false;

      // ⚡ RAF throttle — применяем последнее накопленное значение раз в кадр
      let rafId: number | null = null;
      let pendingMovement: any = null;

      const lockCamera = function () {
        if (cameraLocked) return;
        const c = viewer.scene.screenSpaceCameraController;
        c.enableRotate = false;
        c.enableTranslate = false;
        c.enableTilt = false;
        c.enableZoom = false;
        cameraLocked = true;
      };

      const unlockCamera = function () {
        if (!cameraLocked) return;
        const c = viewer.scene.screenSpaceCameraController;
        c.enableRotate = true;
        c.enableTranslate = true;
        c.enableTilt = true;
        c.enableZoom = true;
        cameraLocked = false;
      };

      const finishDrag = function () {
        const wasActive = dragActive;
        const candidate = dragCandidate;
        const lat = lastLat;
        const lon = lastLon;
        const h = lastHeight;

        unlockCamera();
        setDragging(false);

        dragCandidate = null;
        dragActive = false;
        lastLat = null;
        lastLon = null;
        lastHeight = null;

        if (
          wasActive &&
          candidate &&
          lat !== null &&
          lon !== null &&
          onDragEndRef.current
        ) {
          if (candidate.type === 'place') {
            onDragEndRef.current(
              'place',
              candidate.id,
              null,
              lat,
              lon,
              h || 0
            );
          } else if (candidate.type === 'measure') {
            onDragEndRef.current(
              'measure',
              '_tmp',
              candidate.index,
              lat,
              lon,
              h || 0
            );
          } else if (candidate.type === 'saved-measure') {
            onDragEndRef.current(
              'saved-measure',
              candidate.measureId,
              candidate.index,
              lat,
              lon,
              h || 0
            );
          }
        }

        try {
          viewer.scene.requestRender();
        } catch (e) {}
      };

      const onLeftDown = function (click: any) {
        if (!click || !click.position) return;
        downPos = { x: click.position.x, y: click.position.y };
        dragCandidate = null;
        dragActive = false;
        movedDistance = 0;

        if (clickModeRef.current === 'add-marker') return;

        const picked = viewer.scene.pick(click.position);
        if (!Cesium.defined(picked) || !picked.id) return;
        const entity = picked.id as Cesium.Entity;
        if (!entity.properties) return;

        if (entity.properties.isPlace) {
          const id = entity.properties.placeId.getValue();
          const editingId = editingItemIdRef.current;
          if (!editingId || id !== editingId) return;
          dragCandidate = { type: 'place', id: id };
          return;
        }

        if (entity.properties.isMeasurePoint) {
          const idx = entity.properties.measureIndex
            ? entity.properties.measureIndex.getValue()
            : null;
          if (typeof idx !== 'number') return;

          const measureId = entity.properties.measureId
            ? entity.properties.measureId.getValue()
            : null;

          if (measureId) {
            if (
              measureId !== editingItemIdRef.current &&
              onEditItemRef.current
            ) {
              const all = itemsRef.current.concat(importedItemsRef.current);
              const measure = findMeasureById(all, measureId);
              if (measure) {
                onEditItemRef.current(measure);
              }
            }
            dragCandidate = {
              type: 'saved-measure',
              measureId: measureId,
              index: idx,
            };
          } else {
            dragCandidate = { type: 'measure', index: idx };
          }
        }
      };

      // ⚡ Обработка движения — вызывается раз в кадр через RAF
      const applyPendingMovement = function () {
        rafId = null;
        if (!dragActive || !dragCandidate || !pendingMovement) return;
        const movement = pendingMovement;
        pendingMovement = null;

        const ray = viewer.camera.getPickRay(movement.endPosition);
        let cartesian: any = null;
        if (ray) cartesian = viewer.scene.globe.pick(ray, viewer.scene) || null;
        if (!cartesian) {
          cartesian = viewer.camera.pickEllipsoid(
            movement.endPosition,
            viewer.scene.globe.ellipsoid
          );
        }
        if (!cartesian) return;

        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        lastLat = Cesium.Math.toDegrees(carto.latitude);
        lastLon = Cesium.Math.toDegrees(carto.longitude);
        lastHeight = carto.height;

        if (dragCandidate.type === 'place') {
          // Обновляем позицию entity напрямую (быстрее чем через React)
          const values = viewer.entities.values;
          const targetId = dragCandidate.id;
          const newPos = new Cesium.ConstantPositionProperty(
            Cesium.Cartesian3.fromDegrees(lastLon, lastLat, lastHeight || 0)
          );
          for (let i = 0; i < values.length; i++) {
            const e = values[i];
            if (
              e.properties &&
              e.properties.isPlace &&
              e.properties.placeId &&
              e.properties.placeId.getValue() === targetId
            ) {
              e.position = newPos;
            }
          }
          onMovePlaceRef.current(
            dragCandidate.id,
            lastLat,
            lastLon,
            lastHeight || 0
          );
        } else if (dragCandidate.type === 'measure') {
          onMoveMeasurePointRef.current(
            dragCandidate.index,
            lastLat,
            lastLon,
            lastHeight || 0
          );
        } else if (dragCandidate.type === 'saved-measure') {
          if (onMoveSavedMeasurePointRef.current) {
            onMoveSavedMeasurePointRef.current(
              dragCandidate.measureId,
              dragCandidate.index,
              lastLat,
              lastLon,
              lastHeight || 0
            );
          }
        }

        try {
          viewer.scene.requestRender();
        } catch (e) {}
      };

      const onMouseMove = function (movement: any) {
        if (!downPos || !movement || !movement.endPosition) return;
        const dx = movement.endPosition.x - downPos.x;
        const dy = movement.endPosition.y - downPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > movedDistance) movedDistance = dist;

        if (!dragCandidate) return;

        if (!dragActive && dist > DRAG_THRESHOLD) {
          dragActive = true;
          setDragging(true);
          lockCamera();
        }
        if (!dragActive) return;

        // ⚡ Накапливаем последнее положение, применяем через RAF
        pendingMovement = movement;
        if (rafId === null) {
          rafId = window.requestAnimationFrame(applyPendingMovement);
        }
      };

      const onLeftUp = function () {
        if (!downPos) return;
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        // Применяем последнее накопленное
        if (dragActive && pendingMovement) {
          applyPendingMovement();
        }
        finishDrag();
        downPos = null;
        movedDistance = 0;
      };

      const handler = new Cesium.ScreenSpaceEventHandler(canvas);
      handler.setInputAction(onLeftDown, EVT_LEFT_DOWN);
      handler.setInputAction(onMouseMove, EVT_MOUSE_MOVE);
      handler.setInputAction(onLeftUp, EVT_LEFT_UP);

      const docMouseUp = function () {
        if (dragActive || dragCandidate) {
          if (rafId !== null) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
          }
          if (dragActive && pendingMovement) {
            applyPendingMovement();
          }
          finishDrag();
          downPos = null;
          movedDistance = 0;
        }
      };
      document.addEventListener('mouseup', docMouseUp);

      return function () {
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        try {
          handler.destroy();
        } catch (e) {}
        document.removeEventListener('mouseup', docMouseUp);
        unlockCamera();
      };
    },
    [viewerReady, viewerRef]
  );

  return { dragging };
}

function findMeasureById(
  items: TreeItem[],
  id: string
): TreeItem | null {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    if (it.id === id) return it;
    if (it.type === 'folder' || it.type === 'kmlfile') {
      const found = findMeasureById((it as any).children, id);
      if (found) return found;
    }
  }
  return null;
}