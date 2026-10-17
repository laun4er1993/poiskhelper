// =====================================================
// src/types/tree-utils.ts
// Утилиты для работы с деревом объектов
// =====================================================

import type {
  TreeItem,
  Folder,
  KmlFile,
  SortField,
  SortOrder,
} from './base';
import { isContainer, isPlace, isKmlLine, isKmlPolygon } from './base';

// =====================================================
// ⚡ Legacy-миграция: очистка полей, которых больше нет
// =====================================================
function migrateItem(item: TreeItem): TreeItem {
  if (!item) return item;
  if (item.type === 'measure') {
    const m: any = { ...item };
    // Обводка линии удалена полностью
    delete m.lineOutlineWidth;
    delete m.lineOutlineColor;
    // Тип profile больше не поддерживается
    if (m.rulerType === 'profile') m.rulerType = 'path';
    return m as TreeItem;
  }
  return item;
}

// =====================================================
// === Поиск и обход ===
// =====================================================
export function findItem(items: TreeItem[], id: string): TreeItem | null {
  if (!Array.isArray(items) || typeof id !== 'string' || id.length === 0) {
    return null;
  }
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    if (item.id === id) return item;
    if (isContainer(item)) {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function getBreadcrumbPath(
  items: TreeItem[],
  targetId: string
): TreeItem[] {
  const path: TreeItem[] = [];
  if (!Array.isArray(items) || typeof targetId !== 'string') return path;

  function find(list: TreeItem[], id: string): boolean {
    if (!Array.isArray(list)) return false;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item) continue;
      if (item.id === id) {
        path.push(item);
        return true;
      }
      if (isContainer(item) && Array.isArray(item.children)) {
        if (find(item.children, id)) {
          path.unshift(item);
          return true;
        }
      }
    }
    return false;
  }

  try {
    find(items, targetId);
  } catch (err) {
    console.error('getBreadcrumbPath: ошибка', err);
    return [];
  }
  return path;
}

export function flattenIds(items: TreeItem[]): string[] {
  const result: string[] = [];
  if (!Array.isArray(items)) return result;
  function walk(list: TreeItem[]) {
    list.forEach(function (item) {
      if (!item) return;
      result.push(item.id);
      if (isContainer(item)) walk(item.children);
    });
  }
  walk(items);
  return result;
}

export function collectDescendantIds(item: TreeItem): string[] {
  const ids: string[] = [item.id];
  if (isContainer(item)) {
    item.children.forEach(function (child) {
      ids.push.apply(ids, collectDescendantIds(child));
    });
  }
  return ids;
}

// =====================================================
// === Обновление / удаление / вставка ===
// =====================================================
export function updateItemInTree(
  items: TreeItem[],
  id: string,
  updater: (item: TreeItem) => TreeItem
): TreeItem[] {
  if (!Array.isArray(items)) return items;
  return items.map(function (item) {
    if (!item) return item;
    if (item.id === id) return updater(item);
    if (isContainer(item)) {
      return {
        ...item,
        children: updateItemInTree(item.children, id, updater),
      } as TreeItem;
    }
    return item;
  });
}

export function removeItemFromTree(items: TreeItem[], id: string): TreeItem[] {
  if (!Array.isArray(items)) return items;
  return items
    .filter(function (item) {
      return item && item.id !== id;
    })
    .map(function (item) {
      if (isContainer(item)) {
        return {
          ...item,
          children: removeItemFromTree(item.children, id),
        } as TreeItem;
      }
      return item;
    });
}

export function removeManyFromTree(
  items: TreeItem[],
  ids: string[]
): TreeItem[] {
  if (!Array.isArray(items) || !Array.isArray(ids)) return items;
  const set: Record<string, boolean> = {};
  ids.forEach(function (id) {
    set[id] = true;
  });
  return items
    .filter(function (item) {
      return item && !set[item.id];
    })
    .map(function (item) {
      if (isContainer(item)) {
        return {
          ...item,
          children: removeManyFromTree(item.children, ids),
        } as TreeItem;
      }
      return item;
    });
}

