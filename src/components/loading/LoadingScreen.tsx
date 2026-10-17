// =====================================================
// src/components/loading/LoadingScreen.tsx
// Стартовый загрузочный экран
// =====================================================

import { useEffect, useState } from 'react';
import { Globe2 } from 'lucide-react';

interface LoadingScreenProps {
  visible: boolean;
  message?: string;
}

function LoadingScreen({ visible, message }: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(
    function () {
      if (!visible) return;
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
    [visible]
  );

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <Globe2 size={56} color="var(--accent)" strokeWidth={1.5} />
          <div style={styles.glow} />
        </div>
        <div style={styles.title}>PoiskHelper</div>
        <div style={styles.subtitle}>
          {message || 'Загрузка 3D-глобуса'}
          {dots}
        </div>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} />
        </div>
        <div style={styles.hint}>
          Первая загрузка может занять несколько секунд
        </div>
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
    backgroundColor: 'var(--bg-app)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    fontFamily: 'Segoe UI, sans-serif',
    transition: 'opacity 0.4s ease',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '40px 60px',
    borderRadius: 16,
    backgroundColor: 'color-mix(in srgb, var(--bg-modal) 60%, transparent)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xl)',
    minWidth: 320,
  },
  iconWrap: {
    position: 'relative',
    width: 80,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: '50%',
    background:
      'radial-gradient(circle, color-mix(in srgb, var(--accent) 35%, transparent) 0%, transparent 70%)',
    animation: 'pulse 2s ease-in-out infinite',
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    minHeight: 18,
  },
  progressBar: {
    width: 220,
    height: 3,
    backgroundColor: 'var(--border)',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%',
    height: '100%',
    backgroundColor: 'var(--accent)',
    borderRadius: 2,
    animation: 'slide 1.5s ease-in-out infinite',
  },
  hint: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
};

export default LoadingScreen;