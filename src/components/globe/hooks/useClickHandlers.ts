// =====================================================
// src/components/globe/hooks/useClickHandlers.ts
// Обработка кликов, двойных кликов и hover-событий
// =====================================================

import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import type { TreeItem, Place, MapCreateAction, AppSettings } from '../../../types';
import { isMeasure, isContainer } from '../../../types/base';
import { DRAG_THRESHOLD, EVT_LEFT_UP, EVT_LEFT_DOUBLE_CLICK } from '../constants';
import { findItemById } from '../utils/bounds';

// =====================================================
// === Пропсы ===
// =====================================================
interface UseClickHandlersParams {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  viewerReady: boolean;

  clickMode: 'select' | 'add-marker' | 'measure';
  settings: AppSettings;

  items: TreeItem[];
  importedItems: TreeItem[];

  onMapClick: (lat: number, lon: number, height: number) => void;
  onSelectPlace: (id: string) => void;
  onSelectMeasurePoint: (index: number | null) => void;
  onCreateAction: (
    action: MapCreateAction,
    lat: number,
    lon: number,
    height: number
  ) => void;

  setPopupItem: (item: TreeItem | null) => void;
  setPopupAnchor: (anchor: { x: number; y: number }) => void;

  setCreateMenu: (
    menu: {
      worldPos: Cesium.Cartesian3;
      lat: number;
      lon: number;
      height: number;
      screenX: number;
      screenY: number;
    } | null
  ) => void;
}

// =====================================================
// Поиск measure по id (в дереве и imported)
// =====================================================
function findMeasureById(items: TreeItem[], id: string): TreeItem | null {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    if (it.id === id && isMeasure(it)) return it;
    if (isContainer(it)) {
      const found = findMeasureById(it.children, id);
      if (found) return found;
    }
  }
  return null;
}

