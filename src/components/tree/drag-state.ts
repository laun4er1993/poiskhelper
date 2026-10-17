// =====================================================
// src/components/tree/drag-state.ts
// Модульное состояние drag + contextMenu
// =====================================================

import type { TreeItem } from '../../types/base';
import { isContainer } from '../../types/base';

// -----------------------------------------------------
// Константы
// -----------------------------------------------------
export const DRAG_THRESHOLD = 5;
export const AUTO_SCROLL_EDGE = 40;
export const AUTO_SCROLL_SPEED = 12;
export const HOVER_EXPAND_MS = 700;

// -----------------------------------------------------
// Drag state
// -----------------------------------------------------
export interface DragState {
  active: boolean;
  x: number;
  y: number;
  draggingIds: string[];
  targetFolderId: string | null;
  invalidTargetId: string | null;
  startX: number;
  startY: number;
  pending: boolean;
}

let moduleDragState: DragState = {
  active: false,
  x: 0,
  y: 0,
  draggingIds: [],
  targetFolderId: null,
  invalidTargetId: null,
  startX: 0,
  startY: 0,
  pending: false,
};

let moduleJustDragged = false;
let moduleHoverTimer: number | null = null;
let moduleHoverId: string | null = null;

type DragListener = (s: DragState) => void;
const moduleDragListeners: Set<DragListener> = new Set();

export function subscribeDrag(listener: DragListener): () => void {
  moduleDragListeners.add(listener);
  return function () {
    moduleDragListeners.delete(listener);
  };
}

export function setModuleDragState(s: DragState): void {
  moduleDragState = s;
  moduleDragListeners.forEach(function (fn) {
    fn(s);
  });
}

export function getModuleDragState(): DragState {
  return moduleDragState;
}

export function wasJustDragged(): boolean {
  return moduleJustDragged;
}

export function markJustDragged(): void {
  moduleJustDragged = true;
  setTimeout(function () {
    moduleJustDragged = false;
  }, 150);
}

export function cleanupDragState(): void {
  moduleJustDragged = false;
  if (moduleHoverTimer !== null) {
    window.clearTimeout(moduleHoverTimer);
    moduleHoverTimer = null;
  }
  moduleHoverId = null;
}

// -----------------------------------------------------
// Hover (автораскрытие)
// -----------------------------------------------------
export function getHoverId(): string | null {
  return moduleHoverId;
}

export function setHoverId(id: string | null): void {
  moduleHoverId = id;
}

export function setHoverTimer(id: number | null): void {
  moduleHoverTimer = id;
}

export function getHoverTimer(): number | null {
  return moduleHoverTimer;
}

export function clearHoverTimer(): void {
  if (moduleHoverTimer !== null) {
    window.clearTimeout(moduleHoverTimer);
    moduleHoverTimer = null;
  }
  moduleHoverId = null;
}

// -----------------------------------------------------
// Context menu state (модульный)
// -----------------------------------------------------
export interface ContextMenuState {
  x: number;
  y: number;
  itemId: string;
  itemType: string;
  isBulk: boolean;
}

let moduleContextMenu: ContextMenuState | null = null;
let moduleSortSubmenuOpen = false;

type ContextMenuListener = (
  menu: ContextMenuState | null,
  sortSubmenuOpen: boolean
) => void;
const moduleContextMenuListeners: Set<ContextMenuListener> = new Set();

export function subscribeContextMenu(listener: ContextMenuListener): () => void {
  moduleContextMenuListeners.add(listener);
  return function () {
    moduleContextMenuListeners.delete(listener);
  };
}

function emitContextMenu(): void {
  moduleContextMenuListeners.forEach(function (fn) {
    fn(moduleContextMenu, moduleSortSubmenuOpen);
  });
}

export function openContextMenu(state: ContextMenuState): void {
  moduleContextMenu = state;
  moduleSortSubmenuOpen = false;
  emitContextMenu();
}

export function closeContextMenu(): void {
  moduleContextMenu = null;
  moduleSortSubmenuOpen = false;
  emitContextMenu();
}

export function toggleSortSubmenu(): void {
  moduleSortSubmenuOpen = !moduleSortSubmenuOpen;
  emitContextMenu();
}

export function getContextMenu(): ContextMenuState | null {
  return moduleContextMenu;
}

export function getSortSubmenuOpen(): boolean {
  return moduleSortSubmenuOpen;
}

// -----------------------------------------------------
// DOM-утилиты
// -----------------------------------------------------
export function findFolderAtPoint(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!el) return null;
  let current: HTMLElement | null = el;
  while (current) {
    const id = current.getAttribute('data-tree-item-id');
    const isCont = current.getAttribute('data-tree-container');
    if (id && isCont === 'true') return id;
    current = current.parentElement;
  }
  return null;
}

export function findItemIn(children: TreeItem[], id: string): TreeItem | null {
  if (!Array.isArray(children)) return null;
  for (let i = 0; i < children.length; i++) {
    const item = children[i];
    if (!item) continue;
    if (item.id === id) return item;
    if (isContainer(item)) {
      const found = findItemIn(item.children, id);
      if (found) return found;
    }
  }
  return null;
}