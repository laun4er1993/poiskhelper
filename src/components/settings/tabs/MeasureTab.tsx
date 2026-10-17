// =====================================================
// src/components/settings/tabs/MeasureTab.tsx
// Настройки линейки измерения
// =====================================================

import {
  Ruler,
  Route,
  Circle,
  Type,
  Sliders,
  RotateCcw,
  Footprints,
  Hash,
} from 'lucide-react';
import type { AppSettings } from '../../../types/settings';
import type {
  MeasureSettings,
  LineDashStyle,
  MeasurePointShape,
  NumberStyle,
} from '../../../types/measure';
import { DEFAULT_MEASURE_SETTINGS } from '../../../types/measure';
import Section from '../ui/Section';
import FieldRow from '../ui/FieldRow';
import SegmentButton from '../ui/SegmentButton';
import ToggleOption from '../ui/ToggleOption';
import ColorInput from '../ui/ColorInput';

interface MeasureTabProps {
  settings: AppSettings;
  onChange: (updater: Partial<AppSettings>) => void;
}

function MeasureTab({ settings, onChange }: MeasureTabProps) {
  const M = settings.measure;

  const update = function <K extends keyof MeasureSettings>(
    key: K,
    value: MeasureSettings[K]
  ) {
    onChange({
      measure: { ...settings.measure, [key]: value },
    });
  };

  const handleReset = function () {
    if (window.confirm('Сбросить настройки линейки?')) {
      onChange({ measure: DEFAULT_MEASURE_SETTINGS });
    }
  };

  return (
    <>
      {/* ============ ЛИНИЯ ============ */}
      <Section title="Линия" icon={<Route size={13} />}>
        <FieldRow label="Цвет линии:">
          <ColorInput
            value={M.lineColor}
            onChange={function (v) {
              update('lineColor', v);
            }}
          />
        </FieldRow>

        <FieldRow label={'Толщина линии: ' + M.lineWidth + ' px'}>
          <input
            type="range"
            min={1}
            max={10}
            value={M.lineWidth}
            onChange={function (e) {
              update('lineWidth', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>

        <FieldRow
          label={
            'Прозрачность: ' +
            Math.round(M.lineOpacity * 100) +
            '%'
          }
        >
          <input
            type="range"
            min={10}
            max={100}
            value={Math.round(M.lineOpacity * 100)}
            onChange={function (e) {
              update('lineOpacity', parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
        </FieldRow>

        <FieldRow label="Стиль линии:">
          <SegmentButton
            label="Сплошная"
            active={M.lineDash === 'solid'}
            onClick={function () {
              update('lineDash', 'solid' as LineDashStyle);
            }}
          />
          <SegmentButton
            label="Пунктир"
            active={M.lineDash === 'dashed'}
            onClick={function () {
              update('lineDash', 'dashed' as LineDashStyle);
            }}
          />
          <SegmentButton
            label="Точки"
            active={M.lineDash === 'dotted'}
            onClick={function () {
              update('lineDash', 'dotted' as LineDashStyle);
            }}
          />
        </FieldRow>
      </Section>

      {/* ============ ТОЧКИ ============ */}
      <Section title="Точки" icon={<Circle size={13} />}>
        <FieldRow label="Форма точек:">
          <SegmentButton
            label="Двойной круг"
            active={M.pointShape === 'double-circle'}
            onClick={function () {
              update('pointShape', 'double-circle' as MeasurePointShape);
            }}
          />
          <SegmentButton
            label="Круг"
            active={M.pointShape === 'circle'}
            onClick={function () {
              update('pointShape', 'circle' as MeasurePointShape);
            }}
          />
          <SegmentButton
            label="Квадрат"
            active={M.pointShape === 'square'}
            onClick={function () {
              update('pointShape', 'square' as MeasurePointShape);
            }}
          />
        </FieldRow>

        <FieldRow label={'Размер точек: ' + M.pointSize + ' px'}>
          <input
            type="range"
            min={6}
            max={24}
            value={M.pointSize}
            onChange={function (e) {
              update('pointSize', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>

        <FieldRow
          label={
            'Прозрачность: ' + Math.round(M.pointOpacity * 100) + '%'
          }
        >
          <input
            type="range"
            min={10}
            max={100}
            value={Math.round(M.pointOpacity * 100)}
            onChange={function (e) {
              update('pointOpacity', parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
        </FieldRow>

        <FieldRow label="Цвет заливки точки:">
          <ColorInput
            value={M.pointFillColor}
            onChange={function (v) {
              update('pointFillColor', v);
            }}
          />
        </FieldRow>

        <FieldRow label="Цвет обводки точки:">
          <ColorInput
            value={M.pointOutlineColor}
            onChange={function (v) {
              update('pointOutlineColor', v);
            }}
          />
        </FieldRow>

        <FieldRow
          label={'Толщина обводки точки: ' + M.pointOutlineWidth + ' px'}
        >
          <input
            type="range"
            min={0}
            max={6}
            value={M.pointOutlineWidth}
            onChange={function (e) {
              update('pointOutlineWidth', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>

        <ToggleOption
          label="Выделять начало (зелёный) и конец (красный)"
          checked={M.highlightEndpoints}
          onChange={function (v) {
            update('highlightEndpoints', v);
          }}
        />
      </Section>

      {/* ============ ЦИФРЫ НА ТОЧКАХ ============ */}
      <Section title="Цифры на точках" icon={<Hash size={13} />}>
        <ToggleOption
          label="Показывать номера точек"
          checked={M.showNumbers}
          onChange={function (v) {
            update('showNumbers', v);
          }}
        />

        {M.showNumbers && (
          <>
            <FieldRow
              label={'Размер шрифта: ' + M.numberFontSize + ' px'}
            >
              <input
                type="range"
                min={8}
                max={24}
                value={M.numberFontSize}
                onChange={function (e) {
                  update('numberFontSize', parseInt(e.target.value));
                }}
                style={styles.range}
              />
            </FieldRow>

            <FieldRow label="Цвет цифр:">
              <ColorInput
                value={M.numberColor}
                onChange={function (v) {
                  update('numberColor', v);
                }}
              />
            </FieldRow>

            <FieldRow label="Цвет обводки цифр:">
              <ColorInput
                value={M.numberOutlineColor}
                onChange={function (v) {
                  update('numberOutlineColor', v);
                }}
              />
            </FieldRow>

            <FieldRow
              label={
                'Толщина обводки цифр: ' + M.numberOutlineWidth + ' px'
              }
            >
              <input
                type="range"
                min={0}
                max={5}
                value={M.numberOutlineWidth}
                onChange={function (e) {
                  update(
                    'numberOutlineWidth',
                    parseInt(e.target.value)
                  );
                }}
                style={styles.range}
              />
            </FieldRow>

            <FieldRow label="Стиль:">
              <SegmentButton
                label="Заливка"
                active={M.numberStyle === 'fill'}
                onClick={function () {
                  update('numberStyle', 'fill' as NumberStyle);
                }}
              />
              <SegmentButton
                label="Обводка"
                active={M.numberStyle === 'outline'}
                onClick={function () {
                  update('numberStyle', 'outline' as NumberStyle);
                }}
              />
              <SegmentButton
                label="Оба"
                active={M.numberStyle === 'fill-and-outline'}
                onClick={function () {
                  update('numberStyle', 'fill-and-outline' as NumberStyle);
                }}
              />
            </FieldRow>

            <div style={styles.hintSmall}>
              Обводка цифр улучшает читаемость на любом фоне (светлом
              или тёмном).
            </div>
          </>
        )}
      </Section>

      {/* ============ ПОДПИСИ ============ */}
      <Section title="Подписи" icon={<Type size={13} />}>
        <ToggleOption
          label="Показывать высоты у точек"
          checked={M.showHeights}
          onChange={function (v) {
            update('showHeights', v);
          }}
        />
        <ToggleOption
          label="Показывать длины сегментов"
          checked={M.showSegmentLengths}
          onChange={function (v) {
            update('showSegmentLengths', v);
          }}
        />
        <ToggleOption
          label="Показывать азимуты сегментов"
          checked={M.showAzimuths}
          onChange={function (v) {
            update('showAzimuths', v);
          }}
        />
      </Section>

      {/* ============ РАСЧЁТЫ ============ */}
      <Section title="Расчёты" icon={<Footprints size={13} />}>
        <ToggleOption
          label="Показывать время в пути пешком"
          checked={M.showWalkingTime}
          onChange={function (v) {
            update('showWalkingTime', v);
          }}
        />

        {M.showWalkingTime && (
          <FieldRow
            label={'Скорость пешком: ' + M.walkingSpeed + ' км/ч'}
          >
            <input
              type="range"
              min={1}
              max={15}
              step={0.5}
              value={M.walkingSpeed}
              onChange={function (e) {
                update('walkingSpeed', parseFloat(e.target.value));
              }}
              style={styles.range}
            />
          </FieldRow>
        )}
      </Section>

      {/* ============ ПОВЕДЕНИЕ ============ */}
      <Section title="Поведение" icon={<Sliders size={13} />}>
        <ToggleOption
          label="Автозамыкание при клике рядом с первой точкой"
          checked={M.autoClose}
          onChange={function (v) {
            update('autoClose', v);
          }}
        />

        {M.autoClose && (
          <FieldRow
            label={'Радиус автозамыкания: ' + M.autoCloseRadiusPx + ' px'}
          >
            <input
              type="range"
              min={5}
              max={40}
              value={M.autoCloseRadiusPx}
              onChange={function (e) {
                update('autoCloseRadiusPx', parseInt(e.target.value));
              }}
              style={styles.range}
            />
          </FieldRow>
        )}

        <ToggleOption
          label="Показывать подсказку при наведении на первую точку"
          checked={M.showAutoCloseHint}
          onChange={function (v) {
            update('showAutoCloseHint', v);
          }}
        />

        <ToggleOption
          label="Esc завершает измерение, не удаляя точки"
          checked={M.escFinishesOnly}
          onChange={function (v) {
            update('escFinishesOnly', v);
          }}
        />
      </Section>

      {/* ============ ИНФО ============ */}
      <Section title="Подсказка" icon={<Ruler size={13} />}>
        <div style={styles.hintSmall}>
          Эти настройки применяются к <b>новым</b> линейкам и к{' '}
          <b>текущей</b> незавершённой линейке. Уже сохранённые линейки
          имеют свои настройки — их можно изменить в панели свойств
          линейки (ПКМ → Редактировать).
        </div>
      </Section>

      {/* ============ СБРОС ============ */}
      <div style={styles.resetRow}>
        <button style={styles.resetBtn} onClick={handleReset}>
          <RotateCcw size={11} /> Сбросить настройки линейки
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
    lineHeight: 1.5,
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

export default MeasureTab;