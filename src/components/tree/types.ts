// =====================================================
// src/components/tree/types.ts
// Типы для дерева объектов
// =====================================================

import type { TreeItem, Place } from '../../types/base';
import type { SortField, SortOrder } from '../../types/base';
import type { DesignSettings } from '../../types/settings';

export type SelectMode = 'single' | 'toggle' | 'range';

export interface ContextMenu {
  x: number;
  y: number;
  itemId: string;
  itemType: string;
  isBulk: boolean;
}

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

export interface TreeViewCommonProps {
  items: TreeItem[];
  depth?: number;
  parentVisible?: boolean;
  parentOpacity?: number;

  selectedIds: string[];
  lastClickedId: string | null;
  focusedId: string | null;
  dropTargetId: string | null;
  design: DesignSettings;

  // === Редактирование (управляется снаружи — в Sidebar) ===
  editingId: string | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;

  onFocusChange: (id: string | null) => void;
  onSelect: (id: string, mode: SelectMode) => void;
  onToggleVisible: (id: string) => void;
  onSetVisibleCascade: (id: string, value: boolean) => void;
  onToggleExpanded: (id: string) => void;
  onSetExpandedDeep: (id: string, value: boolean) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onToggleVisibleMultiple: (ids: string[], visible: boolean) => void;
  onAddFolder: (parentId: string) => void;
  onAddPlace: (parentId: string) => void;
  onFlyTo: (place: Place) => void;
  onExport: (id: string, format: 'kml' | 'kmz') => void;
  onExportMultiple: (ids: string[], format: 'kml' | 'kmz') => void;
  onCopy: (ids: string[]) => void;
  onCut: (ids: string[]) => void;
  onPaste: (targetFolderId: string) => void;
  onDuplicate: (ids: string[]) => void;
  onMoveRequest: (ids: string[]) => void;
  onMoveItem: (draggedId: string, targetFolderId: string) => void;
  onMoveUpDown: (id: string, direction: 'up' | 'down') => void;
  onSortChange: (folderId: string, field: SortField, order: SortOrder) => void;
  onTogglePin: (id: string) => void;
  onShowInfo: (id: string) => void;
  onCopyCoords: (text: string, label: string) => void;
  /** Открыть правую панель редактирования */
  onEditItem: (item: TreeItem) => void;

  clipboardEmpty: boolean;
  clipboardOperation: 'copy' | 'cut' | null;
}