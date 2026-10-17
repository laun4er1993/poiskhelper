// =====================================================
// src/components/save-notification/SaveNotification.tsx
// Плашка «Есть несохранённые изменения»
// =====================================================

import { Save, X, EyeOff, AlertCircle } from 'lucide-react';

interface SaveNotificationProps {
  visible: boolean;
  message?: string;
  onSave: () => void;
  onCancel: () => void;
  onHide: () => void;
}

function SaveNotification({
  visible,
  message,
  onSave,
  onCancel,
  onHide,
}: SaveNotificationProps) {
  if (!visible) return null;

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <AlertCircle size={16} color="var(--warning)" />
        <div style={styles.textWrap}>
          <div style={styles.title}>Несохранённые изменения</div>
          <div style={styles.message}>
            {message ||
              'Внесите изменения в проект и сохраните, чтобы не потерять данные.'}
          </div>
        </div>
        <div style={styles.actions}>
          <button
            style={styles.saveBtn}
            onClick={onSave}
            title="Сохранить проект (Ctrl+S)"
          >
            <Save size={14} /> Сохранить
          </button>
          <button
            style={styles.cancelBtn}
            onClick={onCancel}
            title="Отменить изменения"
          >
            <X size={14} /> Отменить
          </button>
          <button
            style={styles.hideBtn}
            onClick={onHide}
            title="Скрыть на время"
          >
            <EyeOff size={14} />
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
  container: {
    position: 'fixed',
    top: 52,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 400,
    animation: 'slideDown 0.3s ease',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    backgroundColor: 'color-mix(in srgb, var(--bg-modal) 97%, transparent)',
    backdropFilter: 'blur(var(--blur))',
    WebkitBackdropFilter: 'blur(var(--blur))',
    border: '1px solid var(--warning-border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-lg)',
    fontFamily: 'Segoe UI, sans-serif',
    maxWidth: '90vw',
  },
  textWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 200,
  },
  title: {
    fontSize: 12.5,
    fontWeight: 700,
    color: 'var(--warning)',
  },
  message: {
    fontSize: 11.5,
    color: 'var(--text-secondary)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    backgroundColor: 'var(--success)',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  hideBtn: {
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 0,
  },
};

export default SaveNotification;