export function addItemToFolder(
  items: TreeItem[],
  parentId: string,
  newItem: TreeItem
): TreeItem[] {
  if (!Array.isArray(items)) return items;
  return items.map(function (item) {
    if (!item) return item;
    if (item.id === parentId && isContainer(item)) {
      return {
        ...item,
        children: item.children.concat([newItem]),
        expanded: true,
      } as TreeItem;
    }
    if (isContainer(item)) {
      return {
        ...item,
        children: addItemToFolder(item.children, parentId, newItem),
      } as TreeItem;
    }
    return item;
  });
}

// =====================================================
// === Видимость ===
// =====================================================
export function setVisibleCascade(item: TreeItem, value: boolean): TreeItem {
  if (isContainer(item)) {
    return {
      ...item,
      visible: value,
      children: item.children.map(function (c) {
        return setVisibleCascade(c, value);
      }),
    } as TreeItem;
  }
  return { ...item, visible: value };
}

export function setVisibleUpward(
  items: TreeItem[],
  id: string,
  value: boolean
): TreeItem[] {
  const path: string[] = [];
  function findPath(
    list: TreeItem[],
    targetId: string,
    currentPath: string[]
  ): boolean {
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const newPath = currentPath.concat([item.id]);
      if (item.id === targetId) {
        path.length = 0;
        path.push.apply(path, newPath);
        return true;
      }
      if (isContainer(item)) {
        if (findPath(item.children, targetId, newPath)) return true;
      }
    }
    return false;
  }
  findPath(items, id, []);

  let result = updateItemInTree(items, id, function (it) {
    return { ...it, visible: value };
  });

  if (value && path.length > 0) {
    for (let i = 0; i < path.length - 1; i++) {
      const ancestorId = path[i];
      result = updateItemInTree(result, ancestorId, function (it) {
        return { ...it, visible: true };
      });
    }
  }

  return result;
}

export function setVisibleDeepAndOpenAncestors(
  items: TreeItem[],
  id: string,
  value: boolean
): TreeItem[] {
  const path: string[] = [];
  function findPath(
    list: TreeItem[],
    targetId: string,
    currentPath: string[]
  ): boolean {
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const newPath = currentPath.concat([item.id]);
      if (item.id === targetId) {
        path.length = 0;
        path.push.apply(path, newPath);
        return true;
      }
      if (isContainer(item)) {
        if (findPath(item.children, targetId, newPath)) return true;
      }
    }
    return false;
  }
  findPath(items, id, []);

  let result = updateItemInTree(items, id, function (it) {
    return setVisibleCascade(it, value);
  });

  if (value && path.length > 0) {
    for (let i = 0; i < path.length - 1; i++) {
      const ancestorId = path[i];
      result = updateItemInTree(result, ancestorId, function (it) {
        return { ...it, visible: true };
      });
    }
  }

  return result;
}

export function expandAncestorsInTree(
  items: TreeItem[],
  targetId: string
): TreeItem[] {
  try {
    if (!Array.isArray(items) || items.length === 0) return items;
    if (!targetId || typeof targetId !== 'string') return items;

    const path = getBreadcrumbPath(items, targetId);
    if (!Array.isArray(path) || path.length <= 1) return items;

    let alreadyExpanded = true;
    for (let i = 0; i < path.length - 1; i++) {
      const ancestor = path[i];
      if (!ancestor || !isContainer(ancestor) || !ancestor.expanded) {
        alreadyExpanded = false;
        break;
      }
    }
    if (alreadyExpanded) return items;

    let result = items;
    for (let i = 0; i < path.length - 1; i++) {
      const ancestor = path[i];
      if (!ancestor || !ancestor.id) continue;
      const ancestorId = ancestor.id;
      result = updateItemInTree(result, ancestorId, function (it) {
        if (!isContainer(it)) return it;
        return { ...it, expanded: true } as TreeItem;
      });
    }

    return result;
  } catch (err) {
    console.error('expandAncestorsInTree: ошибка', err);
    return items;
  }
}

