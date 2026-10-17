// =====================================================
// src/components/info-dialog/InfoDialog.tsx
// Полная информация об объекте
// =====================================================

import { useState } from 'react';
import {
  X,
  Info,
  Folder as FolderIcon,
  FileText,
  MapPin,
  Minus,
  Square,
  Copy,
  Check,
} from 'lucide-react';
import type { TreeItem, Place } from '../../types/base';
import {
  isFolder,
  isPlace,
  isKmlFile,
  isKmlLine,
  isKmlPolygon,
  isContainer,
  getItemTypeLabel,
} from '../../types/base';
import type { InfoDialogProps } from './types';

// =====================================================
// === Компонент ===
// =====================================================
function InfoDialog({ item, onClose, onCopyCoords }: InfoDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = function (text: string, label: string) {
    onCopyCoords(text, label);
    setCopiedField(label);
    setTimeout(function () {
      setCopiedField(null);
    }, 1500);
  };

  const renderIcon = function () {
    if (isFolder(item)) return <FolderIcon size={20} color="var(--warning)" />;
    if (isKmlFile(item)) return <FileText size={20} color="var(--success)" />;
    if (isPlace(item))
      return <MapPin size={20} color={item.color || 'var(--danger)'} />;
    if (isKmlLine(item))
      return <Minus size={20} color={item.color || 'var(--warning)'} />;
    if (isKmlPolygon(item))
      return (
        <Square size={20} color={item.fillColor || 'var(--accent)'} />
      );
    return <Info size={20} color="var(--accent)" />;
  };

  const countChildren = function () {
    const stats = { folders: 0, places: 0, lines: 0, polygons: 0, kmlFiles: 0 };
    function walk(list: TreeItem[]) {
      list.forEach(function (c) {
        if (isFolder(c)) stats.folders++;
        else if (isPlace(c)) stats.places++;
        else if (isKmlLine(c)) stats.lines++;
        else if (isKmlPolygon(c)) stats.polygons++;
        else if (isKmlFile(c)) stats.kmlFiles++;
        if (isContainer(c)) walk(c.children);
      });
    }
    if (isContainer(item)) walk(item.children);
    return stats;
  };

  const stats = countChildren();
  const totalDescendants =
    stats.folders +
    stats.places +
    stats.lines +
    stats.polygons +
    stats.kmlFiles;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={styles.header}>
          {renderIcon()}
          <span style={styles.title}>{getItemTypeLabel(item.type)}</span>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            title="Закрыть (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTENT */}
        <div style={styles.content}>
          {/* Название */}
          <div style={styles.field}>
            <span style={styles.label}>Название</span>
            <div style={styles.valueRow}>
              <span style={styles.value}>{item.name}</span>
              <button
                style={styles.copyBtn}
                onClick={() => handleCopy(item.name, 'Название')}
                title="Копировать"
              >
                {copiedField === 'Название' ? (
                  <Check size={11} color="var(--success)" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>
          </div>

          {/* ID */}
          <div style={styles.field}>
            <span style={styles.label}>ID</span>
            <div style={styles.valueRow}>
              <span style={styles.valueMono}>{item.id}</span>
              <button
                style={styles.copyBtn}
                onClick={() => handleCopy(item.id, 'ID')}
                title="Копировать ID"
              >
                {copiedField === 'ID' ? (
                  <Check size={11} color="var(--success)" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>
          </div>

          {/* Тип */}
          <div style={styles.field}>
            <span style={styles.label}>Тип</span>
            <span style={styles.value}>{getItemTypeLabel(item.type)}</span>
          </div>

          {/* Видимость */}
          <div style={styles.field}>
            <span style={styles.label}>Видимость</span>
            <span
              style={{
                ...styles.badge,
                color: item.visible ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {item.visible ? '👁 Видимый' : '🚫 Скрыт'}
            </span>
          </div>

          {item.pinned && (
            <div style={styles.field}>
              <span style={styles.label}>Закреплено</span>
              <span style={{ ...styles.badge, color: 'var(--warning)' }}>
                📌 Да
              </span>
            </div>
          )}

          {item.createdAt && (
            <div style={styles.field}>
              <span style={styles.label}>Создано</span>
              <span style={styles.value}>
                {new Date(item.createdAt).toLocaleString('ru-RU')}
              </span>
            </div>
          )}

          {/* KML-файл */}
          {isKmlFile(item) && (
            <>
              <div style={styles.field}>
                <span style={styles.label}>Исходный файл</span>
                <span style={styles.value}>{item.sourceFile}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Импортировано</span>
                <span style={styles.value}>
                  {new Date(item.importedAt).toLocaleString('ru-RU')}
                </span>
              </div>
            </>
          )}

          {/* Метка */}
          {isPlace(item) && (
            <>
              <div style={styles.field}>
                <span style={styles.label}>Широта</span>
                <div style={styles.valueRow}>
                  <span style={styles.valueMono}>
                    {item.lat.toFixed(8)}°
                  </span>
                  <button
                    style={styles.copyBtn}
                    onClick={() =>
                      handleCopy(item.lat.toFixed(8), 'Широта')
                    }
                    title="Копировать"
                  >
                    {copiedField === 'Широта' ? (
                      <Check size={11} color="var(--success)" />
                    ) : (
                      <Copy size={11} />
                    )}
                  </button>
                </div>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Долгота</span>
                <div style={styles.valueRow}>
                  <span style={styles.valueMono}>
                    {item.lon.toFixed(8)}°
                  </span>
                  <button
                    style={styles.copyBtn}
                    onClick={() =>
                      handleCopy(item.lon.toFixed(8), 'Долгота')
                    }
                    title="Копировать"
                  >
                    {copiedField === 'Долгота' ? (
                      <Check size={11} color="var(--success)" />
                    ) : (
                      <Copy size={11} />
                    )}
                  </button>
                </div>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Координаты (пара)</span>
                <div style={styles.valueRow}>
                  <span style={styles.valueMono}>
                    {item.lat.toFixed(6)}, {item.lon.toFixed(6)}
                  </span>
                  <button
                    style={styles.copyBtn}
                    onClick={() =>
                      handleCopy(
                        item.lat.toFixed(6) + ', ' + item.lon.toFixed(6),
                        'Координаты'
                      )
                    }
                    title="Копировать"
                  >
                    {copiedField === 'Координаты' ? (
                      <Check size={11} color="var(--success)" />
                    ) : (
                      <Copy size={11} />
                    )}
                  </button>
                </div>
              </div>
              {item.height !== undefined && (
                <div style={styles.field}>
                  <span style={styles.label}>Высота</span>
                  <span style={styles.valueMono}>
                    {item.height.toFixed(2)} м
                  </span>
                </div>
              )}
              {item.pixelSize && (
                <div style={styles.field}>
                  <span style={styles.label}>Размер точки</span>
                  <span style={styles.value}>{item.pixelSize} px</span>
                </div>
              )}
              {item.color && (
                <div style={styles.field}>
                  <span style={styles.label}>Цвет</span>
                  <span style={styles.valueRow}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: item.color,
                        border: '1px solid var(--border)',
                      }}
                    />
                    <span style={styles.valueMono}>{item.color}</span>
                  </span>
                </div>
              )}
            </>
          )}

          {/* Линия */}
          {isKmlLine(item) && (
            <>
              <div style={styles.field}>
                <span style={styles.label}>Точек в линии</span>
                <span style={styles.value}>{item.positions.length}</span>
              </div>
              {item.width !== undefined && (
                <div style={styles.field}>
                  <span style={styles.label}>Толщина</span>
                  <span style={styles.value}>{item.width} px</span>
                </div>
              )}
              {item.color && (
                <div style={styles.field}>
                  <span style={styles.label}>Цвет</span>
                  <span style={styles.valueRow}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: item.color,
                        border: '1px solid var(--border)',
                      }}
                    />
                    <span style={styles.valueMono}>{item.color}</span>
                  </span>
                </div>
              )}
            </>
          )}

          {/* Полигон */}
          {isKmlPolygon(item) && (
            <>
              <div style={styles.field}>
                <span style={styles.label}>Точек в полигоне</span>
                <span style={styles.value}>{item.positions.length}</span>
              </div>
              {item.fillColor && (
                <div style={styles.field}>
                  <span style={styles.label}>Цвет заливки</span>
                  <span style={styles.valueRow}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: item.fillColor,
                        border: '1px solid var(--border)',
                      }}
                    />
                    <span style={styles.valueMono}>{item.fillColor}</span>
                  </span>
                </div>
              )}
              {item.outlineColor && (
                <div style={styles.field}>
                  <span style={styles.label}>Цвет контура</span>
                  <span style={styles.valueRow}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: item.outlineColor,
                        border: '1px solid var(--border)',
                      }}
                    />
                    <span style={styles.valueMono}>{item.outlineColor}</span>
                  </span>
                </div>
              )}
            </>
          )}

          {/* Описание метки */}
          {item.type === 'place' && (item as Place).description && (
            <div style={styles.field}>
              <span style={styles.label}>Описание</span>
              <div style={styles.description}>
                {(item as Place).description}
              </div>
            </div>
          )}

          {/* Содержимое папки */}
          {isContainer(item) && (
            <>
              <div style={styles.separator} />
              <div style={styles.field}>
                <span style={styles.label}>Содержимое</span>
                <span style={styles.value}>
                  Всего объектов: {totalDescendants}
                </span>
              </div>
              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <FolderIcon size={13} color="var(--warning)" />
                  <span style={styles.statCount}>{stats.folders}</span>
                  <span style={styles.statLabel}>папки</span>
                </div>
                <div style={styles.statBox}>
                  <MapPin size={13} color="var(--danger)" />
                  <span style={styles.statCount}>{stats.places}</span>
                  <span style={styles.statLabel}>метки</span>
                </div>
                <div style={styles.statBox}>
                  <Minus size={13} color="var(--warning)" />
                  <span style={styles.statCount}>{stats.lines}</span>
                  <span style={styles.statLabel}>линии</span>
                </div>
                <div style={styles.statBox}>
                  <Square size={13} color="var(--accent)" />
                  <span style={styles.statCount}>{stats.polygons}</span>
                  <span style={styles.statLabel}>полигоны</span>
                </div>
                <div style={styles.statBox}>
                  <FileText size={13} color="var(--success)" />
                  <span style={styles.statCount}>{stats.kmlFiles}</span>
                  <span style={styles.statLabel}>KML</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <button style={styles.doneBtn} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
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
    width: 480,
    maxWidth: '92vw',
    maxHeight: '88vh',
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
    height: 50,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg-panel-header)',
    gap: 10,
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
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 3 },
  label: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 600,
  },
  value: {
    fontSize: 12.5,
    color: 'var(--text-primary)',
    wordBreak: 'break-word',
  },
  valueMono: {
    fontSize: 12,
    fontFamily: 'Consolas, monospace',
    color: 'var(--text-primary)',
  },
  valueRow: { display: 'flex', alignItems: 'center', gap: 6 },
  copyBtn: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  badge: { fontSize: 12, fontWeight: 600 },
  description: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--overlay-soft)',
    padding: '8px 10px',
    borderRadius: 6,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    maxHeight: 150,
    overflowY: 'auto',
  },
  separator: {
    height: 1,
    backgroundColor: 'var(--border)',
    margin: '6px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: 6,
    marginTop: 6,
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '8px 6px',
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 6,
    border: '1px solid var(--border)',
  },
  statCount: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: 'Consolas, monospace',
  },
  statLabel: { fontSize: 10, color: 'var(--text-muted)' },
  footer: {
    height: 52,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    borderTop: '1px solid var(--border)',
    backgroundColor: 'var(--bg-panel-header)',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  doneBtn: {
    padding: '7px 22px',
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

export default InfoDialog;