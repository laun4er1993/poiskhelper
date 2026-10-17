// =====================================================
// src/components/properties/IconPicker.tsx
// Выбор иконки для метки
// =====================================================

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PLACEMARK_ICONS } from '../../types/icons';
import IconPreview from './IconPreview';

// =====================================================
// === Пропсы ===
// =====================================================
interface IconPickerProps {
  currentIconHref: string;
  currentColor: string;
  currentOutlineColor: string;
  currentOutlineWidth: number;
  onChange: (iconHref: string) => void;
}

// =====================================================
// === Компонент ===
// =====================================================
function IconPicker({
  currentIconHref,
  currentColor,
  currentOutlineColor,
  currentOutlineWidth,
  onChange,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedIcon = PLACEMARK_ICONS.find(function (i) {
    return i.href === currentIconHref;
  });

  const displayLabel =
    currentIconHref === ''
      ? 'По умолчанию (кружок)'
      : selectedIcon?.label || 'Своя иконка';

  return (
    <div style={styles.wrap}>
      <button
        style={styles.pickerBtn}
        onClick={function () {
          setOpen(!open);
        }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span style={styles.label}>{displayLabel}</span>
        <IconPreview
          iconHref={currentIconHref}
          sizePx={16}
          fillColor={currentColor}
          outlineColor={currentOutlineColor}
          outlineFraction={currentOutlineWidth}
        />
      </button>

      {open && (
        <div style={styles.grid}>
          {PLACEMARK_ICONS.map(function (icon) {
            const active = currentIconHref === icon.href;
            return (
              <button
                key={icon.id}
                style={{
                  ...styles.cell,
                  borderColor: active ? 'var(--accent)' : 'transparent',
                  backgroundColor: active
                    ? 'var(--bg-surface-hover)'
                    : 'transparent',
                }}
                onClick={function () {
                  onChange(icon.href);
                  setOpen(false);
                }}
                title={icon.label}
              >
                <IconPreview
                  iconHref={icon.href}
                  sizePx={20}
                  fillColor={currentColor}
                  outlineColor={currentOutlineColor}
                  outlineFraction={currentOutlineWidth}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
  },
  pickerBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '7px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    color: 'var(--text-primary)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    width: '100%',
  },
  label: {
    marginLeft: 8,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 4,
    padding: 6,
    marginTop: 6,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    maxHeight: 220,
    overflowY: 'auto',
  },
  cell: {
    width: '100%',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1.5px solid transparent',
    borderRadius: 5,
    cursor: 'pointer',
    padding: 2,
  },
};

export default IconPicker;