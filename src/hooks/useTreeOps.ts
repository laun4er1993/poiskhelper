// =====================================================
// src/hooks/useTreeOps.ts
// Операции над деревом объектов
// =====================================================

import { useCallback, useMemo } from 'react';
import type { TreeItem, Folder, Place } from '../types/base';
import { isPlace, isContainer } from '../types/base';
import {
  updateItemInTree,
  removeItemFromTree,
  removeManyFromTree,
  addItemToFolder,
  setVisibleDeepAndOpenAncestors,
  setVisibleUpward,
  setExpandedDeepInTree,
  collapseAllInTree,
  moveWithinParent,
  expandAncestorsInTree,
  findItem,
  collectDescendantIds,
  collectPlaces,
} from '../types/tree-utils';
import { generateId } from '../types/ids';
import type { ClipboardData, LogType } from '../types/logs';
import type { SortField, SortOrder } from '../types/base';

// -----------------------------------------------------
// Параметры
// -----------------------------------------------------
export interface TreeOpsParams {
  tree: TreeItem[];
  importedItems: TreeItem[];
  setTree: React.Dispatch<React.SetStateAction<TreeItem[]>>;
  setImportedItems: React.Dispatch<React.SetStateAction<TreeItem[]>>;

  activeFolderId: string;
  focusedFolderId: string | null;

  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setLastClickedId: React.Dispatch<React.SetStateAction<string | null>>;
  setPanelItemId: React.Dispatch<React.SetStateAction<string | null>>;

  clipboard: ClipboardData | null;
  setClipboard: React.Dispatch<React.SetStateAction<ClipboardData | null>>;

  addLog: (type: LogType, message: string, details?: string) => void;
  markDirty: () => void;
}

export interface UseTreeOpsResult {
  handleToggleExpanded: (id: string) => void;
  handleSetExpandedDeep: (id: string, value: boolean) => void;
  handleCollapseAll: () => void;

  handleToggleVisible: (id: string) => void;
  handleSetVisibleCascade: (id: string, value: boolean) => void;
  handleToggleVisibleMultiple: (ids: string[], visible: boolean) => void;

  handleMoveUpDown: (id: string, direction: 'up' | 'down') => void;
  handleRename: (id: string, newName: string) => void;
  handleSortChange: (
    folderId: string,
    field: SortField,
    order: SortOrder
  ) => void;
  handleTogglePin: (id: string) => void;

  handleDelete: (id: string) => void;
  handleDeleteMultiple: (ids: string[]) => void;

  handleAddFolder: (parentId: string) => string;
  handleAddPlaceTo: (
    parentId: string,
    lat: number,
    lon: number,
    height: number
  ) => string;

  handleCopy: (ids: string[]) => void;
  handleCut: (ids: string[]) => void;
  handlePaste: (targetFolderId: string) => void;
  handleDuplicateMultiple: (ids: string[]) => void;
  handleMoveConfirm: (targetFolderId: string, ids: string[]) => void;
  handleMoveItemDragDrop: (
    draggedId: string,
    targetFolderId: string
  ) => void;

  handleSaveItem: (
    id: string,
    updates: Partial<any>,
    previewOverrides: Record<string, Partial<any>>,
    setPreviewOverrides: React.Dispatch<
      React.SetStateAction<Record<string, Partial<any>>>
    >
  ) => void;
  handleUpdatePlace: (id: string, updates: Partial<Place>) => void;

  handleExpandAncestors: (id: string) => void;
}

// -----------------------------------------------------
// Клонирование
// -----------------------------------------------------
function cloneItem(item: TreeItem): TreeItem {
  const newId = generateId();
  const now = new Date().toISOString();
  if (item.type === 'place') return { ...item, id: newId, createdAt: now };
  if (item.type === 'kmlline') return { ...item, id: newId, createdAt: now };
  if (item.type === 'kmlpolygon')
    return { ...item, id: newId, createdAt: now };
  if (item.type === 'measure')
    return { ...item, id: newId, createdAt: now };
  if (item.type === 'folder') {
    return {
      ...item,
      id: newId,
      children: item.children.map(cloneItem),
    };
  }
  if (item.type === 'kmlfile') {
    return {
      ...item,
      id: newId,
      name: item.name + ' (копия)',
      children: item.children.map(cloneItem),
    };
  }
  return item;
}