// =====================================================
// === Хук ===
// =====================================================
export function useClickHandlers({
  viewerRef,
  viewerReady,
  clickMode,
  settings,
  items,
  importedItems,
  onMapClick,
  onSelectPlace,
  onSelectMeasurePoint,
  setPopupItem,
  setPopupAnchor,
  setCreateMenu,
}: UseClickHandlersParams): void {
  const clickModeRef = useRef(clickMode);
  const settingsRef = useRef(settings);
  const itemsRef = useRef(items);
  const importedItemsRef = useRef(importedItems);

  useEffect(
    function () {
      clickModeRef.current = clickMode;
    },
    [clickMode]
  );
  useEffect(
    function () {
      settingsRef.current = settings;
    },
    [settings]
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

  const onMapClickRef = useRef(onMapClick);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onSelectMeasurePointRef = useRef(onSelectMeasurePoint);
  const setPopupItemRef = useRef(setPopupItem);
  const setPopupAnchorRef = useRef(setPopupAnchor);
  const setCreateMenuRef = useRef(setCreateMenu);

  useEffect(
    function () {
      onMapClickRef.current = onMapClick;
    },
    [onMapClick]
  );
  useEffect(
    function () {
      onSelectPlaceRef.current = onSelectPlace;
    },
    [onSelectPlace]
  );
  useEffect(
    function () {
      onSelectMeasurePointRef.current = onSelectMeasurePoint;
    },
    [onSelectMeasurePoint]
  );
  useEffect(
    function () {
      setPopupItemRef.current = setPopupItem;
    },
    [setPopupItem]
  );
  useEffect(
    function () {
      setPopupAnchorRef.current = setPopupAnchor;
    },
    [setPopupAnchor]
  );
  useEffect(
    function () {
      setCreateMenuRef.current = setCreateMenu;
    },
    [setCreateMenu]
  );

  useEffect(
    function () {
      if (!viewerReady) return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const canvas = viewer.scene.canvas;
      if (!canvas) return;

      let downPos: { x: number; y: number } | null = null;
      let movedDistance = 0;

      // === Обработчик клика ===
      const onClickInternal = function (clickPos: any) {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const mode = clickModeRef.current;
        const picked = v.scene.pick(clickPos);

        // =====================================================
        // Режим добавления метки
        // =====================================================
        if (mode === 'add-marker') {
          if (
            Cesium.defined(picked) &&
            picked.id &&
            picked.id.properties &&
            picked.id.properties.isPlace
          ) {
            const id = picked.id.properties.placeId.getValue();
            onSelectPlaceRef.current(id);
            return;
          }
          const ray = v.camera.getPickRay(clickPos);
          let cartesian: any = null;
          if (ray) cartesian = v.scene.globe.pick(ray, v.scene) || null;
          if (!cartesian) {
            cartesian = v.camera.pickEllipsoid(
              clickPos,
              v.scene.globe.ellipsoid
            );
          }
          if (cartesian) {
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            onMapClickRef.current(
              Cesium.Math.toDegrees(carto.latitude),
              Cesium.Math.toDegrees(carto.longitude),
              carto.height
            );
          }
          return;
        }

        // =====================================================
        // Режим измерения (текущая линейка)
        // =====================================================
        if (mode === 'measure') {
          if (
            Cesium.defined(picked) &&
            picked.id &&
            picked.id.properties &&
            picked.id.properties.isMeasurePoint
          ) {
            const idx = picked.id.properties.measureIndex.getValue();
            onSelectMeasurePointRef.current(idx);
            return;
          }
          const ray = v.camera.getPickRay(clickPos);
          let cartesian: any = null;
          if (ray) cartesian = v.scene.globe.pick(ray, v.scene) || null;
          if (!cartesian) {
            cartesian = v.camera.pickEllipsoid(
              clickPos,
              v.scene.globe.ellipsoid
            );
          }
          if (cartesian) {
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            onMapClickRef.current(
              Cesium.Math.toDegrees(carto.latitude),
              Cesium.Math.toDegrees(carto.longitude),
              carto.height
            );
          }
          return;
        }

        // =====================================================
        // Режим выбора (select)
        // =====================================================
        if (Cesium.defined(picked) && picked.id && picked.id.properties) {
          const props = picked.id.properties;

          // --- Метка (place) ---
          if (props.isPlace) {
            const id = props.placeId.getValue();
            try {
              onSelectPlaceRef.current(id);
            } catch (err) {
              console.error('onSelectPlace error:', err);
              return;
            }

            const allItems = itemsRef.current.concat(importedItemsRef.current);
            const found = findItemById(allItems, id);
            if (found) {
              const w = v.scene.canvas.clientWidth;
              const h = v.scene.canvas.clientHeight;
              setPopupAnchorRef.current({
                x: Math.max(20, Math.min(w - 40, clickPos.x)),
                y: Math.max(20, Math.min(h - 40, clickPos.y)),
              });
              const mode2 = settingsRef.current.mapPopup.mode;
              if (mode2 === 'always' || mode2 === 'selected-only') {
                setPopupItemRef.current(found);
              }
            }
            return;
          }

          // --- Точка сохранённой линейки (isMeasurePoint + measureId) ---
          if (props.isMeasurePoint) {
            const idx = props.measureIndex
              ? props.measureIndex.getValue()
              : null;
            const measureId = props.measureId
              ? props.measureId.getValue()
              : null;

            if (typeof idx === 'number') {
              onSelectMeasurePointRef.current(idx);
            }

            // ⚡ Если это точка СОХРАНЁННОЙ линейки — открыть попап
            if (measureId) {
              const all = itemsRef.current.concat(importedItemsRef.current);
              const measure = findMeasureById(all, measureId);
              if (measure) {
                const w = v.scene.canvas.clientWidth;
                const h = v.scene.canvas.clientHeight;
                setPopupAnchorRef.current({
                  x: Math.max(20, Math.min(w - 40, clickPos.x)),
                  y: Math.max(20, Math.min(h - 40, clickPos.y)),
                });
                const mode2 = settingsRef.current.mapPopup.mode;
                if (mode2 === 'always' || mode2 === 'selected-only') {
                  setPopupItemRef.current(measure);
                }
              }
            } else {
              // Текущая линейка — не показываем попап
              setPopupItemRef.current(null);
            }
            return;
          }

          // --- Линия сохранённой линейки (isMeasureItem + measureId) ---
          if (props.isMeasureItem) {
            const measureId = props.measureId
              ? props.measureId.getValue()
              : null;
            if (measureId) {
              const all = itemsRef.current.concat(importedItemsRef.current);
              const measure = findMeasureById(all, measureId);
              if (measure) {
                const w = v.scene.canvas.clientWidth;
                const h = v.scene.canvas.clientHeight;
                setPopupAnchorRef.current({
                  x: Math.max(20, Math.min(w - 40, clickPos.x)),
                  y: Math.max(20, Math.min(h - 40, clickPos.y)),
                });
                const mode2 = settingsRef.current.mapPopup.mode;
                if (mode2 === 'always' || mode2 === 'selected-only') {
                  setPopupItemRef.current(measure);
                }
                return;
              }
            }
            setPopupItemRef.current(null);
            return;
          }

          // --- KML-линия / полигон ---
          if (props.isKmlItem) {
            const id = props.kmlItemId ? props.kmlItemId.getValue() : null;
            if (id) {
              const allItems = itemsRef.current.concat(
                importedItemsRef.current
              );
              const found = findItemById(allItems, id);
              if (found) {
                const w = v.scene.canvas.clientWidth;
                const h = v.scene.canvas.clientHeight;
                setPopupAnchorRef.current({
                  x: Math.max(20, Math.min(w - 40, clickPos.x)),
                  y: Math.max(20, Math.min(h - 40, clickPos.y)),
                });
                const mode2 = settingsRef.current.mapPopup.mode;
                if (mode2 === 'always' || mode2 === 'selected-only') {
                  setPopupItemRef.current(found);
                }
                return;
              }
            }
          }

          setPopupItemRef.current(null);
        } else {
          setPopupItemRef.current(null);
        }
      };

      // === Двойной клик ===
      const onDblClickInternal = function (click: any) {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        if (!settingsRef.current.mapCreateMenu.enabled) return;

        // На объектах меню не открываем
        const picked = v.scene.pick(click.position);
        if (
          Cesium.defined(picked) &&
          picked.id &&
          picked.id.properties &&
          (picked.id.properties.isPlace ||
            picked.id.properties.isMeasurePoint ||
            picked.id.properties.isMeasureItem ||
            picked.id.properties.isKmlItem)
        ) {
          return;
        }

        const ray = v.camera.getPickRay(click.position);
        let cartesian: any = null;
        if (ray) cartesian = v.scene.globe.pick(ray, v.scene) || null;
        if (!cartesian) {
          cartesian = v.camera.pickEllipsoid(
            click.position,
            v.scene.globe.ellipsoid
          );
        }
        if (!cartesian) return;

        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const lon = Cesium.Math.toDegrees(carto.longitude);
        const height = carto.height || 0;

        setCreateMenuRef.current({
          worldPos: Cesium.Cartesian3.fromDegrees(lon, lat, height),
          lat: lat,
          lon: lon,
          height: height,
          screenX: click.position.x,
          screenY: click.position.y,
        });
      };

      // =====================================================
      // Единый ScreenSpaceEventHandler
      // =====================================================
      const handler = new Cesium.ScreenSpaceEventHandler(canvas);

      const onLeftDown = function (click: any) {
        if (!click || !click.position) return;
        downPos = { x: click.position.x, y: click.position.y };
        movedDistance = 0;
      };

      const onMouseMove = function (movement: any) {
        if (!downPos || !movement || !movement.endPosition) return;
        const dx = movement.endPosition.x - downPos.x;
        const dy = movement.endPosition.y - downPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > movedDistance) movedDistance = dist;
      };

      const onLeftUp = function (click: any) {
        if (!downPos) return;
        const wasMoving = movedDistance > DRAG_THRESHOLD;
        downPos = null;
        movedDistance = 0;
        if (wasMoving) return;
        if (!click || !click.position) return;
        onClickInternal(click.position);
      };

      handler.setInputAction(onLeftDown, 0);
      handler.setInputAction(onMouseMove, 15);
      handler.setInputAction(onLeftUp, EVT_LEFT_UP);
      handler.setInputAction(onDblClickInternal, EVT_LEFT_DOUBLE_CLICK);

      return function () {
        try {
          handler.destroy();
        } catch (e) {}
      };
    },
    [viewerReady, viewerRef]
  );
}