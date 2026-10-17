// =====================================================
// src/components/sidebar/ImportedModule.tsx
// Секция «Добавленные» (импортированные KML/KMZ файлы)
// =====================================================

import { ChevronDown, ChevronRight, Inbox, ArrowDownToLine } from 'lucide-react';
import TreeView from '../tree/TreeView';
import type { ImportedModuleProps } from './types';

function ImportedModule({
  importedItems,
  open,
  onToggleOpen,
  onMoveAllImported,
  treeCommon,
}: ImportedModuleProps) {
  return (
    <div style={styles.module}>
      <div style={styles.header}>
        <button style={styles.toggle} onClick={onToggleOpen}>
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          <Inbox size={11} color="var(--warning)" />
          <span style={styles.title}>Добавленные</span>
          <span style={styles.countPill}>{importedItems.length}</span>
        </button>

        <button
          style={styles.actionBtn}
          onClick={onMoveAllImported}
          title="Перенести все добавленные в «Мои объекты»"
        >
          <ArrowDownToLine size={12} />
        </button>
      </div>

      {open && (
        <div style={styles.content} data-tree-scroll="true">
          <TreeView items={importedItems} {...treeCommon} />
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
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '32vh',
    minHeight: 0,
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
  actionBtn: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--warning-soft)',
    border: '1px solid var(--warning-border)',
    borderRadius: 4,
    color: 'var(--warning)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    marginRight: 3,
  },
  content: {
    padding: '3px 3px 6px 3px',
    overflowY: 'auto',
    overflowX: 'hidden',
    minHeight: 0,
  },
};

export default ImportedModule;