// =====================================================
// src/components/sidebar/BulkPanel.tsx
// Панель массовых операций над выделенными объектами
// =====================================================

import { useState } from 'react';
import {
  X,
  Copy,
  Scissors,
  MoveRight,
  FilePlus,
  Eye,
  EyeOff,
  Download,
  Trash2,
  ListChecks,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { BulkPanelProps } from './types';

function BulkPanel({
  selectedIds,
  onClearSelection,
  onCopy,
  onCut,
  onMoveRequest,
  onDuplicate,
  onToggleVisibleMultiple,
  onExportMultiple,
  onDeleteMultiple,
}: BulkPanelProps) {
  const [open, setOpen] = useState(true);
  const count = selectedIds.length;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <ListChecks size={12} color="var(--accent)" />
        <span style={styles.count}>Выделено: {count}</span>
        <button
          style={styles.iconBtn}
          onClick={function () {
            setOpen(!open);
          }}
          title={open ? 'Свернуть' : 'Развернуть'}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <button
          style={styles.iconBtn}
          onClick={onClearSelection}
          title="Снять выделение"
        >
          <X size={11} />
        </button>
      </div>

      {open && (
        <div style={styles.actions}>
          <button
            style={styles.btn}
            onClick={function () {
              onCopy(selectedIds);
            }}
          >
            <Copy size={11} /> Копировать
          </button>
          <button
            style={styles.btn}
            onClick={function () {
              onCut(selectedIds);
            }}
          >
            <Scissors size={11} /> Вырезать
          </button>
          <button
            style={styles.btn}
            onClick={function () {
              onMoveRequest(selectedIds);
            }}
          >
            <MoveRight size={11} /> Переместить
          </button>
          <button
            style={styles.btn}
            onClick={function () {
              onDuplicate(selectedIds);
            }}
          >
            <FilePlus size={11} /> Дублировать
          </button>
          <button
            style={styles.btn}
            onClick={function () {
              onToggleVisibleMultiple(selectedIds, true);
            }}
          >
            <Eye size={11} /> Показать
          </button>
          <button
            style={styles.btn}
            onClick={function () {
              onToggleVisibleMultiple(selectedIds, false);
            }}
          >
            <EyeOff size={11} /> Скрыть
          </button>
          <button
            style={styles.btn}
            onClick={function () {
              onExportMultiple(selectedIds, 'kmz');
            }}
          >
            <Download size={11} /> KMZ
          </button>
          <button
            style={{ ...styles.btn, color: 'var(--danger)' }}
            onClick={function () {
              onDeleteMultiple(selectedIds);
            }}
          >
            <Trash2 size={11} /> Удалить
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
  panel: {
    margin: 6,
    padding: 5,
    backgroundColor: 'var(--bg-surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  count: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--accent)',
    flex: 1,
  },
  iconBtn: {
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: 0,
    borderRadius: 3,
  },
  actions: {
    display: 'flex',
    gap: 3,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '3px 7px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 10.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default BulkPanel;