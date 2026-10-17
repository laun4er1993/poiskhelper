// =====================================================
// src/components/settings/tabs/TextTab.tsx
// Настройки подписей
// =====================================================

import {
  Sparkles,
  Eye,
  Type as TypeIcon,
  Palette,
  Square,
  Crosshair,
  Sliders,
} from 'lucide-react';
import type {
  AppSettings,
} from '../../../types/settings';
import type {
  LabelSettings,
  LabelStyle,
} from '../../../types/labels';
import Section from '../ui/Section';
import FieldRow from '../ui/FieldRow';
import SegmentButton from '../ui/SegmentButton';
import ToggleOption from '../ui/ToggleOption';
import ColorInput from '../ui/ColorInput';
import { LABEL_PRESETS, formatKm, hexToRgba } from '../constants';
import type { LabelPreset } from '../constants';

interface TextTabProps {
  settings: AppSettings;
  onChange: (updater: Partial<AppSettings>) => void;
}

function TextTab({ settings, onChange }: TextTabProps) {
  const L = settings.labelDefaults;

  const updateLabel = function <K extends keyof LabelSettings>(
    key: K,
    value: LabelSettings[K]
  ) {
    const next: LabelSettings = { ...settings.labelDefaults, [key]: value };
    onChange({ labelDefaults: next });
  };

  const applyLabelPreset = function (preset: LabelPreset) {
    const next: LabelSettings = {
      ...settings.labelDefaults,
      ...preset.settings,
    };
    onChange({ labelDefaults: next });
  };

  return (
    <>
      {/* ============ ПРЕСЕТЫ ============ */}
      <Section title="Готовые пресеты" icon={<Sparkles size={13} />}>
        <div style={styles.presetGrid}>
          {LABEL_PRESETS.map(function (preset) {
            return (
              <button
                key={preset.id}
                style={styles.presetCard}
                onClick={function () {
                  applyLabelPreset(preset);
                }}
                title={preset.description}
              >
                <div style={styles.presetLabel}>{preset.label}</div>
                <div style={styles.presetDesc}>{preset.description}</div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ============ ОТОБРАЖЕНИЕ ============ */}
      <Section title="Отображение" icon={<Eye size={13} />}>
        <ToggleOption
          label="Показывать подписи на карте"
          checked={L.show}
          onChange={function (v) {
            updateLabel('show', v);
          }}
        />
        <ToggleOption
          label="Скрывать все подписи при отдалении"
          checked={settings.hideAllLabelsOnZoomOut}
          onChange={function (v) {
            onChange({ hideAllLabelsOnZoomOut: v });
          }}
        />
        {settings.hideAllLabelsOnZoomOut && (
          <div style={{ paddingLeft: 24, marginTop: 4 }}>
            <FieldRow
              label={'Порог: ' + formatKm(settings.zoomOutLabelThreshold)}
            >
              <input
                type="range"
                min={100}
                max={20000000}
                step={1000}
                value={settings.zoomOutLabelThreshold}
                onChange={function (e) {
                  onChange({
                    zoomOutLabelThreshold: parseInt(e.target.value),
                  });
                }}
                style={styles.range}
              />
            </FieldRow>
          </div>
        )}
      </Section>

      {/* ============ ШРИФТ ============ */}
      <Section title="Шрифт" icon={<TypeIcon size={13} />}>
        <FieldRow label="Семейство:">
          <select
            value={L.fontFamily}
            onChange={function (e) {
              updateLabel('fontFamily', e.target.value);
            }}
            style={styles.select}
          >
            <option value="Segoe UI">Segoe UI</option>
            <option value="Arial">Arial</option>
            <option value="Consolas">Consolas</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </FieldRow>

        <FieldRow label={'Размер: ' + L.fontSize + ' px'}>
          <input
            type="range"
            min={8}
            max={32}
            value={L.fontSize}
            onChange={function (e) {
              updateLabel('fontSize', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>

        <FieldRow label={'Масштаб: ' + L.scale.toFixed(2)}>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={L.scale}
            onChange={function (e) {
              updateLabel('scale', parseFloat(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
      </Section>

      {/* ============ ЦВЕТ ТЕКСТА ============ */}
      <Section title="Цвет текста" icon={<Palette size={13} />}>
        <FieldRow label="Цвет заливки:">
          <ColorInput
            value={L.fillColor}
            onChange={function (v) {
              updateLabel('fillColor', v);
            }}
          />
        </FieldRow>
        <FieldRow label="Цвет обводки:">
          <ColorInput
            value={L.outlineColor}
            onChange={function (v) {
              updateLabel('outlineColor', v);
            }}
          />
        </FieldRow>
        <FieldRow label={'Толщина обводки: ' + L.outlineWidth}>
          <input
            type="range"
            min={0}
            max={8}
            value={L.outlineWidth}
            onChange={function (e) {
              updateLabel('outlineWidth', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
        <FieldRow label="Стиль:">
          <SegmentButton
            label="Заливка"
            active={L.style === 'FILL'}
            onClick={function () {
              updateLabel('style', 'FILL' as LabelStyle);
            }}
          />
          <SegmentButton
            label="Обводка"
            active={L.style === 'OUTLINE'}
            onClick={function () {
              updateLabel('style', 'OUTLINE' as LabelStyle);
            }}
          />
          <SegmentButton
            label="Оба"
            active={L.style === 'FILL_AND_OUTLINE'}
            onClick={function () {
              updateLabel('style', 'FILL_AND_OUTLINE' as LabelStyle);
            }}
          />
        </FieldRow>
      </Section>

      {/* ============ ФОН ============ */}
      <Section title="Фон подписи" icon={<Square size={13} />}>
        <ToggleOption
          label="Показывать фон под текстом"
          checked={L.showBackground}
          onChange={function (v) {
            updateLabel('showBackground', v);
          }}
        />
        {L.showBackground && (
          <>
            <FieldRow label="Цвет фона:">
              <ColorInput
                value={L.backgroundColor}
                onChange={function (v) {
                  updateLabel('backgroundColor', v);
                }}
              />
            </FieldRow>
            <FieldRow
              label={
                'Непрозрачность: ' +
                Math.round(L.backgroundAlpha * 100) +
                '%'
              }
            >
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(L.backgroundAlpha * 100)}
                onChange={function (e) {
                  updateLabel(
                    'backgroundAlpha',
                    parseInt(e.target.value) / 100
                  );
                }}
                style={styles.range}
              />
            </FieldRow>
            <FieldRow label={'Отступ X: ' + L.paddingX + ' px'}>
              <input
                type="range"
                min={0}
                max={20}
                value={L.paddingX}
                onChange={function (e) {
                  updateLabel('paddingX', parseInt(e.target.value));
                }}
                style={styles.range}
              />
            </FieldRow>
            <FieldRow label={'Отступ Y: ' + L.paddingY + ' px'}>
              <input
                type="range"
                min={0}
                max={20}
                value={L.paddingY}
                onChange={function (e) {
                  updateLabel('paddingY', parseInt(e.target.value));
                }}
                style={styles.range}
              />
            </FieldRow>
          </>
        )}
      </Section>

      {/* ============ ПОЗИЦИЯ ============ */}
      <Section
        title="Позиция относительно точки"
        icon={<Crosshair size={13} />}
      >
        <FieldRow label={'Смещение X: ' + L.offsetX + ' px'}>
          <input
            type="range"
            min={-80}
            max={80}
            value={L.offsetX}
            onChange={function (e) {
              updateLabel('offsetX', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
        <FieldRow label={'Смещение Y: ' + L.offsetY + ' px'}>
          <input
            type="range"
            min={-80}
            max={80}
            value={L.offsetY}
            onChange={function (e) {
              updateLabel('offsetY', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
        <FieldRow label="Вертикально:">
          <select
            value={L.verticalOrigin}
            onChange={function (e) {
              updateLabel('verticalOrigin', parseInt(e.target.value));
            }}
            style={styles.select}
          >
            <option value={0}>Сверху</option>
            <option value={1}>По центру</option>
            <option value={2}>Снизу (над точкой)</option>
            <option value={3}>По базовой линии</option>
          </select>
        </FieldRow>
        <FieldRow label="Горизонтально:">
          <select
            value={L.horizontalOrigin}
            onChange={function (e) {
              updateLabel('horizontalOrigin', parseInt(e.target.value));
            }}
            style={styles.select}
          >
            <option value={0}>Слева</option>
            <option value={1}>По центру</option>
            <option value={2}>Справа</option>
          </select>
        </FieldRow>
      </Section>

      {/* ============ ПРОЗРАЧНОСТЬ ============ */}
      <Section
        title="Прозрачность и скрытие"
        icon={<Sliders size={13} />}
      >
        <FieldRow
          label={'Прозрачность: ' + Math.round(L.opacity * 100) + '%'}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(L.opacity * 100)}
            onChange={function (e) {
              updateLabel('opacity', parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
        </FieldRow>
        <FieldRow
          label={
            'Скрывать при расстоянии > ' + formatKm(L.hideAtDistance)
          }
        >
          <input
            type="range"
            min={0}
            max={20000000}
            step={1000}
            value={L.hideAtDistance}
            onChange={function (e) {
              updateLabel('hideAtDistance', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
        <FieldRow label={'Появление с ' + formatKm(L.fadeInAtDistance)}>
          <input
            type="range"
            min={0}
            max={5000000}
            step={1000}
            value={L.fadeInAtDistance}
            onChange={function (e) {
              updateLabel('fadeInAtDistance', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
      </Section>

      {/* ============ ПРЕВЬЮ ============ */}
      <Section title="Превью" icon={<Eye size={13} />}>
        <div style={styles.previewBox}>
          <div style={styles.previewInner}>
            <div style={styles.previewDot} />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform:
                  'translate(calc(-50% + ' +
                  L.offsetX +
                  'px), calc(-50% + ' +
                  L.offsetY +
                  'px))',
                fontFamily: L.fontFamily,
                fontSize: L.fontSize + 'px',
                color: L.fillColor,
                opacity: L.opacity,
                WebkitTextStroke:
                  L.style === 'FILL'
                    ? '0'
                    : L.outlineWidth + 'px ' + L.outlineColor,
                textShadow:
                  L.style === 'FILL_AND_OUTLINE'
                    ? '0 0 ' +
                      L.outlineWidth +
                      'px ' +
                      L.outlineColor +
                      ', 0 0 ' +
                      L.outlineWidth +
                      'px ' +
                      L.outlineColor
                    : 'none',
                backgroundColor: L.showBackground
                  ? hexToRgba(L.backgroundColor, L.backgroundAlpha)
                  : 'transparent',
                padding: L.paddingY + 'px ' + L.paddingX + 'px',
                borderRadius: 3,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              Пример подписи
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 6,
  },
  presetCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    padding: '8px 10px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    transition: 'all 0.15s',
  },
  presetLabel: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--accent)',
  },
  presetDesc: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    lineHeight: 1.35,
  },
  range: {
    flex: 1,
    maxWidth: 260,
    accentColor: 'var(--accent)',
  },
  select: {
    padding: '5px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: 'pointer',
    minWidth: 130,
    outline: 'none',
  },
  previewBox: {
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    minHeight: 100,
    position: 'relative',
    overflow: 'hidden',
    backgroundImage:
      'linear-gradient(45deg, var(--stripe-pattern-color) 25%, transparent 25%, transparent 75%, var(--stripe-pattern-color) 75%), linear-gradient(45deg, var(--stripe-pattern-color) 25%, transparent 25%, transparent 75%, var(--stripe-pattern-color) 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 8px 8px',
  },
  previewInner: {
    position: 'relative',
    padding: '30px 16px',
    minHeight: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: 'var(--danger)',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    border: '1px solid var(--text-primary)',
  },
};

export default TextTab;