// =====================================================
// src/hooks/useProjectOps.ts
// Операции с проектами и файлами — с импортом через importDefaults
// =====================================================

import { useCallback, useRef } from 'react';
import * as CesiumNS from 'cesium';
import type { TreeItem, Place } from '../types/base';
import { isContainer } from '../types/base';
import type { ImportOptions } from '../components/import-dialog';
import type { ProjectCamera } from '../types/project';
import type { AppSettings } from '../types/settings';
import { addItemToFolder } from '../types/tree-utils';
import type { UseProjectStateResult } from './useProjectState';
import type { UseUIStateResult } from './useUIState';
import type { UseLoggerResult } from './useLogger';
import {
  pickProjectFile,
  pickProjectSavePath,
  readProjectFile,
  writeProjectFile,
  addRecentProject,
  removeRecentProject,
  buildProjectData,
} from '../services/project';
import {
  openKmlFile,
  saveKmlOrKmz,
  saveScreenshot,
} from '../services/file';
import {
  readKmlDocument,
  parseKmlDocumentToTree,
  countTreeItems,
  countTreeItemsByType,
  buildKmlFolder,
  exportTreeToKmz,
  exportTreeToKml,
} from '../services/kml';
import { applyTerrainHeightsToTree } from '../utils/terrain';

