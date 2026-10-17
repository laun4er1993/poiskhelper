// =====================================================
// src/components/properties/LabelEditor.tsx
// Редактор подписи объекта
// =====================================================

import { RotateCcw } from 'lucide-react';
import type { LabelSettings } from '../../types/labels';

// =====================================================
// === Пропсы ===
// =====================================================
interface LabelEditorProps {
  label: LabelSettings;
  setLabelField: <K extends keyof LabelSettings>(
    key: K,
    value: LabelSettings[K]
  ) => void;
  onResetToDefaults: () => void;
}

// =====================================================
// === Компонент ===
// =====================================================
function LabelEditor({
  label,
  setLabelField,
  onResetToDefaults,
}: LabelEditorProps) {
  return (
    <div style={styles.editor}>
      {/* Показывать подпись */}
      <div style={styles.row}>
        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={label.show}
            onChange={function (e) {
              setLabelField('show', e.target.checked);
            }}
          />
          <span style={{ marginLeft: 6 }}>Показывать подпись</span>
        </label>
      </div>

      {/* Шрифт */}
      <div style={styles.field}>
        <label style={styles.miniLabel}>Шрифт</label>
        <select
          value={label.fontFamily}
          onChange={function (e) {
            setLabelField('fontFamily', e.target.value);
          }}
          style={styles.select}
        >
          <option value="Segoe UI">Segoe UI</option>
          <option value="Arial">Arial</option>
          <option value="Consolas">Consolas</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>

      {/* Размер */}
      <div style={styles.field}>
        <label style={styles.miniLabel}>
          Размер: <span style={styles.accent}>{label.fontSize} px</span>
        </label>
        <input
          type="range"
          min={8}
          max={32}
          value={label.fontSize}
          onChange={function (e) {
            setLabelField('fontSize', parseInt(e.target.value));
          }}
          style={styles.range}
        />
      </div>

      {/* Цвет текста */}
      <div style={styles.field}>
        <label style={styles.miniLabel}>Цвет текста</label>
        <div style={styles.colorRow}>
          <input
            type="color"
            value={label.fillColor}
            onChange={function (e) {
              setLabelField('fillColor', e.target.value);
            }}
            style={styles.colorInputSmall}
          />
          <span style={styles.colorValueSmall}>{label.fillColor}</span>
        </div>
      </div>

      {/* Обводка */}
      <div style={styles.field}>
        <label style={styles.miniLabel}>Обводка</label>
        <div style={styles.colorRow}>
          <input
            type="color"
            value={label.outlineColor}
            onChange={function (e) {
              setLabelField('outlineColor', e.target.value);
            }}
            style={styles.colorInputSmall}
          />
          <input
            type="range"
            min={0}
            max={8}
            value={label.outlineWidth}
            onChange={function (e) {
              setLabelField('outlineWidth', parseInt(e.target.value));
            }}
            style={styles.rangeSmall}
          />
          <span style={styles.colorValueSmall}>{label.outlineWidth}px</span>
        </div>
      </div>

      {/* Фон под текстом */}
      <div style={styles.row}>
        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={label.showBackground}
            onChange={function (e) {
              setLabelField('showBackground', e.target.checked);
            }}
          />
          <span style={{ marginLeft: 6 }}>Фон под текстом</span>
        </label>
      </div>

      {label.showBackground && (
        <>
          <div style={styles.field}>
            <label style={styles.miniLabel}>Цвет фона</label>
            <div style={styles.colorRow}>
              <input
                type="color"
                value={label.backgroundColor}
                onChange={function (e) {
                  setLabelField('backgroundColor', e.target.value);
                }}
                style={styles.colorInputSmall}
              />
              <span style={styles.colorValueSmall}>
                {Math.round(label.backgroundAlpha * 100)}%
              </span>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.miniLabel}>Прозрачность фона</label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(label.backgroundAlpha * 100)}
              onChange={function (e) {
                setLabelField(
                  'backgroundAlpha',
                  parseInt(e.target.value) / 100
                );
              }}
              style={styles.range}
            />
          </div>
        </>
      )}

      {/* Смещения */}
      <div style={styles.field}>
        <label style={styles.miniLabel}>
          Смещение X: <span style={styles.accent}>{label.offsetX} px</span>
        </label>
        <input
          type="range"
          min={-80}
          max={80}
          value={label.offsetX}
          onChange={function (e) {
            setLabelField('offsetX', parseInt(e.target.value));
          }}
          style={styles.range}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.miniLabel}>
          Смещение Y: <span style={styles.accent}>{label.offsetY} px</span>
        </label>
        <input
          type="range"
          min={-80}
          max={80}
          value={label.offsetY}
          onChange={function (e) {
            setLabelField('offsetY', parseInt(e.target.value));
          }}
          style={styles.range}
        />
      </div>

      {/* Прозрачность */}
      <div style={styles.field}>
        <label style={styles.miniLabel}>
          Прозрачность:{' '}
          <span style={styles.accent}>
            {Math.round(label.opacity * 100)}%
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(label.opacity * 100)}
          onChange={function (e) {
            setLabelField('opacity', parseInt(e.target.value) / 100);
          }}
          style={styles.range}
        />
      </div>

      {/* Скрытие при отдалении */}
      <div style={styles.field}>
        <label style={styles.miniLabel}>
          Скрывать при расстоянии {'>'}{' '}
          <span style={styles.accent}>
            {label.hideAtDistance > 0
              ? (label.hideAtDistance / 1000).toFixed(0) + ' км'
              : 'выкл'}
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={20000000}
          step={1000}
          value={label.hideAtDistance}
          onChange={function (e) {
            setLabelField('hideAtDistance', parseInt(e.target.value));
          }}
          style={styles.range}
        />
      </div>

      {/* Кнопка сброса */}
      <button style={styles.resetBtn} onClick={onResetToDefaults}>
        <RotateCcw size={11} /> Вернуть к глобальным настройкам
      </button>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '8px 0',
    borderTop: '1px solid var(--border)',
    marginTop: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  miniLabel: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginBottom: 2,
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
  range: {
    width: '100%',
    accentColor: 'var(--accent)',
  },
  rangeSmall: {
    flex: 1,
    accentColor: 'var(--accent)',
  },
  accent: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  colorInputSmall: {
    width: 36,
    height: 24,
    padding: 2,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    cursor: 'pointer',
    flexShrink: 0,
  },
  colorValueSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
    minWidth: 40,
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '6px 10px',
    marginTop: 4,
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 5,
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default LabelEditor;