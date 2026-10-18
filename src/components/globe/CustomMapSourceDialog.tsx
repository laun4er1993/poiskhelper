// =====================================================
// src/components/globe/CustomMapSourceDialog.tsx
// Диалог добавления/редактирования своей карты — респонсивный
// =====================================================

import { useState, useEffect } from 'react';
import { X, Save, Upload, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import type { CustomMapSource, MapSourceCategory } from '../../types/map-sources';

interface CustomMapSourceDialogProps {
  visible: boolean;
  editSource?: CustomMapSource | null;
  onSave: (source: Omit<CustomMapSource, 'id' | 'addedAt'>) => void;
  onImportXml: (xml: string) => void;
  onClose: () => void;
}

function useWindowWidth(): number {
  const [w, setW] = useState(function () {
    return typeof window !== 'undefined' ? window.innerWidth : 1024;
  });
  useEffect(function () {
    let raf: number | null = null;
    const update = function () {
      if (raf !== null) return;
      raf = window.requestAnimationFrame(function () {
        raf = null;
        setW(window.innerWidth);
      });
    };
    window.addEventListener('resize', update);
    return function () {
      window.removeEventListener('resize', update);
      if (raf !== null) window.cancelAnimationFrame(raf);
    };
  }, []);
  return w;
}

function CustomMapSourceDialog({
  visible,
  editSource,
  onSave,
  onImportXml,
  onClose,
}: CustomMapSourceDialogProps) {
  const [name, setName] = useState('');
  const [urlTemplate, setUrlTemplate] = useState('');
  const [maxLevel, setMaxLevel] = useState(19);
  const [minLevel, setMinLevel] = useState(0);
  const [attribution, setAttribution] = useState('');
  const [category, setCategory] = useState<MapSourceCategory>('satellite');
  const [previewColor, setPreviewColor] = useState('#4a90d9');
  const [xmlText, setXmlText] = useState('');
  const [showXml, setShowXml] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const windowWidth = useWindowWidth();
  const isNarrow = windowWidth < 640;
  const isVeryNarrow = windowWidth < 400;

  useEffect(
    function () {
      if (editSource) {
        setName(editSource.name);
        setUrlTemplate(editSource.urlTemplate);
        setMaxLevel(editSource.maxLevel);
        setMinLevel(editSource.minLevel || 0);
        setAttribution(editSource.attribution);
        setCategory(editSource.category);
        setPreviewColor(editSource.previewColor);
      } else {
        setName('');
        setUrlTemplate('');
        setMaxLevel(19);
        setMinLevel(0);
        setAttribution('');
        setCategory('satellite');
        setPreviewColor('#4a90d9');
      }
      setError(null);
      setXmlText('');
      setShowXml(false);
    },
    [editSource, visible]
  );

  if (!visible) return null;

  const handleSubmit = function () {
    setError(null);
    if (!name.trim()) {
      setError('Введите название');
      return;
    }
    if (!urlTemplate.trim()) {
      setError('Введите URL-шаблон');
      return;
    }
    if (
      urlTemplate.indexOf('{z}') < 0 ||
      urlTemplate.indexOf('{x}') < 0 ||
      urlTemplate.indexOf('{y}') < 0
    ) {
      setError('URL должен содержать {z}, {x} и {y}');
      return;
    }
    onSave({
      name: name.trim(),
      urlTemplate: urlTemplate.trim(),
      maxLevel: Math.max(1, Math.min(22, maxLevel)),
      minLevel: Math.max(0, Math.min(22, minLevel)),
      attribution: attribution.trim() || '© Своя карта',
      category: category,
      previewColor: previewColor,
    });
  };

  const handleImport = function () {
    if (!xmlText.trim()) {
      setError('Вставьте XML-код');
      return;
    }
    onImportXml(xmlText);
    setXmlText('');
    setShowXml(false);
  };

  const modalWidth = isVeryNarrow
    ? '100vw'
    : Math.min(520, windowWidth - 24);

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={{
          ...styles.modal,
          width: modalWidth,
          maxHeight: isVeryNarrow ? '100vh' : 'calc(100vh - 24px)',
          borderRadius: isVeryNarrow ? 0 : 'var(--radius)',
        }}
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        <div style={styles.header}>
          <LinkIcon size={16} color="var(--accent)" />
          <span style={styles.title}>
            {editSource ? 'Редактировать карту' : 'Своя карта'}
          </span>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            ...styles.content,
            padding: isNarrow ? '12px 14px' : '16px 20px',
          }}
        >
          {error && (
            <div style={styles.errorBox}>
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tabBtn,
                ...(showXml ? {} : styles.tabBtnActive),
              }}
              onClick={function () {
                setShowXml(false);
              }}
            >
              Вручную
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(showXml ? styles.tabBtnActive : {}),
              }}
              onClick={function () {
                setShowXml(true);
              }}
            >
              Импорт XML
            </button>
          </div>

          {!showXml && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Название *</label>
                <input
                  type="text"
                  value={name}
                  onChange={function (e) {
                    setName(e.target.value);
                  }}
                  style={styles.input}
                  placeholder="Например: Мой спутник"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>URL-шаблон *</label>
                <input
                  type="text"
                  value={urlTemplate}
                  onChange={function (e) {
                    setUrlTemplate(e.target.value);
                  }}
                  style={styles.input}
                  placeholder="https://tile.server/{z}/{x}/{y}.png"
                  spellCheck={false}
                />
                <div style={styles.hintSmall}>
                  Используйте {'{z}'}, {'{x}'}, {'{y}'} для тайлов.
                </div>
              </div>

              <div
                style={{
                  ...styles.row,
                  flexDirection: isVeryNarrow ? 'column' : 'row',
                }}
              >
                <div style={styles.col}>
                  <label style={styles.label}>Мин. зум</label>
                  <input
                    type="number"
                    min={0}
                    max={22}
                    value={minLevel}
                    onChange={function (e) {
                      setMinLevel(parseInt(e.target.value) || 0);
                    }}
                    style={styles.input}
                  />
                </div>
                <div style={styles.col}>
                  <label style={styles.label}>Макс. зум</label>
                  <input
                    type="number"
                    min={1}
                    max={22}
                    value={maxLevel}
                    onChange={function (e) {
                      setMaxLevel(parseInt(e.target.value) || 19);
                    }}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Атрибуция</label>
                <input
                  type="text"
                  value={attribution}
                  onChange={function (e) {
                    setAttribution(e.target.value);
                  }}
                  style={styles.input}
                  placeholder="© Ваш источник"
                />
              </div>

              <div
                style={{
                  ...styles.row,
                  flexDirection: isVeryNarrow ? 'column' : 'row',
                }}
              >
                <div style={styles.col}>
                  <label style={styles.label}>Категория</label>
                  <select
                    value={category}
                    onChange={function (e) {
                      setCategory(e.target.value as MapSourceCategory);
                    }}
                    style={styles.input}
                  >
                    <option value="satellite">Спутник</option>
                    <option value="street">Схема</option>
                    <option value="topo">Топо</option>
                    <option value="history">История</option>
                  </select>
                </div>
                <div style={styles.col}>
                  <label style={styles.label}>Цвет превью</label>
                  <input
                    type="color"
                    value={previewColor}
                    onChange={function (e) {
                      setPreviewColor(e.target.value);
                    }}
                    style={styles.colorInput}
                  />
                </div>
              </div>
            </>
          )}

          {showXml && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>
                  Вставьте XML из Locus (providers.xml)
                </label>
                <textarea
                  value={xmlText}
                  onChange={function (e) {
                    setXmlText(e.target.value);
                  }}
                  style={styles.textarea}
                  rows={isNarrow ? 6 : 10}
                  placeholder={'<?xml version="1.0"?>\n<providers>\n  <provider>\n    <name>Моя карта</name>\n    <url><![CDATA[https://.../{z}/{x}/{y}.png]]></url>\n    <zoomMax>19</zoomMax>\n  </provider>\n</providers>'}
                  spellCheck={false}
                />
              </div>
              <div style={styles.hintSmall}>
                Поддерживается формат Locus Map. Все провайдеры будут добавлены
                как отдельные карты.
              </div>
            </>
          )}
        </div>

        <div
          style={{
            ...styles.footer,
            ...(isVeryNarrow ? styles.footerWrap : {}),
          }}
        >
          <button style={styles.cancelBtn} onClick={onClose}>
            Отмена
          </button>
          {showXml ? (
            <button style={styles.saveBtn} onClick={handleImport}>
              <Upload size={13} /> Импортировать
            </button>
          ) : (
            <button style={styles.saveBtn} onClick={handleSubmit}>
              <Save size={13} /> {editSource ? 'Сохранить' : 'Добавить'}
            </button>
          )}
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
    zIndex: 2500,
    fontFamily: 'Segoe UI, sans-serif',
    animation: 'fadeIn 0.15s ease',
  },
  modal: {
    width: 520,
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 'calc(100vh - 24px)',
    backgroundColor: 'var(--bg-modal)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-xl)',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    animation: 'scaleIn 0.18s ease',
  },
  header: {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    backgroundColor: 'var(--bg-panel-header)',
    borderBottom: '1px solid var(--border)',
    gap: 8,
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
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
    flexShrink: 0,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    backgroundColor: 'var(--danger-soft)',
    border: '1px solid var(--danger-border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--danger)',
    fontSize: 12,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    padding: 3,
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 'var(--radius-small)',
    border: '1px solid var(--border)',
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    padding: '6px 10px',
    border: '1px solid transparent',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  tabBtnActive: {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    borderColor: 'var(--accent)',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: '7px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 12.5,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 11.5,
    outline: 'none',
    fontFamily: 'Consolas, monospace',
    resize: 'vertical',
    boxSizing: 'border-box',
    minHeight: 100,
  },
  row: { display: 'flex', gap: 10 },
  col: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  colorInput: {
    width: '100%',
    height: 32,
    padding: 2,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  hintSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  footer: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    backgroundColor: 'var(--bg-panel-header)',
    borderTop: '1px solid var(--border)',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  footerWrap: {
    height: 'auto',
    padding: '10px 12px',
    flexWrap: 'wrap',
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
    whiteSpace: 'nowrap',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 20px',
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: 'var(--accent-text)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
};

export default CustomMapSourceDialog;