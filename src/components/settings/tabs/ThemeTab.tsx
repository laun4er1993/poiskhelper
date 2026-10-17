// =====================================================
// src/components/settings/tabs/ThemeTab.tsx
// Настройки темы: пресеты + тонкая настройка
// =====================================================

import { Palette, Sliders, Moon, Sun, Check } from 'lucide-react';
import type { Theme } from '../../../theme/types';
import { THEME_PRESETS } from '../../../theme/presets';
import Section from '../ui/Section';
import FieldRow from '../ui/FieldRow';

interface ThemeTabProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

function ThemeTab({ theme, onThemeChange }: ThemeTabProps) {
  return (
    <>
      {/* ============ ГОТОВЫЕ ТЕМЫ ============ */}
      <Section title="Готовые темы" icon={<Palette size={13} />}>
        <div style={styles.themeGrid}>
          {THEME_PRESETS.map(function (preset) {
            const active = theme.id === preset.id;
            return (
              <button
                key={preset.id}
                style={{
                  ...styles.themeCard,
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: active
                    ? 'var(--bg-surface-hover)'
                    : 'var(--bg-surface)',
                }}
                onClick={function () {
                  onThemeChange(preset);
                }}
              >
                <div
                  style={{
                    ...styles.themeSwatch,
                    backgroundColor: preset.bgApp,
                  }}
                >
                  <div
                    style={{
                      ...styles.themeSwatchAccent,
                      backgroundColor: preset.accent,
                    }}
                  />
                  <div
                    style={{
                      ...styles.themeSwatchBar,
                      backgroundColor: preset.textPrimary,
                    }}
                  />
                </div>
                <div style={styles.themeCardLabel}>
                  {preset.dark ? <Moon size={11} /> : <Sun size={11} />}
                  {preset.label}
                </div>
                {active && (
                  <Check
                    size={12}
                    color="var(--accent)"
                    style={{ position: 'absolute', top: 6, right: 6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ============ ТОНКАЯ НАСТРОЙКА ============ */}
      <Section title="Тонкая настройка" icon={<Sliders size={13} />}>
        <FieldRow label="Акцент:">
          <input
            type="color"
            value={theme.accent}
            onChange={function (e) {
              onThemeChange({ ...theme, accent: e.target.value });
            }}
            style={styles.colorInput}
          />
          <span style={styles.valueMono}>{theme.accent}</span>
        </FieldRow>

        <FieldRow label={'Размер шрифта: ' + theme.fontSize + 'px'}>
          <input
            type="range"
            min={11}
            max={18}
            value={theme.fontSize}
            onChange={function (e) {
              onThemeChange({
                ...theme,
                fontSize: parseInt(e.target.value),
              });
            }}
            style={styles.range}
          />
        </FieldRow>

        <FieldRow
          label={
            'Прозрачность панелей: ' +
            Math.round(theme.opacity * 100) +
            '%'
          }
        >
          <input
            type="range"
            min={30}
            max={100}
            value={Math.round(theme.opacity * 100)}
            onChange={function (e) {
              onThemeChange({
                ...theme,
                opacity: parseInt(e.target.value) / 100,
              });
            }}
            style={styles.range}
          />
        </FieldRow>
      </Section>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: 8,
  },
  themeCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 8,
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    transition: 'all 0.15s',
  },
  themeSwatch: {
    width: '100%',
    height: 48,
    borderRadius: 'var(--radius-small)',
    border: '1px solid var(--border)',
    position: 'relative',
    overflow: 'hidden',
  },
  themeSwatchAccent: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 14,
    height: 14,
    borderRadius: '50%',
  },
  themeSwatchBar: {
    position: 'absolute',
    bottom: 8,
    left: 6,
    right: 6,
    height: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
  themeCardLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    fontSize: 11.5,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  colorInput: {
    width: 44,
    height: 28,
    padding: 2,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
  },
  valueMono: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
    minWidth: 62,
  },
  range: {
    flex: 1,
    maxWidth: 260,
    accentColor: 'var(--accent)',
  },
};

export default ThemeTab;