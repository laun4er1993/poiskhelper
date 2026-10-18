// =====================================================
// src/App.tsx
// Корневой компонент — поиск мест через GeocodeResult
// =====================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Cesium from 'cesium';

import { TopToolbar } from './components/top-toolbar';
import { Sidebar } from './components/sidebar';
import { GlobeViewer } from './components/globe';
import { CustomMapSourceDialog } from './components/globe';
import { PropertiesPanel } from './components/properties';
import { SettingsPanel } from './components/settings';
import { StatusBar } from './components/status-bar';
import { LoadingScreen, LoadingOverlay } from './components/loading';
import { ImportDialog } from './components/import-dialog';
import { LogsPanel } from './components/logs';
import { SaveNotification } from './components/save-notification';
import { MoveDialog } from './components/move-dialog';
import { InfoDialog } from './components/info-dialog';
import { WelcomeScreen } from './components/welcome';
import { ProjectDetailsDialog } from './components/project-details';
import { ConfirmDialog } from './components/confirm';

import type { SelectMode } from './components/tree/types';
import type { StatusBarData } from './components/status-bar';
import type { TreeItem, Place, MapCreateAction, MeasureItem } from './types';
import {
  isContainer,
  isPlace,
  isMeasure,
  isKmlLine,
  isKmlPolygon,
  isGeoItem,
  findItem,
  getBreadcrumbPath,
  flattenIds,
} from './types';
import type {
  MapSourceSettings,
  CustomMapSource,
} from './types/settings';
import { DEFAULT_MAP_SOURCE_SETTINGS } from './types/settings';
import { getAllMapSources } from './types/map-sources';

import { addItemToFolder } from './types/tree-utils';
import { generateId } from './types/ids';
import { sampleTerrainForPoint } from './utils/terrain';

import { useProjectState } from './hooks/useProjectState';
import { useUIState } from './hooks/useUIState';
import { useSettings } from './hooks/useSettings';
import { useTheme } from './hooks/useTheme';
import { useSidebarOrder } from './hooks/useSidebarOrder';
import { useLogger } from './hooks/useLogger';
import { useTreeOps } from './hooks/useTreeOps';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProjectOps } from './hooks/useProjectOps';
import { useMeasure } from './hooks/useMeasure';

import {
  getProjectStats,
  removeRecentProject,
  clearRecentProjects,
  pickProjectSavePath,
  normalizeProjectMeta,
} from './services/project';
import {
  searchPlaces,
  type GeocodeResult,
} from './services/geocoding';
import { copyTextToClipboard } from './utils/clipboard';

const LOGS_PANEL_KEY = 'poiskhelper_logs_panel_v1';

const DEFAULT_STATUS_BAR: StatusBarData = {
  mouseLat: null,
  mouseLon: null,
  mouseHeight: null,
  cameraHeading: 0,
  cameraPitch: -Math.PI / 2,
  cameraHeight: 20000000,
  scaleMeters: 0,
};

