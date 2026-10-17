// =====================================================
// src/components/measure/ExportBlock.tsx
// Блок экспорта метрик линейки (TXT, CSV, координаты)
// =====================================================

import { Copy, Download, FileText, Table } from 'lucide-react';
import type {
  MeasurePoint,
  MeasureMetrics,
  SegmentMetricsResult,
} from '../../types/measure';
import type {
  DistanceUnit,
  HeightUnit,
  CoordinateFormat,
} from '../../types/units';
import {
  formatLatLon,
  formatDistance,
  formatArea,
  formatHeight,
  formatAngle,
} from '../../types/format';

interface ExportBlockProps {
  points: MeasurePoint[];
  closed: boolean;
  metrics: MeasureMetrics;
  segments: SegmentMetricsResult;
  distanceUnit: DistanceUnit;
  heightUnit: HeightUnit;
  coordinateFormat: CoordinateFormat;
  highPrecision: boolean;
  rulerLabel: string;

  onCopyToClipboard: (text: string, label: string) => void;
}

function ExportBlock({
  points,
  closed,
  metrics,
  segments,
  distanceUnit,
  heightUnit,
  coordinateFormat,
  highPrecision,
  rulerLabel,
  onCopyToClipboard,
}: ExportBlockProps) {
  if (points.length < 2) {
    return (
      <div style={styles.empty}>
        Нужно минимум 2 точки, чтобы экспортировать данные.
      </div>
    );
  }

  // --- Полный отчёт ---
  const buildFullReport = function (): string {
    const lines: string[] = [];
    lines.push('=== Измерение (' + rulerLabel + ') ===');
    lines.push('');

    lines.push('--- Точки ---');
    let cumulative = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const accLabel =
        i === 0
          ? ''
          : ' [+' +
            formatDistance(cumulative, distanceUnit, highPrecision) +
            ']';
      lines.push(
        (i + 1) +
          '. ' +
          formatLatLon(p.lat, p.lon, coordinateFormat, highPrecision) +
          ' | h = ' +
          formatHeight(p.height || 0, heightUnit) +
          accLabel
      );
      if (i < points.length - 1) {
        cumulative += segments.segments[i]?.distance || 0;
      } else if (closed && points.length >= 3) {
        cumulative +=
          segments.segments[segments.segments.length - 1]?.distance || 0;
      }
    }
    lines.push('');

    lines.push('--- Сегменты ---');
    segments.segments.forEach(function (s) {
      lines.push(
        s.fromNumber +
          '→' +
          s.toNumber +
          ': ' +
          formatDistance(s.distance, distanceUnit, highPrecision) +
          ' | азимут ' +
          formatAngle(s.azimuth, highPrecision) +
          ' | уклон ' +
          s.slopeDeg.toFixed(1) +
          '° (' +
          s.slopePercent.toFixed(1) +
          '%)' +
          ' | Δh ' +
          (s.deltaHeight > 0 ? '+' : '') +
          s.deltaHeight.toFixed(2) +
          ' м'
      );
    });
    lines.push('');

    lines.push('--- Итоги ---');
    lines.push(
      'Длина: ' +
        formatDistance(metrics.totalDist, distanceUnit, highPrecision)
    );
    if (closed && metrics.area > 0) {
      lines.push('Площадь: ' + formatArea(metrics.area, distanceUnit));
    }
    if (metrics.hasHeights) {
      lines.push(
        'Высоты (min/avg/max): ' +
          formatHeight(metrics.minHeight, heightUnit) +
          ' / ' +
          formatHeight(metrics.avgHeight, heightUnit) +
          ' / ' +
          formatHeight(metrics.maxHeight, heightUnit)
      );
      lines.push(
        'Суммарный перепад: ' +
          (segments.totalDeltaHeight > 0 ? '+' : '') +
          segments.totalDeltaHeight.toFixed(2) +
          ' м'
      );
    }

    return lines.join('\n');
  };

  // --- CSV ---
  const buildCsv = function (): string {
    const lines: string[] = [];

    // Секция точек
    lines.push('# Точки');
    lines.push('N,Lat,Lon,Height_m,Distance_from_start_m');
    let cumulative = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      lines.push(
        (i + 1) +
          ',' +
          p.lat.toFixed(8) +
          ',' +
          p.lon.toFixed(8) +
          ',' +
          (p.height || 0).toFixed(2) +
          ',' +
          cumulative.toFixed(2)
      );
      if (i < points.length - 1) {
        cumulative += segments.segments[i]?.distance || 0;
      } else if (closed && points.length >= 3) {
        cumulative +=
          segments.segments[segments.segments.length - 1]?.distance || 0;
      }
    }
    lines.push('');

    // Секция сегментов
    lines.push('# Сегменты');
    lines.push('From,To,Distance_m,Azimuth_deg,Slope_deg,Slope_percent,Delta_h_m');
    segments.segments.forEach(function (s) {
      lines.push(
        s.fromNumber +
          ',' +
          s.toNumber +
          ',' +
          s.distance.toFixed(2) +
          ',' +
          s.azimuth.toFixed(2) +
          ',' +
          s.slopeDeg.toFixed(2) +
          ',' +
          s.slopePercent.toFixed(2) +
          ',' +
          s.deltaHeight.toFixed(2)
      );
    });

    return lines.join('\n');
  };

  // --- Только координаты ---
  const buildCoordsOnly = function (): string {
    return points
      .map(function (p) {
        return p.lat.toFixed(8) + ', ' + p.lon.toFixed(8);
      })
      .join('\n');
  };

  const handleCopyReport = function () {
    onCopyToClipboard(buildFullReport(), 'Отчёт измерения');
  };

  const handleCopyCsv = function () {
    onCopyToClipboard(buildCsv(), 'CSV измерения');
  };

  const handleCopyCoords = function () {
    onCopyToClipboard(buildCoordsOnly(), 'Координаты');
  };

  const handleDownloadTxt = function () {
    downloadTextFile(buildFullReport(), 'measure-report.txt');
  };

  const handleDownloadCsv = function () {
    downloadTextFile(buildCsv(), 'measure.csv');
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.grid}>
        <button style={styles.btn} onClick={handleCopyReport}>
          <FileText size={12} />
          <span>Копировать отчёт</span>
        </button>
        <button style={styles.btn} onClick={handleCopyCsv}>
          <Table size={12} />
          <span>Копировать CSV</span>
        </button>
        <button style={styles.btn} onClick={handleCopyCoords}>
          <Copy size={12} />
          <span>Только координаты</span>
        </button>
        <button style={styles.btn} onClick={handleDownloadTxt}>
          <Download size={12} />
          <span>Скачать .txt</span>
        </button>
        <button style={styles.btn} onClick={handleDownloadCsv}>
          <Download size={12} />
          <span>Скачать .csv</span>
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------
// Локальная функция скачивания
// -----------------------------------------------------
function downloadTextFile(text: string, filename: string) {
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (e) {
    console.error('downloadTextFile:', e);
    alert('Не удалось сохранить файл.');
  }
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 4,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    textAlign: 'left',
    justifyContent: 'flex-start',
  },
  empty: {
    padding: '16px 12px',
    textAlign: 'center',
    fontSize: 11.5,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
};

export default ExportBlock;