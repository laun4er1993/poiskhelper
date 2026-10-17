// =====================================================
// src/components/sidebar/Sidebar.tsx
// Левая панель: поиск + «Добавленные» + «Мои объекты» + массовые
// =====================================================

import { useState, useRef, useEffect } from 'react';
import { Breadcrumbs } from '../breadcrumbs';
import ProjectHeader from './ProjectHeader';
import SidebarSearch from './SidebarSearch';
import ImportedModule from './ImportedModule';
import TreeModule from './TreeModule';
import BulkPanel from './BulkPanel';
import TreeContextMenu from '../tree/TreeContextMenu';
import type { SidebarProps } from './types';
import { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from './types';
import { getBreadcrumbPath } from '../../types/tree-utils';
import type { TreeItem } from '../../types/base';
import type { ContextMenuState } from '../tree/drag-state';
import {
  subscribeContextMenu,
  closeContextMenu,
  toggleSortSubmenu,
  getContextMenu,
  getSortSubmenuOpen,
} from '../tree/drag-state';

function Sidebar(props: SidebarProps) {
  const {
    tree,
    importedItems,
    selectedIds,
    lastClickedId,
    focusedId,
    focusedFolderId,
    placesCount,
    projectName,
    width,
    dropTargetId,
    clipboardEmpty,
    clipboardOperation,
    showBreadcrumbs,
    design,
    settings,
    onWidthChange,
    onSearch,
    onSelect,
    onToggleVisible,
    onSetVisibleCascade,
    onToggleExpanded,
    onSetExpandedDeep,
    onRename,
    onDelete,
    onDeleteMultiple,
    onToggleVisibleMultiple,
    onAddFolder,
    onAddPlace,
    onFlyTo,
    onImport,
    onExport,
    onExportMultiple,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    onMoveRequest,
    onMoveItem,
    onMoveUpDown,
    onSortChange,
    onTogglePin,
    onShowInfo,
    onCopyCoords,
    onOpenLogs,
    onOpenProjectDetails,
    onNavigateToFolder,
    logsCount,
    onMoveAllImported,
    onCollapseAll,
    onEditItem,
  } = props;

  const [importedOpen, setImportedOpen] = useState(true);
  const [treeOpen, setTreeOpen] = useState(true);
  const [resizing, setResizing] = useState(false);

  // =====================================================
  // === State редактирования (имени) ===
  // =====================================================
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // =====================================================
  // === Контекстное меню (рендерится один раз здесь) ===
  // =====================================================
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
    getContextMenu()
  );
  const [sortSubmenuOpen, setSortSubmenuOpen] = useState<boolean>(
    getSortSubmenuOpen()
  );

  useEffect(function () {
    const unsub = subscribeContextMenu(function (menu, sortOpen) {
      setContextMenu(menu);
      setSortSubmenuOpen(sortOpen);
    });
    return unsub;
  }, []);

  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // =====================================================
  // === Resize ===
  // =====================================================
  useEffect(
    function () {
      if (!resizing) return;
      const handleMove = function (e: MouseEvent) {
        const delta = e.clientX - startXRef.current;
        let newWidth = startWidthRef.current + delta;
        if (newWidth < MIN_SIDEBAR_WIDTH) newWidth = MIN_SIDEBAR_WIDTH;
        if (newWidth > MAX_SIDEBAR_WIDTH) newWidth = MAX_SIDEBAR_WIDTH;
        onWidthChange(newWidth);
      };
      const handleUp = function () {
        setResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      return function () {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    },
    [resizing, onWidthChange]
  );

  const handleResizeStart = function (e: React.MouseEvent) {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    setResizing(true);
  };

  // =====================================================
  // === Редактирование имени ===
  // =====================================================
  const handleEditValueChange = function (value: string) {
    setEditValue(value);
  };

  const handleFinishRename = function () {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelRename = function () {
    setEditingId(null);
    setEditValue('');
  };

  const handleStartRename = function (item: TreeItem) {
    setEditingId(item.id);
    setEditValue(item.name);
    closeContextMenu();
  };

  // =====================================================
  // === Расчётные значения ===
  // =====================================================
  const selectedCount = selectedIds.length;
  const isRootView = !focusedFolderId || focusedFolderId === 'root-folder';
  const hasImported = importedItems.length > 0;

  const breadcrumbPath = focusedFolderId
    ? getBreadcrumbPath(tree, focusedFolderId)
    : [];

  const handleGoUp = function () {
    if (!focusedFolderId || focusedFolderId === 'root-folder') return;
    onMoveUpDown(focusedFolderId, 'up');
  };

  const handleAddFolderRoot = function () {
    const targetFolderId = focusedFolderId || 'root-folder';
    onAddFolder(targetFolderId);
  };

  const handleAddPlaceRoot = function () {
    const targetFolderId = focusedFolderId || 'root-folder';
    onAddPlace(targetFolderId);
  };

  // =====================================================
  // === Общие пропсы для TreeView ===
  // =====================================================
  const treeCommon = {
    settings,
    selectedIds,
    lastClickedId,
    dropTargetId,
    focusedId,
    design,
    editingId,
    editValue,
    onEditValueChange: handleEditValueChange,
    onFinishRename: handleFinishRename,
    onCancelRename: handleCancelRename,
    onFocusChange: function (id: string | null) {
      if (id) onNavigateToFolder(null);
    },
    onSelect,
    onToggleVisible,
    onSetVisibleCascade,
    onToggleExpanded,
    onSetExpandedDeep,
    onRename,
    onDelete,
    onDeleteMultiple,
    onToggleVisibleMultiple,
    onAddFolder,
    onAddPlace,
    onFlyTo,
    onExport,
    onExportMultiple,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    onMoveRequest,
    onMoveItem,
    onMoveUpDown,
    onSortChange,
    onTogglePin,
    onShowInfo,
    onCopyCoords,
    onEditItem,
    clipboardEmpty,
    clipboardOperation,
  };

  // =====================================================
  // === Порядок модулей ===
  // =====================================================
  const isImportedFirst = settings.sidebarOrder !== 'tree-first';

  const importedModule = hasImported ? (
    <ImportedModule
      key="imported"
      importedItems={importedItems}
      open={importedOpen}
      onToggleOpen={function () {
        setImportedOpen(!importedOpen);
      }}
      onMoveAllImported={onMoveAllImported}
      treeCommon={treeCommon}
    />
  ) : null;

  const treeModule = (
    <TreeModule
      key="tree"
      tree={tree}
      placesCount={placesCount}
      open={treeOpen}
      isRootView={isRootView}
      onToggleOpen={function () {
        setTreeOpen(!treeOpen);
      }}
      onGoUp={handleGoUp}
      onAddFolderRoot={handleAddFolderRoot}
      onAddPlaceRoot={handleAddPlaceRoot}
      onImport={onImport}
      onCollapseAll={onCollapseAll}
      onMoveUpDown={onMoveUpDown}
      focusedFolderId={focusedFolderId}
      treeCommon={treeCommon}
    />
  );

  // =====================================================
  // === Items для контекстного меню ===
  // =====================================================
  const allItemsForMenu = tree.concat(importedItems);

  return (
    <div style={{ ...styles.sidebar, width }}>
      <ProjectHeader
        projectName={projectName}
        logsCount={logsCount}
        onOpenProjectDetails={onOpenProjectDetails}
        onOpenLogs={onOpenLogs}
      />

      {showBreadcrumbs && (
        <Breadcrumbs
          path={breadcrumbPath}
          onNavigate={onNavigateToFolder}
        />
      )}

      <SidebarSearch onSearch={onSearch} />

      {isImportedFirst ? (
        <>
          {importedModule}
          {treeModule}
        </>
      ) : (
        <>
          {treeModule}
          {importedModule}
        </>
      )}

      {selectedCount > 1 && (
        <BulkPanel
          selectedIds={selectedIds}
          onClearSelection={function () {
            onSelect('', 'single');
          }}
          onCopy={onCopy}
          onCut={onCut}
          onMoveRequest={onMoveRequest}
          onDuplicate={onDuplicate}
          onToggleVisibleMultiple={onToggleVisibleMultiple}
          onExportMultiple={onExportMultiple}
          onDeleteMultiple={onDeleteMultiple}
        />
      )}

      {/* ============================================ */}
      {/* КОНТЕКСТНОЕ МЕНЮ (единственный инстанс)      */}
      {/* ============================================ */}
      {contextMenu && (
        <TreeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          itemId={contextMenu.itemId}
          isBulk={contextMenu.isBulk}
          selectedIds={selectedIds}
          items={allItemsForMenu}
          clipboardEmpty={clipboardEmpty}
          clipboardOperation={clipboardOperation}
          sortSubmenuOpen={sortSubmenuOpen}
          onToggleSortSubmenu={toggleSortSubmenu}
          onClose={closeContextMenu}
          onStartRename={handleStartRename}
          onShowInfo={onShowInfo}
          onTogglePin={onTogglePin}
          onToggleExpanded={onToggleExpanded}
          onSetExpandedDeep={onSetExpandedDeep}
          onFlyTo={onFlyTo}
          onCopyCoords={onCopyCoords}
          onAddFolder={onAddFolder}
          onAddPlace={onAddPlace}
          onSortChange={onSortChange}
          onEditItem={onEditItem}
          onCopy={onCopy}
          onCut={onCut}
          onPaste={onPaste}
          onDuplicate={onDuplicate}
          onMoveRequest={onMoveRequest}
          onMoveUpDown={onMoveUpDown}
          onToggleVisibleMultiple={onToggleVisibleMultiple}
          onExport={onExport}
          onExportMultiple={onExportMultiple}
          onDelete={onDelete}
          onDeleteMultiple={onDeleteMultiple}
        />
      )}

      <div
        ref={resizeRef}
        style={{
          ...styles.resizeHandle,
          backgroundColor: resizing ? 'var(--accent)' : 'transparent',
        }}
        onMouseDown={handleResizeStart}
        title="Потяните, чтобы изменить ширину"
      />
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    height: '100%',
    maxHeight: '100%',
    backgroundColor: 'var(--bg-panel)',
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRight: '1px solid var(--border)',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: 12,
    flexShrink: 0,
    position: 'relative',
    userSelect: 'none',
    transition: 'background-color 0.2s',
  },
  resizeHandle: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 4,
    height: '100%',
    cursor: 'col-resize',
    zIndex: 10,
    transition: 'background-color 0.15s',
  },
};

export default Sidebar;