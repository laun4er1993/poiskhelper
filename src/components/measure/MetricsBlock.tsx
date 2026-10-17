// =====================================================
// src/components/measure/MetricsBlock.tsx
// Блок метрик: длина, площадь, высоты, время в пути
// =====================================================

import { Ruler, Square, Mountain, Clock, Footprints } from 'lucide-react';
import type { MeasureMetrics } from '../../types/measure';
import type { DistanceUnit, HeightUnit } from '../../types/units';
import {
  formatDistance,
  formatArea,
  formatHeight,
} from '../../types/format';

interface MetricsBlockProps {
  metrics: MeasureMetrics;
  closed: boolean;
  distanceUnit: DistanceUnit;
  heightUnit: HeightUnit;
  highPrecision: boolean;
  /** Показывать время в пути */
  showWalkingTime: boolean;
  /** Скорость пешком, км/ч */
  walkingSpeed: number;
}

function MetricsBlock({
  metrics,
  closed,
  distanceUnit,
  heightUnit,
  highPrecision,
  showWalkingTime,
  walkingSpeed,
}: MetricsBlockProps) {
  // Время в пути
  let walkingText = '';
  if (showWalkingTime && walkingSpeed > 0 && metrics.totalDist > 0) {
    const hours = metrics.totalDist / 1000 / walkingSpeed;
    if (hours < 1) {
      walkingText = Math.round(hours * 60) + ' мин';
    } else {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      walkingText = h + ' ч ' + (m > 0 ? m + ' мин' : '');
    }
  }

  return (
    <div style={styles.block}>
      <div style={styles.row}>
        <span style={styles.label}>
          <Ruler size={11} /> Длина:
        </span>
        <span style={styles.value}>
          {formatDistance(metrics.totalDist, distanceUnit, highPrecision)}
        </span>
      </div>

      {closed && metrics.area > 0 && (
        <div style={styles.row}>
          <span style={styles.label}>
            <Square size={11} /> Площадь:
          </span>
          <span style={styles.value}>
            {formatArea(metrics.area, distanceUnit)}
          </span>
        </div>
      )}

      {metrics.hasHeights && metrics.segmentCount >= 1 && (
        <>
          <div style={styles.row}>
            <span style={styles.label}>
              <Mountain size={11} /> Высоты:
            </span>
            <span style={styles.value}>
              {formatHeight(metrics.minHeight, heightUnit)}
              {' / '}
              {formatHeight(metrics.avgHeight, heightUnit)}
              {' / '}
              {formatHeight(metrics.maxHeight, heightUnit)}
            </span>
          </div>
          <div style={styles.hintRow}>
            <span style={styles.hint}>min / средняя / max</span>
          </div>
        </>
      )}

      {walkingText && (
        <div style={styles.row}>
          <span style={styles.label}>
            <Footprints size={11} /> В пути:
          </span>
          <span style={styles.value}>
            <Clock size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
            {walkingText}
          </span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  block: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '6px 0',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: 'var(--text-secondary)',
    fontSize: 11.5,
  },
  value: {
    fontWeight: 600,
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
    fontSize: 12,
  },
  hintRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  hint: {
    color: 'var(--text-muted)',
    fontSize: 10,
    fontStyle: 'italic',
  },
};

export default MetricsBlock;