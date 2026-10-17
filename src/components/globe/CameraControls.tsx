// =====================================================
// src/components/globe/CameraControls.tsx
// Кнопки управления камерой: зум, сброс, ориентиры
// =====================================================

import {
  Plus,
  Minus,
  Home,
  Mountain,
  RotateCcw,
  Target,
} from 'lucide-react';

// =====================================================
// === Пропсы ===
// =====================================================
interface CameraControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onTopDown: () => void;
  onResetNorth: () => void;
  onFlyToProjectCenter: () => void;
}

// =====================================================
// === Компонент ===
// =====================================================
function CameraControls({
  onZoomIn,
  onZoomOut,
  onReset,
  onTopDown,
  onResetNorth,
  onFlyToProjectCenter,
}: CameraControlsProps) {
  return (
    <div
      data-globe-overlay="true"
      style={{
        ...styles.wrap,
        backgroundColor: 'var(--globe-nav-bg, rgba(20,24,32,0.8))',
        borderColor: 'var(--globe-nav-border, rgba(255,255,255,0.12))',
        borderRadius: 'var(--globe-nav-radius, 8px)',
        boxShadow: 'var(--globe-shadow)',
        backdropFilter: 'blur(var(--globe-blur, 14px))',
        WebkitBackdropFilter: 'blur(var(--globe-blur, 14px))',
      }}
    >
      <button
        style={styles.btn}
        onClick={onZoomIn}
        title="Приблизить"
      >
        <Plus size={16} />
      </button>
      <button
        style={styles.btn}
        onClick={onZoomOut}
        title="Отдалить"
      >
        <Minus size={16} />
      </button>

      <div style={styles.separator} />

      <button
        style={styles.btn}
        onClick={onReset}
        title="Сбросить камеру"
      >
        <Home size={16} />
      </button>
      <button
        style={styles.btn}
        onClick={onTopDown}
        title="Вид сверху"
      >
        <Mountain size={16} />
      </button>
      <button
        style={styles.btn}
        onClick={onResetNorth}
        title="Ориентировать на север"
      >
        <RotateCcw size={16} />
      </button>

      <div style={styles.separator} />

      <button
        style={{ ...styles.btn, color: 'var(--globe-nav-accent, var(--accent))' }}
        onClick={onFlyToProjectCenter}
        title="Перейти к центру проекта (все видимые метки)"
      >
        <Target size={16} />
      </button>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'absolute',
    bottom: 42,
    right: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: 4,
    border: '1px solid',
    userSelect: 'none',
  },
  btn: {
    width: 28,
    height: 28,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'background-color 0.15s',
    color: 'var(--globe-nav-text, var(--text-primary))',
  },
  separator: {
    height: 1,
    backgroundColor: 'var(--globe-nav-border, var(--border))',
    margin: '2px 4px',
  },
};

export default CameraControls;