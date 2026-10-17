// =====================================================
// src/components/properties/sections/PlaceSection.tsx
// Секция свойств метки (точки)
// =====================================================

import { Crosshair, Hash } from 'lucide-react';
import type { Place } from '../../../types/base';
import IconPreview from '../IconPreview';
import IconPicker from '../IconPicker';
import ColorSection from '../ColorSection';
import type { Draft } from '../types';

// =====================================================
// === Пропсы ===
// =====================================================
interface PlaceSectionProps {
  item: Place;
  draft: Draft;
  getVal: <K extends keyof Draft>(field: K, fallback: any) => any;
  setField: <K extends keyof Draft>(field: K, value: Draft[K]) => void;
  onCopyCoords: (text: string, label: string) => void;
  onFlyTo: (place: Place) => void;
}

// =====================================================
// === Компонент ===
// =====================================================
function PlaceSection({
  item,
  getVal,
  setField,
  onCopyCoords,
  onFlyTo,
}: PlaceSectionProps) {
  // === Текущие значения ===
  const currentIconHref =
    (getVal('iconHref', item.iconHref || '') as string) || '';

  const currentColor =
    (getVal('color', item.color || '#e74c3c') as string) || '#e74c3c';
  const currentShowFill =
    (getVal('showFill', item.showFill !== false) as boolean) !== false;
  const currentFillOpacity =
    (getVal('fillOpacity', item.fillOpacity ?? 1) as number) ?? 1;

  const currentOutlineColor =
    (getVal('outlineColor', item.outlineColor || '#000000') as string) ||
    '#000000';
  const currentShowOutline =
    (getVal('showOutline', item.showOutline !== false) as boolean) !== false;
  const currentOutlineWidth =
    (getVal(
      'outlineWidth',
      item.outlineWidth !== undefined ? item.outlineWidth : 1
    ) as number) ?? 1;
  const currentOutlineOpacity =
    (getVal('outlineOpacity', item.outlineOpacity ?? 1) as number) ?? 1;

  const currentPixelSize =
    (getVal('pixelSize', item.pixelSize || 6) as number) || 6;

  return (
    <>
      {/* ============ КООРДИНАТЫ ============ */}
      <div style={styles.field}>
        <label style={styles.label}>Координаты</label>
        <div style={styles.coordRow}>
          <div style={styles.coordField}>
            <span style={styles.coordLabel}>Широта</span>
            <input
              type="number"
              value={getVal('lat', item.lat)}
              onChange={function (e) {
                setField('lat', parseFloat(e.target.value) || 0);
              }}
              style={styles.input}
              step={0.000001}
            />
          </div>
          <div style={styles.coordField}>
            <span style={styles.coordLabel}>Долгота</span>
            <input
              type="number"
              value={getVal('lon', item.lon)}
              onChange={function (e) {
                setField('lon', parseFloat(e.target.value) || 0);
              }}
              style={styles.input}
              step={0.000001}
            />
          </div>
        </div>
        <div style={styles.rowButtons}>
          <button
            style={styles.smallBtn}
            onClick={function () {
              const lat = (getVal('lat', item.lat) as number) || item.lat;
              const lon = (getVal('lon', item.lon) as number) || item.lon;
              onCopyCoords(
                lat.toFixed(8) + ', ' + lon.toFixed(8),
                item.name
              );
            }}
          >
            <Hash size={11} /> Копировать
          </button>
          <button
            style={styles.smallBtn}
            onClick={function () {
              onFlyTo(item);
            }}
          >
            <Crosshair size={11} /> Перелететь
          </button>
        </div>
      </div>

      {/* ============ ВЫСОТА ============ */}
      <div style={styles.field}>
        <label style={styles.label}>Высота (м)</label>
        <input
          type="number"
          value={getVal('height', item.height || 0)}
          onChange={function (e) {
            setField('height', parseFloat(e.target.value) || 0);
          }}
          style={styles.input}
          step={10}
        />
      </div>

      {/* ============ ОПИСАНИЕ ============ */}
      <div style={styles.field}>
        <label style={styles.label}>Описание</label>
        <textarea
          value={getVal('description', item.description || '')}
          onChange={function (e) {
            setField('description', e.target.value);
          }}
          style={styles.textarea}
          rows={3}
          placeholder="Подробное описание..."
        />
      </div>

      {/* ============ РАЗМЕР ============ */}
      <div style={styles.field}>
        <label style={styles.label}>
          Размер:{' '}
          <span style={styles.accent}>{currentPixelSize} px</span>
        </label>
        <input
          type="range"
          min={4}
          max={24}
          value={currentPixelSize}
          onChange={function (e) {
            setField('pixelSize', parseInt(e.target.value));
          }}
          style={styles.range}
        />
      </div>

      {/* ============ ИКОНКА ============ */}
      <div style={styles.field}>
        <label style={styles.label}>Иконка</label>
        <IconPicker
          currentIconHref={currentIconHref}
          currentColor={currentColor}
          currentOutlineColor={currentOutlineColor}
          currentOutlineWidth={currentOutlineWidth}
          onChange={function (href) {
            setField('iconHref', href);
          }}
        />
      </div>

      {/* ============ ЦВЕТА ============ */}
      <ColorSection
        currentColor={currentColor}
        currentShowFill={currentShowFill}
        currentFillOpacity={currentFillOpacity}
        currentOutlineColor={currentOutlineColor}
        currentShowOutline={currentShowOutline}
        currentOutlineWidth={currentOutlineWidth}
        currentOutlineOpacity={currentOutlineOpacity}
        currentIconHref={currentIconHref}
        onChangeColor={function (v) {
          setField('color', v);
        }}
        onChangeShowFill={function (v) {
          setField('showFill', v);
        }}
        onChangeFillOpacity={function (v) {
          setField('fillOpacity', v);
        }}
        onChangeOutlineColor={function (v) {
          setField('outlineColor', v);
        }}
        onChangeShowOutline={function (v) {
          setField('showOutline', v);
        }}
        onChangeOutlineWidth={function (v) {
          setField('outlineWidth', v);
        }}
        onChangeOutlineOpacity={function (v) {
          setField('outlineOpacity', v);
        }}
      />
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
  input: {
    width: '100%',
    padding: '7px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    color: 'var(--text-primary)',
    fontSize: 12.5,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '7px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    color: 'var(--text-primary)',
    fontSize: 12.5,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  coordRow: {
    display: 'flex',
    gap: 8,
  },
  coordField: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
  },
  coordLabel: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
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
  range: {
    width: '100%',
    accentColor: 'var(--accent)',
  },
  accent: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
};

export default PlaceSection;