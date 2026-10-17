// =====================================================
// src/components/properties/sections/ContainerSection.tsx
// Секция свойств папки/KML-файла
// =====================================================

import { FolderPlus, MapPin } from 'lucide-react';
import type { Folder, KmlFile } from '../../../types/base';
import type { Draft } from '../types';

interface ContainerSectionProps {
  item: Folder | KmlFile;
  getVal: <K extends keyof Draft>(field: K, fallback: any) => any;
  setField: <K extends keyof Draft>(field: K, value: Draft[K]) => void;
  onAddFolder: (parentId: string) => void;
  onAddPlace: (parentId: string) => void;
}

function ContainerSection({
  item,
  getVal,
  setField,
  onAddFolder,
  onAddPlace,
}: ContainerSectionProps) {
  const currentSortField =
    getVal('sortField', (item as any).sortField || 'manual') as string;

  return (
    <>
      <div style={styles.infoBlock}>
        <span style={styles.infoLabel}>Объектов:</span>
        <span style={styles.infoValue}>{item.children.length}</span>
      </div>

      {/* === Сортировка === */}
      <div style={styles.field}>
        <label style={styles.label}>Сортировка</label>
        <select
          value={currentSortField}
          onChange={function (e) {
            setField('sortField', e.target.value);
          }}
          style={styles.select}
        >
          <option value="manual">Вручную</option>
          <option value="name">По имени</option>
          <option value="type">По типу</option>
          <option value="date">По дате</option>
        </select>
      </div>

      {(currentSortField === 'name' || currentSortField === 'date') && (
        <div style={styles.field}>
          <label style={styles.label}>Порядок</label>
          <select
            value={getVal('sortOrder', (item as any).sortOrder || 'asc')}
            onChange={function (e) {
              setField('sortOrder', e.target.value);
            }}
            style={styles.select}
          >
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </div>
      )}

      {/* === Создать внутри === */}
      <div style={styles.field}>
        <label style={styles.label}>Создать внутри</label>
        <div style={styles.rowButtons}>
          <button
            style={styles.smallBtn}
            onClick={function () {
              onAddFolder(item.id);
            }}
          >
            <FolderPlus size={11} /> Папку
          </button>
          <button
            style={styles.smallBtn}
            onClick={function () {
              onAddPlace(item.id);
            }}
          >
            <MapPin size={11} /> Метку
          </button>
        </div>
      </div>
    </>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  label: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    color: 'var(--text-primary)',
    fontSize: 12,
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  rowButtons: {
    display: 'flex',
    gap: 6,
    marginTop: 4,
  },
  smallBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '6px 8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 5,
    color: 'var(--text-primary)',
    fontSize: 11.5,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  infoBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    fontSize: 12,
  },
  infoLabel: {
    color: 'var(--text-secondary)',
  },
  infoValue: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
};

export default ContainerSection;