// =====================================================
// src/components/globe/InfoBar.tsx
// Нижняя инфо-линейка: масштаб, азимут, камера, FPS
// =====================================================

import type { AppSettings } from '../../types/settings';
import { formatHeight } from '../../types/format';

// =====================================================
// === Пропсы ===
// =====================================================
interface InfoBarProps {
  settings: AppSettings;
  scaleMeters: number;
  heading: number;
  cameraHeight: number;
  fps: number;
}

// =====================================================
// === Компонент ===
// =====================================================
function InfoBar({
  settings,
  scaleMeters,
  heading,
  cameraHeight,
  fps,
}: InfoBarProps) {
  const formatScaleLabel = function (meters: number): string {
    if (!isFinite(meters) || meters <= 0) return '';
    if (settings.distanceUnit === 'metric') {
      if (meters >= 1000) return (meters / 1000).toFixed(1) + ' км';
      return Math.round(meters) + ' м';
    }
    const feet = meters * 3.28084;
    if (feet >= 5280) return (feet / 5280).toFixed(1) + ' mi';
    return Math.round(feet) + ' ft';
  };

  return (
    <div
      data-globe-overlay="true"
      style={{
        ...styles.bar,
        backgroundColor: 'var(--globe-infobar-bg, rgba(20,24,32,0.85))',
        borderColor: 'var(--globe-infobar-border, var(--border))',
        color: 'var(--globe-infobar-text, var(--text-primary))',
        backdropFilter: 'blur(var(--globe-blur, 14px))',
        WebkitBackdropFilter: 'blur(var(--globe-blur, 14px))',
        height: 'var(--globe-infobar-height, 26px)',
      }}
    >
      <span style={styles.segment}>
        <span style={styles.label}>Масштаб:</span>
        <span
          style={{
            ...styles.value,
            color: 'var(--globe-infobar-accent, var(--accent))',
          }}
        >
          {formatScaleLabel(scaleMeters) || '—'}
        </span>
      </span>

      <span style={styles.divider} />

      <span style={styles.segment}>
        <span style={styles.label}>Азимут:</span>
        <span style={styles.value}>
          {Math.round(((heading % 360) + 360) % 360)}°
        </span>
      </span>

      <span style={styles.divider} />

      <span style={styles.segment}>
        <span style={styles.label}>Камера:</span>
        <span style={styles.value}>
          {formatHeight(cameraHeight, settings.heightUnit)}
        </span>
      </span>

      {settings.design.showFPS && (
        <>
          <span style={styles.divider} />
          <span style={styles.segment}>
            <span style={styles.label}>FPS:</span>
            <span style={styles.value}>{fps}</span>
          </span>
        </>
      )}
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    gap: 8,
    borderTop: '1px solid',
    fontFamily: 'Consolas, monospace',
    fontSize: 11,
    userSelect: 'none',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    zIndex: 10,
  },
  segment: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  label: {
    opacity: 0.6,
    fontSize: 10,
  },
  value: {
    fontWeight: 600,
    fontSize: 11,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'var(--globe-infobar-border, var(--border))',
    flexShrink: 0,
  },
};

export default InfoBar;