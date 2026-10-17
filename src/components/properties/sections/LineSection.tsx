// =====================================================
// src/components/properties/sections/LineSection.tsx
// Секция свойств линии
// =====================================================

import type { KmlLine } from '../../../types/base';
import type { Draft } from '../types';

interface LineSectionProps {
  item: KmlLine;
  getVal: <K extends keyof Draft>(field: K, fallback: any) => any;
  setField: <K extends keyof Draft>(field: K, value: Draft[K]) => void;
}

function LineSection({ item, getVal, setField }: LineSectionProps) {
  return (
    <>
      <div style={styles.infoBlock}>
        <span style={styles.infoLabel}>Точек:</span>
        <span style={styles.infoValue}>{item.positions.length}</span>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Цвет</label>
        <input
          type="color"
          value={getVal('color', item.color || '#f1c40f')}
          onChange={function (e) {
            setField('color', e.target.value);
          }}
          style={styles.colorInput}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Толщина:{' '}
          <span style={styles.accent}>{getVal('width', item.width || 3)} px</span>
        </label>
        <input
          type="range"
          min={1}
          max={15}
          value={getVal('width', item.width || 3)}
          onChange={function (e) {
            setField('width', parseInt(e.target.value));
          }}
          style={styles.range}
        />
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
  colorInput: {
    width: 46,
    height: 30,
    padding: 2,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    cursor: 'pointer',
  },
  range: {
    width: '100%',
    accentColor: 'var(--accent)',
  },
  accent: {
    color: 'var(--accent)',
    fontWeight: 600,
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

export default LineSection;