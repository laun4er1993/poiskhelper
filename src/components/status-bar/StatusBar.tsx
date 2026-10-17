// =====================================================
// src/components/status-bar/StatusBar.tsx
// Нижняя строка состояния
// =====================================================

import { Crosshair, Mountain, Compass as CompassIcon, Ruler, Eye } from 'lucide-react';
import type { AppSettings } from '../../types/settings';
import {
  formatLatLon,
  formatHeight,
  formatAngle,
  formatDistance,
} from '../../types/format';
import type { StatusBarData } from './types';

interface StatusBarProps {
  data: StatusBarData;
  settings: AppSettings;
}

const ICON = 11;

function StatusBar({ data, settings }: StatusBarProps) {
  const hasMouse = data.mouseLat !== null && data.mouseLon !== null;
  const hasHeight = data.mouseHeight !== null && isFinite(data.mouseHeight);

  return (
    <div style={styles.bar}>
      {settings.showMouseCoords && (
        <div style={styles.block}>
          <Crosshair size={ICON} color="var(--accent)" />
          <span style={styles.value}>
            {hasMouse
              ? formatLatLon(
                  data.mouseLat!,
                  data.mouseLon!,
                  settings.coordinateFormat,
                  settings.highPrecision
                )
              : '—'}
          </span>
        </div>
      )}

      {settings.showTerrainHeight && (
        <div style={styles.block}>
          <Mountain size={ICON} color="var(--success)" />
          <span style={styles.value}>
            {hasHeight
              ? formatHeight(data.mouseHeight!, settings.heightUnit)
              : '—'}
          </span>
        </div>
      )}

      {settings.showScaleLegend && (
        <div style={styles.block}>
          <Ruler size={ICON} color="var(--warning)" />
          <span style={styles.value}>
            {isFinite(data.scaleMeters) && data.scaleMeters > 0
              ? formatDistance(
                  data.scaleMeters,
                  settings.distanceUnit,
                  settings.highPrecision
                )
              : '—'}
          </span>
        </div>
      )}

      {settings.showCameraInfo && (
        <>
          <div style={styles.block}>
            <CompassIcon size={ICON} color="var(--danger)" />
            <span style={styles.value}>
              {formatAngle(data.cameraHeading, settings.highPrecision)}
            </span>
          </div>
          <div style={styles.block}>
            <Eye size={ICON} color="var(--accent)" />
            <span style={styles.value}>
              {formatAngle(
                90 + (data.cameraPitch * 180) / Math.PI,
                settings.highPrecision
              )}
            </span>
          </div>
          <div style={styles.block}>
            <Mountain size={ICON} color="var(--info)" />
            <span style={styles.value}>
              {isFinite(data.cameraHeight) && data.cameraHeight >= 0
                ? formatHeight(data.cameraHeight, settings.heightUnit)
                : '—'}
            </span>
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      <div style={styles.help}>ЛКМ — вращение · Колесо — зум · ПКМ — наклон</div>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  bar: {
    height: 24,
    backgroundColor: 'var(--bg-panel-header)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: 14,
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: 11,
    color: 'var(--text-secondary)',
    flexShrink: 0,
    userSelect: 'none',
    overflowX: 'auto',
    overflowY: 'hidden',
    transition: 'background-color 0.2s',
  },
  block: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
  },
  value: {
    color: 'var(--text-primary)',
    fontSize: 11,
    fontFamily: 'Consolas, "Courier New", monospace',
    fontWeight: 500,
    minWidth: 50,
  },
  help: {
    color: 'var(--text-muted)',
    fontSize: 10,
    fontStyle: 'italic',
    whiteSpace: 'nowrap',
  },
};

export default StatusBar;