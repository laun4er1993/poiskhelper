// =====================================================
// src/components/project-details/CameraCard.tsx
// Карточка домашней камеры
// =====================================================

import {
  Crosshair,
  Mountain,
  Globe2,
  Camera,
  Trash2,
} from 'lucide-react';
import type { HomeCamera } from '../../types/project';

interface CameraCardProps {
  camera: HomeCamera | null;
  currentCamera: HomeCamera | null;
  onFlyToHome: (cam: HomeCamera) => void;
  onSetFromCurrent: () => void;
  onClear: () => void;
}

function CameraCard({
  camera,
  currentCamera,
  onFlyToHome,
  onSetFromCurrent,
  onClear,
}: CameraCardProps) {
  if (!camera) {
    return (
      <div style={styles.cameraEmpty}>
        <Camera size={22} color="var(--text-muted)" strokeWidth={1.2} />
        <div style={styles.cameraEmptyText}>
          Домашняя камера не задана.
          <br />
          Сохраните текущее положение глобуса, чтобы быстро возвращаться к
          нему.
        </div>
        <button
          style={styles.outlineBtn}
          onClick={onSetFromCurrent}
          disabled={!currentCamera}
        >
          <Camera size={12} /> Сохранить текущее положение
        </button>
      </div>
    );
  }

  return (
    <div style={styles.cameraCard}>
      <div style={styles.cameraCoords}>
        <div style={styles.cameraLine}>
          <Crosshair size={11} />
          <span style={styles.cameraMono}>
            {camera.lat.toFixed(6)}, {camera.lon.toFixed(6)}
          </span>
        </div>
        <div style={styles.cameraLine}>
          <Mountain size={11} />
          <span style={styles.cameraMono}>
            высота {(camera.height / 1000).toFixed(1)} км
          </span>
        </div>
        <div style={styles.cameraLine}>
          <Globe2 size={11} />
          <span style={styles.cameraMono}>
            азимут {((camera.heading * 180) / Math.PI).toFixed(0)}°
          </span>
        </div>
      </div>
      <div style={styles.cameraActions}>
        <button
          style={styles.smallIconBtn}
          onClick={function () {
            onFlyToHome(camera);
          }}
          title="Перелететь"
        >
          <Crosshair size={12} />
        </button>
        <button
          style={styles.smallIconBtn}
          onClick={onSetFromCurrent}
          title="Заменить текущим положением"
          disabled={!currentCamera}
        >
          <Camera size={12} />
        </button>
        <button
          style={{ ...styles.smallIconBtn, color: 'var(--danger)' }}
          onClick={onClear}
          title="Удалить"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  cameraCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
  },
  cameraCoords: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cameraLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--text-secondary)',
    fontSize: 11.5,
  },
  cameraMono: {
    fontFamily: 'Consolas, monospace',
    color: 'var(--text-primary)',
  },
  cameraActions: {
    display: 'flex',
    gap: 4,
  },
  smallIconBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
  },
  cameraEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '16px 12px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-small)',
    textAlign: 'center',
  },
  cameraEmptyText: {
    fontSize: 11.5,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  outlineBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
};

export default CameraCard;