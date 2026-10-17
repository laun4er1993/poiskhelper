// =====================================================
// src/components/settings/tabs/PopupTab.tsx
// Настройки всплывающего окна на карте
// =====================================================

import {
  Eye,
  Palette,
  Sliders,
  Info,
  RotateCcw,
} from 'lucide-react';
import type { AppSettings } from '../../../types/settings';
import type {
  MapPopupMode,
  MapPopupSettings,
  DesignSettings,
} from '../../../types/settings';
import { DEFAULT_MAP_POPUP } from '../../../types/settings';
import Section from '../ui/Section';
import FieldRow from '../ui/FieldRow';
import SegmentButton from '../ui/SegmentButton';
import ToggleOption from '../ui/ToggleOption';
import ColorInput from '../ui/ColorInput';

interface PopupTabProps {
  settings: AppSettings;
  onChange: (updater: Partial<AppSettings>) => void;
}

function PopupTab({ settings, onChange }: PopupTabProps) {
  const P = settings.mapPopup;

  const updatePopup = function <K extends keyof MapPopupSettings>(
    key: K,
    value: MapPopupSettings[K]
  ) {
    onChange({
      mapPopup: { ...settings.mapPopup, [key]: value },
    });
  };

  const updateDesign = function <K extends keyof DesignSettings>(
    key: K,
    value: DesignSettings[K]
  ) {
    onChange({
      design: { ...settings.design, [key]: value },
    });
  };

  const handleResetPopup = function () {
    if (window.confirm('Сбросить настройки попапа?')) {
      onChange({ mapPopup: DEFAULT_MAP_POPUP });
    }
  };

  return (
    <>
      {/* ============ РЕЖИМ ============ */}
      <Section title="Режим отображения" icon={<Eye size={13} />}>
        <FieldRow label="Показывать:">
          <SegmentButton
            label="Всегда при клике"
            active={P.mode === 'always'}
            onClick={function () {
              updatePopup('mode', 'always' as MapPopupMode);
            }}
          />
          <SegmentButton
            label="Только выделенным"
            active={P.mode === 'selected-only'}
            onClick={function () {
              updatePopup('mode', 'selected-only' as MapPopupMode);
            }}
          />
          <SegmentButton
            label="Отключён"
            active={P.mode === 'off'}
            onClick={function () {
              updatePopup('mode', 'off' as MapPopupMode);
            }}
          />
        </FieldRow>
        <ToggleOption
          label="Открывать редактор сразу при клике"
          checked={P.autoOpenEditor}
          onChange={function (v) {
            updatePopup('autoOpenEditor', v);
          }}
        />
        <div style={styles.hintSmall}>
          Если выключено — редактор откроется только по кнопке
          «Редактировать» в попапе.
        </div>
      </Section>

      {/* ============ ВНЕШНИЙ ВИД ============ */}
      <Section title="Внешний вид" icon={<Palette size={13} />}>
        <FieldRow
          label={'Прозрачность фона: ' + Math.round(P.opacity * 100) + '%'}
        >
          <input
            type="range"
            min={20}
            max={100}
            value={Math.round(P.opacity * 100)}
            onChange={function (e) {
              updatePopup('opacity', parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
        </FieldRow>
        <FieldRow label={'Ширина: ' + P.width + ' px'}>
          <input
            type="range"
            min={220}
            max={420}
            step={10}
            value={P.width}
            onChange={function (e) {
              updatePopup('width', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
        <FieldRow
          label={
            'Затемнение вокруг: ' + Math.round(P.backdropDim * 100) + '%'
          }
        >
          <input
            type="range"
            min={0}
            max={70}
            value={Math.round(P.backdropDim * 100)}
            onChange={function (e) {
              updatePopup('backdropDim', parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
        </FieldRow>
        <FieldRow label="Цвет фона:">
          <ColorInput
            value={settings.design.popupBackground}
            onChange={function (v) {
              updateDesign('popupBackground', v);
            }}
          />
        </FieldRow>
        <ToggleOption
          label="Акцентная полоса слева"
          checked={settings.design.popupAccentStripe}
          onChange={function (v) {
            updateDesign('popupAccentStripe', v);
          }}
        />
      </Section>

      {/* ============ ПОВЕДЕНИЕ ============ */}
      <Section title="Поведение" icon={<Sliders size={13} />}>
        <FieldRow
          label={'Задержка перед показом: ' + P.delayMs + ' мс'}
        >
          <input
            type="range"
            min={0}
            max={1000}
            step={50}
            value={P.delayMs}
            onChange={function (e) {
              updatePopup('delayMs', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
        <FieldRow
          label={
            P.autoHideMs > 0
              ? 'Автоскрытие через ' +
                (P.autoHideMs / 1000).toFixed(1) +
                ' сек'
              : 'Автоскрытие выключено'
          }
        >
          <input
            type="range"
            min={0}
            max={10000}
            step={500}
            value={P.autoHideMs}
            onChange={function (e) {
              updatePopup('autoHideMs', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
      </Section>

      {/* ============ СОДЕРЖИМОЕ ============ */}
      <Section title="Содержимое" icon={<Info size={13} />}>
        <ToggleOption
          label="Координаты"
          checked={P.showCoords}
          onChange={function (v) {
            updatePopup('showCoords', v);
          }}
        />
        <ToggleOption
          label="Высота"
          checked={P.showHeight}
          onChange={function (v) {
            updatePopup('showHeight', v);
          }}
        />
        <ToggleOption
          label="Описание"
          checked={P.showDescription}
          onChange={function (v) {
            updatePopup('showDescription', v);
          }}
        />
        <ToggleOption
          label="Бейдж типа объекта"
          checked={P.showTypeBadge}
          onChange={function (v) {
            updatePopup('showTypeBadge', v);
          }}
        />
        {P.showDescription && (
          <FieldRow label={'Строк описания: ' + P.descriptionMaxLines}>
            <input
              type="range"
              min={1}
              max={10}
              value={P.descriptionMaxLines}
              onChange={function (e) {
                updatePopup(
                  'descriptionMaxLines',
                  parseInt(e.target.value)
                );
              }}
              style={styles.range}
            />
          </FieldRow>
        )}
      </Section>

      {/* ============ СБРОС ============ */}
      <div style={styles.resetRow}>
        <button style={styles.resetBtn} onClick={handleResetPopup}>
          <RotateCcw size={11} /> Сбросить попап
        </button>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  range: {
    flex: 1,
    maxWidth: 260,
    accentColor: 'var(--accent)',
  },
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

export default PopupTab;