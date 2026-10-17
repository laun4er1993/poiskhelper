// =====================================================
// src/components/loading/LoadingOverlay.tsx
// Универсальный оверлей прогресса / успеха
// =====================================================

import { useEffect, useState } from 'react';
import { Loader2, X, Check } from 'lucide-react';

export type LoadingKind = 'spinner' | 'progress' | 'success';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
  progress?: number | null;
  kind?: LoadingKind;
  dismissible?: boolean;
  backdrop?: number;
  autoCloseMs?: number;
  onClose?: () => void;
}

function LoadingOverlay({
  visible,
  message,
  subMessage,
  progress,
  kind = 'spinner',
  dismissible = false,
  backdrop = 0.45,
  autoCloseMs,
  onClose,
}: LoadingOverlayProps) {
  const [visibleProgress, setVisibleProgress] = useState<number>(0);
  const [dots, setDots] = useState('');

  // Анимация точек
  useEffect(
    function () {
      if (!visible) return;
      if (kind !== 'spinner') return;
      const id = window.setInterval(function () {
        setDots(function (prev) {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 400);
      return function () {
        window.clearInterval(id);
      };
    },
    [visible, kind]
  );

  // Плавное движение прогресса
  useEffect(
    function () {
      if (progress === undefined || progress === null) return;
      const target = Math.max(0, Math.min(1, progress));
      const id = window.setInterval(function () {
        setVisibleProgress(function (prev) {
          if (Math.abs(prev - target) < 0.01) return target;
          const delta = (target - prev) * 0.15;
          return prev + delta;
        });
      }, 30);
      return function () {
        window.clearInterval(id);
      };
    },
    [progress]
  );

  // Сброс при скрытии
  useEffect(
    function () {
      if (!visible) {
        setVisibleProgress(0);
        setDots('');
      }
    },
    [visible]
  );

  // Авто-закрытие при success
  useEffect(
    function () {
      if (!visible) return;
      if (kind !== 'success') return;
      if (!autoCloseMs || autoCloseMs <= 0) return;
      if (!onClose) return;
      const t = setTimeout(function () {
        onClose();
      }, autoCloseMs);
      return function () {
        clearTimeout(t);
      };
    },
    [visible, kind, autoCloseMs, onClose]
  );

  // Esc — закрыть
  useEffect(
    function () {
      if (!visible || !dismissible || !onClose) return;
      const handler = function (e: KeyboardEvent) {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return function () {
        window.removeEventListener('keydown', handler);
      };
    },
    [visible, dismissible, onClose]
  );

  if (!visible) return null;

  const hasProgress =
    progress !== undefined && progress !== null && kind === 'progress';
  const percent = Math.round(visibleProgress * 100);

  return (
    <div
      style={{
        ...styles.overlay,
        backgroundColor: 'rgba(0, 0, 0, ' + backdrop + ')',
      }}
    >
      <div style={styles.card}>
        {dismissible && onClose && (
          <button
            style={styles.closeBtn}
            onClick={onClose}
            title="Закрыть (Esc)"
          >
            <X size={12} />
          </button>
        )}

        <div style={styles.iconWrap}>
          {kind === 'success' ? (
            <div style={styles.successCircle}>
              <Check size={24} color="#ffffff" strokeWidth={3} />
            </div>
          ) : (
            <Loader2
              size={32}
              color="var(--accent)"
              style={{ animation: 'spin 0.9s linear infinite' }}
            />
          )}
        </div>

        <div style={styles.messageWrap}>
          <div style={styles.message}>
            {message || 'Загрузка'}
            {kind === 'spinner' && dots}
          </div>
          {subMessage && (
            <div style={styles.subMessage}>{subMessage}</div>
          )}
        </div>

        {hasProgress && (
          <div style={styles.progressWrap}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: percent + '%',
                }}
              />
            </div>
            <div style={styles.progressLabel}>{percent}%</div>
          </div>
        )}

        {kind === 'progress' && !hasProgress && (
          <div style={styles.progressWrap}>
            <div style={styles.indeterminateBar}>
              <div style={styles.indeterminateFill} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8000,
    fontFamily: 'Segoe UI, sans-serif',
    animation: 'fadeIn 0.15s ease',
    pointerEvents: 'auto',
  },
  card: {
    position: 'relative',
    minWidth: 280,
    maxWidth: 400,
    padding: '24px 28px 20px 28px',
    backgroundColor: 'var(--bg-modal)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    animation: 'scaleIn 0.2s ease',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    transition: 'background-color 0.15s',
  },
  iconWrap: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px color-mix(in srgb, var(--success) 40%, transparent)',
    animation: 'scaleIn 0.25s ease',
  },
  messageWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    textAlign: 'center',
    minWidth: 0,
    width: '100%',
  },
  message: {
    fontSize: 13.5,
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  subMessage: {
    fontSize: 11.5,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
    fontStyle: 'italic',
    wordBreak: 'break-word',
  },
  progressWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'var(--bg-input)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--accent)',
    borderRadius: 3,
    transition: 'width 0.25s ease',
    background:
      'linear-gradient(90deg, var(--accent), var(--accent-hover))',
  },
  progressLabel: {
    fontSize: 11.5,
    fontWeight: 600,
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
    minWidth: 40,
    textAlign: 'right',
  },
  indeterminateBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'var(--bg-input)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  indeterminateFill: {
    position: 'absolute',
    height: '100%',
    width: '40%',
    backgroundColor: 'var(--accent)',
    borderRadius: 3,
    animation: 'shimmer 1.4s ease-in-out infinite',
    background:
      'linear-gradient(90deg, transparent, var(--accent), transparent)',
  },
};

export default LoadingOverlay;