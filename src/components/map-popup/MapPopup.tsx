// =====================================================
// src/components/map-popup/MapPopup.tsx
// Прозрачное окошко при клике на объект
// =====================================================

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Crosshair,
  Pencil,
  MapPin,
  Folder as FolderIcon,
  FileText,
  Minus,
  Square,
  Hash,
  Mountain,
  Layers,
  EyeOff,
  Check,
  Ruler,
} from 'lucide-react';
import type {
  TreeItem,
  Place,
  MeasureItem,
  AppSettings,
} from '../../types/base-imports';
import type { DesignSettings } from '../../types/settings';
import {
  isPlace,
  isFolder,
  isKmlFile,
  isKmlLine,
  isKmlPolygon,
  isMeasure,
  getItemTypeLabel,
} from '../../types/base';
import { formatLatLon, formatHeight, formatDistance } from '../../types/format';
import { computeMeasureMetrics } from '../../types/geometry';
import { hexToRgba } from '../../types/ids';
import { getItemTypeColor } from './types';

// =====================================================
// === Пропсы ===
// =====================================================
interface MapPopupProps {
  item: TreeItem | null;
  anchorX: number;
  anchorY: number;
  containerWidth: number;
  containerHeight: number;
  settings: AppSettings;
  onEdit: (item: TreeItem) => void;
  onFlyTo: (place: Place) => void;
  onClose: () => void;
  onCopyCoords: (text: string, label: string) => void;
  onHide?: (id: string) => void;
}

// =====================================================
// === Иконка типа ===
// =====================================================
function getTypeIcon(item: TreeItem, size: number) {
  if (isFolder(item))
    return <FolderIcon size={size} color="var(--warning)" />;
  if (isKmlFile(item))
    return <FileText size={size} color="var(--success)" />;
  if (isPlace(item))
    return (
      <MapPin
        size={size}
        color={(item as Place).color || 'var(--danger)'}
      />
    );
  if (isKmlLine(item))
    return <Minus size={size} color={(item as any).color || 'var(--warning)'} />;
  if (isKmlPolygon(item))
    return (
      <Square size={size} color={(item as any).fillColor || 'var(--accent)'} />
    );
  if (isMeasure(item))
    return <Ruler size={size} color="var(--accent)" />;
  return <MapPin size={size} color="var(--danger)" />;
}

