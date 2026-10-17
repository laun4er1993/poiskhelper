// =====================================================
// src/components/settings/ui/ColorInput.tsx
// Цветовой input + hex-значение
// =====================================================

interface ColorInputProps {
  value: string;
  onChange: (v: string) => void;
}

function ColorInput({ value, onChange }: ColorInputProps) {
  return (
    <>
      <input
        type="color"
        value={value}
        onChange={function (e) {
          onChange(e.target.value);
        }}
        style={styles.input}
      />
      <span style={styles.value}>{value}</span>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  input: {
    width: 44,
    height: 28,
    padding: 2,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
  },
  value: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
    minWidth: 62,
  },
};

export default ColorInput;