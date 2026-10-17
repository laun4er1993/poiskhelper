// =====================================================
// src/components/settings/tabs/DesignTab.tsx
// Дизайн: скин глобуса, дерево, тулбар, цвета объектов
// =====================================================

import {
  Globe,
  Layers,
  Settings as SettingsIcon,
  Eye,
  Grid3x3,
  Zap,
  Circle,
  Palette,
  Square,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';

import type { AppSettings } from '../../../types/settings';
import type {
  GlobeSkin as GlobeSkinId,
  TreeDensity as TreeDensityId,
  ToolbarSize as ToolbarSizeId,
  DesignSettings,
} from '../../../types/settings';
import { DEFAULT_DESIGN } from '../../../types/settings';
import type { ThemeColors } from '../../../theme/types';
import { GLOBE_SKINS, getGlobeSkin } from '../../../theme/skins';
import { TOOLBAR_SIZES, TREE_DENSITIES } from '../../../theme/sizes';

import Section from '../ui/Section';
import FieldRow from '../ui/FieldRow';
import SegmentButton from '../ui/SegmentButton';
import ToggleOption from '../ui/ToggleOption';
import ColorInput from '../ui/ColorInput';

interface DesignTabProps {
  settings: AppSettings;
  colors: ThemeColors;
  onColorsChange: (colors: ThemeColors) => void;
  onChange: (updater: Partial<AppSettings>) => void;
}

function DesignTab({
  settings,
  colors,
  onColorsChange,
  onChange,
}: DesignTabProps) {
  const D = settings.design;

  const updateDesign = function <K extends keyof DesignSettings>(
    key: K,
    value: DesignSettings[K]
  ) {
    onChange({
      design: { ...settings.design, [key]: value },
    });
  };

  const handleResetDesign = function () {
    if (window.confirm('Сбросить настройки дизайна?')) {
      onChange({ design: DEFAULT_DESIGN });
    }
  };

  return (
    <>
      {/* ============ СКИН ГЛОБУСА ============ */}
      <Section title="Скин глобуса" icon={<Globe size={13} />}>
        <div style={styles.skinGrid}>
          {GLOBE_SKINS.map(function (skin) {
            const active = D.globeSkin === skin.id;
            return (
              <button
                key={skin.id}
                style={{
                  ...styles.skinCard,
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: active
                    ? 'var(--bg-surface-hover)'
                    : 'var(--bg-surface)',
                }}
                onClick={function () {
                  updateDesign('globeSkin', skin.id as GlobeSkinId);
                }}
                title={skin.description}
              >
                <div
                  style={{
                    ...styles.skinSwatch,
                    backgroundColor: skin.compassBg,
                    borderColor: skin.compassBorder,
                  }}
                >
                  <div
                    style={{
                      ...styles.skinSwatchRing,
                      borderColor: skin.compassRingColor,
                    }}
                  />
                  <div
                    style={{
                      ...styles.skinSwatchNorth,
                      backgroundColor: skin.compassNorth,
                    }}
                  />
                  <div
                    style={{
                      ...styles.skinSwatchAccent,
                      backgroundColor: skin.accent,
                    }}
                  />
                </div>
                <div style={styles.skinCardLabel}>{skin.label}</div>
                {active && (
                  <Check
                    size={11}
                    color="var(--accent)"
                    style={{ position: 'absolute', top: 5, right: 5 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div style={styles.hintSmall}>
          {getGlobeSkin(D.globeSkin).description}
        </div>
      </Section>

      {/* ============ ДЕРЕВО ============ */}
      <Section title="Дерево объектов" icon={<Layers size={13} />}>
        <FieldRow label="Плотность строк:">
          {TREE_DENSITIES.map(function (d) {
            return (
              <SegmentButton
                key={d.id}
                label={d.label}
                active={D.treeDensity === d.id}
                onClick={function () {
                  updateDesign('treeDensity', d.id as TreeDensityId);
                }}
              />
            );
          })}
        </FieldRow>

        <FieldRow label={'Размер иконок: ' + D.treeIconSize + ' px'}>
          <input
            type="range"
            min={10}
            max={18}
            value={D.treeIconSize}
            onChange={function (e) {
              updateDesign('treeIconSize', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>

        <ToggleOption
          icon={<Zap size={12} color="var(--warning)" />}
          label="Действия только при наведении"
          checked={D.treeActionsOnHover}
          onChange={function (v) {
            updateDesign('treeActionsOnHover', v);
          }}
        />
        <ToggleOption
          label="Показывать заметку рядом с именем"
          checked={D.treeShowNote}
          onChange={function (v) {
            updateDesign('treeShowNote', v);
          }}
        />
        <ToggleOption
          label="Бейдж прозрачности"
          checked={D.treeShowOpacityBadge}
          onChange={function (v) {
            updateDesign('treeShowOpacityBadge', v);
          }}
        />
        <ToggleOption
          label="Бейдж «своя подпись»"
          checked={D.treeShowLabelBadge}
          onChange={function (v) {
            updateDesign('treeShowLabelBadge', v);
          }}
        />
      </Section>

      {/* ============ ТУЛБАР ============ */}
      <Section title="Тулбар" icon={<SettingsIcon size={13} />}>
        <FieldRow label="Размер:">
          {TOOLBAR_SIZES.map(function (s) {
            return (
              <SegmentButton
                key={s.id}
                label={s.label}
                active={D.toolbarSize === s.id}
                onClick={function () {
                  updateDesign('toolbarSize', s.id as ToolbarSizeId);
                }}
              />
            );
          })}
        </FieldRow>
      </Section>

      {/* ============ ГЛОБУС ============ */}
      <Section title="Глобус" icon={<Globe size={13} />}>
        <ToggleOption
          icon={<Eye size={12} color="var(--accent)" />}
          label="Ореол выбранного объекта"
          checked={D.selectedPulse}
          onChange={function (v) {
            updateDesign('selectedPulse', v);
          }}
        />
        <ToggleOption
          icon={<Grid3x3 size={12} color="var(--accent)" />}
          label="Сетка координат (graticule)"
          checked={D.showGraticule}
          onChange={function (v) {
            updateDesign('showGraticule', v);
          }}
        />
        <ToggleOption
          icon={<Zap size={12} color="var(--success)" />}
          label="Показывать FPS в инфо-линейке"
          checked={D.showFPS}
          onChange={function (v) {
            updateDesign('showFPS', v);
          }}
        />
      </Section>

      {/* ============ ЦВЕТА ОБЪЕКТОВ ============ */}
      <Section title="Цвета объектов" icon={<Circle size={13} />}>
        <FieldRow label="Метка по умолчанию:">
          <ColorInput
            value={colors.markerDefault}
            onChange={function (v) {
              onColorsChange({ ...colors, markerDefault: v });
            }}
          />
        </FieldRow>
        <FieldRow label="Линия измерения:">
          <ColorInput
            value={colors.lineColor}
            onChange={function (v) {
              onColorsChange({ ...colors, lineColor: v });
            }}
          />
        </FieldRow>
        <FieldRow label="Выделение:">
          <ColorInput
            value={colors.selectionColor}
            onChange={function (v) {
              onColorsChange({ ...colors, selectionColor: v });
            }}
          />
        </FieldRow>
        <FieldRow label="Заливка полигона:">
          <ColorInput
            value={colors.polygonFill}
            onChange={function (v) {
              onColorsChange({ ...colors, polygonFill: v });
            }}
          />
        </FieldRow>
        <FieldRow label="Контур полигона:">
          <ColorInput
            value={colors.polygonOutline}
            onChange={function (v) {
              onColorsChange({ ...colors, polygonOutline: v });
            }}
          />
        </FieldRow>
      </Section>

      {/* ============ ОБЩИЙ СТИЛЬ ============ */}
      <Section title="Общий стиль" icon={<Palette size={13} />}>
        <FieldRow label={'Скругление углов: ' + D.radius + ' px'}>
          <input
            type="range"
            min={0}
            max={20}
            value={D.radius}
            onChange={function (e) {
              updateDesign('radius', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
        <ToggleOption
          icon={<Square size={12} color="var(--warning)" />}
          label="Тени"
          checked={D.shadows}
          onChange={function (v) {
            updateDesign('shadows', v);
          }}
        />
        <ToggleOption
          icon={<Sparkles size={12} color="var(--accent)" />}
          label="Размытие (стекло)"
          checked={D.blur}
          onChange={function (v) {
            updateDesign('blur', v);
          }}
        />
        <ToggleOption
          icon={<Palette size={12} color="var(--accent)" />}
          label="Применять дизайн ко всем диалогам"
          checked={D.applyToDialogs}
          onChange={function (v) {
            updateDesign('applyToDialogs', v);
          }}
        />
      </Section>

      {/* ============ СБРОС ============ */}
      <div style={styles.resetRow}>
        <button style={styles.resetBtn} onClick={handleResetDesign}>
          <RotateCcw size={11} /> Сбросить дизайн
        </button>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  skinGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 8,
  },
  skinCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 6,
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    transition: 'all 0.15s',
  },
  skinSwatch: {
    width: '100%',
    height: 52,
    borderRadius: 'var(--radius-small)',
    border: '1px solid',
    position: 'relative',
    overflow: 'hidden',
  },
  skinSwatchRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: '1.5px solid',
    opacity: 0.9,
  },
  skinSwatchNorth: {
    position: 'absolute',
    top: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 12,
    borderRadius: 2,
  },
  skinSwatchAccent: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 10,
    height: 3,
    borderRadius: 2,
    opacity: 0.8,
  },
  skinCardLabel: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
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

export default DesignTab;