// =====================================================
// === Компонент ===
// =====================================================
function MapPopup({
  item,
  anchorX,
  anchorY,
  containerWidth,
  containerHeight,
  settings,
  onEdit,
  onFlyTo,
  onClose,
  onHide,
}: MapPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const popupSettings = settings.mapPopup;
  const design: DesignSettings = settings.design;

  useEffect(
    function () {
      if (!item) {
        setVisible(false);
        return;
      }
      if (popupSettings.delayMs <= 0) {
        setVisible(true);
        return;
      }
      const t = setTimeout(function () {
        setVisible(true);
      }, popupSettings.delayMs);
      return function () {
        clearTimeout(t);
        setVisible(false);
      };
    },
    [item, popupSettings.delayMs]
  );

  useEffect(
    function () {
      if (!visible || !item) return;
      if (popupSettings.autoHideMs <= 0) return;
      const t = setTimeout(function () {
        onClose();
      }, popupSettings.autoHideMs);
      return function () {
        clearTimeout(t);
      };
    },
    [visible, item, popupSettings.autoHideMs, onClose]
  );

  useEffect(
    function () {
      if (!item) return;
      const handler = function (e: KeyboardEvent) {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return function () {
        window.removeEventListener('keydown', handler);
      };
    },
    [item, onClose]
  );

  if (!item) return null;
  if (popupSettings.mode === 'off') return null;

  // === Позиционирование ===
  const popupWidth = popupSettings.width || 300;
  const estimatedHeight = 200;
  const gap = 12;
  const edgePadding = 8;

  let left = anchorX + gap;
  let top = anchorY - estimatedHeight / 2;

  if (left + popupWidth > containerWidth - edgePadding) {
    left = anchorX - popupWidth - gap;
  }
  if (left < edgePadding) {
    left = Math.min(anchorX + gap, containerWidth - popupWidth - edgePadding);
  }
  if (top < edgePadding) top = edgePadding;
  if (top + estimatedHeight > containerHeight - edgePadding) {
    top = containerHeight - estimatedHeight - edgePadding;
  }

  // === Данные ===
  const place: Place | null = isPlace(item) ? item : null;
  const measure: MeasureItem | null = isMeasure(item) ? item : null;

  // Для measure — метрики
  const measureMetrics = measure
    ? computeMeasureMetrics(measure.positions, measure.closed)
    : null;

  const description =
    place?.description || (item as any).description || '';
  const hasCoords = place && popupSettings.showCoords;
  const hasHeight =
    place && popupSettings.showHeight && typeof place.height === 'number';

  const preciseCoordsText = place
    ? place.lat.toFixed(8) + ', ' + place.lon.toFixed(8)
    : '';

  const descriptionLines = description
    .split('\n')
    .filter(function (l) {
      return l.trim().length > 0;
    })
    .slice(0, popupSettings.descriptionMaxLines);
  const truncatedDescription = descriptionLines.join('\n');
  const descriptionTruncated =
    description.split('\n').length > popupSettings.descriptionMaxLines;

  const bgAlpha = Math.max(0.3, Math.min(1, popupSettings.opacity));
  const dimAlpha = Math.max(0, Math.min(0.7, popupSettings.backdropDim));
  const color = getItemTypeColor(item);

  const popupBgBase = design.popupBackground || '#14161c';
  const popupBg = hexToRgba(popupBgBase, bgAlpha);

  // === Копирование ===
  const handleCopyCoordsClick = function () {
    if (!preciseCoordsText) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(preciseCoordsText).catch(function () {});
    }
    setCopiedCoords(true);
    setTimeout(function () {
      setCopiedCoords(false);
    }, 1400);
  };

  const handleHideClick = function () {
    if (onHide) onHide(item.id);
    onClose();
  };

  // === Рендер ===
  return (
    <>
      {visible && dimAlpha > 0.01 && (
        <div
          style={{
            ...styles.backdrop,
            backgroundColor: 'rgba(0, 0, 0, ' + dimAlpha + ')',
          }}
          onClick={onClose}
        />
      )}

      {visible && (
        <div
          ref={popupRef}
          style={{
            ...styles.popup,
            left: left,
            top: top,
            width: popupWidth,
            backgroundColor: popupBg,
            borderColor: 'var(--globe-popup-border, var(--border))',
            borderRadius: 'var(--globe-popup-radius, 10px)',
            boxShadow: design.shadows ? 'var(--shadow-lg)' : 'none',
            backdropFilter: design.blur
              ? 'blur(14px) saturate(150%)'
              : 'none',
            WebkitBackdropFilter: design.blur
              ? 'blur(14px) saturate(150%)'
              : 'none',
          }}
          onClick={function (e) {
            e.stopPropagation();
          }}
        >
          {design.popupAccentStripe && (
            <div
              style={{
                ...styles.accentStripe,
                backgroundColor: color,
              }}
            />
          )}

          <div style={styles.header}>
            <span style={styles.headerIcon}>{getTypeIcon(item, 14)}</span>
            <span style={styles.headerName} title={item.name}>
              {item.name}
            </span>
            <button
              style={styles.closeBtn}
              onClick={handleHideClick}
              title="Скрыть объект"
            >
              <EyeOff size={12} />
            </button>
          </div>

          {popupSettings.showTypeBadge && (
            <div style={styles.typeBadge}>
              <span
                style={{
                  ...styles.typeBadgeDot,
                  backgroundColor: color,
                }}
              />
              <span style={styles.typeBadgeText}>
                {getItemTypeLabel(item.type)}
              </span>
            </div>
          )}

          <div style={styles.body}>
            {/* === Метка === */}
            {hasCoords && place && (
              <div style={styles.row}>
                <span style={styles.rowIcon}>
                  <Crosshair size={11} />
                </span>
                <span style={styles.rowLabel}>Координаты</span>
                <span style={styles.rowValue} title={preciseCoordsText}>
                  {formatLatLon(
                    place.lat,
                    place.lon,
                    settings.coordinateFormat,
                    true
                  )}
                </span>
                <button
                  style={{
                    ...styles.rowCopyBtn,
                    color: copiedCoords
                      ? 'var(--success)'
                      : 'var(--globe-popup-muted, var(--text-muted))',
                  }}
                  onClick={handleCopyCoordsClick}
                  title="Скопировать точные координаты (8 знаков)"
                >
                  {copiedCoords ? <Check size={10} /> : <Hash size={10} />}
                </button>
              </div>
            )}

            {hasHeight && place && (
              <div style={styles.row}>
                <span style={styles.rowIcon}>
                  <Mountain size={11} />
                </span>
                <span style={styles.rowLabel}>Высота</span>
                <span style={styles.rowValue}>
                  {formatHeight(place.height || 0, settings.heightUnit)}
                </span>
              </div>
            )}

            {/* === Линейка === */}
            {measure && measureMetrics && (
              <>
                <div style={styles.row}>
                  <span style={styles.rowIcon}>
                    <Layers size={11} />
                  </span>
                  <span style={styles.rowLabel}>Точек</span>
                  <span style={styles.rowValue}>
                    {measure.positions.length}
                  </span>
                </div>
                <div style={styles.row}>
                  <span style={styles.rowIcon}>
                    <Ruler size={11} />
                  </span>
                  <span style={styles.rowLabel}>Длина</span>
                  <span style={styles.rowValue}>
                    {formatDistance(
                      measureMetrics.totalDist,
                      settings.distanceUnit,
                      settings.highPrecision
                    )}
                  </span>
                </div>
                {measure.closed && measureMetrics.area > 0 && (
                  <div style={styles.row}>
                    <span style={styles.rowIcon}>
                      <Square size={11} />
                    </span>
                    <span style={styles.rowLabel}>Площадь</span>
                    <span style={styles.rowValue}>
                      {measureMetrics.area.toFixed(1)} м²
                    </span>
                  </div>
                )}
              </>
            )}

            {/* === Папка / KML-файл === */}
            {(isFolder(item) || isKmlFile(item)) && (
              <div style={styles.row}>
                <span style={styles.rowIcon}>
                  <Layers size={11} />
                </span>
                <span style={styles.rowLabel}>Содержимое</span>
                <span style={styles.rowValue}>
                  {(item as any).children.length} объектов
                </span>
              </div>
            )}

            {popupSettings.showDescription && truncatedDescription && (
              <div style={styles.descriptionBlock}>
                <div style={styles.descriptionText}>
                  {truncatedDescription}
                  {descriptionTruncated && (
                    <span style={styles.descriptionMore}>…</span>
                  )}
                </div>
              </div>
            )}

            {!truncatedDescription &&
              !hasCoords &&
              !hasHeight &&
              !measure &&
              !isFolder(item) &&
              !isKmlFile(item) && (
                <div style={styles.emptyHint}>
                  Нет дополнительной информации
                </div>
              )}
          </div>

          <div style={styles.footer}>
            <button
              style={styles.actionBtnPrimary}
              onClick={function () {
                onEdit(item);
              }}
              title="Открыть панель настроек справа"
            >
              <Pencil size={12} /> Редактировать
            </button>

            {isPlace(item) && (
              <button
                style={styles.actionBtn}
                onClick={function () {
                  if (isPlace(item)) onFlyTo(item);
                }}
                title="Перелететь к объекту"
              >
                <Crosshair size={12} />
              </button>
            )}

            <button
              style={styles.actionBtn}
              onClick={onClose}
              title="Скрыть попап"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 500,
    pointerEvents: 'auto',
  },
  popup: {
    position: 'absolute',
    zIndex: 510,
    border: '1px solid',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: 12,
    color: 'var(--globe-popup-text, var(--text-primary))',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'scaleIn 0.14s ease',
    transformOrigin: 'top left',
    pointerEvents: 'auto',
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    opacity: 0.9,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 8px 6px 12px',
    borderBottom:
      '1px solid var(--globe-popup-border, var(--border))',
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  headerName: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--globe-popup-title, var(--text-primary))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  closeBtn: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  typeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 12px 6px 12px',
    fontSize: 10,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 500,
  },
  typeBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  },
  typeBadgeText: {
    fontSize: 9.5,
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '2px 12px 8px 12px',
    maxHeight: 240,
    overflowY: 'auto',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11.5,
    lineHeight: 1.4,
    minHeight: 20,
  },
  rowIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 14,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    flexShrink: 0,
  },
  rowLabel: {
    color: 'var(--globe-popup-muted, var(--text-muted))',
    minWidth: 74,
    flexShrink: 0,
  },
  rowValue: {
    flex: 1,
    color: 'var(--globe-popup-text, var(--text-primary))',
    fontFamily: 'Consolas, monospace',
    fontSize: 11,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  rowCopyBtn: {
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 3,
    padding: 0,
    flexShrink: 0,
    transition: 'color 0.15s',
  },
  descriptionBlock: {
    marginTop: 2,
    padding: '6px 8px',
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 5,
    border: '1px solid var(--globe-popup-border, var(--border))',
  },
  descriptionText: {
    fontSize: 11,
    color: 'var(--globe-popup-text, var(--text-primary))',
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  descriptionMore: {
    color: 'var(--globe-popup-muted, var(--text-muted))',
    fontStyle: 'italic',
  },
  emptyHint: {
    fontSize: 11,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    fontStyle: 'italic',
    padding: '4px 0',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 8px 8px 12px',
    borderTop: '1px solid var(--globe-popup-border, var(--border))',
  },
  actionBtn: {
    width: 28,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--globe-popup-border, var(--border))',
    borderRadius: 5,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  actionBtnPrimary: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '5px 10px',
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 5,
    color: 'var(--globe-popup-accent, var(--accent))',
    fontSize: 11.5,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
};

export default MapPopup;