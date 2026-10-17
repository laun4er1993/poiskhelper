// =====================================================
// src/components/settings/tabs/CreateMenuTab.tsx
// Настройки меню создания (двойной клик по карте)
// =====================================================

import {
  MousePointerClick,
  Layers,
  Info,
  RotateCcw,
} from 'lucide-react';
import type { AppSettings } from '../../../types/settings';
import type { MapCreateMenuSettings } from '../../../types/settings';
import { DEFAULT_MAP_CREATE_MENU } from '../../../types/settings';
import Section from '../ui/Section';
import ToggleOption from '../ui/ToggleOption';

interface CreateMenuTabProps {
  settings: AppSettings;
  onChange: (updater: Partial<AppSettings>) => void;
}

function CreateMenuTab({ settings, onChange }: CreateMenuTabProps) {
  const M = settings.mapCreateMenu;

  const updateCreateMenu = function <K extends keyof MapCreateMenuSettings>(
    key: K,
    value: MapCreateMenuSettings[K]
  ) {
    onChange({
      mapCreateMenu: { ...settings.mapCreateMenu, [key]: value },
    });
  };

  const handleReset = function () {
    if (window.confirm('Сбросить настройки меню на карте?')) {
      onChange({ mapCreateMenu: DEFAULT_MAP_CREATE_MENU });
    }
  };

  return (
    <>
      {/* ============ ОСНОВНОЕ ============ */}
      <Section title="Основное" icon={<MousePointerClick size={13} />}>
        <ToggleOption
          label="Показывать меню при двойном клике по карте"
          checked={M.enabled}
          onChange={function (v) {
            updateCreateMenu('enabled', v);
          }}
        />
        <div style={styles.hintSmall}>
          Меню появляется в точке клика и предлагает создать объект.
          Одиночный клик по-прежнему только выбирает.
        </div>

        <ToggleOption
          label="Сразу активировать выбранный режим"
          checked={M.autoActivateMode}
          onChange={function (v) {
            updateCreateMenu('autoActivateMode', v);
          }}
          disabled={!M.enabled}
        />
      </Section>

      {/* ============ СОСТАВ ============ */}
      <Section title="Какие пункты показывать" icon={<Layers size={13} />}>
        <ToggleOption
          label="Метка"
          checked={M.showPlace}
          onChange={function (v) {
            updateCreateMenu('showPlace', v);
          }}
          disabled={!M.enabled}
        />
        <ToggleOption
          label="Папка"
          checked={M.showFolder}
          onChange={function (v) {
            updateCreateMenu('showFolder', v);
          }}
          disabled={!M.enabled}
        />
        <ToggleOption
          label="Измерение"
          checked={M.showMeasure}
          onChange={function (v) {
            updateCreateMenu('showMeasure', v);
          }}
          disabled={!M.enabled}
        />
        <ToggleOption
          label="Линия (в разработке)"
          checked={M.showLine}
          onChange={function (v) {
            updateCreateMenu('showLine', v);
          }}
          disabled={!M.enabled}
        />
        <ToggleOption
          label="Полигон (в разработке)"
          checked={M.showPolygon}
          onChange={function (v) {
            updateCreateMenu('showPolygon', v);
          }}
          disabled={!M.enabled}
        />
      </Section>

      {/* ============ ПОДСКАЗКА ============ */}
      <Section title="Подсказка" icon={<Info size={13} />}>
        <div style={styles.hintSmall}>
          Двойной клик по карте (в режиме выбора) вызовет меню с
          координатами. Клавиши: ↑↓ — навигация, Enter — ОК, Esc —
          отмена. Меню «прилипает» к точке на карте — при движении
          камеры оно остаётся на месте относительно земли.
        </div>
      </Section>

      {/* ============ СБРОС ============ */}
      <div style={styles.resetRow}>
        <button style={styles.resetBtn} onClick={handleReset}>
          <RotateCcw size={11} /> Сбросить меню на карте
        </button>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hintSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    marginTop: 4,
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  resetRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid var(--border)',
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--danger)',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
};

export default CreateMenuTab;