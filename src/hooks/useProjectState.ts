// =====================================================
// src/hooks/useProjectState.ts
// Состояние проекта + автосохранение в localStorage
// =====================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { TreeItem, Folder } from '../types/base';
import { normalizeTree } from '../types/tree-utils';
import type {
  ProjectData,
  ProjectMeta,
  ProjectCamera,
} from '../types/project';
import { createDefaultProjectMeta } from '../types/project';
import {
  normalizeProjectMeta,
  buildProjectData,
} from '../services/project';

const STORAGE_KEY = 'poiskhelper_project_v2';
const IMPORTED_ITEMS_KEY = 'poiskhelper_imported_v1';
const LOCALSTORAGE_SAFE_LIMIT = 4 * 1024 * 1024;

// -----------------------------------------------------
// Начальное дерево проекта
// -----------------------------------------------------
function createInitialTree(): TreeItem[] {
  const rootFolder: Folder = {
    id: 'root-folder',
    name: 'Мои объекты',
    type: 'folder',
    visible: true,
    expanded: true,
    children: [],
    sortField: 'manual',
    sortOrder: 'asc',
  };
  return [rootFolder];
}

// -----------------------------------------------------
// Загрузка из localStorage
// -----------------------------------------------------
function loadTreeFromStorage(): TreeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: ProjectData = JSON.parse(raw);
      if (parsed.tree && parsed.tree.length > 0) {
        return normalizeTree(parsed.tree);
      }
    }
  } catch (e) {}
  return createInitialTree();
}

function loadImportedFromStorage(): TreeItem[] {
  try {
    const raw = localStorage.getItem(IMPORTED_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeTree(parsed);
    }
  } catch (e) {}
  return [];
}

function loadMetaFromStorage(): ProjectMeta {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: ProjectData = JSON.parse(raw);
      if (parsed.meta) return normalizeProjectMeta(parsed.meta);
      if (parsed.name) return createDefaultProjectMeta(parsed.name);
    }
  } catch (e) {}
  return createDefaultProjectMeta('Новый проект');
}

// -----------------------------------------------------
// Результат
// -----------------------------------------------------
export interface UseProjectStateResult {
  tree: TreeItem[];
  importedItems: TreeItem[];
  meta: ProjectMeta;
  currentProjectPath: string | null;

  setTree: React.Dispatch<React.SetStateAction<TreeItem[]>>;
  setImportedItems: React.Dispatch<React.SetStateAction<TreeItem[]>>;
  setMeta: React.Dispatch<React.SetStateAction<ProjectMeta>>;
  setCurrentProjectPath: (path: string | null) => void;

  hasUnsavedChanges: boolean;
  markDirty: () => void;
  clearDirty: () => void;

  /** ⚡ Предупреждение: автосохранение в localStorage отключено */
  autoSaveWarning: string | null;

  /** Заменить весь проект (при загрузке) */
  loadProject: (data: {
    tree: TreeItem[];
    importedItems?: TreeItem[];
    meta: ProjectMeta;
    path: string;
  }) => void;

  /** Полный сброс к пустому проекту */
  resetProject: () => void;

  /** Собрать ProjectData для сохранения */
  buildCurrentProject: (
    camera: ProjectCamera | null | undefined
  ) => ProjectData;
}

