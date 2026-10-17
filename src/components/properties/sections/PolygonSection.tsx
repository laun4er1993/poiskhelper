// =====================================================
// src/components/properties/sections/PolygonSection.tsx
// Секция свойств полигона
// =====================================================

import type { KmlPolygon } from '../../../types/base';
import type { Draft } from '../types';

interface PolygonSectionProps {
  item: KmlPolygon;
  getVal: <K extends keyof Draft>(field: K, fallback: any) => any;
  setField: <K extends keyof Draft>(field: K, value: Draft[K]) => void;
}

function PolygonSection({ item, getVal, setField }: PolygonSectionProps) {
  return (
    <>
      <div style={styles.infoBlock}>
        <span style={styles.infoLabel}>Точек:</span>
        <span style={styles.infoValue}>{item.positions.length}</span>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Цвет заливки</label>
        <input
          type="color"
          value={getVal('fillColor', item.fillColor || '#4a90d9')}
          onChange={function (e) {
            setField('fillColor', e.target.value);
          }}
          style={styles.colorInput}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Цвет контура</label>
        <input
          type="color"
          value={getVal(
            'polygonOutlineColor',
            item.outlineColor || '#ffffff'
          )}
          onChange={function (e) {
            setField('polygonOutlineColor', e.target.value);
          }}
          style={styles.colorInput}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Толщина контура:{' '}
          <span style={styles.accent}>
            {getVal('polygonOutlineWidth', item.outlineWidth || 2)} px
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={15}
          value={getVal('polygonOutlineWidth', item.outlineWidth || 2)}
          onChange={function (e) {
            setField('polygonOutlineWidth', parseInt(e.target.value));
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

export default PolygonSection;