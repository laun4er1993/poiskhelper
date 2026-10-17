// =====================================================
// src/components/welcome/WindowControls.tsx
// Кнопки управления окном в стиле Windows
// =====================================================

import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';

// =====================================================
// === Вспомогательная иконка «Восстановить» ===
// =====================================================
function RestoreIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="0.5" y="2.5" width="7" height="7" />
      <polyline points="3,0.5 10.5,0.5 10.5,8" />
    </svg>
  );
}

// =====================================================
// === Компонент ===
// =====================================================
function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(
    function () {
      let unlisten: (() => void) | null = null;

      const setup = async function () {
        try {
          const win = getCurrentWindow();
          const maximized = await win.isMaximized();
          setIsMaximized(maximized);

          unlisten = await win.onResized(async function () {
            try {
              const m = await win.isMaximized();
              setIsMaximized(m);
            } catch (e) {
              /* ignore */
            }
          });
        } catch (err) {
          console.warn('WindowControls: window API недоступен', err);
        }
      };

      setup();

      return function () {
        if (unlisten) unlisten();
      };
    },
    []
  );

  const handleMinimize = async function () {
    try {
      const win = getCurrentWindow();
      await win.minimize();
    } catch (err) {
      console.warn('Minimize error:', err);
    }
  };

  const handleToggleMaximize = async function () {
    try {
      const win = getCurrentWindow();
      await win.toggleMaximize();
    } catch (err) {
      console.warn('ToggleMaximize error:', err);
    }
  };

  const handleClose = async function () {
    try {
      const win = getCurrentWindow();
      await win.close();
    } catch (err) {
      console.warn('Close error, fallback:', err);
      window.close();
    }
  };

  return (
    <div style={styles.controls}>
      <button
        style={styles.btn}
        onClick={handleMinimize}
        title="Свернуть"
        onMouseEnter={function (e) {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'var(--overlay-medium)';
        }}
        onMouseLeave={function (e) {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'transparent';
        }}
      >
        <Minus size={12} strokeWidth={2.5} />
      </button>

      <button
        style={styles.btn}
        onClick={handleToggleMaximize}
        title={isMaximized ? 'Восстановить' : 'Развернуть'}
        onMouseEnter={function (e) {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'var(--overlay-medium)';
        }}
        onMouseLeave={function (e) {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'transparent';
        }}
      >
        {isMaximized ? (
          <RestoreIcon />
        ) : (
          <Square size={10} strokeWidth={2.2} />
        )}
      </button>

      <button
        style={{ ...styles.btn, ...styles.btnClose }}
        onClick={handleClose}
        title="Закрыть программу"
        onMouseEnter={function (e) {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#e81123';
          (e.currentTarget as HTMLElement).style.color = '#ffffff';
        }}
        onMouseLeave={function (e) {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'transparent';
          (e.currentTarget as HTMLElement).style.color = '';
        }}
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  controls: {
    position: 'absolute',
    top: 0,
    right: 0,
    display: 'flex',
    zIndex: 100,
    pointerEvents: 'auto',
  },
  btn: {
    width: 44,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    transition: 'background-color 0.12s, color 0.12s',
    outline: 'none',
  },
  btnClose: {
    color: 'var(--text-secondary)',
  },
};

export default WindowControls;