// =====================================================
// src/components/properties/ColorSection.tsx
// Секция «Цвета метки»: заливка внутри, обводка по контуру
// =====================================================

import { Palette } from 'lucide-react';
import IconPreview from './IconPreview';

// =====================================================
// === Пропсы ===
// =====================================================
interface ColorSectionProps {
  // Заливка
  currentColor: string;
  currentShowFill: boolean;
  currentFillOpacity: number;

  // Обводка
  currentOutlineColor: string;
  currentShowOutline: boolean;
  currentOutlineWidth: number;
  currentOutlineOpacity: number;

  currentIconHref: string;

  onChangeColor: (value: string) => void;
  onChangeShowFill: (value: boolean) => void;
  onChangeFillOpacity: (value: number) => void;

  onChangeOutlineColor: (value: string) => void;
  onChangeShowOutline: (value: boolean) => void;
  onChangeOutlineWidth: (value: number) => void;
  onChangeOutlineOpacity: (value: number) => void;
}

// =====================================================
// === Компонент ===
// =====================================================
function ColorSection({
  currentColor,
  currentShowFill,
  currentFillOpacity,
  currentOutlineColor,
  currentShowOutline,
  currentOutlineWidth,
  currentOutlineOpacity,
  currentIconHref,
  onChangeColor,
  onChangeShowFill,
  onChangeFillOpacity,
  onChangeOutlineColor,
  onChangeShowOutline,
  onChangeOutlineWidth,
  onChangeOutlineOpacity,
}: ColorSectionProps) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>
        <Palette size={11} /> Цвета метки
      </div>

      {/* ============ ЗАЛИВКА ============ */}
      <div style={styles.field}>
        <div style={styles.labelRow}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={currentShowFill}
              onChange={function (e) {
                onChangeShowFill(e.target.checked);
              }}
            />
            <span style={{ marginLeft: 6 }}>Заливка (внутри иконки)</span>
          </label>
        </div>

        <div
          style={{
            ...styles.colorRow,
            opacity: currentShowFill ? 1 : 0.4,
            pointerEvents: currentShowFill ? 'auto' : 'none',
          }}
        >
          <input
            type="color"
            value={currentColor}
            onChange={function (e) {
              onChangeColor(e.target.value);
            }}
            style={styles.colorInput}
          />
          <span style={styles.colorValue}>{currentColor}</span>
          <span
            style={{ ...styles.colorSwatch, backgroundColor: currentColor }}
            title="Заливка"
          />
        </div>

        <div
          style={{
            opacity: currentShowFill ? 1 : 0.4,
            pointerEvents: currentShowFill ? 'auto' : 'none',
          }}
        >
          <label style={styles.miniLabel}>
            Прозрачность:{' '}
            <span style={styles.accent}>
              {Math.round(currentFillOpacity * 100)}%
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(currentFillOpacity * 100)}
            onChange={function (e) {
              onChangeFillOpacity(parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
        </div>
      </div>

      {/* ============ ОБВОДКА ============ */}
      <div style={styles.field}>
        <div style={styles.labelRow}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={currentShowOutline}
              onChange={function (e) {
                onChangeShowOutline(e.target.checked);
              }}
            />
            <span style={{ marginLeft: 6 }}>Обводка (по контуру)</span>
          </label>
        </div>

        <div
          style={{
            ...styles.colorRow,
            opacity: currentShowOutline ? 1 : 0.4,
            pointerEvents: currentShowOutline ? 'auto' : 'none',
          }}
        >
          <input
            type="color"
            value={currentOutlineColor}
            onChange={function (e) {
              onChangeOutlineColor(e.target.value);
            }}
            style={styles.colorInput}
          />
          <span style={styles.colorValue}>{currentOutlineColor}</span>
          <span
            style={{
              ...styles.colorSwatch,
              backgroundColor: currentOutlineColor,
            }}
            title="Обводка"
          />
        </div>

        <div
          style={{
            opacity: currentShowOutline ? 1 : 0.4,
            pointerEvents: currentShowOutline ? 'auto' : 'none',
          }}
        >
          <label style={styles.miniLabel}>
            Толщина обводки:{' '}
            <span style={styles.accent}>
              {currentOutlineWidth.toFixed(1)} px
            </span>
          </label>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={currentOutlineWidth}
            onChange={function (e) {
              onChangeOutlineWidth(parseFloat(e.target.value));
            }}
            style={styles.range}
          />

          <label style={styles.miniLabel}>
            Прозрачность:{' '}
            <span style={styles.accent}>
              {Math.round(currentOutlineOpacity * 100)}%
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(currentOutlineOpacity * 100)}
            onChange={function (e) {
              onChangeOutlineOpacity(parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
        </div>
      </div>

      {/* ============ ПРЕВЬЮ ============ */}
      <div style={styles.previewWrap}>
        <span style={styles.previewLabel}>Превью:</span>
        <div style={styles.previewCanvas} className="checker-bg">
          <IconPreview
            iconHref={currentIconHref}
            sizePx={28}
            fillColor={currentColor}
            fillOpacity={currentFillOpacity}
            showFill={currentShowFill}
            outlineColor={currentOutlineColor}
            outlineOpacity={currentOutlineOpacity}
            showOutline={currentShowOutline}
            outlineWidth={currentOutlineWidth}
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '12px 12px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10.5,
    fontWeight: 700,
    color: 'var(--accent)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11.5,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontWeight: 500,
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
  colorValue: {
    fontSize: 11.5,
    color: 'var(--text-secondary)',
    fontFamily: 'Consolas, monospace',
    flex: 1,
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 4,
    border: '1px solid var(--border)',
    flexShrink: 0,
  },
  miniLabel: {
    display: 'block',
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginBottom: 2,
    marginTop: 4,
  },
  range: {
    width: '100%',
    accentColor: 'var(--accent)',
  },
  accent: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
  previewWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTop: '1px dashed var(--border)',
  },
  previewLabel: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCanvas: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: 8,
  },
};

export default ColorSection;