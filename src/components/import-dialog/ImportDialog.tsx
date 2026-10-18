// =====================================================
// src/components/import-dialog/ImportDialog.tsx
// Диалог настроек импорта KML/KMZ
// =====================================================

import { useState } from 'react';
import {
  X,
  Upload,
  Eye,
  Palette,
  Ruler,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';
import type { ImportOptions, ImportDialogProps } from './types';

const PRESET_COLORS = [
  '#e74c3c',
  '#f1c40f',
  '#27ae60',
  '#3498db',
  '#9b59b6',
  '#e67e22',
  '#1abc9c',
  '#ffffff',
];

function ImportDialog({
  fileName,
  objectCount,
  sizeBytes,
  defaults,
  onConfirm,
  onCancel,
}: ImportDialogProps) {
  const d = defaults || {};

  // ⚡ Инициализация из defaults
  const [color, setColor] = useState(d.color || '#4a90d9');
  const [pixelSize, setPixelSize] = useState(d.pixelSize ?? 6);
  const [visible, setVisible] = useState(d.visible !== false);
  const [flyToBounds, setFlyToBounds] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showHidden, setShowHidden] = useState(true);
  const [importLinesAsMeasures, setImportLinesAsMeasures] = useState(false);
  const [startCollapsed, setStartCollapsed] = useState(
    d.startCollapsed !== false
  );

  const sizeMb = sizeBytes ? sizeBytes / 1024 / 1024 : 0;
  const isLarge = sizeMb > 50;
  const isHuge = sizeMb > 200;

  const handleConfirm = function () {
    onConfirm({
      color,
      pixelSize,
      visible,
      flyToBounds,
      showLabels,
      showHidden,
      importLinesAsMeasures,
      defaultRulerType: 'path',
      startCollapsed,
    });
  };

  return (
    <div style={styles.backdrop} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <Upload size={16} color="var(--accent)" />
          <span style={styles.title}>Настройки импорта</span>
          <button style={styles.closeBtn} onClick={onCancel}>
            <X size={16} />
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.fileInfo}>
            <div style={styles.fileName}>{fileName}</div>
            <div style={styles.fileMeta}>
              Найдено узлов дерева: {objectCount}
              {sizeBytes ? ' · Размер: ' + sizeMb.toFixed(2) + ' МБ' : ''}
            </div>
            <div style={styles.hintSmall}>
              «Узлы» включают папки; фактическое число точек/линий будет
              меньше и появится после импорта.
            </div>
          </div>

          {isHuge && (
            <div style={styles.warningBox}>
              <AlertTriangle size={16} color="var(--danger)" />
              <div>
                <b>Файл очень большой ({sizeMb.toFixed(0)} МБ).</b>
                <br />
                Возможны проблемы с производительностью и нехваткой памяти.
              </div>
            </div>
          )}

          {!isHuge && isLarge && (
            <div style={styles.warnBoxYellow}>
              <AlertTriangle size={16} color="var(--warning)" />
              <div>
                Файл большой ({sizeMb.toFixed(1)} МБ). Импорт может занять
                время.
              </div>
            </div>
          )}

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Eye size={12} /> Отображение
            </h3>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>
                Показывать объекты на карте
              </span>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>Показывать подписи</span>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={flyToBounds}
                onChange={(e) => setFlyToBounds(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>
                Перелететь к границам файла
              </span>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>
                Показывать скрытые объекты (visibility=0)
              </span>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={importLinesAsMeasures}
                onChange={(e) => setImportLinesAsMeasures(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>
                Импортировать линии как измерения
              </span>
            </label>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <FolderTree size={12} /> Дерево
            </h3>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={startCollapsed}
                onChange={(e) => setStartCollapsed(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>
                Свернуть папки после импорта
              </span>
            </label>
            <div style={styles.hintSmall}>
              Включено — все папки KML будут свёрнуты, чтобы дерево не
              раздувалось. Объекты всё равно отрисуются (если отображение
              включено выше).
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Palette size={12} /> Цвет объектов по умолчанию
            </h3>
            <div style={styles.colorRow}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={styles.colorInput}
              />
              <span style={styles.colorValue}>{color}</span>
            </div>
            <div style={styles.presetRow}>
              {PRESET_COLORS.map(function (c) {
                return (
                  <button
                    key={c}
                    style={{
                      ...styles.colorPreset,
                      backgroundColor: c,
                      borderColor:
                        c === color ? 'var(--text-primary)' : 'transparent',
                    }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                );
              })}
            </div>
            <div style={styles.hintSmall}>
              Применяется только к объектам, у которых нет своего цвета в
              файле.
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Ruler size={12} /> Размер точек
            </h3>
            <div style={styles.fieldRow}>
              <input
                type="range"
                min={6}
                max={24}
                value={pixelSize}
                onChange={(e) => setPixelSize(parseInt(e.target.value))}
                style={styles.range}
              />
              <span style={styles.rangeValue}>{pixelSize} px</span>
            </div>
          </section>
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Отмена
          </button>
          <button style={styles.confirmBtn} onClick={handleConfirm}>
            Импортировать
          </button>
        </div>
      </div>
    </div>
  );
}

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
    width: 460,
    maxWidth: '92vw',
    maxHeight: '90vh',
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
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
  fileInfo: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg-surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    marginBottom: 16,
  },
  fileName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4,
    wordBreak: 'break-all',
  },
  fileMeta: {
    fontSize: 11.5,
    color: 'var(--text-secondary)',
  },
  hintSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    backgroundColor: 'var(--danger-soft)',
    border: '1px solid var(--danger-border)',
    borderRadius: 'var(--radius-small)',
    marginBottom: 16,
    fontSize: 12,
    lineHeight: 1.5,
  },
  warnBoxYellow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    backgroundColor: 'var(--warning-soft)',
    border: '1px solid var(--warning-border)',
    borderRadius: 'var(--radius-small)',
    marginBottom: 16,
    fontSize: 12,
    lineHeight: 1.5,
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11.5,
    fontWeight: 600,
    color: 'var(--accent)',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12.5,
    cursor: 'pointer',
    color: 'var(--text-primary)',
    padding: '5px 4px',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  colorInput: {
    width: 44,
    height: 28,
    padding: 2,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
  },
  colorValue: {
    fontSize: 11.5,
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
  },
  presetRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  colorPreset: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid transparent',
    cursor: 'pointer',
    padding: 0,
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  range: { flex: 1, accentColor: 'var(--accent)' },
  rangeValue: {
    fontSize: 12,
    color: 'var(--text-primary)',
    fontFamily: 'Consolas, monospace',
    fontWeight: 600,
    minWidth: 50,
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

export default ImportDialog;