export function useProjectState(): UseProjectStateResult {
  const [tree, setTree] = useState<TreeItem[]>(loadTreeFromStorage);
  const [importedItems, setImportedItems] = useState<TreeItem[]>(
    loadImportedFromStorage
  );
  const [meta, setMeta] = useState<ProjectMeta>(loadMetaFromStorage);
  const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ⚡ Флаг переполнения localStorage
  const [autoSaveWarning, setAutoSaveWarning] = useState<string | null>(
    null
  );

  // Рефы, чтобы избежать лишних зависимостей в эффектах автосохранения
  const treeRef = useRef(tree);
  const metaRef = useRef(meta);
  useEffect(
    function () {
      treeRef.current = tree;
    },
    [tree]
  );
  useEffect(
    function () {
      metaRef.current = meta;
    },
    [meta]
  );

  // -----------------------------------------------------
  // Сохранение importedItems
  // -----------------------------------------------------
  useEffect(
    function () {
      try {
        if (importedItems.length === 0) {
          localStorage.removeItem(IMPORTED_ITEMS_KEY);
          return;
        }
        const json = JSON.stringify(importedItems);
        if (json.length > LOCALSTORAGE_SAFE_LIMIT) {
          console.warn('importedItems слишком большой для localStorage');
          return;
        }
        localStorage.setItem(IMPORTED_ITEMS_KEY, json);
      } catch (e) {}
    },
    [importedItems]
  );

  // -----------------------------------------------------
  // Автосохранение проекта (throttle 500мс)
  // ⚡ При переполнении — предупреждение в autoSaveWarning
  // -----------------------------------------------------
  useEffect(
    function () {
      const timeout = setTimeout(function () {
        try {
          const json = JSON.stringify({
            version: 2,
            name: metaRef.current.title,
            tree: treeRef.current,
            meta: metaRef.current,
            savedAt: new Date().toISOString(),
          } as ProjectData);

          if (json.length > LOCALSTORAGE_SAFE_LIMIT) {
            const sizeMb = (json.length / 1024 / 1024).toFixed(1);
            const limitMb = (
              LOCALSTORAGE_SAFE_LIMIT /
              1024 /
              1024
            ).toFixed(0);
            setAutoSaveWarning(
              'Проект больше ' +
                limitMb +
                ' МБ (' +
                sizeMb +
                ' МБ). Автосохранение в браузер отключено. Сохраните проект в файл (Ctrl+S).'
            );
            return;
          }

          localStorage.setItem(STORAGE_KEY, json);
          // Сбрасываем предупреждение, если снова влезли
          setAutoSaveWarning(function (prev) {
            return prev ? null : prev;
          });
        } catch (e: any) {
          const isQuota =
            e && (e.name === 'QuotaExceededError' || e.code === 22);
          if (isQuota) {
            setAutoSaveWarning(
              'Хранилище браузера переполнено. Автосохранение отключено. Сохраните проект в файл (Ctrl+S).'
            );
          }
        }
      }, 500);
      return function () {
        clearTimeout(timeout);
      };
    },
    [tree, meta]
  );

  // -----------------------------------------------------
  // Dirty-флаг
  // -----------------------------------------------------
  const markDirty = useCallback(function () {
    setHasUnsavedChanges(true);
  }, []);

  const clearDirty = useCallback(function () {
    setHasUnsavedChanges(false);
  }, []);

  // -----------------------------------------------------
  // Загрузка проекта из внешних данных
  // -----------------------------------------------------
  const loadProject = useCallback(function (data: {
    tree: TreeItem[];
    importedItems?: TreeItem[];
    meta: ProjectMeta;
    path: string;
  }) {
    setTree(normalizeTree(data.tree || createInitialTree()));
    setImportedItems(
      data.importedItems ? normalizeTree(data.importedItems) : []
    );
    setMeta(data.meta);
    setCurrentProjectPath(data.path);
    setHasUnsavedChanges(false);
    setAutoSaveWarning(null);
  }, []);

  // -----------------------------------------------------
  // Полный сброс (новый проект / закрытие)
  // -----------------------------------------------------
  const resetProject = useCallback(function () {
    setTree(createInitialTree());
    setImportedItems([]);
    setMeta(createDefaultProjectMeta('Новый проект'));
    setCurrentProjectPath(null);
    setHasUnsavedChanges(false);
    setAutoSaveWarning(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(IMPORTED_ITEMS_KEY);
    } catch (e) {}
  }, []);

  // -----------------------------------------------------
  // Сборка текущего ProjectData для сохранения
  // -----------------------------------------------------
  const buildCurrentProject = useCallback(
    function (camera: ProjectCamera | null | undefined): ProjectData {
      return buildProjectData(
        metaRef.current,
        treeRef.current,
        importedItems,
        camera || null
      );
    },
    [importedItems]
  );

  return useMemo(
    function () {
      return {
        tree,
        importedItems,
        meta,
        currentProjectPath,
        setTree,
        setImportedItems,
        setMeta,
        setCurrentProjectPath,
        hasUnsavedChanges,
        markDirty,
        clearDirty,
        autoSaveWarning,
        loadProject,
        resetProject,
        buildCurrentProject,
      };
    },
    [
      tree,
      importedItems,
      meta,
      currentProjectPath,
      hasUnsavedChanges,
      markDirty,
      clearDirty,
      autoSaveWarning,
      loadProject,
      resetProject,
      buildCurrentProject,
    ]
  );
}