// =====================================================
// src/components/top-toolbar/ToolbarButton.tsx
// Кнопка тулбара (единый стиль)
// =====================================================

interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  /** Небольшая точка в углу — индикатор несохранённых изменений */
  hasDot?: boolean;
  color?: string;
}

function ToolbarButton({
  icon,
  title,
  onClick,
  active,
  hasDot,
  color,
}: ToolbarButtonProps) {
  return (
    <button
      style={{
        ...styles.btn,
        backgroundColor: active ? 'var(--accent)' : 'transparent',
        color: active
          ? 'var(--accent-text)'
          : color || 'var(--text-secondary)',
      }}
      onClick={onClick}
      title={title}
    >
      {icon}
      {hasDot && <span style={styles.unsavedDot} />}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    width: 'var(--toolbar-btn-size, 28px)',
    height: 'var(--toolbar-btn-size, 28px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: 'var(--toolbar-radius, 5px)',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    padding: 0,
    transition: 'background-color 0.12s, color 0.12s',
  },
  unsavedDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: 'var(--warning)',
    border: '1px solid var(--bg-panel-header)',
    pointerEvents: 'none',
  },
};

export default ToolbarButton;