function App() {
  const project = useProjectState();
  const ui = useUIState();
  const { settings, updateSettings } = useSettings();
  const { theme, colors, setTheme, setColors } = useTheme(settings.design);
  const sidebarOrder = useSidebarOrder(settings, updateSettings);
  const logger = useLogger();

  const [recentProjects, setRecentProjects] = useState<any[]>(function () {
    try {
      const raw = localStorage.getItem('poiskhelper_recent_projects_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  const [statusBarData, setStatusBarData] =
    useState<StatusBarData>(DEFAULT_STATUS_BAR);

  const [customDialogVisible, setCustomDialogVisible] = useState(false);
  const [editingCustomSource, setEditingCustomSource] =
    useState<CustomMapSource | null>(null);

  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const buildingsTilesetRef = useRef<Cesium.Cesium3DTileset | null>(null);
  const exitInProgressRef = useRef(false);
  const autoSaveWarnedRef = useRef(false);

  const effectiveMapSource: MapSourceSettings = useMemo(
    function () {
      return {
        ...DEFAULT_MAP_SOURCE_SETTINGS,
        ...settings.mapSource,
        ...(project.meta.mapSource || {}),
      };
    },
    [settings.mapSource, project.meta.mapSource]
  );

  const treeOps = useTreeOps({
    tree: project.tree,
    importedItems: project.importedItems,
    setTree: project.setTree,
    setImportedItems: project.setImportedItems,
    activeFolderId: ui.activeFolderId,
    focusedFolderId: ui.focusedFolderId,
    selectedIds: ui.selectedIds,
    setSelectedIds: ui.setSelectedIds,
    setLastClickedId: ui.setLastClickedId,
    setPanelItemId: ui.setPanelItemId,
    clipboard: ui.clipboard,
    setClipboard: ui.setClipboard,
    addLog: logger.addLog,
    markDirty: project.markDirty,
  });

  const projectOps = useProjectOps({
    project,
    ui,
    logger,
    settings,
    colors,
    viewerRef,
    setRecentProjects,
  });

  function handleCopyCoordsInternal(text: string, label: string) {
    copyTextToClipboard(text).then(function () {
      ui.setToast({ text: text, label: label });
      logger.addLog('copy', 'Координаты: ' + label);
    });
  }

  const measure = useMeasure({
    settings: settings.measure,
    distanceUnit: settings.distanceUnit,
    highPrecision: settings.highPrecision,
    activeFolderId: ui.activeFolderId,
    setTree: project.setTree,
    setSelectedIds: ui.setSelectedIds,
    addLog: logger.addLog,
    markDirty: project.markDirty,
    copyToClipboard: handleCopyCoordsInternal,
  });

  useEffect(
    function () {
      measure.clearAll();
      ui.setSelectedMeasureIndex(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [project.currentProjectPath]
  );

  useEffect(
    function () {
      if (!project.autoSaveWarning) return;
      if (autoSaveWarnedRef.current) return;
      autoSaveWarnedRef.current = true;

      ui.setToast({
        text: project.autoSaveWarning,
        label: 'Автосохранение',
      });
      logger.addLog('project', project.autoSaveWarning);

      const t = setTimeout(function () {
        autoSaveWarnedRef.current = false;
      }, 60000);
      return function () {
        clearTimeout(t);
      };
    },
    [project.autoSaveWarning, ui, logger]
  );

  const handleMapSourceChange = useCallback(
    function (updater: Partial<MapSourceSettings>) {
      if (project.meta.mapSource) {
        project.setMeta(function (prev) {
          const nextMeta = {
            ...prev,
            mapSource: {
              ...(prev.mapSource || {}),
              ...updater,
            },
            updatedAt: new Date().toISOString(),
          };
          return nextMeta;
        });
        project.markDirty();
      } else {
        updateSettings({
          mapSource: { ...settings.mapSource, ...updater },
        });
      }
    },
    [project, settings.mapSource, updateSettings]
  );

  const handleNeedCustomDialog = useCallback(
    function (edit?: CustomMapSource | null) {
      setEditingCustomSource(edit || null);
      setCustomDialogVisible(true);
    },
    []
  );

  const handleSaveCustomSource = useCallback(
    function (source: Omit<CustomMapSource, 'id' | 'addedAt'>) {
      const currentCustom = settings.mapSource.customSources || [];
      const newSource: CustomMapSource = {
        ...source,
        id:
          editingCustomSource &&
          editingCustomSource.id &&
          editingCustomSource.id !== '__import_xml__'
            ? editingCustomSource.id
            : 'custom-' +
              Date.now() +
              '-' +
              Math.random().toString(36).slice(2, 8),
        addedAt:
          (editingCustomSource && editingCustomSource.addedAt) ||
          new Date().toISOString(),
      };

      let nextCustom: CustomMapSource[];
      if (
        editingCustomSource &&
        editingCustomSource.id &&
        editingCustomSource.id !== '__import_xml__'
      ) {
        nextCustom = currentCustom.map(function (c) {
          return c.id === newSource.id ? newSource : c;
        });
      } else {
        nextCustom = currentCustom.concat([newSource]);
      }

      updateSettings({
        mapSource: {
          ...settings.mapSource,
          customSources: nextCustom,
          baseLayer: newSource.id,
        },
      });
      setCustomDialogVisible(false);
      setEditingCustomSource(null);
      logger.addLog('project', 'Добавлена карта: ' + newSource.name);
    },
    [settings.mapSource, updateSettings, editingCustomSource, logger]
  );

  const handleImportCustomXml = useCallback(
    function (xml: string) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');

        const providers = doc.getElementsByTagName('provider');
        const imported: CustomMapSource[] = [];

        for (let i = 0; i < providers.length; i++) {
          const p = providers[i];
          const nameEl = p.getElementsByTagName('name')[0];
          const urlEl = p.getElementsByTagName('url')[0];
          const maxEl = p.getElementsByTagName('zoomMax')[0];
          const minEl = p.getElementsByTagName('zoomMin')[0];

          const name = nameEl ? (nameEl.textContent || '').trim() : '';
          let url = urlEl ? (urlEl.textContent || '').trim() : '';
          const maxLevel = maxEl
            ? parseInt(maxEl.textContent || '19', 10)
            : 19;
          const minLevel = minEl
            ? parseInt(minEl.textContent || '0', 10)
            : 0;

          if (!name || !url) continue;
          url = url.replace(/\s+/g, '');
          url = url.replace(/\{ts\}/g, '');

          imported.push({
            id:
              'custom-' +
              Date.now() +
              '-' +
              i +
              '-' +
              Math.random().toString(36).slice(2, 6),
            name: name,
            urlTemplate: url,
            maxLevel: Math.max(1, Math.min(22, maxLevel)),
            minLevel: Math.max(0, Math.min(22, minLevel)),
            attribution: 'Импорт из Locus',
            category: 'satellite',
            previewColor: '#4a90d9',
            addedAt: new Date().toISOString(),
          });
        }

        if (imported.length === 0) {
          alert('Не найдено провайдеров в XML');
          return;
        }

        const currentCustom = settings.mapSource.customSources || [];
        const nextCustom = currentCustom.concat(imported);

        updateSettings({
          mapSource: {
            ...settings.mapSource,
            customSources: nextCustom,
          },
        });

        alert('Импортировано: ' + imported.length + ' карт');
        logger.addLog('project', 'Импорт XML: ' + imported.length + ' карт');
        setCustomDialogVisible(false);
        setEditingCustomSource(null);
      } catch (err) {
        alert('Ошибка разбора XML: ' + (err as Error).message);
      }
    },
    [settings.mapSource, updateSettings, logger]
  );

  const handleDeleteCustom = useCallback(
    function (id: string) {
      const currentCustom = settings.mapSource.customSources || [];
      const nextCustom = currentCustom.filter(function (c) {
        return c.id !== id;
      });
      const nextBaseLayer =
        settings.mapSource.baseLayer === id && nextCustom.length > 0
          ? nextCustom[0].id
          : settings.mapSource.baseLayer === id
          ? 'esri-imagery'
          : settings.mapSource.baseLayer;

      updateSettings({
        mapSource: {
          ...settings.mapSource,
          customSources: nextCustom,
          baseLayer: nextBaseLayer,
        },
      });
      logger.addLog('project', 'Удалена карта: ' + id);
    },
    [settings.mapSource, updateSettings, logger]
  );

  const ensureHeightForPlace = useCallback(
    async function (id: string, lat: number, lon: number, height: number) {
      if (height && Math.abs(height) > 0.001) return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      try {
        const realHeight = await sampleTerrainForPoint(
          viewer.terrainProvider,
          lat,
          lon,
          0
        );
        if (Math.abs(realHeight) > 0.001) {
          treeOps.handleUpdatePlace(id, { height: realHeight });
        }
      } catch (e) {
        console.warn('ensureHeightForPlace:', e);
      }
    },
    [treeOps]
  );

  const toggle3DBuildings = useCallback(
    async function () {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      if (buildingsTilesetRef.current) {
        viewer.scene.primitives.remove(buildingsTilesetRef.current);
        buildingsTilesetRef.current = null;
        ui.setShow3DBuildings(false);
        logger.addLog('visibility', '3D-здания выключены');
        try {
          viewer.scene.requestRender();
        } catch (e) {}
        return;
      }
      ui.setBuildingsLoading(true);
      try {
        const tileset = await Cesium.createOsmBuildingsAsync();
        if (!viewer.isDestroyed()) {
          viewer.scene.primitives.add(tileset);
          buildingsTilesetRef.current = tileset;
          ui.setShow3DBuildings(true);
          viewer.scene.globe.enableLighting = true;
          tileset.style = new Cesium.Cesium3DTileStyle({
            color: {
              conditions: [
                ['${height} >= 100', 'rgba(200, 100, 80, 0.9)'],
                ['${height} >= 50', 'rgba(180, 130, 100, 0.9)'],
                ['${height} >= 20', 'rgba(150, 150, 140, 0.9)'],
                ['true', 'rgba(120, 120, 120, 0.9)'],
              ],
            },
          });
          logger.addLog('visibility', '3D-здания включены');
          try {
            viewer.scene.requestRender();
          } catch (e) {}
        }
      } catch (err) {
        console.error('3D-здания:', err);
        alert('Не удалось загрузить 3D-здания.');
      } finally {
        ui.setBuildingsLoading(false);
      }
    },
    [ui, logger]
  );

  const handleViewerReady = useCallback(
    function (viewer: Cesium.Viewer) {
      viewerRef.current = viewer;
      setTimeout(function () {
        ui.setAppLoading(false);
      }, 500);
    },
    [ui]
  );

  useEffect(
    function () {
      if (ui.focusedFolderId) {
        ui.setActiveFolderId(ui.focusedFolderId);
        return;
      }
      if (!ui.selectedIds.length) return;
      const sid = ui.selectedIds[ui.selectedIds.length - 1];
      const path = getBreadcrumbPath(project.tree, sid);
      if (path.length >= 2) {
        ui.setActiveFolderId(path[path.length - 2].id);
      } else if (path.length === 1 && isContainer(path[0])) {
        ui.setActiveFolderId(path[0].id);
      } else {
        ui.setActiveFolderId('root-folder');
      }
    },
    [ui.selectedIds, project.tree, ui.focusedFolderId, ui.setActiveFolderId]
  );

  useEffect(
    function () {
      try {
        localStorage.setItem(LOGS_PANEL_KEY, String(ui.showLogsPanel));
      } catch (e) {}
    },
    [ui.showLogsPanel]
  );

  useEffect(
    function () {
      let unlisten: (() => void) | null = null;
      const setup = async function () {
        try {
          const { getCurrentWindow } = await import(
            '@tauri-apps/api/window'
          );
          const win = getCurrentWindow();
          unlisten = await win.onCloseRequested(async function (event) {
            if (exitInProgressRef.current) return;
            if (!project.hasUnsavedChanges) return;
            event.preventDefault();
            ui.setConfirmDialog({
              visible: true,
              title: 'Выход из PoiskHelper',
              message:
                'В проекте есть несохранённые изменения.\n\nСохранить перед выходом?',
              okLabel: 'Сохранить и выйти',
              cancelLabel: 'Отмена',
              thirdLabel: 'Выйти без сохранения',
              danger: false,
              onThird: async function () {
                ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
                exitInProgressRef.current = true;
                try {
                  await win.destroy();
                } catch (e) {
                  window.close();
                }
              },
              onConfirm: async function () {
                ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
                try {
                  await projectOps.handleSaveProject();
                  exitInProgressRef.current = true;
                  try {
                    await win.destroy();
                  } catch (e) {
                    window.close();
                  }
                } catch (e) {
                  console.error('Ошибка сохранения при выходе:', e);
                }
              },
            });
          });
        } catch (err) {}
      };
      setup();
      return function () {
        if (unlisten) unlisten();
      };
    },
    [project.hasUnsavedChanges, ui, projectOps]
  );

  const handleCancelChanges = useCallback(
    function () {
      ui.setConfirmDialog({
        visible: true,
        title: 'Отмена изменений',
        message:
          'Отменить изменения с момента последнего сохранения?\n\nВосстановится последняя сохранённая версия.',
        okLabel: 'Отменить изменения',
        cancelLabel: 'Не отменять',
        danger: true,
        onConfirm: function () {
          try {
            const raw = localStorage.getItem('poiskhelper_project_v2');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.tree) project.setTree(parsed.tree);
              if (parsed.meta)
                project.setMeta(normalizeProjectMeta(parsed.meta));
            }
          } catch (e) {}
          ui.setPreviewOverrides({});
          project.clearDirty();
          ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
        },
      });
    },
    [ui, project]
  );

  const handleCopyCoords = useCallback(
    function (text: string, label: string) {
      copyTextToClipboard(text).then(function () {
        ui.setToast({ text: text, label: label });
        logger.addLog('copy', 'Координаты: ' + label);
      });
    },
    [ui, logger]
  );

  const handleHideItem = useCallback(
    function (id: string) {
      treeOps.handleToggleVisible(id);
    },
    [treeOps]
  );

  useEffect(
    function () {
      if (!ui.toast) return;
      const id = setTimeout(function () {
        ui.setToast(null);
      }, 3000);
      return function () {
        clearTimeout(id);
      };
    },
    [ui.toast, ui.setToast]
  );

  const handleFlyTo = useCallback(
    function (item: TreeItem) {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const points = collectGeoPoints(item);
      if (points.length === 0) {
        logger.addLog(
          'update',
          'Перелёт невозможен: нет координат у "' + item.name + '"'
        );
        return;
      }

      let minLat = 90,
        maxLat = -90,
        minLon = 180,
        maxLon = -180;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (!isFinite(p.lat) || !isFinite(p.lon)) continue;
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lon < minLon) minLon = p.lon;
        if (p.lon > maxLon) maxLon = p.lon;
      }
      if (minLat > maxLat || minLon > maxLon) return;

      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;
      const latDelta = Math.max(0.0002, maxLat - minLat);
      const lonDelta = Math.max(0.0002, maxLon - minLon);
      const maxDelta = Math.max(latDelta, lonDelta);
      const height = Math.max(500, maxDelta * 111000 * 2.5);

      try {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            centerLon,
            centerLat,
            height
          ),
          duration: 1.5,
        });
      } catch (e) {}

      ui.setSelectedIds([item.id]);
      ui.setLastClickedId(item.id);
      logger.addLog('update', 'Перелёт к: ' + item.name);
    },
    [ui, logger]
  );

  const handleMapClick = useCallback(
    function (lat: number, lon: number, height: number) {
      if (ui.clickMode === 'measure') {
        measure.addPoint(lat, lon, height);
        logger.addLog('measure', 'Точка измерения');
      } else {
        const newId = treeOps.handleAddPlaceTo(
          ui.activeFolderId,
          lat,
          lon,
          height
        );
        ui.setClickMode('select');
        if (!height || Math.abs(height) < 0.001) {
          ensureHeightForPlace(newId, lat, lon, 0);
        }
      }
    },
    [ui, measure, treeOps, logger, ensureHeightForPlace]
  );

  const handleNavigateToFolder = useCallback(
    function (id: string | null) {
      if (!id) {
        ui.setFocusedFolderId(null);
        return;
      }
      const item =
        findItem(project.tree, id) || findItem(project.importedItems, id);
      if (item && isContainer(item)) ui.setFocusedFolderId(id);
    },
    [project.tree, project.importedItems, ui]
  );

  const handleSelectPlaceFromMap = useCallback(
    function (id: string) {
      try {
        ui.setSelectedIds(function (prev) {
          if (prev.length === 1 && prev[0] === id) return prev;
          return [id];
        });
        ui.setLastClickedId(id);
        ui.setFocusedId(id);
        treeOps.handleExpandAncestors(id);
      } catch (err) {
        console.error('handleSelectPlaceFromMap:', err);
      }
    },
    [ui, treeOps]
  );

  const handleEditItem = useCallback(
    function (item: TreeItem) {
      try {
        ui.setSelectedIds([item.id]);
        ui.setLastClickedId(item.id);
        ui.setFocusedId(item.id);
        ui.setPanelItemId(item.id);
        treeOps.handleExpandAncestors(item.id);
      } catch (err) {
        console.error('handleEditItem:', err);
      }
    },
    [ui, treeOps]
  );

  const handleCreateAction = useCallback(
    function (
      action: MapCreateAction,
      lat: number,
      lon: number,
      height: number
    ) {
      if (action === 'place') {
        const newId = treeOps.handleAddPlaceTo(
          ui.activeFolderId,
          lat,
          lon,
          height
        );
        if (!height || Math.abs(height) < 0.001) {
          ensureHeightForPlace(newId, lat, lon, 0);
        }
      } else if (action === 'folder') {
        treeOps.handleAddFolder(ui.activeFolderId);
      } else if (action === 'measure') {
        measure.addPoint(lat, lon, height);
        ui.setClickMode('measure');
        logger.addLog('measure', 'Измерение начато');
      } else if (action === 'line') {
        alert('Линии — в разработке.');
      } else if (action === 'polygon') {
        alert('Полигоны — в разработке.');
      }
    },
    [ui, treeOps, measure, logger, ensureHeightForPlace]
  );

  const handlePreview = useCallback(
    function (id: string, updates: Partial<any>) {
      ui.setPreviewOverrides(function (prev) {
        const next = { ...prev };
        next[id] = { ...(prev[id] || {}), ...updates };
        return next;
      });
    },
    [ui]
  );

  const handleCancelPreviewFor = useCallback(
    function (id: string) {
      ui.setPreviewOverrides(function (prev) {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [ui]
  );

  const prevPanelItemIdRef = useRef<string | null>(null);
  useEffect(
    function () {
      const prevId = prevPanelItemIdRef.current;
      const currentId = ui.panelItemId;

      if (prevId !== null && prevId !== currentId) {
        ui.setPreviewOverrides(function (prev) {
          if (!prev[prevId]) return prev;
          const next = { ...prev };
          delete next[prevId];
          return next;
        });
      }

      prevPanelItemIdRef.current = currentId;
    },
    [ui.panelItemId, ui.setPreviewOverrides]
  );

  const handleMoveConfirm = useCallback(
    function (targetFolderId: string) {
      if (!ui.moveDialogIds) return;
      treeOps.handleMoveConfirm(targetFolderId, ui.moveDialogIds);
      ui.setMoveDialogIds(null);
    },
    [ui, treeOps]
  );

  const handleMovePlace = useCallback(
    function (id: string, lat: number, lon: number, height: number) {
      ui.setPreviewOverrides(function (prev) {
        const next = { ...prev };
        next[id] = { ...(prev[id] || {}), lat, lon, height };
        return next;
      });
      project.markDirty();
    },
    [ui, project]
  );

  const handleMoveSavedMeasurePoint = useCallback(
    function (
      measureId: string,
      index: number,
      lat: number,
      lon: number,
      height: number
    ) {
      ui.setPreviewOverrides(function (prev) {
        const current = prev[measureId];
        let positions: Array<{ lat: number; lon: number; height: number }>;

        if (current && current.positions) {
          positions = (current.positions as typeof positions).slice();
        } else {
          const measure = findItem(project.tree, measureId);
          if (!measure || !isMeasure(measure as TreeItem)) return prev;
          positions = (measure as MeasureItem).positions.slice();
        }

        if (index < 0 || index >= positions.length) return prev;
        positions[index] = { lat, lon, height: height || 0 };

        return {
          ...prev,
          [measureId]: {
            ...(current || {}),
            positions,
          },
        };
      });
      project.markDirty();
    },
    [ui, project]
  );

  const handleDragEnd = useCallback(
    function (
      kind: 'place' | 'measure' | 'saved-measure',
      id: string,
      index: number | null,
      lat: number,
      lon: number,
      height: number
    ) {
      const coordStr =
        lat.toFixed(6) +
        ', ' +
        lon.toFixed(6) +
        ' (h=' +
        height.toFixed(1) +
        ' м)';

      if (kind === 'place') {
        const item = findItem(project.tree, id);
        const name = item ? item.name : id;
        logger.addLog('move', 'Перемещено: ' + name, coordStr);
        return;
      }
      if (kind === 'measure') {
        logger.addLog(
          'move',
          'Точка ' + ((index ?? 0) + 1) + ' линейки перемещена',
          coordStr
        );
        return;
      }
      if (kind === 'saved-measure') {
        const item = findItem(project.tree, id);
        const name = item ? item.name : id;
        logger.addLog(
          'move',
          'Точка ' + ((index ?? 0) + 1) + ' ' + name + ' перемещена',
          coordStr
        );
      }
    },
    [project.tree, logger]
  );

  const handleCopyMeasureCoords = useCallback(
    function (text: string, label: string) {
      copyTextToClipboard(text).then(function () {
        ui.setToast({ text: text, label: label });
        logger.addLog('copy', label);
      });
    },
    [ui, logger]
  );

  const placesCount = useMemo(
    function () {
      let n = 0;
      function walk(list: TreeItem[], parentVis: boolean) {
        list.forEach(function (it) {
          if (!it) return;
          const visible = parentVis && it.visible !== false;
          if (!visible) return;
          if (isPlace(it)) n++;
          else if (isContainer(it)) walk(it.children, visible);
        });
      }
      walk(project.tree, true);
      return n;
    },
    [project.tree]
  );

  const projectStats = useMemo(
    function () {
      return getProjectStats(project.tree, project.importedItems);
    },
    [project.tree, project.importedItems]
  );

  const selectedId =
    ui.selectedIds.length > 0
      ? ui.selectedIds[ui.selectedIds.length - 1]
      : null;

  const selectedItem = useMemo(
    function () {
      if (!selectedId) return null;
      const base =
        findItem(project.tree, selectedId) ||
        findItem(project.importedItems, selectedId);
      if (!base) return null;
      const patch = ui.previewOverrides[selectedId];
      return patch ? ({ ...base, ...patch } as TreeItem) : base;
    },
    [
      project.tree,
      project.importedItems,
      selectedId,
      ui.previewOverrides,
    ]
  );

  const panelItem = useMemo(
    function () {
      if (!ui.panelItemId) return null;
      const base =
        findItem(project.tree, ui.panelItemId) ||
        findItem(project.importedItems, ui.panelItemId);
      if (!base) return null;
      const patch = ui.previewOverrides[ui.panelItemId];
      return patch ? ({ ...base, ...patch } as TreeItem) : base;
    },
    [
      project.tree,
      project.importedItems,
      ui.panelItemId,
      ui.previewOverrides,
    ]
  );

  const hasPreviewForPanel = ui.panelItemId
    ? !!ui.previewOverrides[ui.panelItemId]
    : false;

  const infoItem = ui.infoDialogId
    ? findItem(project.tree, ui.infoDialogId) ||
      findItem(project.importedItems, ui.infoDialogId)
    : null;

  // =====================================================
  // Поиск мест — выбор конкретного результата
  // =====================================================
  const handleSelectGeocodeResult = useCallback(
    function (result: GeocodeResult) {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      // Полёт к найденному месту
      try {
        if (result.bbox) {
          const west = result.bbox[0];
          const south = result.bbox[1];
          const east = result.bbox[2];
          const north = result.bbox[3];

          const centerLon = (west + east) / 2;
          const centerLat = (south + north) / 2;
          const latDelta = Math.max(0.001, north - south);
          const lonDelta = Math.max(0.001, east - west);
          const maxDelta = Math.max(latDelta, lonDelta);
          const height = Math.max(500, maxDelta * 111000 * 2);

          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              centerLon,
              centerLat,
              height
            ),
            duration: 1.5,
          });
        } else {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              result.lon,
              result.lat,
              5000
            ),
            duration: 1.5,
          });
        }
      } catch (e) {}

      // Создаём метку в активной папке
      const newPlace: Place = {
        id: generateId(),
        name: result.displayName,
        type: 'place',
        visible: true,
        lat: result.lat,
        lon: result.lon,
        height: result.height || 0,
        color: colors.markerDefault,
        pixelSize: 6,
        description: '',
        altitudeMode: 'clampToGround',
        createdAt: new Date().toISOString(),
      };

      project.setTree(function (prev) {
        return addItemToFolder(prev, ui.activeFolderId, newPlace);
      });
      ui.setSelectedIds([newPlace.id]);
      ui.setLastClickedId(newPlace.id);

      const sourceLabel =
        result.source === 'coordinate'
          ? 'координаты'
          : result.source === 'cesium'
          ? 'Cesium Ion'
          : 'OpenStreetMap';
      logger.addLog(
        'add',
        'Найдено: ' + result.displayName,
        'Источник: ' + sourceLabel
      );
      project.markDirty();

      if (!result.height || Math.abs(result.height) < 0.001) {
        ensureHeightForPlace(newPlace.id, newPlace.lat, newPlace.lon, 0);
      }
    },
    [
      ui,
      project,
      logger,
      colors.markerDefault,
      ensureHeightForPlace,
    ]
  );

  // =====================================================
  // Поиск — fallback по Enter без выбора в dropdown
  // =====================================================
  const handleSidebarSearch = useCallback(
    async function (query: string) {
      const trimmed = (query || '').trim();
      if (!trimmed) return;

      const viewer = viewerRef.current;

      ui.setLoading({
        visible: true,
        message: 'Поиск',
        subMessage: trimmed,
        kind: 'spinner',
      });

      try {
        const results = await searchPlaces(trimmed, {
          viewer: viewer || undefined,
        });

        if (results.length === 0) {
          logger.addLog(
            'update',
            'Поиск: ничего не найдено — "' + trimmed + '"'
          );
          return;
        }

        // Первый результат — flyTo + создание метки
        handleSelectGeocodeResult(results[0]);

        logger.addLog(
          'update',
          'Поиск: ' +
            results.length +
            ' результат(ов) — выбран первый'
        );
      } catch (error) {
        console.warn('handleSidebarSearch:', error);
        logger.addLog('update', 'Ошибка поиска: "' + trimmed + '"');
      } finally {
        ui.setLoading(ui.DEFAULT_LOADING);
      }
    },
    [ui, logger, handleSelectGeocodeResult]
  );

  const handleSidebarWidthChange = useCallback(
    function (w: number) {
      updateSettings({ sidebarWidth: w });
    },
    [updateSettings]
  );

  const handleSidebarSelect = useCallback(
    function (id: string, mode: SelectMode) {
      ui.setSelectedMeasureIndex(null);
      if (id === '') {
        ui.setSelectedIds([]);
        ui.setLastClickedId(null);
        return;
      }
      if (mode === 'single') {
        ui.setSelectedIds([id]);
        ui.setLastClickedId(id);
      } else if (mode === 'toggle') {
        ui.setSelectedIds(function (prev) {
          const idx = prev.indexOf(id);
          if (idx >= 0) {
            const next = prev.slice();
            next.splice(idx, 1);
            return next;
          }
          return prev.concat([id]);
        });
        ui.setLastClickedId(id);
      } else if (mode === 'range') {
        const allIds = flattenIds(project.tree);
        const startIdx = ui.lastClickedId
          ? allIds.indexOf(ui.lastClickedId)
          : -1;
        const endIdx = allIds.indexOf(id);
        if (startIdx < 0 || endIdx < 0) {
          ui.setSelectedIds([id]);
          ui.setLastClickedId(id);
          return;
        }
        const from = Math.min(startIdx, endIdx);
        const to = Math.max(startIdx, endIdx);
        ui.setSelectedIds(allIds.slice(from, to + 1));
      }
    },
    [ui, project.tree]
  );

  const handleSidebarAddPlace = useCallback(
    function (parentId: string) {
      const viewer = viewerRef.current;
      if (!viewer) return;
      const carto = viewer.camera.positionCartographic;
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const lon = Cesium.Math.toDegrees(carto.longitude);
      const h = carto.height;
      const newId = treeOps.handleAddPlaceTo(parentId, lat, lon, h);
      if (!h || Math.abs(h) < 0.001) {
        ensureHeightForPlace(newId, lat, lon, 0);
      }
    },
    [treeOps, ensureHeightForPlace]
  );

  const handleSidebarMoveRequest = useCallback(
    function (ids: string[]) {
      if (ids.length === 0) return;
      ui.setMoveDialogIds(ids);
    },
    [ui]
  );

  const handleSidebarShowInfo = useCallback(
    function (id: string) {
      ui.setInfoDialogId(id);
    },
    [ui]
  );

  const handleSidebarOpenLogs = useCallback(
    function () {
      ui.setShowLogsPanel(function (v: boolean) {
        return !v;
      });
    },
    [ui]
  );

  const handleSidebarMoveAllImported = useCallback(
    function () {
      if (project.importedItems.length === 0) return;
      ui.setConfirmDialog({
        visible: true,
        title: 'Перенос объектов',
        message:
          'Перенести все добавленные (' +
          project.importedItems.length +
          ') в «Мои объекты»?',
        okLabel: 'Перенести',
        cancelLabel: 'Отмена',
        danger: false,
        onConfirm: function () {
          const items = project.importedItems.slice();
          project.setTree(function (prev) {
            let next = prev;
            items.forEach(function (it) {
              next = addItemToFolder(next, 'root-folder', it);
            });
            return next;
          });
          project.setImportedItems([]);
          logger.addLog('move', 'Перенесено: ' + items.length);
          project.markDirty();
          ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
        },
      });
    },
    [ui, project, logger]
  );

  const handleSidebarDeleteMultiple = useCallback(
    function (ids: string[]) {
      handleConfirmDeleteMultiple(ids);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ui, treeOps]
  );

  useKeyboardShortcuts({
    onSave: projectOps.handleSaveProject,
    onSaveAs: projectOps.handleSaveProjectAs,
    onOpen: projectOps.pickAndOpenProject,
    onNew: projectOps.handleNewProject,
    onCopy: treeOps.handleCopy,
    onCut: treeOps.handleCut,
    onPaste: treeOps.handlePaste,
    onSelectAll: function () {
      ui.setSelectedIds(flattenIds(project.tree));
    },
    onToggleLogs: function () {
      ui.setShowLogsPanel(function (v: boolean) {
        return !v;
      });
    },
    onDelete: function () {
      if (ui.selectedIds.length === 1) {
        const found =
          findItem(project.tree, ui.selectedIds[0]) ||
          findItem(project.importedItems, ui.selectedIds[0]);
        handleRequestDelete(ui.selectedIds[0], found ? found.name : '');
      } else if (ui.selectedIds.length > 1) {
        handleConfirmDeleteMultiple(ui.selectedIds);
      }
    },
    onEscape: function () {
      if (ui.confirmDialog.visible) return;
      if (customDialogVisible) {
        setCustomDialogVisible(false);
        return;
      }
      if (ui.infoDialogId) ui.setInfoDialogId(null);
      else if (ui.moveDialogIds) ui.setMoveDialogIds(null);
      else if (ui.pendingImport) ui.setPendingImport(null);
      else if (ui.showProjectDetails) ui.setShowProjectDetails(false);
      else if (ui.showSettings) ui.setShowSettings(false);
      else if (ui.clickMode === 'measure') ui.setClickMode('select');
      else if (ui.clickMode === 'add-marker') ui.setClickMode('select');
      else if (ui.panelItemId) {
        if (hasPreviewForPanel) handleCancelPreviewFor(ui.panelItemId);
        ui.setPanelItemId(null);
      } else if (ui.selectedIds.length > 0) {
        ui.setSelectedIds([]);
        ui.setLastClickedId(null);
      } else ui.setSelectedMeasureIndex(null);
    },
    selectedIds: ui.selectedIds,
    activeFolderId: ui.activeFolderId,
    clipboardEmpty: !ui.clipboard,
  });

  const handleRequestDelete = useCallback(
    function (id: string, name: string) {
      const displayName = name || id;
      ui.setConfirmDialog({
        visible: true,
        title: 'Удаление объекта',
        message:
          'Удалить "' + displayName + '"?\n\nДействие нельзя отменить.',
        okLabel: 'Удалить',
        cancelLabel: 'Отмена',
        danger: true,
        onConfirm: function () {
          treeOps.handleDelete(id);
          ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
        },
      });
    },
    [ui, treeOps]
  );

  const handleConfirmDeleteMultiple = useCallback(
    function (ids: string[]) {
      ui.setConfirmDialog({
        visible: true,
        title: 'Массовое удаление',
        message:
          'Удалить ' + ids.length + ' объектов?\n\nДействие нельзя отменить.',
        okLabel: 'Удалить все',
        cancelLabel: 'Отмена',
        danger: true,
        onConfirm: function () {
          treeOps.handleDeleteMultiple(ids);
          ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
        },
      });
    },
    [ui, treeOps]
  );

  const handleOpenProjectDetails = useCallback(
    function () {
      ui.setShowProjectDetails(true);
    },
    [ui]
  );

  const handleSaveProjectDetails = useCallback(
    function (updates: any) {
      project.setMeta(function (prev) {
        const next = {
          ...prev,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        if (updates.units) next.units = { ...prev.units, ...updates.units };
        if (updates.mapSource) {
          next.mapSource = {
            ...(prev.mapSource || {}),
            ...updates.mapSource,
          };
        }
        return next;
      });
      if (updates.units) {
        updateSettings({
          distanceUnit: updates.units.distance || settings.distanceUnit,
          heightUnit: updates.units.height || settings.heightUnit,
          coordinateFormat:
            updates.units.coordinate || settings.coordinateFormat,
        });
      }
      logger.addLog('save', 'Метаданные проекта');
      project.markDirty();
      ui.setShowProjectDetails(false);
    },
    [project, ui, settings, updateSettings, logger]
  );

  const handleFlyToHome = useCallback(function (cam: any) {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    try {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          cam.lon,
          cam.lat,
          cam.height
        ),
        orientation: {
          heading: cam.heading,
          pitch: cam.pitch,
          roll: cam.roll,
        },
        duration: 1.5,
      });
    } catch (e) {}
  }, []);

  const currentCamera = useMemo(
    function () {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return null;
      try {
        return {
          lon: Cesium.Math.toDegrees(
            viewer.camera.positionCartographic.longitude
          ),
          lat: Cesium.Math.toDegrees(
            viewer.camera.positionCartographic.latitude
          ),
          height: viewer.camera.positionCartographic.height,
          heading: viewer.camera.heading,
          pitch: viewer.camera.pitch,
          roll: viewer.camera.roll,
        };
      } catch (e) {
        return null;
      }
    },
    [ui.showProjectDetails]
  );

  const handleChangeProjectPath = useCallback(
    async function () {
      try {
        const path = await pickProjectSavePath(
          project.meta.fileBaseName || project.meta.title
        );
        if (!path) return;
        project.setCurrentProjectPath(path);
        const fileName = path.split(/[\\/]/).pop() || 'project';
        const cleaned = fileName.replace(/\.(poiskhelper|json)$/, '');
        project.setMeta(function (prev) {
          return { ...prev, fileBaseName: cleaned };
        });
        alert('Путь изменён. Не забудьте сохранить (Ctrl+S).');
      } catch (err) {
        alert('Ошибка: ' + (err as Error).message);
      }
    },
    [project]
  );

  const handleToggleSidebarOrder = useCallback(
    function () {
      sidebarOrder.toggleOrder();
    },
    [sidebarOrder]
  );

  const handleStatusUpdate = useCallback(function (data: StatusBarData) {
    setStatusBarData(function (prev) {
      if (
        prev.mouseLat === data.mouseLat &&
        prev.mouseLon === data.mouseLon &&
        prev.mouseHeight === data.mouseHeight &&
        prev.cameraHeading === data.cameraHeading &&
        prev.cameraPitch === data.cameraPitch &&
        prev.cameraHeight === data.cameraHeight &&
        prev.scaleMeters === data.scaleMeters
      ) {
        return prev;
      }
      return data;
    });
  }, []);

  return (
    <>
      {ui.showWelcome && (
        <WelcomeScreen
          recentProjects={recentProjects}
          settings={settings}
          theme={theme}
          busy={ui.welcomeBusy}
          busyMessage={ui.welcomeBusyMessage}
          onNewProject={projectOps.handleNewProject}
          onOpenProject={projectOps.pickAndOpenProject}
          onOpenRecent={projectOps.handleOpenRecent}
          onRemoveRecent={function (path: string) {
            const list = removeRecentProject(path);
            setRecentProjects(list);
          }}
          onClearRecent={function () {
            clearRecentProjects();
            setRecentProjects([]);
          }}
          onSettingsChange={updateSettings}
          onThemeChange={setTheme}
          onSkip={function () {
            ui.setShowWelcome(false);
          }}
        />
      )}

      <div style={styles.app}>
        <LoadingScreen visible={ui.appLoading} message={ui.loadingMessage} />

        <TopToolbar
          clickMode={ui.clickMode}
          projectName={project.meta.title}
          hasUnsavedChanges={project.hasUnsavedChanges}
          onSetMode={ui.setClickMode}
          onAddMarker={function () {
            ui.setClickMode('add-marker');
          }}
          onAddFolder={function () {
            treeOps.handleAddFolder(ui.activeFolderId);
          }}
          onStartMeasure={function () {
            ui.setClickMode(function (prev: any) {
              return prev === 'measure' ? 'select' : 'measure';
            });
          }}
          onNewProject={projectOps.handleNewProject}
          onOpenProject={projectOps.pickAndOpenProject}
          onSaveProject={projectOps.handleSaveProject}
          onSaveProjectAs={projectOps.handleSaveProjectAs}
          onExitProject={projectOps.handleExitProject}
          onImport={projectOps.handleImport}
          onExportSelected={function () {
            projectOps.handleExportSelected();
          }}
          onExportProjectKmz={projectOps.handleExportProjectKmz}
          onScreenshot={projectOps.handleScreenshot}
          onOpenSettings={function () {
            ui.setShowSettings(true);
          }}
          onOpenProjectDetails={handleOpenProjectDetails}
        />

        <div style={styles.main}>
          <Sidebar
            tree={project.tree}
            importedItems={project.importedItems}
            selectedIds={ui.selectedIds}
            lastClickedId={ui.lastClickedId}
            focusedId={ui.focusedId}
            focusedFolderId={ui.focusedFolderId}
            placesCount={placesCount}
            projectName={project.meta.title}
            width={settings.sidebarWidth || 320}
            dropTargetId={ui.dropTargetId}
            clipboardEmpty={!ui.clipboard}
            clipboardOperation={ui.clipboard ? ui.clipboard.operation : null}
            showBreadcrumbs={settings.showBreadcrumbs}
            design={settings.design}
            settings={settings}
            onWidthChange={handleSidebarWidthChange}
            onSearch={handleSidebarSearch}
            onSelectGeocodeResult={handleSelectGeocodeResult}
            viewerRef={viewerRef}
            onSelect={handleSidebarSelect}
            onToggleVisible={treeOps.handleToggleVisible}
            onSetVisibleCascade={treeOps.handleSetVisibleCascade}
            onToggleExpanded={treeOps.handleToggleExpanded}
            onSetExpandedDeep={treeOps.handleSetExpandedDeep}
            onRename={treeOps.handleRename}
            onDelete={treeOps.handleDelete}
            onDeleteMultiple={handleSidebarDeleteMultiple}
            onToggleVisibleMultiple={treeOps.handleToggleVisibleMultiple}
            onAddFolder={treeOps.handleAddFolder}
            onAddPlace={handleSidebarAddPlace}
            onFlyTo={handleFlyTo}
            onImport={projectOps.handleImport}
            onExport={projectOps.handleExportSelected}
            onExportMultiple={projectOps.handleExportMultiple}
            onCopy={treeOps.handleCopy}
            onCut={treeOps.handleCut}
            onPaste={treeOps.handlePaste}
            onDuplicate={treeOps.handleDuplicateMultiple}
            onMoveRequest={handleSidebarMoveRequest}
            onMoveItem={treeOps.handleMoveItemDragDrop}
            onMoveUpDown={treeOps.handleMoveUpDown}
            onSortChange={treeOps.handleSortChange}
            onTogglePin={treeOps.handleTogglePin}
            onShowInfo={handleSidebarShowInfo}
            onCopyCoords={handleCopyCoords}
            onOpenLogs={handleSidebarOpenLogs}
            onOpenProjectDetails={handleOpenProjectDetails}
            onNavigateToFolder={handleNavigateToFolder}
            logsCount={logger.logs.length}
            onMoveAllImported={handleSidebarMoveAllImported}
            onCollapseAll={treeOps.handleCollapseAll}
            onToggleSidebarOrder={handleToggleSidebarOrder}
            onEditItem={handleEditItem}
          />

          <div style={styles.globeContainer}>
            <GlobeViewer
              items={project.tree}
              importedItems={project.importedItems}
              previewOverrides={ui.previewOverrides}
              clickMode={ui.clickMode}
              settings={settings}
              colors={colors}
              measurePoints={measure.points}
              measureClosed={measure.closed}
              selectedId={selectedId}
              selectedItem={selectedItem}
              editingItemId={ui.panelItemId}
              selectedMeasureIndex={ui.selectedMeasureIndex}
              mapSource={effectiveMapSource}
              onMapSourceChange={handleMapSourceChange}
              onNeedCustomDialog={handleNeedCustomDialog}
              onDeleteCustom={handleDeleteCustom}
              onViewerReady={handleViewerReady}
              onMapClick={handleMapClick}
              onSelectPlace={handleSelectPlaceFromMap}
              onSelectMeasurePoint={function (index: number | null) {
                ui.setSelectedMeasureIndex(index);
              }}
              onStatusUpdate={handleStatusUpdate}
              onClearMeasure={function () {
                measure.clearAll();
                ui.setClickMode('select');
              }}
              onUndoMeasure={measure.removeLastPoint}
              onRemoveMeasurePoint={measure.removePoint}
              onToggleClosed={measure.toggleClosed}
              onSave={function () {
                measure.saveAsMeasureItem();
                ui.setClickMode('select');
              }}
              onSetRulerType={function (type) {
                updateSettings({
                  measure: { ...settings.measure, rulerType: type },
                });
              }}
              onMovePlace={handleMovePlace}
              onMoveMeasurePoint={measure.movePoint}
              onMoveSavedMeasurePoint={handleMoveSavedMeasurePoint}
              onDragEnd={handleDragEnd}
              onCopyMeasureCoords={handleCopyMeasureCoords}
              onEditItem={handleEditItem}
              onHideItem={handleHideItem}
              onCreateAction={handleCreateAction}
            />
          </div>

          {panelItem && (
            <PropertiesPanel
              item={panelItem}
              settings={settings}
              hasPreview={hasPreviewForPanel}
              onDelete={treeOps.handleDelete}
              onRequestDelete={handleRequestDelete}
              onFlyTo={handleFlyTo}
              onClose={function () {
                if (ui.panelItemId && ui.previewOverrides[ui.panelItemId]) {
                  handleCancelPreviewFor(ui.panelItemId);
                }
                ui.setPanelItemId(null);
              }}
              onDuplicate={function (id) {
                treeOps.handleDuplicateMultiple([id]);
              }}
              onToggleVisible={treeOps.handleToggleVisible}
              onTogglePin={treeOps.handleTogglePin}
              onCopyCoords={handleCopyCoords}
              onAddFolder={treeOps.handleAddFolder}
              onAddPlace={function (parentId) {
                const viewer = viewerRef.current;
                if (!viewer) return;
                const carto = viewer.camera.positionCartographic;
                const lat = Cesium.Math.toDegrees(carto.latitude);
                const lon = Cesium.Math.toDegrees(carto.longitude);
                const h = carto.height;
                const newId = treeOps.handleAddPlaceTo(parentId, lat, lon, h);
                if (!h || Math.abs(h) < 0.001) {
                  ensureHeightForPlace(newId, lat, lon, 0);
                }
              }}
              onPreview={handlePreview}
              onCancelPreviewFor={handleCancelPreviewFor}
              onSaveItem={function (id, updates) {
                treeOps.handleSaveItem(
                  id,
                  updates,
                  ui.previewOverrides,
                  ui.setPreviewOverrides
                );
              }}
            />
          )}
        </div>

        {settings.showStatusBar && (
          <StatusBar data={statusBarData} settings={settings} />
        )}

        <SaveNotification
          visible={
            project.hasUnsavedChanges &&
            !ui.saveNotificationHidden &&
            settings.showSaveNotifications
          }
          message={'В проекте есть несохранённые изменения.'}
          onSave={projectOps.handleSaveProject}
          onCancel={handleCancelChanges}
          onHide={function () {
            ui.setSaveNotificationHidden(true);
          }}
        />

        <LogsPanel
          visible={ui.showLogsPanel}
          logs={logger.logs}
          onClose={function () {
            ui.setShowLogsPanel(false);
          }}
          onClear={logger.clearLogs}
          onExport={logger.exportLogs}
        />

        {ui.showSettings && (
          <SettingsPanel
            settings={settings}
            theme={theme}
            colors={colors}
            show3DBuildings={ui.show3DBuildings}
            onChange={updateSettings}
            onThemeChange={setTheme}
            onColorsChange={setColors}
            onToggle3DBuildings={toggle3DBuildings}
            onNeedCustomDialog={handleNeedCustomDialog}
            onClose={function () {
              ui.setShowSettings(false);
            }}
          />
        )}

        {customDialogVisible && (
          <CustomMapSourceDialog
            visible={customDialogVisible}
            editSource={
              editingCustomSource &&
              editingCustomSource.id !== '__import_xml__'
                ? editingCustomSource
                : null
            }
            onSave={handleSaveCustomSource}
            onImportXml={handleImportCustomXml}
            onClose={function () {
              setCustomDialogVisible(false);
              setEditingCustomSource(null);
            }}
          />
        )}

        {ui.showProjectDetails && (
          <ProjectDetailsDialog
            meta={project.meta}
            projectPath={project.currentProjectPath}
            stats={projectStats}
            currentCamera={currentCamera}
            defaultMapSource={settings.mapSource}
            onSave={handleSaveProjectDetails}
            onChangePath={handleChangeProjectPath}
            onClose={function () {
              ui.setShowProjectDetails(false);
            }}
            onFlyToHome={handleFlyToHome}
          />
        )}

        {ui.pendingImport && (
          <ImportDialog
            fileName={ui.pendingImport.fileName}
            objectCount={ui.pendingImport.objectCount}
            sizeBytes={ui.pendingImport.sizeBytes}
            defaults={{
              visible: !settings.importDefaults.startHidden,
              startCollapsed: settings.importDefaults.startCollapsed,
              color: colors.markerDefault,
            }}
            onConfirm={projectOps.handleImportConfirm}
            onCancel={function () {
              ui.setPendingImport(null);
            }}
          />
        )}

        {ui.moveDialogIds && (
          <MoveDialog
            items={project.tree}
            movingIds={ui.moveDialogIds}
            onConfirm={handleMoveConfirm}
            onCancel={function () {
              ui.setMoveDialogIds(null);
            }}
          />
        )}

        {infoItem && (
          <InfoDialog
            item={infoItem}
            onClose={function () {
              ui.setInfoDialogId(null);
            }}
            onCopyCoords={handleCopyCoords}
          />
        )}

        {ui.buildingsLoading && (
          <div style={styles.buildingsLoader}>Загрузка 3D-зданий…</div>
        )}

        {ui.loading.visible && (
          <LoadingOverlay
            visible={true}
            message={ui.loading.message}
            subMessage={ui.loading.subMessage}
            progress={ui.loading.progress}
            kind={ui.loading.kind || 'spinner'}
            backdrop={ui.loading.kind === 'success' ? 0.25 : 0.45}
            autoCloseMs={ui.loading.kind === 'success' ? 1600 : undefined}
            onClose={
              ui.loading.kind === 'success'
                ? function () {
                    ui.setLoading(ui.DEFAULT_LOADING);
                  }
                : undefined
            }
          />
        )}

        <ConfirmDialog
          visible={ui.confirmDialog.visible}
          title={ui.confirmDialog.title}
          message={ui.confirmDialog.message}
          okLabel={ui.confirmDialog.okLabel}
          cancelLabel={ui.confirmDialog.cancelLabel}
          thirdLabel={ui.confirmDialog.thirdLabel}
          onThird={
            ui.confirmDialog.thirdLabel ? ui.confirmDialog.onThird : undefined
          }
          danger={ui.confirmDialog.danger}
          onConfirm={function () {
            const cb = ui.confirmDialog.onConfirm;
            if (cb) cb();
            else ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
          }}
          onCancel={function () {
            ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
          }}
        />

        {ui.toast && (
          <div style={styles.toast}>
            <div style={styles.toastLabel}>📋 {ui.toast.label}</div>
            <div style={styles.toastText}>{ui.toast.text}</div>
            <div style={styles.toastHint}>Скопировано в буфер</div>
          </div>
        )}
      </div>
    </>
  );
}