export function setExpandedDeepInTree(
  items: TreeItem[],
  id: string,
  value: boolean
): TreeItem[] {
  function applyDeep(item: TreeItem, v: boolean): TreeItem {
    if (!isContainer(item)) return item;
    return {
      ...item,
      expanded: v,
      children: item.children.map(function (c) {
        return applyDeep(c, v);
      }),
    } as TreeItem;
  }
  return items.map(function (item) {
    if (!item) return item;
    if (item.id === id) return applyDeep(item, value);
    if (isContainer(item)) {
      return {
        ...item,
        children: setExpandedDeepInTree(item.children, id, value),
      } as TreeItem;
    }
    return item;
  });
}

export function collapseAllInTree(items: TreeItem[]): TreeItem[] {
  return items.map(function (item) {
    if (!item) return item;
    if (isContainer(item)) {
      return {
        ...item,
        expanded: false,
        children: collapseAllInTree(item.children),
      } as TreeItem;
    }
    return item;
  });
}

// =====================================================
// === Перемещение ===
// =====================================================
export function moveWithinParent(
  items: TreeItem[],
  id: string,
  direction: 'up' | 'down'
): TreeItem[] {
  const rootIdx = items.findIndex(function (i) {
    return i.id === id;
  });
  if (rootIdx >= 0) {
    const newIdx = direction === 'up' ? rootIdx - 1 : rootIdx + 1;
    if (newIdx < 0 || newIdx >= items.length) return items;
    const copy = items.slice();
    const moved = copy.splice(rootIdx, 1)[0];
    copy.splice(newIdx, 0, moved);
    return copy;
  }

  return items.map(function (item) {
    if (!isContainer(item)) return item;
    const idx = item.children.findIndex(function (c) {
      return c.id === id;
    });
    if (idx >= 0) {
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= item.children.length) return item;
      const newChildren = item.children.slice();
      const moved = newChildren.splice(idx, 1)[0];
      newChildren.splice(newIdx, 0, moved);
      return {
        ...item,
        children: newChildren,
        sortField: 'manual',
      } as TreeItem;
    }
    const newChildren = moveWithinParent(item.children, id, direction);
    if (newChildren !== item.children) {
      return {
        ...item,
        children: newChildren,
        sortField: 'manual',
      } as TreeItem;
    }
    return item;
  });
}

// =====================================================
// === Чекбокс видимости ===
// =====================================================
function countVisible(
  item: TreeItem,
  parentVisible: boolean
): { total: number; visible: number } {
  const selfVis = parentVisible && item.visible !== false;
  let total = 1;
  let visible = selfVis ? 1 : 0;
  if (isContainer(item)) {
    item.children.forEach(function (c) {
      const sub = countVisible(c, selfVis);
      total += sub.total;
      visible += sub.visible;
    });
  }
  return { total: total, visible: visible };
}

export function getCheckedState(
  item: TreeItem,
  parentVisible: boolean = true
): 'checked' | 'unchecked' | 'indeterminate' {
  const selfVis = parentVisible && item.visible !== false;
  if (!isContainer(item)) {
    return selfVis ? 'checked' : 'unchecked';
  }
  if (!selfVis) return 'unchecked';
  if (item.children.length === 0) return 'checked';
  const result = countVisible(item, parentVisible);
  const descendantsVisible = result.visible - 1;
  const descendantsTotal = result.total - 1;
  if (descendantsVisible === 0) return 'unchecked';
  if (descendantsVisible === descendantsTotal) return 'checked';
  return 'indeterminate';
}

