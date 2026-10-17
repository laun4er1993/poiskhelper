// =====================================================
// src/components/sidebar/TreeModule.tsx
// Секция «Мои объекты»
// =====================================================

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  FolderPlus,
  Upload,
  ArrowUp,
  ArrowDown,
  ChevronsDownUp,
  RefreshCw,
} from 'lucide-react';
import TreeView from '../tree/TreeView';
import type { TreeModuleProps } from './types';

function TreeModule({
  tree,
  placesCount,
  open,
  isRootView,
  onToggleOpen,
  onGoUp,
  onAddFolderRoot,
  onAddPlaceRoot,
  onImport,
  onCollapseAll,
  onMoveUpDown,
  focusedFolderId,
  treeCommon,
}: TreeModuleProps) {
  const [headerCtx, setHeaderCtx] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // === ПКМ по заголовку «Мои объекты» ===
  const handleHeaderContextMenu = function (e: React.MouseEvent) {
    e.preventDefault();
    setHeaderCtx({ x: e.clientX, y: e.clientY });
  };

  const closeHeaderCtx = function () {
    setHeaderCtx(null);
  };

  return (
    <div style={styles.module}>
      <div
        style={styles.header}
        onContextMenu={handleHeaderContextMenu}
      >
        <button
          style={{
            ...styles.toggle,
            opacity: isRootView ? 0.35 : 1,
            cursor: isRootView ? 'default' : 'pointer',
            flex: 'initial',
            padding: '3px 5px',
          }}
          onClick={onGoUp}
          disabled={isRootView}
          title={
            isRootView
              ? 'Уже в корне'
              : 'На уровень вверх'
          }
        >
          <ArrowUp size={11} />
        </button>

        <button style={styles.toggle} onClick={onToggleOpen}>
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          <MapPin size={11} color="var(--accent)" />
          <span style={styles.title}>Мои объекты</span>
          <span style={styles.countPill}>{placesCount}</span>
        </button>

        <div style={styles.actions}>
          <button
            style={styles.actionBtn}
            title="Свернуть все папки"
            onClick={onCollapseAll}
          >
            <ChevronsDownUp size={12} />
          </button>
          <button
            style={styles.actionBtn}
            title="Новая папка"
            onClick={onAddFolderRoot}
          >
            <FolderPlus size={12} />
          </button>
          <button
            style={styles.actionBtn}
            title="Новая метка"
            onClick={onAddPlaceRoot}
          >
            <MapPin size={12} />
          </button>
          <button
            style={styles.actionBtn}
            title="Импорт KML/KMZ"
            onClick={onImport}
          >
            <Upload size={12} />
          </button>
        </div>
      </div>

      {open && (
        <div style={styles.content} data-tree-scroll="true">
          {tree.length === 0 ? (
            <div style={styles.placeholder}>
              <MapPin
                size={26}
                color="var(--text-muted)"
                strokeWidth={1.2}
              />
              <div style={styles.placeholderTitle}>Пока пусто</div>
              <div style={styles.placeholderHint}>
                Импортируйте KML/KMZ или создайте папку.
              </div>
            </div>
          ) : (
            <TreeView items={tree} {...treeCommon} />
          )}
        </div>
      )}

      {/* === ПКМ-меню заголовка === */}
      {headerCtx && (
        <div
          style={{
            position: 'fixed',
            top: headerCtx.y,
            left: headerCtx.x,
            zIndex: 2147483647,
            backgroundColor: 'var(--bg-modal)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxShadow: 'var(--shadow-lg)',
            padding: 4,
            minWidth: 220,
          }}
          onMouseLeave={closeHeaderCtx}
        >
          <button
            style={styles.ctxMenuItem}
            onClick={function () {
              if (focusedFolderId) {
                onMoveUpDown(focusedFolderId, 'up');
              }
              closeHeaderCtx();
            }}
            disabled={!focusedFolderId}
          >
            <ArrowUp size={12} /> Переместить папку вверх
          </button>
          <button
            style={styles.ctxMenuItem}
            onClick={function () {
              if (focusedFolderId) {
                onMoveUpDown(focusedFolderId, 'down');
              }
              closeHeaderCtx();
            }}
            disabled={!focusedFolderId}
          >
            <ArrowDown size={12} /> Переместить папку вниз
          </button>
        </div>
      )}
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  module: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '3px 5px',
    backgroundColor: 'var(--bg-surface-hover)',
    userSelect: 'none',
    gap: 2,
    flexShrink: 0,
    minHeight: 24,
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
    padding: '3px 5px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 4,
    textAlign: 'left',
  },
  title: {
    marginLeft: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  countPill: {
    fontSize: 9.5,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-input)',
    padding: '0px 5px',
    borderRadius: 8,
    fontWeight: 500,
    fontFamily: 'Consolas, monospace',
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    gap: 2,
    flexShrink: 0,
  },
  actionBtn: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.15s',
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '3px 3px 8px 3px',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '30px 16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
  },
  placeholderTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginTop: 4,
  },
  placeholderHint: {
    fontSize: 10.5,
    lineHeight: 1.45,
    maxWidth: 220,
  },
  ctxMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '7px 10px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: 4,
    fontFamily: 'inherit',
  },
};

export default TreeModule;