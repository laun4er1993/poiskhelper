// =====================================================
// src/components/settings/ui/RadioOption.tsx
// Радио-опция с примером
// =====================================================

interface RadioOptionProps {
  label: string;
  example: string;
  value: string;
  current: string;
  onChange: (value: string) => void;
}

function RadioOption({
  label,
  example,
  value,
  current,
  onChange,
}: RadioOptionProps) {
  const active = current === value;

  return (
    <label
      style={{
        ...styles.radio,
        backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <input
        type="radio"
        checked={active}
        onChange={function () {
          onChange(value);
        }}
        style={{ marginRight: 4 }}
      />
      <div style={{ flex: 1 }}>
        <div style={styles.label}>{label}</div>
        <div style={styles.example}>{example}</div>
      </div>
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  radio: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '8px 10px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: 4,
  },
  label: {
    fontSize: 12.5,
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  example: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 2,
    fontFamily: 'Consolas, monospace',
  },
};

export default RadioOption;