interface UseProjectOpsParams {
  project: UseProjectStateResult;
  ui: UseUIStateResult;
  logger: UseLoggerResult;
  settings: AppSettings;
  colors: { markerDefault: string; lineColor: string; selectionColor: string };
  viewerRef: React.MutableRefObject<CesiumNS.Viewer | null>;
  setRecentProjects: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useProjectOps(params: UseProjectOpsParams) {
  const {
    project,
    ui,
    logger,
    settings,
    colors,
    viewerRef,
    setRecentProjects,
  } = params;

  const projectRef = useRef(project);
  projectRef.current = project;
  const uiRef = useRef(ui);
  uiRef.current = ui;

  // =====================================================
  // Камера
  // =====================================================
  const buildCurrentCamera = useCallback(
    function (): ProjectCamera | undefined {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return undefined;
      return {
        lon: CesiumNS.Math.toDegrees(
          viewer.camera.positionCartographic.longitude
        ),
        lat: CesiumNS.Math.toDegrees(
          viewer.camera.positionCartographic.latitude
        ),
        height: viewer.camera.positionCartographic.height,
        heading: viewer.camera.heading,
        pitch: viewer.camera.pitch,
        roll: viewer.camera.roll,
      };
    },
    [viewerRef]
  );

  // =====================================================
  // Сброс
  // =====================================================
  const performResetProject = useCallback(
    function () {
      project.resetProject();
      ui.clearSelection();
      ui.setFocusedId(null);
      ui.setFocusedFolderId(null);
      ui.setActiveFolderId('root-folder');
      ui.setMeasurePoints([]);
      ui.setMeasureClosed(false);
      ui.setSelectedMeasureIndex(null);
      ui.setClipboard(null);
      ui.setPreviewOverrides({});
      ui.setClickMode('select');
      ui.setPanelItemId(null);
      ui.closeAllDialogs();
      ui.setShowWelcome(true);
      try {
        const viewer = viewerRef.current;
        if (viewer && !viewer.isDestroyed()) {
          viewer.camera.flyTo({
            destination: CesiumNS.Cartesian3.fromDegrees(0, 20, 20000000),
            duration: 1.5,
          });
        }
      } catch (e) {}
    },
    [project, ui, viewerRef]
  );

  // =====================================================
  // Новый проект
  // =====================================================
  const handleNewProject = useCallback(
    function () {
      const createNew = function () {
        performResetProject();
        logger.addLog('new', 'Создан новый проект');
        ui.setShowWelcome(false);
        setTimeout(function () {
          ui.setShowProjectDetails(true);
        }, 300);
      };
      if (project.hasUnsavedChanges) {
        ui.setConfirmDialog({
          visible: true,
          title: 'Новый проект',
          message:
            'Создать новый проект?\n\nНесохранённые изменения будут потеряны.',
          okLabel: 'Создать',
          cancelLabel: 'Отмена',
          danger: true,
          onConfirm: function () {
            ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
            createNew();
          },
        });
      } else {
        createNew();
      }
    },
    [project.hasUnsavedChanges, ui, logger, performResetProject]
  );

  // =====================================================
  // Открытие проекта
  // =====================================================
  const handleOpenRecent = useCallback(
    async function (path: string) {
      ui.setWelcomeBusy(true);
      ui.setWelcomeBusyMessage('Загрузка проекта...');
      try {
        const opened = await readProjectFile(path);
        const data = opened.data;
        const meta = opened.meta;

        project.loadProject({
          tree: data.tree || [],
          importedItems: data.importedItems,
          meta: meta,
          path: path,
        });

        ui.setSelectedIds([]);
        ui.setLastClickedId(null);
        ui.setFocusedId(null);
        ui.setFocusedFolderId(null);
        ui.setSelectedMeasureIndex(null);
        ui.setClipboard(null);
        ui.setPreviewOverrides({});
        ui.setPanelItemId(null);
        ui.closeAllDialogs();

        const list = addRecentProject(
          path,
          meta.title || opened.name,
          opened.sizeBytes
        );
        setRecentProjects(list);

        logger.addLog('load', 'Проект загружен: ' + opened.name);
        ui.setShowWelcome(false);

        const cam = data.camera;
        const viewer = viewerRef.current;
        if (cam && viewer && !viewer.isDestroyed()) {
          try {
            viewer.camera.flyTo({
              destination: CesiumNS.Cartesian3.fromDegrees(
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
        }

        if (viewer && !viewer.isDestroyed()) {
          setTimeout(async function () {
            try {
              ui.setLoading({
                visible: true,
                message: 'Проверка высот рельефа',
                kind: 'spinner',
              });

              const treeResult = await applyTerrainHeightsToTree(
                viewer.terrainProvider,
                data.tree || []
              );
              const importedResult = data.importedItems
                ? await applyTerrainHeightsToTree(
                    viewer.terrainProvider,
                    data.importedItems
                  )
                : { tree: [], updatedCount: 0 };

              const totalUpdated =
                treeResult.updatedCount + importedResult.updatedCount;

              if (totalUpdated > 0) {
                project.setTree(treeResult.tree);
                if (data.importedItems) {
                  project.setImportedItems(importedResult.tree);
                }
                logger.addLog(
                  'load',
                  'Уточнены высоты: ' + totalUpdated + ' точек'
                );
              }
            } catch (e) {
              console.warn('handleOpenRecent: ошибка высот', e);
            } finally {
              ui.setLoading(ui.DEFAULT_LOADING);
            }
          }, 100);
        }
      } catch (err) {
        console.error('handleOpenRecent:', err);
        alert('Ошибка открытия:\n' + (err as Error).message);
        const list = removeRecentProject(path);
        setRecentProjects(list);
      } finally {
        ui.setWelcomeBusy(false);
      }
    },
    [project, ui, logger, viewerRef, setRecentProjects]
  );

  const pickAndOpenProject = useCallback(
    async function () {
      ui.setWelcomeBusy(true);
      ui.setWelcomeBusyMessage('Открытие файла...');
      try {
        const path = await pickProjectFile();
        if (!path) {
          ui.setWelcomeBusy(false);
          return;
        }
        await handleOpenRecent(path);
      } catch (err) {
        console.error('pickAndOpenProject:', err);
        alert('Ошибка: ' + (err as Error).message);
        ui.setWelcomeBusy(false);
      }
    },
    [handleOpenRecent, ui]
  );

  // =====================================================
  // Сохранение
  // =====================================================
  const handleSaveProject = useCallback(
    async function () {
      ui.setLoading({
        visible: true,
        message: 'Сохранение проекта',
        kind: 'spinner',
      });
      try {
        const camera = buildCurrentCamera();
        const projectData = buildProjectData(
          project.meta,
          project.tree,
          project.importedItems,
          camera || null
        );
        let path = project.currentProjectPath;
        if (!path) {
          path = await pickProjectSavePath(
            project.meta.fileBaseName || project.meta.title
          );
          if (!path) {
            ui.setLoading(ui.DEFAULT_LOADING);
            return;
          }
        }
        const size = await writeProjectFile(path, projectData);
        project.setCurrentProjectPath(path);

        const fileName = path.split(/[\\/]/).pop() || 'project';
        const cleanedName = fileName.replace(/\.(poiskhelper|json)$/, '');
        project.setMeta(function (prev) {
          return {
            ...prev,
            fileBaseName: cleanedName,
            updatedAt: new Date().toISOString(),
          };
        });

        const list = addRecentProject(
          path,
          project.meta.title || cleanedName,
          size
        );
        setRecentProjects(list);

        logger.addLog('save', 'Проект сохранён: ' + fileName);
        project.clearDirty();
      } catch (err) {
        console.error('handleSaveProject:', err);
        alert('Ошибка сохранения: ' + (err as Error).message);
      } finally {
        ui.setLoading(ui.DEFAULT_LOADING);
      }
    },
    [project, ui, logger, buildCurrentCamera, setRecentProjects]
  );

  const handleSaveProjectAs = useCallback(
    async function () {
      ui.setLoading({
        visible: true,
        message: 'Сохранение проекта',
        kind: 'spinner',
      });
      try {
        const camera = buildCurrentCamera();
        const projectData = buildProjectData(
          project.meta,
          project.tree,
          project.importedItems,
          camera || null
        );
        const path = await pickProjectSavePath(
          project.meta.fileBaseName || project.meta.title
        );
        if (!path) {
          ui.setLoading(ui.DEFAULT_LOADING);
          return;
        }
        const size = await writeProjectFile(path, projectData);
        project.setCurrentProjectPath(path);

        const fileName = path.split(/[\\/]/).pop() || 'project';
        const cleanedName = fileName.replace(/\.(poiskhelper|json)$/, '');
        project.setMeta(function (prev) {
          return {
            ...prev,
            fileBaseName: cleanedName,
            updatedAt: new Date().toISOString(),
          };
        });

        const list = addRecentProject(
          path,
          project.meta.title || cleanedName,
          size
        );
        setRecentProjects(list);

        logger.addLog('save', 'Проект сохранён как: ' + fileName);
        project.clearDirty();
      } catch (err) {
        alert('Ошибка сохранения: ' + (err as Error).message);
      } finally {
        ui.setLoading(ui.DEFAULT_LOADING);
      }
    },
    [project, ui, logger, buildCurrentCamera, setRecentProjects]
  );

  // =====================================================
  // Выход
  // =====================================================
  const handleExitProject = useCallback(
    function () {
      if (project.hasUnsavedChanges) {
        ui.setConfirmDialog({
          visible: true,
          title: 'Закрыть проект',
          message:
            'В проекте есть несохранённые изменения.\n\nСохранить перед закрытием?',
          okLabel: 'Сохранить и закрыть',
          cancelLabel: 'Отмена',
          thirdLabel: 'Закрыть без сохранения',
          danger: false,
          onThird: function () {
            ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
            performResetProject();
            logger.addLog('new', 'Проект закрыт (без сохранения)');
          },
          onConfirm: async function () {
            ui.setConfirmDialog(ui.DEFAULT_CONFIRM);
            try {
              await handleSaveProject();
            } catch (e) {
              console.error('handleExitProject: ошибка сохранения', e);
              return;
            }
            performResetProject();
          },
        });
      } else {
        performResetProject();
        logger.addLog('new', 'Проект закрыт');
      }
    },
    [
      project.hasUnsavedChanges,
      ui,
      logger,
      performResetProject,
      handleSaveProject,
    ]
  );

  // =====================================================
  // ⚡ Импорт KML/KMZ — использует settings.importDefaults
  // =====================================================
  const handleImport = useCallback(async function () {
    console.log('[import] клик по кнопке импорта');
    logger.addLog('import', 'Импорт KML/KMZ — старт');

    const viewer = viewerRef.current;
    if (!viewer) {
      const msg = 'Глобус не загружен — импорт невозможен.';
      console.error('[import]', msg);
      logger.addLog('import', msg);
      alert(msg);
      return;
    }

    try {
      console.log('[import] открываю диалог + чтение с прогрессом…');

      ui.setLoading({
        visible: true,
        message: 'Выбор файла',
        subMessage: 'Открывается диалог…',
        kind: 'spinner',
      });

      const result = await openKmlFile({
        onProgress: function (p) {
          const loadedMb = (p.loadedBytes / 1024 / 1024).toFixed(1);
          const elapsedSec = (p.elapsedMs / 1000).toFixed(1);

          let sub: string;
          if (p.loadedBytes === 0) {
            sub = 'Открытие файла…';
          } else if (p.stalled) {
            sub =
              'Прочитано ' +
              loadedMb +
              ' МБ за ' +
              elapsedSec +
              ' с — возможно, чтение зависло, ждите…';
          } else {
            sub =
              'Прочитано ' +
              loadedMb +
              ' МБ за ' +
              elapsedSec +
              ' с' +
              (p.chunkCount > 0
                ? ' (' + p.chunkCount + ' чанков)'
                : '');
          }

          const soft = 256 * 1024 * 1024;
          const progress =
            p.loadedBytes > 0
              ? Math.min(0.95, p.loadedBytes / soft)
              : undefined;

          ui.setLoading({
            visible: true,
            message: 'Чтение файла',
            subMessage: sub,
            progress: progress,
            kind: 'progress',
          });
        },
      });

      console.log(
        '[import] результат диалога:',
        result
          ? 'OK: ' +
              result.name +
              ' (' +
              (result.sizeBytes / 1024 / 1024).toFixed(2) +
              ' МБ)'
          : 'null'
      );

      ui.setLoading(ui.DEFAULT_LOADING);

      if (!result) {
        logger.addLog(
          'import',
          'Диалог закрыт без выбора файла (или отменено пользователем)'
        );
        return;
      }

      const fileName = result.name;
      const ext = result.extension;
      const rawBytes = result.data as Uint8Array;

      logger.addLog(
        'import',
        'Файл выбран: ' + fileName,
        (rawBytes.length / 1024 / 1024).toFixed(1) + ' МБ'
      );

      if (ext === 'kml' || ext === 'kmz') {
        ui.setLoading({
          visible: true,
          message: 'Разбор документа',
          subMessage: fileName + ' (' + ext.toUpperCase() + ')',
          kind: 'spinner',
        });

        console.log('[import] читаю документ', ext);
        const parsed = await readKmlDocument(rawBytes, ext);
        console.log('[import] документ прочитан OK');

        ui.setLoading({
          visible: true,
          message: 'Разбор объектов',
          subMessage: fileName,
          kind: 'spinner',
        });

        // ⚡ previewOpts — только для подсчёта, без применения
        const previewOpts: ImportOptions = {
          color: colors.markerDefault,
          pixelSize: 6,
          visible: true,
          flyToBounds: true,
          showLabels: true,
          showHidden: true,
          startCollapsed: settings.importDefaults.startCollapsed,
        };

        console.log('[import] парсинг объектов…');
        const previewChildren = parseKmlDocumentToTree(
          parsed.kmlDocument,
          previewOpts,
          fileName
        );
        const byType = countTreeItemsByType(previewChildren);
        const totalCount = byType.total;

        console.log(
          '[import] разобрано: total=' +
            totalCount +
            ' (place=' +
            byType.places +
            ', line=' +
            byType.lines +
            ', poly=' +
            byType.polygons +
            ', folders=' +
            byType.folders +
            ')'
        );
        logger.addLog(
          'import',
          'Разобрано: ' + totalCount + ' объектов',
          'place=' +
            byType.places +
            ', line=' +
            byType.lines +
            ', poly=' +
            byType.polygons
        );

        ui.setLoading(ui.DEFAULT_LOADING);

        if (totalCount === 0) {
          const msg =
            'В файле не найдено объектов:\n' +
            fileName +
            '\n\nВозможные причины:\n' +
            '• В KML нет Placemark/Point/LineString/Polygon\n' +
            '• Неподдерживаемая структура (MultiGeometry без геометрий)\n' +
            '• Пустой файл';
          logger.addLog('import', 'Объектов не найдено');
          alert(msg);
          return;
        }

        ui.setPendingImport({
          fileName,
          objectCount: totalCount,
          document: parsed.kmlDocument,
          sizeBytes: result.sizeBytes,
        });
        logger.addLog(
          'import',
          'Ожидание подтверждения: ' + fileName
        );
        return;
      }

      const msg = 'Неподдерживаемый формат: .' + ext;
      logger.addLog('import', msg);
      alert(msg);
    } catch (err: any) {
      console.error('[import] ошибка:', err);
      const msg = err?.message || 'причина неизвестна';
      logger.addLog('import', 'Ошибка импорта: ' + msg);
      ui.setLoading(ui.DEFAULT_LOADING);
      alert(
        'Ошибка импорта:\n' +
          msg +
          '\n\nПроверьте консоль (F12) для подробностей.'
      );
    }
  }, [ui, colors.markerDefault, viewerRef, logger, settings.importDefaults]);

  // =====================================================
  // Подтверждение импорта
  // =====================================================
  const handleImportConfirm = useCallback(
    async function (options: ImportOptions) {
      const pending = ui.pendingImport;
      if (!pending) {
        console.warn('[import] handleImportConfirm: нет pendingImport');
        return;
      }
      const viewer = viewerRef.current;
      console.log('[import] подтверждение, файл:', pending.fileName);

      ui.setLoading({
        visible: true,
        message: 'Разбор объектов',
        subMessage: pending.fileName,
        kind: 'spinner',
      });

      try {
        const parsedChildren = parseKmlDocumentToTree(
          pending.document,
          options,
          pending.fileName
        );
        console.log(
          '[import] парсинг в confirm: получено',
          parsedChildren.length,
          'корневых'
        );

        if (parsedChildren.length === 0) {
          alert('Объектов нет.');
          ui.setPendingImport(null);
          ui.setLoading(ui.DEFAULT_LOADING);
          return;
        }

        let fixedChildren = parsedChildren;

        if (viewer && !viewer.isDestroyed() && viewer.terrainProvider) {
          const totalPoints = countTreeItems(parsedChildren);
          if (totalPoints > 2000) {
            console.log(
              '[import] точек больше 2000 (' +
                totalPoints +
                ') — пропускаю уточнение высот для скорости'
            );
            logger.addLog(
              'import',
              'Пропущено уточнение высот (большой файл, ' +
                totalPoints +
                ' объектов)'
            );
          } else {
            try {
              ui.setLoading({
                visible: true,
                message: 'Уточнение высот рельефа',
                subMessage: 'Обработка точек…',
                kind: 'progress',
              });

              const result = await applyTerrainHeightsToTree(
                viewer.terrainProvider,
                parsedChildren
              );
              fixedChildren = result.tree;
              console.log('[import] высоты обновлены:', result.updatedCount);

              if (result.updatedCount > 0) {
                logger.addLog(
                  'import',
                  'Высоты уточнены: ' + result.updatedCount + ' точек'
                );
              }
            } catch (e) {
              console.warn('[import] ошибка высот:', e);
              fixedChildren = parsedChildren;
            }
          }
        }

        // ⚡ expanded — с учётом startCollapsed
        const kmlExpanded = options.startCollapsed ? false : true;

        const kmlFolder = buildKmlFolder(
          pending.fileName,
          fixedChildren,
          options.visible,
          kmlExpanded
        );

        project.setImportedItems(function (prev) {
          return prev.concat([kmlFolder]);
        });
        ui.setSelectedIds([kmlFolder.id]);
        ui.setLastClickedId(kmlFolder.id);

        const byType = countTreeItemsByType(fixedChildren);
        logger.addLog(
          'import',
          'Импортирован: ' + pending.fileName,
          'Объектов: ' +
            byType.total +
            ' (place=' +
            byType.places +
            ', line=' +
            byType.lines +
            ', poly=' +
            byType.polygons +
            ')' +
            (options.visible === false ? ' [скрыто]' : '')
        );
        project.markDirty();

        if (options.flyToBounds && viewer && !viewer.isDestroyed()) {
          let minLat = 90,
            maxLat = -90,
            minLon = 180,
            maxLon = -180;
          let ok = false;

          function considerPoint(lat: number, lon: number) {
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            ok = true;
          }

          function walk(list: TreeItem[]) {
            list.forEach(function (c) {
              if (c.type === 'place') {
                const p = c as Place;
                considerPoint(p.lat, p.lon);
              } else if (
                c.type === 'kmlline' ||
                c.type === 'kmlpolygon'
              ) {
                const positions = (c as any).positions;
                if (positions) {
                  positions.forEach(function (pt: any) {
                    considerPoint(pt.lat, pt.lon);
                  });
                }
              }
              if (isContainer(c)) walk((c as any).children);
            });
          }
          walk(fixedChildren);

          if (ok) {
            const centerLat = (minLat + maxLat) / 2;
            const centerLon = (minLon + maxLon) / 2;
            const maxDelta = Math.max(
              maxLat - minLat,
              maxLon - minLon,
              0.01
            );
            const height = maxDelta * 111000 * 2;
            try {
              viewer.camera.flyTo({
                destination: CesiumNS.Cartesian3.fromDegrees(
                  centerLon,
                  centerLat,
                  height
                ),
                duration: 2,
              });
            } catch (e) {}
          }
        }

        ui.setPendingImport(null);
        ui.setClickMode('select');
      } catch (err) {
        console.error('[import] ошибка в confirm:', err);
        const msg = (err as Error).message || 'причина неизвестна';
        logger.addLog('import', 'Ошибка: ' + msg);
        alert('Ошибка обработки:\n' + msg);
      } finally {
        ui.setLoading(ui.DEFAULT_LOADING);
      }
    },
    [ui, project, logger, viewerRef]
  );

  // =====================================================
  // Экспорт
  // =====================================================
  const handleExportProjectKmz = useCallback(
    async function () {
      ui.setLoading({
        visible: true,
        message: 'Экспорт проекта в KMZ',
        kind: 'spinner',
      });
      try {
        const allItems = project.tree.concat(project.importedItems);
        if (allItems.length === 0) {
          alert('Нет объектов.');
          ui.setLoading(ui.DEFAULT_LOADING);
          return;
        }
        const baseName =
          project.meta.fileBaseName || project.meta.title || 'project';
        const kmzBytes = await exportTreeToKmz(allItems, project.meta.title);
        const kmlText = exportTreeToKml(allItems, project.meta.title);
        const path = await saveKmlOrKmz(kmzBytes, kmlText, baseName);
        if (path) {
          logger.addLog('export', 'Проект: ' + baseName);
          alert('Экспортировано: ' + path);
        }
      } catch (err) {
        alert('Ошибка: ' + (err as Error).message);
      } finally {
        ui.setLoading(ui.DEFAULT_LOADING);
      }
    },
    [project, ui, logger]
  );

  const handleExportSelected = useCallback(
    async function (id?: string, _format?: 'kml' | 'kmz') {
      const targetId =
        id || ui.selectedIds[ui.selectedIds.length - 1] || null;
      if (!targetId) {
        alert('Выберите объект.');
        return;
      }
      const item =
        findItemById(project.tree, targetId) ||
        findItemById(project.importedItems, targetId);
      if (!item) {
        alert('Объект не найден.');
        return;
      }
      ui.setLoading({
        visible: true,
        message: 'Экспорт: ' + item.name,
        kind: 'spinner',
      });
      try {
        const safeName = item.name
          .replace(/[^a-zA-Zа-яА-Я0-9_\-]/g, '_')
          .slice(0, 50);
        const kmzBytes = await exportTreeToKmz([item], item.name);
        const kmlText = exportTreeToKml([item], item.name);
        const path = await saveKmlOrKmz(kmzBytes, kmlText, safeName);
        if (path) {
          logger.addLog('export', 'Экспортировано: ' + item.name);
          alert('Экспортировано: ' + path);
        }
      } catch (err) {
        alert('Ошибка: ' + (err as Error).message);
      } finally {
        ui.setLoading(ui.DEFAULT_LOADING);
      }
    },
    [project.tree, project.importedItems, ui, logger]
  );

  const handleExportMultiple = useCallback(
    async function (ids: string[], _format: 'kml' | 'kmz') {
      if (ids.length === 0) return;
      const items: TreeItem[] = [];
      ids.forEach(function (id) {
        const it =
          findItemById(project.tree, id) ||
          findItemById(project.importedItems, id);
        if (it) items.push(it);
      });
      if (items.length === 0) return;
      try {
        const name = window.prompt(
          'Название для экспорта ' + items.length + ' объектов:',
          'Экспорт ' + items.length + ' объектов'
        );
        if (!name) return;
        ui.setLoading({
          visible: true,
          message: 'Экспорт ' + items.length + ' объектов',
          kind: 'spinner',
        });
        const safeName = name
          .replace(/[^a-zA-Zа-яА-Я0-9_\- ]/g, '_')
          .slice(0, 60);
        const kmzBytes = await exportTreeToKmz(items, name);
        const kmlText = exportTreeToKml(items, name);
        const path = await saveKmlOrKmz(kmzBytes, kmlText, safeName);
        if (path) {
          logger.addLog('export', 'Экспортировано: ' + items.length);
          alert('Экспортировано: ' + path);
        }
      } catch (err) {
        alert('Ошибка: ' + (err as Error).message);
      } finally {
        ui.setLoading(ui.DEFAULT_LOADING);
      }
    },
    [project.tree, project.importedItems, ui, logger]
  );

  // =====================================================
  // Скриншот
  // =====================================================
  const handleScreenshot = useCallback(
    async function () {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) {
        alert('Глобус не загружен.');
        return;
      }
      ui.setLoading({
        visible: true,
        message: 'Создание скриншота',
        kind: 'spinner',
      });
      try {
        const includeOverlays = settings.screenshot.includeOverlays;
        const overlayEls = includeOverlays
          ? []
          : document.querySelectorAll('[data-globe-overlay="true"]');
        const prevDisplays: string[] = [];
        overlayEls.forEach(function (el, idx) {
          const htmlEl = el as HTMLElement;
          prevDisplays[idx] = htmlEl.style.visibility;
          htmlEl.style.visibility = 'hidden';
        });

        let dataUrl = '';
        try {
          viewer.render();
          const canvas = viewer.scene.canvas;
          const scale = settings.screenshot.scale || 1;
          if (scale === 1) {
            dataUrl = canvas.toDataURL(
              settings.screenshot.format === 'jpg'
                ? 'image/jpeg'
                : 'image/png',
              settings.screenshot.quality
            );
          } else {
            const off = document.createElement('canvas');
            off.width = Math.max(1, Math.round(canvas.width * scale));
            off.height = Math.max(1, Math.round(canvas.height * scale));
            const ctx = off.getContext('2d');
            if (ctx) {
              ctx.drawImage(canvas, 0, 0, off.width, off.height);
              dataUrl = off.toDataURL(
                settings.screenshot.format === 'jpg'
                  ? 'image/jpeg'
                  : 'image/png',
                settings.screenshot.quality
              );
            } else {
              dataUrl = canvas.toDataURL('image/png');
            }
          }
        } finally {
          overlayEls.forEach(function (el, idx) {
            const htmlEl = el as HTMLElement;
            htmlEl.style.visibility = prevDisplays[idx] || '';
          });
        }

        const savedPath = await saveScreenshot(dataUrl, {
          autoSaveDir: settings.screenshot.autoSaveDir,
          prefixName: settings.screenshot.prefix || 'poiskhelper',
          format: settings.screenshot.format,
        });

        if (!savedPath) {
          ui.setLoading(ui.DEFAULT_LOADING);
          return;
        }

        logger.addLog('export', 'Скриншот: ' + savedPath);

        if (settings.screenshot.copyPathToClipboard) {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(savedPath).catch(function () {});
          }
        }

        if (settings.screenshot.showNotification) {
          ui.setLoading({
            visible: true,
            message: 'Скриншот сохранён',
            subMessage: savedPath,
            kind: 'success',
          });
          setTimeout(function () {
            ui.setLoading(ui.DEFAULT_LOADING);
          }, 1600);
        } else {
          ui.setLoading(ui.DEFAULT_LOADING);
        }
      } catch (err) {
        console.error('handleScreenshot:', err);
        alert('Ошибка скриншота: ' + (err as Error).message);
        ui.setLoading(ui.DEFAULT_LOADING);
      }
    },
    [ui, settings.screenshot, logger, viewerRef]
  );

  return {
    buildCurrentCamera,
    handleNewProject,
    handleOpenRecent,
    pickAndOpenProject,
    handleSaveProject,
    handleSaveProjectAs,
    handleExitProject,
    handleImport,
    handleImportConfirm,
    handleExportProjectKmz,
    handleExportSelected,
    handleExportMultiple,
    handleScreenshot,
    performResetProject,
  };
}

function findItemById(items: TreeItem[], id: string): TreeItem | null {
  if (!Array.isArray(items) || typeof id !== 'string') return null;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    if (it.id === id) return it;
    if (isContainer(it)) {
      const found = findItemById((it as any).children, id);
      if (found) return found;
    }
  }
  return null;
}