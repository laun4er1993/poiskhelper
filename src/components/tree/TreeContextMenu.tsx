// =====================================================
// src/components/tree/TreeContextMenu.tsx
// Контекстное меню дерева (Portal)
// =====================================================

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  FolderPlus,
  MapPin,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Crosshair,
  Download,
  Copy,
  Scissors,
  Clipboard,
  MoveRight,
  FilePlus,
  ArrowDownAZ,
  Hash,
  Pin,
  PinOff,
  Info,
  ArrowUp,
  ArrowDown,
  Edit3,
} from 'lucide-react';
import type { TreeItem } from '../../types/base';
import type { SortField, SortOrder } from '../../types/base';
import { isContainer, isPlace } from '../../types/base';
import SortSubmenu from './SortSubmenu';

// =====================================================
// === Пропсы ===
// =====================================================
interface TreeContextMenuProps {
  x: number;
  y: number;
  itemId: string;
  isBulk: boolean;
  selectedIds: string[];
  items: TreeItem[];
  clipboardEmpty: boolean;
  clipboardOperation: 'copy' | 'cut' | null;

  sortSubmenuOpen: boolean;
  onToggleSortSubmenu: () => void;

  onClose: () => void;
  onStartRename: (item: TreeItem) => void;
  onShowInfo: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onSetExpandedDeep: (id: string, value: boolean) => void;
  onFlyTo: (place: any) => void;
  onCopyCoords: (text: string, label: string) => void;
  onAddFolder: (parentId: string) => void;
  onAddPlace: (parentId: string) => void;
  onSortChange: (folderId: string, field: SortField, order: SortOrder) => void;
  onEditItem: (item: TreeItem) => void;

  onCopy: (ids: string[]) => void;
  onCut: (ids: string[]) => void;
  onPaste: (targetFolderId: string) => void;
  onDuplicate: (ids: string[]) => void;
  onMoveRequest: (ids: string[]) => void;
  onMoveUpDown: (id: string, direction: 'up' | 'down') => void;
  onToggleVisibleMultiple: (ids: string[], visible: boolean) => void;
  onExport: (id: string, format: 'kml' | 'kmz') => void;
  onExportMultiple: (ids: string[], format: 'kml' | 'kmz') => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
}

