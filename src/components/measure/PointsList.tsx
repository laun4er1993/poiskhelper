// =====================================================
// src/components/measure/PointsList.tsx
// Список точек измерения с расстояниями
// =====================================================

import { Trash2, Crosshair, Copy } from 'lucide-react';
import type { MeasurePoint } from '../../types/measure';
import type { CoordinateFormat, HeightUnit } from '../../types/units';
import { formatLatLon, formatHeight, formatDistance } from '../../types/format';
import type { DistanceUnit } from '../../types/units';

interface PointsListProps {
  points: MeasurePoint[];
  selectedIndex: number | null;
  coordinateFormat: CoordinateFormat;
  heightUnit: HeightUnit;
  distanceUnit: DistanceUnit;
  highPrecision: boolean;

  /** Показывать высоты у точек */
  showHeights?: boolean;

  /** Замкнута ли фигура — для последней точки с замыканием */
  closed?: boolean;

  onSelect: (index: number | null) => void;
  onRemove: (index: number) => void;
  onFlyTo: (index: number) => void;
  onCopyCoords: (index: number) => void;
}

// Хав-формула локально
function distanceBetween(a: MeasurePoint, b: MeasurePoint): number {
  const R = 6371008.8;
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a.lat * toRad) *
      Math.cos(b.lat * toRad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

function PointsList({
  points,
  selectedIndex,
  coordinateFormat,
  heightUnit,
  distanceUnit,
  highPrecision,
  showHeights = false,
  closed = false,
  onSelect,
  onRemove,
  onFlyTo,
  onCopyCoords,
}: PointsListProps) {
  if (points.length === 0) {
    return (
      <div style={styles.empty}>
        Кликайте по карте, чтобы добавить точки измерения.
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {points.map(function (p, idx) {
        const isSelected = idx === selectedIndex;

        // Расстояние от предыдущей точки (или от последней к первой, если замкнуто)
        let segLabel = '';
        if (idx > 0) {
          const d = distanceBetween(points[idx - 1], p);
          segLabel = '+' + formatDistance(d, distanceUnit, highPrecision);
        } else if (closed && points.length >= 3) {
          const d = distanceBetween(points[points.length - 1], p);
          segLabel = '+' + formatDistance(d, distanceUnit, highPrecision);
        }

        return (
          <div
            key={idx}
            style={{
              ...styles.row,
              backgroundColor: isSelected
                ? 'var(--accent-soft)'
                : 'transparent',
              borderColor: isSelected
                ? 'var(--accent-border)'
                : 'transparent',
            }}
            onClick={function () {
              onSelect(isSelected ? null : idx);
            }}
            title={
              p.lat.toFixed(8) +
              ', ' +
              p.lon.toFixed(8) +
              ' (h=' +
              (p.height || 0).toFixed(2) +
              ' м)'
            }
          >
            <span style={styles.num}>{idx + 1}</span>

            <div style={styles.content}>
              <div style={styles.mainRow}>
                <span style={styles.coords}>
                  {formatLatLon(
                    p.lat,
                    p.lon,
                    coordinateFormat,
                    highPrecision
                  )}
                </span>
                {segLabel && (
                  <span style={styles.segment}>{segLabel}</span>
                )}
              </div>
              {showHeights && (
                <div style={styles.subRow}>
                  <span style={styles.height}>
                    h = {formatHeight(p.height || 0, heightUnit)}
                  </span>
                </div>
              )}
            </div>

            <span style={styles.actions}>
              <button
                style={styles.iconBtn}
                onClick={function (e) {
                  e.stopPropagation();
                  onFlyTo(idx);
                }}
                title="Перелететь к точке"
              >
                <Crosshair size={11} />
              </button>
              <button
                style={styles.iconBtn}
                onClick={function (e) {
                  e.stopPropagation();
                  onCopyCoords(idx);
                }}
                title="Скопировать координаты"
              >
                <Copy size={11} />
              </button>
              <button
                style={{ ...styles.iconBtn, color: 'var(--danger)' }}
                onClick={function (e) {
                  e.stopPropagation();
                  onRemove(idx);
                }}
                title="Удалить точку"
              >
                <Trash2 size={11} />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    maxHeight: 260,
    overflowY: 'auto',
    padding: '2px 0',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 8px',
    borderRadius: 'var(--radius-small)',
    border: '1px solid transparent',
    cursor: 'pointer',
    fontSize: 11.5,
    transition: 'all 0.12s',
  },
  num: {
    minWidth: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent)',
    borderRadius: '50%',
    fontWeight: 700,
    fontSize: 10,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  mainRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  subRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  coords: {
    flex: 1,
    fontFamily: 'Consolas, monospace',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  segment: {
    fontSize: 10,
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
    fontWeight: 600,
    flexShrink: 0,
  },
  height: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
  },
  actions: {
    display: 'flex',
    gap: 1,
    flexShrink: 0,
  },
  iconBtn: {
    width: 22,
    height: 22,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: 3,
  },
  empty: {
    padding: '20px 12px',
    textAlign: 'center',
    fontSize: 11.5,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
};

export default PointsList;