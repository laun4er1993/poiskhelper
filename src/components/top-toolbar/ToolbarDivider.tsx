// =====================================================
// src/components/top-toolbar/ToolbarDivider.tsx
// Разделитель между группами кнопок с подсветкой
// =====================================================

interface ToolbarDividerProps {
  label: string;
  isActive: boolean;
  onHover: (v: boolean) => void;
}

function ToolbarDivider({
  label,
  isActive,
  onHover,
}: ToolbarDividerProps) {
  return (
    <div
      style={{
        ...styles.wrap,
        opacity: isActive ? 1 : 0.85,
      }}
      onMouseEnter={function () {
        onHover(true);
      }}
      onMouseLeave={function () {
        onHover(false);
      }}
      title={label}
    >
      <div
        style={{
          ...styles.divider,
          backgroundColor: isActive ? 'var(--accent)' : 'var(--border)',
        }}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
    height: 22,
    cursor: 'help',
    transition: 'opacity 0.15s',
  },
  divider: {
    width: 1,
    height: 18,
    borderRadius: 1,
    transition: 'background-color 0.15s',
  },
};

export default ToolbarDivider;