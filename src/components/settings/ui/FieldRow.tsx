// =====================================================
// src/components/settings/ui/FieldRow.tsx
// Строка «label : контрол»
// =====================================================

interface FieldRowProps {
  label: string;
  children: React.ReactNode;
}

function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <div style={styles.control}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '5px 0',
    minHeight: 30,
  },
  label: {
    fontSize: 12.5,
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  control: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
};

export default FieldRow;