// -----------------------------------------------------
// ⚡ Уникальное имя для метки: "Метка N", где N — max+1
// -----------------------------------------------------
function getNextPlaceName(
  tree: TreeItem[],
  importedItems: TreeItem[]
): string {
  const all = collectPlaces(tree, true).concat(
    collectPlaces(importedItems, true)
  );
  const existing = new Set<string>();
  all.forEach(function (p) {
    existing.add(p.name);
  });

  const re = /^Метка (\d+)$/;
  let maxN = 0;
  existing.forEach(function (name) {
    const m = re.exec(name);
    if (m) {
      const n = parseInt(m[1], 10);
      if (isFinite(n) && n > maxN) maxN = n;
    }
  });

  let n = maxN + 1;
  while (existing.has('Метка ' + n)) n++;
  return 'Метка ' + n;
}

// -----------------------------------------------------
// Хук
// -----------------------------------------------------
export function useTreeOps(params: TreeOpsParams): UseTreeOpsResult {
  const {
    tree,
    importedItems,
    setTree,
    setImportedItems,
    activeFolderId,
    focusedFolderId,
    selectedIds,
    setSelectedIds,
    setLastClickedId,
    setPanelItemId,
    clipboard,
    setClipboard,
    addLog,
    markDirty,
  } = params;

  // =====================================================
  // === Раскрытие ===
  // =====================================================
  const handleToggleExpanded = useCallback(
    function (id: string) {
      setTree(function (prev) {
        return updateItemInTree(prev, id, function (item) {
          return isContainer(item)
            ? ({ ...item, expanded: !item.expanded } as TreeItem)
            : item;
        });
      });
      setImportedItems(function (prev) {
        return updateItemInTree(prev, id, function (item) {
          return isContainer(item)
            ? ({ ...item, expanded: !item.expanded } as TreeItem)
            : item;
        });
      });
    },
    [setTree, setImportedItems]
  );

  const handleSetExpandedDeep = useCallback(
    function (id: string, value: boolean) {
      setTree(function (prev) {
        return setExpandedDeepInTree(prev, id, value);
      });
      setImportedItems(function (prev) {
        return setExpandedDeepInTree(prev, id, value);
      });
      addLog(
        'visibility',
        (value ? 'Развёрнуто всё ниже: ' : 'Свёрнуто всё ниже: ') + id
      );
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  const handleCollapseAll = useCallback(
    function () {
      setTree(function (prev) {
        return collapseAllInTree(prev);
      });
      setImportedItems(function (prev) {
        return collapseAllInTree(prev);
      });
      addLog('visibility', 'Свёрнуты все папки');
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  // =====================================================
  // === Видимость ===
  // =====================================================
  const handleToggleVisible = useCallback(
    function (id: string) {
      setTree(function (prev) {
        return updateItemInTree(prev, id, function (item) {
          return { ...item, visible: item.visible === false };
        });
      });
      setImportedItems(function (prev) {
        return updateItemInTree(prev, id, function (item) {
          return { ...item, visible: item.visible === false };
        });
      });
      addLog('visibility', 'Видимость: ' + id);
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  const handleSetVisibleCascade = useCallback(
    function (id: string, value: boolean) {
      setTree(function (prev) {
        return setVisibleDeepAndOpenAncestors(prev, id, value);
      });
      setImportedItems(function (prev) {
        return setVisibleDeepAndOpenAncestors(prev, id, value);
      });
      addLog('visibility', (value ? 'Показано' : 'Скрыто') + ': ' + id);
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  const handleToggleVisibleMultiple = useCallback(
    function (ids: string[], visible: boolean) {
      setTree(function (prev) {
        let next = prev;
        ids.forEach(function (id) {
          next = updateItemInTree(next, id, function (item) {
            return { ...item, visible: visible };
          });
        });
        return next;
      });
      setImportedItems(function (prev) {
        let next = prev;
        ids.forEach(function (id) {
          next = updateItemInTree(next, id, function (item) {
            return { ...item, visible: visible };
          });
        });
        return next;
      });
      addLog(
        'visibility',
        (visible ? 'Показано' : 'Скрыто') + ': ' + ids.length
      );
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  // =====================================================
  // === Прочее ===
  // =====================================================
  const handleMoveUpDown = useCallback(
    function (id: string, direction: 'up' | 'down') {
      setTree(function (prev) {
        return moveWithinParent(prev, id, direction);
      });
      setImportedItems(function (prev) {
        return moveWithinParent(prev, id, direction);
      });
      addLog('move', (direction === 'up' ? 'Вверх: ' : 'Вниз: ') + id);
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  const handleRename = useCallback(
    function (id: string, newName: string) {
      setTree(function (prev) {
        return updateItemInTree(prev, id, function (item) {
          return { ...item, name: newName };
        });
      });
      setImportedItems(function (prev) {
        return updateItemInTree(prev, id, function (item) {
          return { ...item, name: newName };
        });
      });
      addLog('rename', id + ' → ' + newName);
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  const handleSortChange = useCallback(
    function (folderId: string, field: SortField, order: SortOrder) {
      setTree(function (prev) {
        return updateItemInTree(prev, folderId, function (item) {
          if (isContainer(item))
            return {
              ...item,
              sortField: field,
              sortOrder: order,
            } as TreeItem;
          return item;
        });
      });
      setImportedItems(function (prev) {
        return updateItemInTree(prev, folderId, function (item) {
          if (isContainer(item))
            return {
              ...item,
              sortField: field,
              sortOrder: order,
            } as TreeItem;
          return item;
        });
      });
      addLog('sort', 'Сортировка: ' + folderId);
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  const handleTogglePin = useCallback(
    function (id: string) {
      setTree(function (prev) {
        return updateItemInTree(prev, id, function (it) {
          return { ...it, pinned: !it.pinned };
        });
      });
      setImportedItems(function (prev) {
        return updateItemInTree(prev, id, function (it) {
          return { ...it, pinned: !it.pinned };
        });
      });
      addLog('pin', 'Закрепление: ' + id);
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  // =====================================================
  // === Удаление ===
  // =====================================================
  const handleDelete = useCallback(
    function (id: string) {
      setTree(function (prev) {
        return removeItemFromTree(prev, id);
      });
      setImportedItems(function (prev) {
        return removeItemFromTree(prev, id);
      });
      setSelectedIds(function (prev) {
        return prev.filter(function (x) {
          return x !== id;
        });
      });
      setPanelItemId(function (prev) {
        return prev === id ? null : prev;
      });
      addLog('delete', 'Удалено: ' + id);
      markDirty();
    },
    [
      setTree,
      setImportedItems,
      setSelectedIds,
      setPanelItemId,
      addLog,
      markDirty,
    ]
  );

  const handleDeleteMultiple = useCallback(
    function (ids: string[]) {
      setTree(function (prev) {
        return removeManyFromTree(prev, ids);
      });
      setImportedItems(function (prev) {
        return removeManyFromTree(prev, ids);
      });
      setSelectedIds([]);
      setPanelItemId(function (prev) {
        return prev && ids.indexOf(prev) >= 0 ? null : prev;
      });
      addLog('delete', 'Массовое удаление: ' + ids.length);
      markDirty();
    },
    [
      setTree,
      setImportedItems,
      setSelectedIds,
      setPanelItemId,
      addLog,
      markDirty,
    ]
  );

  // =====================================================
  // === Добавление ===
  // =====================================================
  const handleAddFolder = useCallback(
    function (parentId: string): string {
      const newFolder: Folder = {
        id: generateId(),
        name: 'Новая папка',
        type: 'folder',
        visible: true,
        expanded: false,
        children: [],
        sortField: 'manual',
        sortOrder: 'asc',
        createdAt: new Date().toISOString(),
      };
      setTree(function (prev) {
        return addItemToFolder(prev, parentId, newFolder);
      });
      setSelectedIds([newFolder.id]);
      setLastClickedId(newFolder.id);
      addLog('add', 'Создана папка: ' + newFolder.name);
      markDirty();
      return newFolder.id;
    },
    [setTree, setSelectedIds, setLastClickedId, addLog, markDirty]
  );

  const handleAddPlaceTo = useCallback(
    function (
      parentId: string,
      lat: number,
      lon: number,
      height: number
    ): string {
      // ⚡ Уникальное имя по max+1, а не length+1
      const placeName = getNextPlaceName(tree, importedItems);

      const newPlace: Place = {
        id: generateId(),
        name: placeName,
        type: 'place',
        visible: true,
        lat: lat,
        lon: lon,
        color: '#e74c3c',
        pixelSize: 6,
        description: '',
        height: height || 0,
        altitudeMode: 'clampToGround',
        createdAt: new Date().toISOString(),
      };
      setTree(function (prev) {
        return addItemToFolder(prev, parentId, newPlace);
      });
      setSelectedIds([newPlace.id]);
      setLastClickedId(newPlace.id);
      addLog('add', 'Создана метка: ' + newPlace.name);
      markDirty();
      return newPlace.id;
    },
    [
      tree,
      importedItems,
      setTree,
      setSelectedIds,
      setLastClickedId,
      addLog,
      markDirty,
    ]
  );

  // =====================================================
  // === Copy / Cut / Paste ===
  // =====================================================
  const handleCopy = useCallback(
    function (ids: string[]) {
      const items: TreeItem[] = [];
      ids.forEach(function (id) {
        const item = findItem(tree, id) || findItem(importedItems, id);
        if (item) items.push(item);
      });
      if (items.length === 0) return;
      setClipboard({
        items: items,
        operation: 'copy',
        sourceFolderId: focusedFolderId,
      });
      addLog('copy', 'Скопировано: ' + items.length);
    },
    [tree, importedItems, setClipboard, addLog, focusedFolderId]
  );

  const handleCut = useCallback(
    function (ids: string[]) {
      const items: TreeItem[] = [];
      ids.forEach(function (id) {
        const item = findItem(tree, id) || findItem(importedItems, id);
        if (item) items.push(item);
      });
      if (items.length === 0) return;
      setClipboard({
        items: items,
        operation: 'cut',
        sourceFolderId: focusedFolderId,
      });
      addLog('cut', 'Вырезано: ' + items.length);
    },
    [tree, importedItems, setClipboard, addLog, focusedFolderId]
  );

  const handlePaste = useCallback(
    function (targetFolderId: string) {
      if (!clipboard) return;
      const targetFolder = findItem(tree, targetFolderId);
      if (!targetFolder || !isContainer(targetFolder)) {
        alert('Цель — не папка.');
        return;
      }
      const sourceIds: string[] = [];
      clipboard.items.forEach(function (it) {
        sourceIds.push(it.id);
      });

      if (clipboard.operation === 'cut') {
        const clonedItems = clipboard.items.map(cloneItem);
        setTree(function (prev) {
          let next = removeManyFromTree(prev, sourceIds);
          clonedItems.forEach(function (it) {
            next = addItemToFolder(next, targetFolderId, it);
          });
          next = setVisibleUpward(next, targetFolderId, true);
          return next;
        });
        setImportedItems(function (prev) {
          return removeManyFromTree(prev, sourceIds);
        });
        addLog('paste', 'Перемещено: ' + clonedItems.length);
        setClipboard(null);
      } else {
        const clonedItems = clipboard.items.map(cloneItem);
        setTree(function (prev) {
          let next = prev;
          clonedItems.forEach(function (it) {
            next = addItemToFolder(next, targetFolderId, it);
          });
          next = setVisibleUpward(next, targetFolderId, true);
          return next;
        });
        addLog('paste', 'Вставлено: ' + clonedItems.length);
      }
      markDirty();
    },
    [
      clipboard,
      tree,
      setTree,
      setImportedItems,
      setClipboard,
      addLog,
      markDirty,
    ]
  );

  const handleDuplicateMultiple = useCallback(
    function (ids: string[]) {
      const items: TreeItem[] = [];
      ids.forEach(function (id) {
        const item = findItem(tree, id) || findItem(importedItems, id);
        if (item) items.push(item);
      });
      if (items.length === 0) return;
      const clonedItems = items.map(cloneItem);
      setTree(function (prev) {
        let next = prev;
        clonedItems.forEach(function (it) {
          next = addItemToFolder(next, activeFolderId, it);
        });
        return next;
      });
      addLog('copy', 'Дублировано: ' + clonedItems.length);
      markDirty();
    },
    [tree, importedItems, activeFolderId, setTree, addLog, markDirty]
  );

  // =====================================================
  // === Move ===
  // =====================================================
  const handleMoveConfirm = useCallback(
    function (targetFolderId: string, ids: string[]) {
      if (!ids || ids.length === 0) return;
      const targetFolder = findItem(tree, targetFolderId);
      if (!targetFolder || !isContainer(targetFolder)) {
        alert('Цель — не папка.');
        return;
      }
      const itemsToMove: TreeItem[] = [];
      ids.forEach(function (id) {
        const it = findItem(tree, id) || findItem(importedItems, id);
        if (it) itemsToMove.push(it);
      });
      setTree(function (prev) {
        let next = removeManyFromTree(prev, ids);
        itemsToMove.forEach(function (it) {
          next = addItemToFolder(next, targetFolderId, it);
        });
        next = setVisibleUpward(next, targetFolderId, true);
        next = updateItemInTree(next, targetFolderId, function (it) {
          return isContainer(it)
            ? ({ ...it, expanded: true } as TreeItem)
            : it;
        });
        return next;
      });
      setImportedItems(function (prev) {
        return removeManyFromTree(prev, ids);
      });
      addLog('move', 'Перемещено: ' + itemsToMove.length);
      markDirty();
    },
    [tree, importedItems, setTree, setImportedItems, addLog, markDirty]
  );

  const handleMoveItemDragDrop = useCallback(
    function (draggedId: string, targetFolderId: string) {
      if (draggedId === targetFolderId) return;
      const dragged =
        findItem(tree, draggedId) || findItem(importedItems, draggedId);
      const target =
        findItem(tree, targetFolderId) ||
        findItem(importedItems, targetFolderId);
      if (!dragged || !target || !isContainer(target)) return;

      if (isContainer(dragged)) {
        const descendants = collectDescendantIds(dragged);
        if (descendants.indexOf(targetFolderId) >= 0) return;
      }

      setTree(function (prev) {
        let next = removeItemFromTree(prev, draggedId);
        if (dragged) next = addItemToFolder(next, targetFolderId, dragged);
        next = setVisibleUpward(next, targetFolderId, true);
        next = updateItemInTree(next, targetFolderId, function (it) {
          return isContainer(it)
            ? ({ ...it, expanded: true } as TreeItem)
            : it;
        });
        return next;
      });
      setImportedItems(function (prev) {
        return removeItemFromTree(prev, draggedId);
      });
      addLog('move', 'Перетащено: ' + dragged.name);
      markDirty();
    },
    [tree, importedItems, setTree, setImportedItems, addLog, markDirty]
  );

  // =====================================================
  // === Сохранение объекта (без закрытия панели) ===
  // =====================================================
  const handleSaveItem = useCallback(
    function (
      id: string,
      updates: Partial<any>,
      previewOverrides: Record<string, Partial<any>>,
      setPreviewOverrides: React.Dispatch<
        React.SetStateAction<Record<string, Partial<any>>>
      >
    ) {
      setTree(function (prev) {
        return updateItemInTree(prev, id, function (it) {
          const preview = previewOverrides[id] || {};
          return { ...it, ...preview, ...updates } as TreeItem;
        });
      });
      setImportedItems(function (prev) {
        return updateItemInTree(prev, id, function (it) {
          const preview = previewOverrides[id] || {};
          return { ...it, ...preview, ...updates } as TreeItem;
        });
      });
      setPreviewOverrides(function (prev) {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      addLog('update', 'Сохранено: ' + id);
      markDirty();
    },
    [setTree, setImportedItems, addLog, markDirty]
  );

  const handleUpdatePlace = useCallback(
    function (id: string, updates: Partial<Place>) {
      setTree(function (prev) {
        return updateItemInTree(prev, id, function (item) {
          return isPlace(item) ? { ...item, ...updates } : item;
        });
      });
      addLog('update', 'Изменена метка: ' + id);
      markDirty();
    },
    [setTree, addLog, markDirty]
  );

  const handleExpandAncestors = useCallback(
    function (id: string) {
      try {
        setTree(function (prev) {
          return expandAncestorsInTree(prev, id);
        });
        setImportedItems(function (prev) {
          return expandAncestorsInTree(prev, id);
        });
      } catch (err) {
        console.error('handleExpandAncestors:', err);
      }
    },
    [setTree, setImportedItems]
  );

  return useMemo(
    function () {
      return {
        handleToggleExpanded,
        handleSetExpandedDeep,
        handleCollapseAll,
        handleToggleVisible,
        handleSetVisibleCascade,
        handleToggleVisibleMultiple,
        handleMoveUpDown,
        handleRename,
        handleSortChange,
        handleTogglePin,
        handleDelete,
        handleDeleteMultiple,
        handleAddFolder,
        handleAddPlaceTo,
        handleCopy,
        handleCut,
        handlePaste,
        handleDuplicateMultiple,
        handleMoveConfirm,
        handleMoveItemDragDrop,
        handleSaveItem,
        handleUpdatePlace,
        handleExpandAncestors,
      };
    },
    [
      handleToggleExpanded,
      handleSetExpandedDeep,
      handleCollapseAll,
      handleToggleVisible,
      handleSetVisibleCascade,
      handleToggleVisibleMultiple,
      handleMoveUpDown,
      handleRename,
      handleSortChange,
      handleTogglePin,
      handleDelete,
      handleDeleteMultiple,
      handleAddFolder,
      handleAddPlaceTo,
      handleCopy,
      handleCut,
      handlePaste,
      handleDuplicateMultiple,
      handleMoveConfirm,
      handleMoveItemDragDrop,
      handleSaveItem,
      handleUpdatePlace,
      handleExpandAncestors,
    ]
  );
}