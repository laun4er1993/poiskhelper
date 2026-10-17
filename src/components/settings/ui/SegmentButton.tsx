// =====================================================
// src/components/settings/ui/SegmentButton.tsx
// Кнопка-сегмент (групповой переключатель)
// =====================================================

interface SegmentButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function SegmentButton({ label, active, onClick }: SegmentButtonProps) {
  return (
    <button
      style={{
        ...styles.btn,
        backgroundColor: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    padding: '5px 12px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    minWidth: 36,
    backgroundColor: 'transparent',
  },
};

export default SegmentButton;