// =====================================================
// src/components/confirm/ConfirmDialog.tsx
// Универсальный диалог подтверждения
// с опциональной третьей кнопкой
// =====================================================

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// =====================================================
// === Пропсы ===
// =====================================================
interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  okLabel?: string;
  cancelLabel?: string;
  /** Опциональная третья кнопка между «Отмена» и «ОК». */
  thirdLabel?: string;
  /** Callback для третьей кнопки. Если не задан — кнопка не показывается. */
  onThird?: () => void;
  /** true — красная опасная кнопка (для удаления) */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// =====================================================
// === Компонент ===
// =====================================================
function ConfirmDialog({
  visible,
  title,
  message,
  okLabel,
  cancelLabel,
  thirdLabel,
  onThird,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Фокус по умолчанию на «Отмена» — Enter безопасен
  useEffect(
    function () {
      if (!visible) return;
      const t = setTimeout(function () {
        cancelBtnRef.current?.focus();
      }, 60);
      return function () {
        clearTimeout(t);
      };
    },
    [visible]
  );

  // Esc — отмена
  useEffect(
    function () {
      if (!visible) return;
      const handler = function (e: KeyboardEvent) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
      };
      window.addEventListener('keydown', handler, true);
      return function () {
        window.removeEventListener('keydown', handler, true);
      };
    },
    [visible, onCancel]
  );

  if (!visible) return null;

  const showThird = !!(thirdLabel && onThird);

  return (
    <div style={styles.backdrop} onClick={onCancel}>
      <div
        style={styles.modal}
        onClick={function (e) {
          e.stopPropagation();
        }}
        role="alertdialog"
      >
        <div style={styles.header}>
          <span style={styles.icon}>
            <AlertTriangle
              size={16}
              color={danger ? 'var(--danger)' : 'var(--warning)'}
            />
          </span>
          <span style={styles.title}>{title || 'Подтверждение'}</span>
          <button
            style={styles.closeBtn}
            onClick={onCancel}
            tabIndex={-1}
            title="Отмена (Esc)"
          >
            <X size={14} />
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.message}>{message}</div>
        </div>

        <div style={styles.footer}>
          <button
            ref={cancelBtnRef}
            style={styles.cancelBtn}
            onClick={onCancel}
          >
            {cancelLabel || 'Отмена'}
          </button>

          {showThird && (
            <button
              style={styles.thirdBtn}
              onClick={onThird}
              title={thirdLabel}
            >
              {thirdLabel}
            </button>
          )}

          <button
            style={{
              ...styles.confirmBtn,
              backgroundColor: danger ? 'var(--danger)' : 'var(--accent)',
            }}
            onClick={onConfirm}
          >
            {okLabel || 'ОК'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--backdrop)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    fontFamily: 'Segoe UI, sans-serif',
    animation: 'fadeIn 0.12s ease',
  },
  modal: {
    width: 460,
    maxWidth: '92vw',
    backgroundColor: 'var(--bg-modal)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-xl)',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    animation: 'scaleIn 0.16s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 14px',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg-panel-header)',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: '50%',
    backgroundColor: 'var(--warning-soft)',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: 600,
  },
  closeBtn: {
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
  },
  body: {
    padding: '16px 18px',
  },
  message: {
    fontSize: 12.5,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    color: 'var(--text-primary)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '12px 14px',
    borderTop: '1px solid var(--border)',
    backgroundColor: 'var(--bg-panel-header)',
    flexWrap: 'wrap',
  },
  cancelBtn: {
    padding: '7px 16px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    outline: 'none',
  },
  thirdBtn: {
    padding: '7px 16px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 12.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    outline: 'none',
  },
  confirmBtn: {
    padding: '7px 18px',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: '#fff',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default ConfirmDialog;