// =====================================================
// === Утилита ===
// =====================================================
function findItemIn(children: TreeItem[], id: string): TreeItem | null {
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

// =====================================================
// === Компонент ===
// =====================================================
function TreeContextMenu(props: TreeContextMenuProps) {
  const {
    x,
    y,
    itemId,
    isBulk,
    selectedIds,
    items,
    clipboardEmpty,
    clipboardOperation,
    sortSubmenuOpen,
    onToggleSortSubmenu,
    onClose,
    onStartRename,
    onShowInfo,
    onTogglePin,
    onToggleExpanded,
    onSetExpandedDeep,
    onFlyTo,
    onCopyCoords,
    onAddFolder,
    onAddPlace,
    onSortChange,
    onEditItem,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    onMoveRequest,
    onMoveUpDown,
    onToggleVisibleMultiple,
    onExport,
    onExportMultiple,
    onDelete,
    onDeleteMultiple,
  } = props;

  const menuRef = useRef<HTMLDivElement>(null);

  // Клик-снаружи закрывает
  useEffect(
    function () {
      const handler = function (e: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          onClose();
        }
      };
      const t = setTimeout(function () {
        document.addEventListener('mousedown', handler);
      }, 50);
      return function () {
        clearTimeout(t);
        document.removeEventListener('mousedown', handler);
      };
    },
    [onClose]
  );

  // =====================================================
  // === Позиционирование — корректное по всем краям ===
  // =====================================================
  const MENU_WIDTH = 260;
  const MAX_MENU_HEIGHT = 560;
  const PADDING = 8;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  // Максимальная высота меню — не больше viewport и не больше MAX_MENU_HEIGHT
  const menuMaxHeight = Math.min(MAX_MENU_HEIGHT, viewportH - PADDING * 2);

  // top — стараемся поставить в курсоре, но не даём вылезти за края
  let menuTop = y;
  if (menuTop + menuMaxHeight + PADDING > viewportH) {
    // Не влезает снизу — смещаем вверх, чтобы влезло
    menuTop = Math.max(PADDING, viewportH - menuMaxHeight - PADDING);
  }
  if (menuTop < PADDING) menuTop = PADDING;

  // left — если не влезает справа — открываем влево
  let menuLeft = x;
  if (menuLeft + MENU_WIDTH + PADDING > viewportW) {
    menuLeft = Math.max(PADDING, x - MENU_WIDTH);
  }
  if (menuLeft < PADDING) menuLeft = PADDING;

  const targetItem = findItemIn(items, itemId);
  const isBulkMode = isBulk && selectedIds.length > 1;
  const selectedCount = selectedIds.length;

  // =====================================================
  // === Портал ===
  // =====================================================
  return createPortal(
    <div
      ref={menuRef}
      style={{
        ...styles.contextMenu,
        top: menuTop,
        left: menuLeft,
        width: MENU_WIDTH,
        maxHeight: menuMaxHeight,
      }}
      onMouseDown={function (e) {
        e.stopPropagation();
      }}
      onContextMenu={function (e) {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {isBulkMode && (
        <div style={styles.bulkHeader}>
          Выбрано: <b>{selectedCount}</b> объектов
        </div>
      )}

      {/* ============ ОДИНОЧНЫЙ ============ */}
      {!isBulkMode && targetItem && (
        <>
          <button
            style={{ ...styles.menuItem, color: 'var(--accent)' }}
            onClick={function () {
              onEditItem(targetItem);
              onClose();
            }}
          >
            <Edit3 size={12} /> Редактировать
          </button>

          <div style={styles.menuSeparator} />

          {isContainer(targetItem) && (
            <>
              <button
                style={styles.menuItem}
                onClick={function () {
                  onToggleExpanded(itemId);
                  onClose();
                }}
              >
                {targetItem.expanded ? (
                  <>
                    <ChevronDown size={12} /> Свернуть
                  </>
                ) : (
                  <>
                    <ChevronRight size={12} /> Развернуть
                  </>
                )}
              </button>
              <button
                style={styles.menuItem}
                onClick={function () {
                  onSetExpandedDeep(itemId, false);
                  onClose();
                }}
              >
                <ChevronsDown size={12} /> Свернуть всё ниже
              </button>
              <button
                style={styles.menuItem}
                onClick={function () {
                  onSetExpandedDeep(itemId, true);
                  onClose();
                }}
              >
                <ChevronsUp size={12} /> Развернуть всё ниже
              </button>
            </>
          )}

          <button
            style={styles.menuItem}
            onClick={function () {
              onStartRename(targetItem);
            }}
          >
            <Pencil size={12} /> Переименовать
          </button>

          <button
            style={styles.menuItem}
            onClick={function () {
              onShowInfo(itemId);
              onClose();
            }}
          >
            <Info size={12} /> Свойства
          </button>

          <button
            style={styles.menuItem}
            onClick={function () {
              onTogglePin(itemId);
              onClose();
            }}
          >
            {targetItem.pinned ? (
              <>
                <PinOff size={12} /> Открепить
              </>
            ) : (
              <>
                <Pin size={12} /> Закрепить вверху
              </>
            )}
          </button>

          {targetItem.type === 'place' && (
            <>
              <button
                style={styles.menuItem}
                onClick={function () {
                  if (isPlace(targetItem)) onFlyTo(targetItem);
                  onClose();
                }}
              >
                <Crosshair size={12} /> Перелететь к метке
              </button>
              <button
                style={styles.menuItem}
                onClick={function () {
                  if (isPlace(targetItem)) {
                    const text =
                      targetItem.lat.toFixed(8) +
                      ', ' +
                      targetItem.lon.toFixed(8);
                    onCopyCoords(text, targetItem.name);
                  }
                  onClose();
                }}
              >
                <Hash size={12} /> Скопировать координаты
              </button>
            </>
          )}

          {(targetItem.type === 'folder' ||
            targetItem.type === 'kmlfile') && (
            <>
              <button
                style={styles.menuItem}
                onClick={function () {
                  onAddFolder(itemId);
                  onClose();
                }}
              >
                <FolderPlus size={12} /> Новая папка внутри
              </button>
              <button
                style={styles.menuItem}
                onClick={function () {
                  onAddPlace(itemId);
                  onClose();
                }}
              >
                <MapPin size={12} /> Новая метка внутри
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  style={styles.menuItem}
                  onClick={function (e) {
                    e.stopPropagation();
                    onToggleSortSubmenu();
                  }}
                >
                  <ArrowDownAZ size={12} /> Сортировать
                  <ChevronRight
                    size={11}
                    style={{ marginLeft: 'auto', opacity: 0.6 }}
                  />
                </button>
                {sortSubmenuOpen && (
                  <SortSubmenu
                    item={targetItem}
                    onSort={function (field, order) {
                      onSortChange(itemId, field, order);
                      onClose();
                    }}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}

      <div style={styles.menuSeparator} />

      {!isBulkMode && (
        <>
          <button
            style={styles.menuItem}
            onClick={function () {
              onMoveUpDown(itemId, 'up');
              onClose();
            }}
          >
            <ArrowUp size={12} /> Переместить вверх
          </button>
          <button
            style={styles.menuItem}
            onClick={function () {
              onMoveUpDown(itemId, 'down');
              onClose();
            }}
          >
            <ArrowDown size={12} /> Переместить вниз
          </button>
          <div style={styles.menuSeparator} />
        </>
      )}

      <button
        style={styles.menuItem}
        onClick={function () {
          if (isBulkMode) onCopy(selectedIds);
          else onCopy([itemId]);
          onClose();
        }}
      >
        <Copy size={12} /> Копировать
        {isBulkMode ? ' (' + selectedCount + ')' : ''}
      </button>

      <button
        style={styles.menuItem}
        onClick={function () {
          if (isBulkMode) onCut(selectedIds);
          else onCut([itemId]);
          onClose();
        }}
      >
        <Scissors size={12} /> Вырезать
        {isBulkMode ? ' (' + selectedCount + ')' : ''}
      </button>

      {(isBulkMode || (targetItem && isContainer(targetItem))) &&
        !clipboardEmpty && (
          <button
            style={styles.menuItem}
            onClick={function () {
              if (targetItem && isContainer(targetItem))
                onPaste(targetItem.id);
              onClose();
            }}
          >
            <Clipboard size={12} /> Вставить
            {clipboardOperation === 'cut' ? ' (вырезано)' : ''}
          </button>
        )}

      <button
        style={styles.menuItem}
        onClick={function () {
          if (isBulkMode) onDuplicate(selectedIds);
          else onDuplicate([itemId]);
          onClose();
        }}
      >
        <FilePlus size={12} /> Дублировать
        {isBulkMode ? ' (' + selectedCount + ')' : ''}
      </button>

      <button
        style={styles.menuItem}
        onClick={function () {
          if (isBulkMode) onMoveRequest(selectedIds);
          else onMoveRequest([itemId]);
          onClose();
        }}
      >
        <MoveRight size={12} /> Переместить в…
        {isBulkMode ? ' (' + selectedCount + ')' : ''}
      </button>

      <div style={styles.menuSeparator} />

      {isBulkMode && (
        <>
          <button
            style={styles.menuItem}
            onClick={function () {
              onToggleVisibleMultiple(selectedIds, true);
              onClose();
            }}
          >
            <Eye size={12} /> Показать все
          </button>
          <button
            style={styles.menuItem}
            onClick={function () {
              onToggleVisibleMultiple(selectedIds, false);
              onClose();
            }}
          >
            <EyeOff size={12} /> Скрыть все
          </button>
          <div style={styles.menuSeparator} />
        </>
      )}

      <button
        style={styles.menuItem}
        onClick={function () {
          if (isBulkMode) onExportMultiple(selectedIds, 'kml');
          else onExport(itemId, 'kml');
          onClose();
        }}
      >
        <Download size={12} /> Экспорт в KML
      </button>
      <button
        style={styles.menuItem}
        onClick={function () {
          if (isBulkMode) onExportMultiple(selectedIds, 'kmz');
          else onExport(itemId, 'kmz');
          onClose();
        }}
      >
        <Download size={12} /> Экспорт в KMZ
      </button>

      <div style={styles.menuSeparator} />

      <button
        style={{ ...styles.menuItem, color: 'var(--danger)' }}
        onClick={function () {
          if (isBulkMode) onDeleteMultiple(selectedIds);
          else onDelete(itemId);
          onClose();
        }}
      >
        <Trash2 size={12} />
        {isBulkMode ? 'Удалить все (' + selectedCount + ')' : 'Удалить'}
      </button>
    </div>,
    document.body
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  contextMenu: {
    position: 'fixed',
    backgroundColor: 'var(--bg-modal)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    boxShadow: 'var(--shadow-lg)',
    padding: 5,
    zIndex: 2147483647,
    color: 'var(--text-primary)',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  bulkHeader: {
    padding: '7px 12px',
    fontSize: 11,
    color: 'var(--accent)',
    fontWeight: 600,
    borderBottom: '1px solid var(--border)',
    marginBottom: 4,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    width: '100%',
    padding: '7px 11px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 12.5,
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: 5,
    fontFamily: 'Segoe UI, sans-serif',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: 'var(--border)',
    margin: '4px 0',
  },
};

export default TreeContextMenu;