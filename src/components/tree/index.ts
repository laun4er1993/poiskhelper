// =====================================================
// src/components/tree/index.ts
// Реэкспорт модуля tree
// =====================================================

export type {
  SelectMode,
  ContextMenu,
  DragState,
  TreeViewCommonProps,
} from './types';

export { default as TreeView } from './TreeView';
export { default as TreeRow } from './TreeRow';
export { default as TreeContextMenu } from './TreeContextMenu';
export { default as SortSubmenu } from './SortSubmenu';
export { default as IconPreviewMini } from './IconPreviewMini';

export {
  DRAG_THRESHOLD,
  AUTO_SCROLL_EDGE,
  AUTO_SCROLL_SPEED,
  HOVER_EXPAND_MS,
  subscribeDrag,
  setModuleDragState,
  getModuleDragState,
  wasJustDragged,
  markJustDragged,
  cleanupDragState,
} from './drag-state';