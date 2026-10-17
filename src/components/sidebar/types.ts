// =====================================================
// src/components/sidebar/types.ts
// Общие типы для Sidebar и подкомпонентов
// =====================================================

import type { TreeItem, Place } from '../../types/base';
import type { SortField, SortOrder, DesignSettings } from '../../types/base';
import type { AppSettings } from '../../types/settings';
import type { SelectMode } from '../tree/types';

// -----------------------------------------------------
// Пропсы Sidebar
// -----------------------------------------------------
export interface SidebarProps {
  // Данные
  tree: TreeItem[];
  importedItems: TreeItem[];
  selectedIds: string[];
  lastClickedId: string | null;
  focusedId: string | null;
  focusedFolderId: string | null;
  placesCount: number;
  projectName: string;
  width: number;
  dropTargetId: string | null;
  clipboardEmpty: boolean;
  clipboardOperation: 'copy' | 'cut' | null;
  showBreadcrumbs: boolean;
  design: DesignSettings;
  settings: AppSettings;

  // UI-колбэки
  onWidthChange: (width: number) => void;
  onSearch: (query: string) => void;
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
  onImport: () => void;
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
  onOpenLogs: () => void;
  onOpenProjectDetails: () => void;
  onNavigateToFolder: (id: string | null) => void;
  logsCount: number;

  onMoveAllImported: () => void;
  onCollapseAll: () => void;

  /** Смена порядка модулей «Добавленные» / «Мои объекты» */
  onToggleSidebarOrder: () => void;

  /** Открыть правую панель редактирования */
  onEditItem: (item: TreeItem) => void;
}

// -----------------------------------------------------
// Заголовок проекта
// -----------------------------------------------------
export interface ProjectHeaderProps {
  projectName: string;
  logsCount: number;
  onOpenProjectDetails: () => void;
  onOpenLogs: () => void;
}

// -----------------------------------------------------
// Поиск
// -----------------------------------------------------
export interface SidebarSearchProps {
  onSearch: (query: string) => void;
}

// -----------------------------------------------------
// Модуль «Добавленные»
// -----------------------------------------------------
export interface ImportedModuleProps {
  importedItems: TreeItem[];
  open: boolean;
  onToggleOpen: () => void;
  onMoveAllImported: () => void;
  treeCommon: any;
}

// -----------------------------------------------------
// Модуль «Мои объекты»
// -----------------------------------------------------
export interface TreeModuleProps {
  tree: TreeItem[];
  placesCount: number;
  open: boolean;
  isRootView: boolean;
  onToggleOpen: () => void;
  onGoUp: () => void;
  onAddFolderRoot: () => void;
  onAddPlaceRoot: () => void;
  onImport: () => void;
  onCollapseAll: () => void;
  onMoveUpDown: (id: string, direction: 'up' | 'down') => void;
  focusedFolderId: string | null;
  treeCommon: any;
}

// -----------------------------------------------------
// Bulk panel
// -----------------------------------------------------
export interface BulkPanelProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onCopy: (ids: string[]) => void;
  onCut: (ids: string[]) => void;
  onMoveRequest: (ids: string[]) => void;
  onDuplicate: (ids: string[]) => void;
  onToggleVisibleMultiple: (ids: string[], visible: boolean) => void;
  onExportMultiple: (ids: string[], format: 'kml' | 'kmz') => void;
  onDeleteMultiple: (ids: string[]) => void;
}

// -----------------------------------------------------
// Константы
// -----------------------------------------------------
export const MIN_SIDEBAR_WIDTH = 240;
export const MAX_SIDEBAR_WIDTH = 700;