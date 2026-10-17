// =====================================================
// src/components/measure/SegmentsList.tsx
// Список сегментов линейки: длина, азимут, уклон, перепад
// =====================================================

import { MoveRight, Navigation, TrendingUp } from 'lucide-react';
import type { SegmentMetricsResult } from '../../types/measure';
import type { DistanceUnit, HeightUnit } from '../../types/units';
import {
  formatDistance,
  formatAngle,
  formatHeight,
} from '../../types/format';

interface SegmentsListProps {
  data: SegmentMetricsResult;
  distanceUnit: DistanceUnit;
  heightUnit: HeightUnit;
  highPrecision: boolean;
}

function SegmentsList({
  data,
  distanceUnit,
  heightUnit,
  highPrecision,
}: SegmentsListProps) {
  if (data.segments.length === 0) {
    return (
      <div style={styles.empty}>
        Нужно минимум 2 точки, чтобы построить сегменты.
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {data.segments.map(function (s) {
        const slopeLabel =
          s.slopeDeg === 0
            ? '—'
            : (s.slopeDeg > 0 ? '↗ ' : '↘ ') +
              Math.abs(s.slopeDeg).toFixed(1) +
              '°';
        const slopePercentLabel =
          Math.abs(s.slopePercent) < 0.1
            ? ''
            : (s.slopePercent > 0 ? '+' : '') +
              s.slopePercent.toFixed(1) +
              '%';

        const deltaLabel =
          Math.abs(s.deltaHeight) < 0.01
            ? ''
            : (s.deltaHeight > 0 ? '+' : '') +
              s.deltaHeight.toFixed(1) +
              ' м';

        return (
          <div key={s.index} style={styles.row}>
            <div style={styles.headRow}>
              <span style={styles.segmentBadge}>
                {s.fromNumber}
                <MoveRight
                  size={9}
                  style={{ margin: '0 2px', verticalAlign: -1 }}
                />
                {s.toNumber}
              </span>
              <span style={styles.distance}>
                {formatDistance(s.distance, distanceUnit, highPrecision)}
              </span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detail}>
                <Navigation size={9} style={{ verticalAlign: -1 }} />
                {' '}
                {formatAngle(s.azimuth, highPrecision)}
              </span>

              {slopeLabel !== '—' && (
                <span style={styles.detail}>
                  <TrendingUp size={9} style={{ verticalAlign: -1 }} />
                  {' '}
                  {slopeLabel}
                  {slopePercentLabel && (
                    <span style={styles.slopePercent}>
                      {' '}
                      ({slopePercentLabel})
                    </span>
                  )}
                </span>
              )}

              {deltaLabel && (
                <span style={styles.detail}>
                  Δh {deltaLabel}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Итоговая строка */}
      <div style={styles.summaryRow}>
        <span style={styles.summaryLabel}>Всего сегментов:</span>
        <span style={styles.summaryValue}>{data.segments.length}</span>
      </div>

      {data.hasHeights && (
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>Суммарный перепад:</span>
          <span style={styles.summaryValue}>
            {(data.totalDeltaHeight > 0 ? '+' : '') +
              data.totalDeltaHeight.toFixed(1) +
              ' м'}
          </span>
        </div>
      )}

      {data.hasHeights && (
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>Мин / макс высота:</span>
          <span style={styles.summaryValue}>
            {formatHeight(data.minHeight, heightUnit)} /{' '}
            {formatHeight(data.maxHeight, heightUnit)}
          </span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    maxHeight: 280,
    overflowY: 'auto',
    padding: '2px 0',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    padding: '6px 8px',
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 'var(--radius-small)',
    border: '1px solid var(--border)',
  },
  headRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  segmentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 6px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent)',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'Consolas, monospace',
  },
  distance: {
    fontSize: 11.5,
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'Consolas, monospace',
  },
  detailRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
  },
  detail: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  slopePercent: {
    color: 'var(--text-secondary)',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 8px',
    marginTop: 4,
    borderTop: '1px solid var(--border)',
    fontSize: 11,
  },
  summaryLabel: {
    color: 'var(--text-muted)',
  },
  summaryValue: {
    color: 'var(--accent)',
    fontWeight: 600,
    fontFamily: 'Consolas, monospace',
  },
  empty: {
    padding: '16px 12px',
    textAlign: 'center',
    fontSize: 11.5,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
};

export default SegmentsList;