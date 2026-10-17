// =====================================================
// src/components/move-dialog/MoveDialog.tsx
// Диалог «Переместить в папку»
// =====================================================

import { useState } from 'react';
import {
  X,
  MoveRight,
  Folder as FolderIcon,
  FolderOpen,
  Home,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import type { TreeItem } from '../../types/base';
import { isContainer } from '../../types/base';
import { collectDescendantIds } from '../../types/tree-utils';

import type { MoveDialogProps, FolderNode } from './types';

// =====================================================
// === Утилита: поиск элемента по ID ===
// =====================================================
function findItem(items: TreeItem[], id: string): TreeItem | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.id === id) return item;
    if (isContainer(item)) {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

// =====================================================
// === Компонент ===
// =====================================================
function MoveDialog({
  items,
  movingIds,
  onConfirm,
  onCancel,
}: MoveDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Заблокированные ID: перемещаемые и все их потомки
  const blockedIds: Record<string, boolean> = {};
  movingIds.forEach(function (id) {
    blockedIds[id] = true;
    const item = findItem(items, id);
    if (item) {
      const descendants = collectDescendantIds(item);
      descendants.forEach(function (d) {
        blockedIds[d] = true;
      });
    }
  });

  // Плоский список папок
  const rows: FolderNode[] = [];
  function walk(
    list: TreeItem[],
    depth: number,
    parentId: string | null,
    hiddenByCollapse: boolean
  ) {
    list.forEach(function (item) {
      if (!isContainer(item)) return;

      const isBlocked = blockedIds[item.id] === true;
      let reason = '';
      if (isBlocked) {
        if (movingIds.indexOf(item.id) >= 0)
          reason = 'Это перемещаемый объект';
        else reason = 'Внутри перемещаемого объекта';
      }

      const hasChildren = item.children.some(function (c) {
        return isContainer(c);
      });

      if (!hiddenByCollapse) {
        rows.push({
          id: item.id,
          name: item.name,
          depth: depth,
          isKml: item.type === 'kmlfile',
          disabled: isBlocked,
          disabledReason: reason,
          hasChildren: hasChildren,
          parentId: parentId,
        });
      }

      const isCollapsed = collapsed[item.id] === true;
      const childHidden = hiddenByCollapse || isCollapsed;
      walk(item.children, depth + 1, item.id, childHidden);
    });
  }
  walk(items, 0, null, false);

  const handleConfirm = function () {
    if (!selectedFolderId) {
      alert('Выберите папку назначения.');
      return;
    }
    const row = rows.find(function (r) {
      return r.id === selectedFolderId;
    });
    if (row && row.disabled) {
      alert(
        'Эту папку выбрать нельзя: ' + (row.disabledReason || 'запрещено')
      );
      return;
    }
    onConfirm(selectedFolderId);
  };

  const handleDoubleClick = function (row: FolderNode) {
    if (row.disabled) return;
    setSelectedFolderId(row.id);
    setTimeout(function () {
      onConfirm(row.id);
    }, 50);
  };

  const toggleCollapse = function (e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setCollapsed(function (prev) {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const countMoving = movingIds.length;

  return (
    <div style={styles.backdrop} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <MoveRight size={16} color="var(--accent)" />
          <span style={styles.title}>Переместить в папку</span>
          <button
            style={styles.closeBtn}
            onClick={onCancel}
            title="Закрыть (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        <div style={styles.infoBar}>
          Перемещается объектов: <b>{countMoving}</b>
        </div>

        <div style={styles.hint}>
          Кликните по папке, чтобы выбрать. Двойной клик — сразу
          переместить.
        </div>

        <div style={styles.content}>
          {rows.length === 0 ? (
            <div style={styles.empty}>
              Нет папок. Создайте хотя бы одну папку для перемещения.
            </div>
          ) : (
            rows.map(function (row) {
              const isSelected = selectedFolderId === row.id;
              const isCollapsed = collapsed[row.id] === true;
              return (
                <div
                  key={row.id}
                  style={{
                    ...styles.folderRow,
                    paddingLeft: 8 + row.depth * 18,
                    backgroundColor: isSelected
                      ? 'var(--accent-soft-hover)'
                      : row.disabled
                      ? 'var(--danger-soft)'
                      : 'transparent',
                    borderLeft: isSelected
                      ? '3px solid var(--accent)'
                      : row.disabled
                      ? '3px solid var(--danger-border)'
                      : '3px solid transparent',
                    opacity: row.disabled ? 0.55 : 1,
                    cursor: row.disabled ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => {
                    if (row.disabled) return;
                    setSelectedFolderId(row.id);
                  }}
                  onDoubleClick={() => handleDoubleClick(row)}
                  title={row.disabledReason || row.name}
                >
                  {row.hasChildren ? (
                    <span
                      style={styles.collapseBtn}
                      onClick={(e) => toggleCollapse(e, row.id)}
                    >
                      {isCollapsed ? (
                        <ChevronRight size={11} />
                      ) : (
                        <ChevronDown size={11} />
                      )}
                    </span>
                  ) : (
                    <span style={styles.collapsePlaceholder} />
                  )}

                  {row.depth === 0 ? (
                    <Home size={13} color="var(--warning)" />
                  ) : row.isKml ? (
                    <FolderOpen size={13} color="var(--success)" />
                  ) : (
                    <FolderIcon size={13} color="var(--warning)" />
                  )}
                  <span style={styles.folderName}>{row.name}</span>
                  {isSelected && <span style={styles.selectedMark}>✓</span>}
                </div>
              );
            })
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Отмена
          </button>
          <button
            style={{
              ...styles.confirmBtn,
              opacity: selectedFolderId ? 1 : 0.5,
              cursor: selectedFolderId ? 'pointer' : 'not-allowed',
            }}
            onClick={handleConfirm}
            disabled={!selectedFolderId}
          >
            <MoveRight size={14} /> Переместить
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--backdrop)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    fontFamily: 'Segoe UI, sans-serif',
    animation: 'fadeIn 0.15s ease',
  },
  modal: {
    width: 480,
    maxWidth: '92vw',
    maxHeight: '85vh',
    backgroundColor: 'var(--bg-modal)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xl)',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    animation: 'scaleIn 0.16s ease',
  },
  header: {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg-panel-header)',
    gap: 8,
    flexShrink: 0,
  },
  title: { flex: 1, fontSize: 14, fontWeight: 600 },
  closeBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  infoBar: {
    padding: '8px 16px',
    fontSize: 12,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--accent-soft)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  hint: {
    padding: '8px 16px',
    fontSize: 11,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 12px 12px 12px',
  },
  folderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    fontSize: 12.5,
    transition: 'background-color 0.15s',
    borderBottom: '1px solid var(--border)',
    userSelect: 'none',
  },
  collapseBtn: {
    width: 14,
    height: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-muted)',
  },
  collapsePlaceholder: { width: 14 },
  folderName: {
    flex: 1,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  selectedMark: {
    color: 'var(--accent)',
    fontWeight: 900,
    fontSize: 14,
  },
  empty: {
    padding: '30px 20px',
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  footer: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    borderTop: '1px solid var(--border)',
    backgroundColor: 'var(--bg-panel-header)',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  cancelBtn: {
    padding: '7px 16px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  confirmBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 20px',
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: 'var(--accent-text)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default MoveDialog;