function collectGeoPoints(
  item: TreeItem
): Array<{ lat: number; lon: number; height?: number }> {
  const points: Array<{ lat: number; lon: number; height?: number }> = [];

  function walk(it: TreeItem) {
    if (isPlace(it)) {
      if (isFinite(it.lat) && isFinite(it.lon)) {
        points.push({ lat: it.lat, lon: it.lon, height: it.height || 0 });
      }
    } else if (isKmlLine(it)) {
      it.positions.forEach(function (p) {
        if (isFinite(p.lat) && isFinite(p.lon)) points.push(p);
      });
    } else if (isKmlPolygon(it)) {
      it.positions.forEach(function (p) {
        if (isFinite(p.lat) && isFinite(p.lon)) points.push(p);
      });
    } else if (isMeasure(it)) {
      it.positions.forEach(function (p) {
        if (isFinite(p.lat) && isFinite(p.lon)) points.push(p);
      });
    } else if (isContainer(it)) {
      it.children.forEach(walk);
    }
  }

  walk(item);
  return points;
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'var(--bg-app)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0,
    minWidth: 0,
    position: 'relative',
  },
  globeContainer: {
    flex: 1,
    position: 'relative',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  buildingsLoader: {
    position: 'fixed',
    bottom: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    padding: '8px 16px',
    borderRadius: 'var(--radius-small)',
    fontSize: 13,
    fontWeight: 600,
    boxShadow: 'var(--shadow-lg)',
    zIndex: 100,
  },
  toast: {
    position: 'fixed',
    bottom: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--bg-modal)',
    border: '1px solid var(--success)',
    borderRadius: 'var(--radius)',
    padding: '10px 18px',
    boxShadow: 'var(--shadow-lg)',
    color: 'var(--text-primary)',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: 12.5,
    zIndex: 900,
    pointerEvents: 'none',
    minWidth: 220,
  },
  toastLabel: {
    fontSize: 11,
    color: 'var(--success)',
    fontWeight: 700,
    marginBottom: 3,
  },
  toastText: {
    fontSize: 13,
    fontFamily: 'Consolas, monospace',
    color: 'var(--text-primary)',
    wordBreak: 'break-all',
  },
  toastHint: {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginTop: 4,
    fontStyle: 'italic',
  },
};

export default App;