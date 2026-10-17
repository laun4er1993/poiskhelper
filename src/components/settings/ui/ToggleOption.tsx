// =====================================================
// src/components/settings/ui/ToggleOption.tsx
// Флажок с иконкой и подписью
// =====================================================

interface ToggleOptionProps {
  icon?: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleOption({
  icon,
  label,
  checked,
  onChange,
  disabled,
}: ToggleOptionProps) {
  return (
    <label
      style={{
        ...styles.toggle,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={function (e) {
          onChange(e.target.checked);
        }}
        disabled={disabled}
      />
      <span style={styles.content}>
        {icon}
        <span style={styles.text}>{label}</span>
      </span>
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toggle: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 6px',
    borderRadius: 'var(--radius-small)',
    transition: 'background 0.15s',
    marginBottom: 1,
  },
  content: {
    marginLeft: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 12.5,
    color: 'var(--text-primary)',
  },
};

export default ToggleOption;