// =====================================================
// === Сортировка ===
// =====================================================
export function sortChildren(
  children: TreeItem[],
  field: SortField,
  order: SortOrder
): TreeItem[] {
  if (field === 'manual') return children;
  const arr = children.slice();

  arr.sort(function (a, b) {
    const aPin = a.pinned ? 0 : 1;
    const bPin = b.pinned ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;

    const aCont = isContainer(a) ? 0 : 1;
    const bCont = isContainer(b) ? 0 : 1;
    if (aCont !== bCont) return aCont - bCont;

    let cmp = 0;
    if (field === 'name') {
      cmp = a.name.localeCompare(b.name, 'ru');
    } else if (field === 'type') {
      cmp = a.type.localeCompare(b.type);
      if (cmp === 0) cmp = a.name.localeCompare(b.name, 'ru');
    } else if (field === 'date') {
      const aDate = a.createdAt || (a as any).importedAt || '';
      const bDate = b.createdAt || (b as any).importedAt || '';
      cmp = aDate.localeCompare(bDate);
      if (cmp === 0) cmp = a.name.localeCompare(b.name, 'ru');
    }
    return order === 'desc' ? -cmp : cmp;
  });

  return arr;
}

export function getSortField(item: TreeItem): SortField {
  if (isContainer(item)) {
    return (item as any).sortField || 'manual';
  }
  return 'manual';
}

export function getSortOrder(item: TreeItem): SortOrder {
  if (isContainer(item)) {
    return (item as any).sortOrder || 'asc';
  }
  return 'asc';
}

// =====================================================
// === Нормализация ===
// =====================================================
export function normalizeTree(items: TreeItem[]): TreeItem[] {
  if (!Array.isArray(items)) return [];
  return items.map(function (item) {
    if (!item) return item;
    // ⚡ Миграция: чистим устаревшие поля
    const migrated = migrateItem(item);
    const base = { ...migrated, visible: item.visible !== false } as TreeItem;
    if (isContainer(base)) {
      return {
        ...base,
        children: normalizeTree(base.children),
        expanded: base.expanded === true,
        sortField: (base as any).sortField || 'manual',
        sortOrder: (base as any).sortOrder || 'asc',
      } as TreeItem;
    }
    return base;
  });
}

// =====================================================
// === Прочее ===
// =====================================================
export function getItemOpacity(item: TreeItem): number {
  if (item.opacity === undefined || item.opacity === null) return 1;
  const v = item.opacity;
  if (!isFinite(v)) return 1;
  return Math.max(0, Math.min(1, v));
}

export function collectPlaces(
  items: TreeItem[],
  parentVisible: boolean = true
): Array<import('./base').Place> {
  const result: Array<import('./base').Place> = [];
  if (!Array.isArray(items)) return result;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    const visible = parentVisible && item.visible !== false;
    if (isPlace(item)) {
      result.push({ ...item, visible: visible });
    } else if (isContainer(item)) {
      result.push.apply(result, collectPlaces(item.children, visible));
    }
  }
  return result;
}

export function collectGeoItems(
  items: TreeItem[],
  parentVisible: boolean = true
): TreeItem[] {
  const result: TreeItem[] = [];
  if (!Array.isArray(items)) return result;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    const visible = parentVisible && item.visible !== false;
    if (!visible) continue;
    if (
      isPlace(item) ||
      isKmlLine(item) ||
      isKmlPolygon(item) ||
      item.type === 'measure'
    ) {
      result.push(item);
    } else if (isContainer(item)) {
      result.push.apply(result, collectGeoItems(item.children, visible));
    }
  }
  return result;
}

export function collectContainers(items: TreeItem[]): Array<Folder | KmlFile> {
  const result: Array<Folder | KmlFile> = [];
  if (!Array.isArray(items)) return result;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    if (isContainer(item)) {
      result.push(item);
      result.push.apply(result, collectContainers(item.children));
    }
  }
  return result;
}