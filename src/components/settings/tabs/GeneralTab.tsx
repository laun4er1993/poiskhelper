// =====================================================
// src/components/settings/tabs/GeneralTab.tsx
// Общие настройки: формат координат, единицы, элементы интерфейса
// =====================================================

import {
  Hash,
  Ruler,
  Eye,
  Crosshair,
  Compass,
  Mountain,
  Square,
} from 'lucide-react';
import type { AppSettings } from '../../../types/settings';
import type {
  CoordinateFormat,
  HeightUnit,
} from '../../../types/units';
import Section from '../ui/Section';
import FieldRow from '../ui/FieldRow';
import SegmentButton from '../ui/SegmentButton';
import ToggleOption from '../ui/ToggleOption';
import RadioOption from '../ui/RadioOption';

interface GeneralTabProps {
  settings: AppSettings;
  onChange: (updater: Partial<AppSettings>) => void;
}

function GeneralTab({ settings, onChange }: GeneralTabProps) {
  return (
    <>
      {/* ============ ФОРМАТ КООРДИНАТ ============ */}
      <Section title="Формат координат" icon={<Hash size={13} />}>
        <RadioOption
          label="Десятичные градусы (DD)"
          example="55.7558°, 37.6173°"
          value="DD"
          current={settings.coordinateFormat}
          onChange={function (v) {
            onChange({ coordinateFormat: v as CoordinateFormat });
          }}
        />
        <RadioOption
          label="Градусы, минуты, секунды (DMS)"
          example={'55° 45\u2032 20.88\u2033 N'}
          value="DMS"
          current={settings.coordinateFormat}
          onChange={function (v) {
            onChange({ coordinateFormat: v as CoordinateFormat });
          }}
        />
        <RadioOption
          label="Градусы, десятичные минуты (DDM)"
          example="55° 45.348\u2032 N"
          value="DDM"
          current={settings.coordinateFormat}
          onChange={function (v) {
            onChange({ coordinateFormat: v as CoordinateFormat });
          }}
        />
      </Section>

      {/* ============ ЕДИНИЦЫ ИЗМЕРЕНИЯ ============ */}
      <Section title="Единицы измерения" icon={<Ruler size={13} />}>
        <FieldRow label="Расстояние:">
          <SegmentButton
            label="Метрическая"
            active={settings.distanceUnit === 'metric'}
            onClick={function () {
              onChange({ distanceUnit: 'metric' });
            }}
          />
          <SegmentButton
            label="Имперская"
            active={settings.distanceUnit === 'imperial'}
            onClick={function () {
              onChange({ distanceUnit: 'imperial' });
            }}
          />
        </FieldRow>

        <FieldRow label="Высота:">
          <SegmentButton
            label="м"
            active={settings.heightUnit === 'meters'}
            onClick={function () {
              onChange({ heightUnit: 'meters' as HeightUnit });
            }}
          />
          <SegmentButton
            label="км"
            active={settings.heightUnit === 'kilometers'}
            onClick={function () {
              onChange({ heightUnit: 'kilometers' as HeightUnit });
            }}
          />
          <SegmentButton
            label="ft"
            active={settings.heightUnit === 'feet'}
            onClick={function () {
              onChange({ heightUnit: 'feet' as HeightUnit });
            }}
          />
          <SegmentButton
            label="mi"
            active={settings.heightUnit === 'miles'}
            onClick={function () {
              onChange({ heightUnit: 'miles' as HeightUnit });
            }}
          />
        </FieldRow>
      </Section>

      {/* ============ ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ============ */}
      <Section title="Элементы интерфейса" icon={<Eye size={13} />}>
        <ToggleOption
          icon={<Crosshair size={13} color="var(--accent)" />}
          label="Статусная строка внизу"
          checked={settings.showStatusBar}
          onChange={function (v) {
            onChange({ showStatusBar: v });
          }}
        />
        <ToggleOption
          icon={<Ruler size={13} color="var(--warning)" />}
          label="Масштабная линейка на глобусе"
          checked={settings.showScaleLegend}
          onChange={function (v) {
            onChange({ showScaleLegend: v });
          }}
        />
        <ToggleOption
          icon={<Compass size={13} color="var(--danger)" />}
          label="Компас"
          checked={settings.showCompass}
          onChange={function (v) {
            onChange({ showCompass: v });
          }}
        />
        <ToggleOption
          icon={<Crosshair size={13} color="var(--accent)" />}
          label="Координаты курсора"
          checked={settings.showMouseCoords}
          onChange={function (v) {
            onChange({ showMouseCoords: v });
          }}
          disabled={!settings.showStatusBar}
        />
        <ToggleOption
          icon={<Mountain size={13} color="var(--success)" />}
          label="Высота рельефа"
          checked={settings.showTerrainHeight}
          onChange={function (v) {
            onChange({ showTerrainHeight: v });
          }}
          disabled={!settings.showStatusBar}
        />
        <ToggleOption
          icon={<Eye size={13} color="var(--info)" />}
          label="Параметры камеры"
          checked={settings.showCameraInfo}
          onChange={function (v) {
            onChange({ showCameraInfo: v });
          }}
          disabled={!settings.showStatusBar}
        />
        <ToggleOption
          icon={<Hash size={13} color="var(--info)" />}
          label="Повышенная точность координат"
          checked={settings.highPrecision}
          onChange={function (v) {
            onChange({ highPrecision: v });
          }}
        />
      </Section>
    </>
  );
}

export default GeneralTab;