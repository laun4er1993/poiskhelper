// =====================================================
// src/components/globe/GlobeViewer.tsx
// Основной компонент 3D-глобуса
// =====================================================

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import type { TreeItem, Place } from '../../types/base';
import type { ThemeColors } from '../../theme/types';
import type { StatusBarData } from '../status-bar/types';
import MapPopup from '../map-popup/MapPopup';
import MapCreateMenu from '../map-create-menu/MapCreateMenu';
import Compass from './Compass';
import CameraControls from './CameraControls';
import InfoBar from './InfoBar';
import MapSourcesPanel from './MapSourcesPanel';
import MeasurePanel from '../measure/MeasurePanel';
import { useCesiumViewer } from './hooks/useCesiumViewer';
import { useBaseLayer } from './hooks/useBaseLayer';
import { useStatusBar } from './hooks/useStatusBar';
import { useDragHandlers } from './hooks/useDragHandlers';
import { useClickHandlers } from './hooks/useClickHandlers';
import { useRendering } from './hooks/useRendering';
import { useSelectionScale } from './hooks/useSelectionScale';
import { computeProjectBounds } from './utils/bounds';
import type {
  GlobeViewerProps,
  BillboardInfo,
  CreateMenuAnchor,
} from './types';

function GlobeViewer({
  items,
  importedItems,
  clickMode,
  settings,
  colors,
  measurePoints,
  measureClosed,
  selectedId,
  selectedItem: _selectedItem,
  editingItemId,
  selectedMeasureIndex,
  mapSource,
  onMapSourceChange,
  onNeedCustomDialog,
  onDeleteCustom,
  onViewerReady,
  onMapClick,
  onSelectPlace,
  onSelectMeasurePoint,
  onStatusUpdate,
  onClearMeasure,
  onUndoMeasure,
  onRemoveMeasurePoint,
  onToggleClosed,
  onSave,
  onSetRulerType,
  onMovePlace,
  onMoveMeasurePoint,
  onMoveSavedMeasurePoint,
  onDragEnd,
  onCopyMeasureCoords,
  onEditItem,
  onHideItem,
  onCreateAction,
}: GlobeViewerProps) {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const billboardsRef = useRef<Map<string, BillboardInfo>>(new Map());
  const popupItemRef = useRef<TreeItem | null>(null);
  const createMenuRef = useRef<CreateMenuAnchor | null>(null);

  const [popupItem, setPopupItem] = useState<TreeItem | null>(null);
  const [popupAnchor, setPopupAnchor] = useState({ x: 0, y: 0 });
  const [createMenu, setCreateMenu] = useState<CreateMenuAnchor | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 1000, h: 700 });

  useEffect(
    function () {
      popupItemRef.current = popupItem;
    },
    [popupItem]
  );
  useEffect(
    function () {
      createMenuRef.current = createMenu;
    },
    [createMenu]
  );

  const { viewerRef, viewerReady } = useCesiumViewer(
    cesiumContainerRef,
    onViewerReady
  );

  useBaseLayer({
    viewerRef,
    viewerReady,
    settings: mapSource,
  });

  const { applySelectionScale } = useSelectionScale({
    viewerRef,
    viewerReady,
    selectedId,
    billboardsRef,
  });

  const { heading, cameraHeight, scaleMeters, fps } = useStatusBar({
    viewerRef,
    viewerReady,
    onStatusUpdate,
  });

  const { dragging } = useDragHandlers({
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
  });

  useClickHandlers({
    viewerRef,
    viewerReady,
    clickMode,
    settings,
    items,
    importedItems,
    onMapClick,
    onSelectPlace,
    onSelectMeasurePoint,
    onCreateAction,
    setPopupItem,
    setPopupAnchor,
    setCreateMenu,
  });

  const handleAfterRender = useCallback(
    function () {
      applySelectionScale(selectedId);
    },
    [applySelectionScale, selectedId]
  );

  useRendering({
    viewerRef,
    viewerReady,
    items,
    importedItems,
    settings,
    colors,
    billboardsRef,
    measurePoints,
    measureClosed,
    editingItemId,
    onAfterRender: handleAfterRender,
  });

  useEffect(
    function () {
      if (!viewerReady || !containerRef.current) return;
      const container = containerRef.current;
      let rafId: number | null = null;

      const doResize = function () {
        const v = viewerRef.current;
        if (v && !v.isDestroyed()) {
          try {
            v.resize();
            v.render();
          } catch (e) {}
        }
        setContainerSize(function (prev) {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (prev.w === w && prev.h === h) return prev;
          return { w: w, h: h };
        });
        rafId = null;
      };

      const schedule = function () {
        if (rafId === null) rafId = window.requestAnimationFrame(doResize);
      };

      const ro = new ResizeObserver(schedule);
      ro.observe(container);
      window.addEventListener('resize', schedule);

      setContainerSize({
        w: container.clientWidth,
        h: container.clientHeight,
      });

      return function () {
        ro.disconnect();
        window.removeEventListener('resize', schedule);
        if (rafId !== null) window.cancelAnimationFrame(rafId);
      };
    },
    [viewerReady, viewerRef]
  );

  useEffect(
    function () {
      if (!viewerReady) return;

      const id = window.setInterval(function () {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;

        const it = popupItemRef.current;
        if (it && it.type === 'place') {
          const place = it as Place;
          if (isFinite(place.lat) && isFinite(place.lon)) {
            try {
              const worldPos = Cesium.Cartesian3.fromDegrees(
                place.lon,
                place.lat,
                place.height || 0
              );
              const screen =
                Cesium.SceneTransforms.worldToWindowCoordinates(
                  v.scene,
                  worldPos
                );
              if (screen) {
                const w = v.scene.canvas.clientWidth;
                const h = v.scene.canvas.clientHeight;
                if (
                  screen.x >= 0 &&
                  screen.y >= 0 &&
                  screen.x <= w &&
                  screen.y <= h
                ) {
                  setPopupAnchor(function (prev) {
                    if (
                      Math.abs(prev.x - screen.x) < 0.5 &&
                      Math.abs(prev.y - screen.y) < 0.5
                    )
                      return prev;
                    return { x: screen.x, y: screen.y };
                  });
                }
              }
            } catch (e) {}
          }
        }

        const menu = createMenuRef.current;
        if (menu) {
          try {
            const screen = Cesium.SceneTransforms.worldToWindowCoordinates(
              v.scene,
              menu.worldPos
            );
            if (screen) {
              setCreateMenu(function (prev) {
                if (!prev) return prev;
                if (
                  Math.abs(prev.screenX - screen.x) < 0.5 &&
                  Math.abs(prev.screenY - screen.y) < 0.5
                )
                  return prev;
                return { ...prev, screenX: screen.x, screenY: screen.y };
              });
            }
          } catch (e) {}
        }
      }, 200);

      return function () {
        window.clearInterval(id);
      };
    },
    [viewerReady, viewerRef]
  );

  const handleZoomIn = useCallback(
    function () {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;
      const h = v.camera.positionCartographic.height;
      v.camera.zoomIn(h * 0.5);
    },
    [viewerRef]
  );

  const handleZoomOut = useCallback(
    function () {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;
      const h = v.camera.positionCartographic.height;
      v.camera.zoomOut(h);
    },
    [viewerRef]
  );

  const handleReset = useCallback(
    function () {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;
      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
        duration: 1.5,
      });
    },
    [viewerRef]
  );

  const handleTopDown = useCallback(
    function () {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;
      v.camera.flyTo({
        destination: v.camera.position,
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
        duration: 1,
      });
    },
    [viewerRef]
  );

  const handleResetNorth = useCallback(
    function () {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;
      const carto = v.camera.positionCartographic;
      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(
          carto.longitude,
          carto.latitude,
          carto.height
        ),
        orientation: { heading: 0, pitch: v.camera.pitch, roll: 0 },
        duration: 0.8,
      });
    },
    [viewerRef]
  );

  const handleFlyToProjectCenter = useCallback(
    function () {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;

      const all = items.concat(importedItems);
      const bounds = computeProjectBounds(all, true);
      if (!bounds) {
        alert('В проекте нет видимых меток с координатами.');
        return;
      }

      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerLon = bounds.avgLon;
      const latDelta = Math.max(0.001, bounds.maxLat - bounds.minLat);
      const lonDelta = Math.max(0.001, bounds.maxLon - bounds.minLon);
      const maxDelta = Math.max(latDelta, lonDelta);
      const height = Math.max(500, maxDelta * 111000 * 1.5);

      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          centerLon,
          centerLat,
          height
        ),
        orientation: {
          heading: v.camera.heading,
          pitch: Cesium.Math.toRadians(-70),
          roll: 0,
        },
        duration: 1.6,
      });
    },
    [viewerRef, items, importedItems]
  );

  const handlePopupEdit = useCallback(
    function (it: TreeItem) {
      onEditItem(it);
      setPopupItem(null);
    },
    [onEditItem]
  );

  const handlePopupFlyTo = useCallback(
    function (p: Place) {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;
      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 5000),
        duration: 1.5,
      });
    },
    [viewerRef]
  );

  const handlePopupClose = useCallback(function () {
    setPopupItem(null);
  }, []);

  const handleCreateMenuSelect = useCallback(
    function (action: any) {
      if (!createMenu) return;
      onCreateAction(action, createMenu.lat, createMenu.lon, createMenu.height);
      setCreateMenu(null);
    },
    [createMenu, onCreateAction]
  );

  const handleCreateMenuClose = useCallback(function () {
    setCreateMenu(null);
  }, []);

  const handleFlyToMeasurePoint = useCallback(
    function (lat: number, lon: number, height: number) {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;
      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, height + 5000),
        duration: 1.2,
      });
    },
    [viewerRef]
  );

  const handleCopyMeasureCoordsInternal = useCallback(
    function (text: string, label: string) {
      if (onCopyMeasureCoords) {
        onCopyMeasureCoords(text, label);
        return;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(function () {});
      }
    },
    [onCopyMeasureCoords]
  );

  const handleRemoveMeasurePointInternal = useCallback(
    function (index: number) {
      if (onRemoveMeasurePoint) onRemoveMeasurePoint(index);
    },
    [onRemoveMeasurePoint]
  );

  const popupVisible = useMemo(
    function () {
      return (
        popupItem !== null &&
        settings.mapPopup.mode !== 'off' &&
        clickMode === 'select'
      );
    },
    [popupItem, settings.mapPopup.mode, clickMode]
  );

  const createMenuVisible = useMemo(
    function () {
      return createMenu !== null && settings.mapCreateMenu.enabled;
    },
    [createMenu, settings.mapCreateMenu.enabled]
  );

  return (
    <div ref={containerRef} style={styles.wrapper}>
      <div ref={cesiumContainerRef} style={styles.globe} />

      {settings.showCompass && (
        <div
          data-globe-overlay="true"
          style={{
            ...styles.compassWrap,
            width: 'var(--globe-compass-size, 56px)',
            height: 'var(--globe-compass-size, 56px)',
          }}
          onClick={handleResetNorth}
          title="Сбросить направление на север"
        >
          <Compass
            heading={heading}
            size={settings.design.globeSkin === 'compact' ? 40 : 56}
            showTicks={
              settings.design.globeSkin !== 'minimal' &&
              settings.design.globeSkin !== 'compact'
            }
            northColor="var(--globe-compass-north, var(--danger))"
            ringColor="var(--globe-compass-ring, var(--border))"
            textColor="var(--globe-compass-text, var(--text-primary))"
            bgColor="var(--globe-compass-bg, var(--bg-panel-header))"
            borderColor="var(--globe-compass-border, var(--border))"
          />
        </div>
      )}

      <MapSourcesPanel
        settings={mapSource}
        onChange={onMapSourceChange}
        onNeedCustomDialog={onNeedCustomDialog}
        onDeleteCustom={onDeleteCustom}
        top={14}
        right={settings.showCompass ? 80 : 14}
      />

      <CameraControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onTopDown={handleTopDown}
        onResetNorth={handleResetNorth}
        onFlyToProjectCenter={handleFlyToProjectCenter}
      />

      {clickMode === 'add-marker' && (
        <div data-globe-overlay="true" style={styles.hint}>
          Кликните по карте, чтобы поставить метку
        </div>
      )}
      {dragging && (
        <div data-globe-overlay="true" style={styles.dragHint}>
          Перетаскивание… Отпустите мышь
        </div>
      )}

      {clickMode === 'measure' && (
        <MeasurePanel
          points={measurePoints}
          closed={measureClosed}
          settings={settings}
          selectedIndex={selectedMeasureIndex}
          onClear={onClearMeasure}
          onUndo={onUndoMeasure}
          onRemovePoint={handleRemoveMeasurePointInternal}
          onToggleClosed={onToggleClosed}
          onSave={onSave}
          onSelectPoint={onSelectMeasurePoint}
          onFlyToPoint={handleFlyToMeasurePoint}
          onCopyCoordsToClipboard={handleCopyCoordsInternalSafe(
            handleCopyMeasureCoordsInternal
          )}
          onSetRulerType={onSetRulerType}
        />
      )}

      {settings.showScaleLegend && (
        <InfoBar
          settings={settings}
          scaleMeters={scaleMeters}
          heading={heading}
          cameraHeight={cameraHeight}
          fps={fps}
        />
      )}

      {popupVisible && popupItem && (
        <MapPopup
          item={popupItem}
          anchorX={popupAnchor.x}
          anchorY={popupAnchor.y}
          containerWidth={containerSize.w}
          containerHeight={containerSize.h}
          settings={settings}
          onEdit={handlePopupEdit}
          onFlyTo={handlePopupFlyTo}
          onClose={handlePopupClose}
          onHide={onHideItem}
          onCopyCoords={function () {}}
        />
      )}

      {createMenuVisible && createMenu && (
        <MapCreateMenu
          visible={true}
          x={createMenu.screenX}
          y={createMenu.screenY}
          lat={createMenu.lat}
          lon={createMenu.lon}
          height={createMenu.height}
          settings={settings.mapCreateMenu}
          coordinateFormat={settings.coordinateFormat}
          highPrecision={settings.highPrecision}
          containerWidth={containerSize.w}
          containerHeight={containerSize.h}
          onSelect={handleCreateMenuSelect}
          onClose={handleCreateMenuClose}
        />
      )}
    </div>
  );
}

// helper — просто возвращает ту же функцию (fix TS)
function handleCopyCoordsInternalSafe(
  fn: (text: string, label: string) => void
): (text: string, label: string) => void {
  return fn;
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  globe: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  compassWrap: {
    position: 'absolute',
    top: 14,
    right: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35))',
  },
  hint: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--danger)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    boxShadow: 'var(--shadow-md)',
  },
  dragHint: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    padding: '8px 16px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    boxShadow: 'var(--shadow-md)',
  },
};

export default GlobeViewer;