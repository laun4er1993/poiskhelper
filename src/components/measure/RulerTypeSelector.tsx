// =====================================================
// src/components/measure/RulerTypeSelector.tsx
// Переключатель типа линейки: Простая / Путь / Площадь
// =====================================================

import { MEASURE_RULERS } from '../../types/measure';
import type { MeasureRulerType } from '../../types/measure';

interface RulerTypeSelectorProps {
  active: MeasureRulerType;
  onChange: (type: MeasureRulerType) => void;
  /** Отключить переключение (например, при сохранении) */
  disabled?: boolean;
}

function RulerTypeSelector({
  active,
  onChange,
  disabled,
}: RulerTypeSelectorProps) {
  return (
    <div style={styles.row}>
      {MEASURE_RULERS.map(function (ruler) {
        const isActive = active === ruler.id;
        return (
          <button
            key={ruler.id}
            style={{
              ...styles.btn,
              backgroundColor: isActive ? 'var(--accent)' : 'transparent',
              color: isActive
                ? 'var(--accent-text)'
                : 'var(--text-secondary)',
              borderColor: isActive ? 'var(--accent)' : 'var(--border)',
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            onClick={function () {
              if (disabled) return;
              onChange(ruler.id);
            }}
            disabled={disabled}
            title={ruler.description}
          >
            {ruler.label}
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    gap: 3,
    padding: '0 0 8px 0',
    borderBottom: '1px solid var(--border)',
    marginBottom: 8,
  },
  btn: {
    flex: 1,
    padding: '5px 8px',
    fontSize: 11,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    fontWeight: 500,
    transition: 'all 0.15s',
  },
};

export default RulerTypeSelector;