// =====================================================
// src/components/settings/SettingsPanel.tsx
// Главный компонент панели настроек
// =====================================================

import { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Type as TypeIcon,
  Palette,
  Monitor,
  Camera,
  MousePointerClick,
  Sun,
  Globe,
  Ruler,
  RotateCcw,
  Check,
} from 'lucide-react';
import type { AppSettings } from '../../types/settings';
import { DEFAULT_SETTINGS } from '../../types/settings';
import type { Theme, ThemeColors } from '../../theme/types';
import { DARK_THEME } from '../../theme/presets';
import { DEFAULT_COLORS } from '../../theme/colors';
import type { TabId, TabDef, SettingsPanelProps } from './types';
import GeneralTab from './tabs/GeneralTab';
import TextTab from './tabs/TextTab';
import DesignTab from './tabs/DesignTab';
import PopupTab from './tabs/PopupTab';
import ScreenshotTab from './tabs/ScreenshotTab';
import CreateMenuTab from './tabs/CreateMenuTab';
import MeasureTab from './tabs/MeasureTab';
import ThemeTab from './tabs/ThemeTab';
import MapTab from './tabs/MapTab';

// =====================================================
// === Вкладки ===
// =====================================================
const TABS: TabDef[] = [
  { id: 'general', label: 'Общие', icon: SettingsIcon },
  { id: 'text', label: 'Подписи', icon: TypeIcon },
  { id: 'design', label: 'Дизайн', icon: Palette },
  { id: 'measure', label: 'Линейка', icon: Ruler },
  { id: 'popup', label: 'Попап', icon: Monitor },
  { id: 'screenshot', label: 'Скриншоты', icon: Camera },
  { id: 'createMenu', label: 'Меню на карте', icon: MousePointerClick },
  { id: 'theme', label: 'Тема', icon: Sun },
  { id: 'map', label: 'Карта', icon: Globe },
];

// =====================================================
// === Компонент ===
// =====================================================
function SettingsPanel({
  settings,
  theme,
  colors,
  show3DBuildings,
  onChange,
  onThemeChange,
  onColorsChange,
  onToggle3DBuildings,
  onNeedCustomDialog,
  onClose,
}: SettingsPanelProps) {
  const [tab, setTab] = useState<TabId>('general');

  // Esc — закрыть
  useEffect(function () {
    const handler = function (e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return function () {
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  const handleReset = function () {
    if (
      !window.confirm(
        'Сбросить все настройки к значениям по умолчанию?\n\nТема, цвета, подписи, дизайн, попап, карта и линейка также будут сброшены.'
      )
    ) {
      return;
    }
    onChange(DEFAULT_SETTINGS);
    onThemeChange(DARK_THEME);
    onColorsChange(DEFAULT_COLORS);
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        {/* === HEADER === */}
        <div style={styles.header}>
          <SettingsIcon size={16} color="var(--accent)" />
          <span style={styles.title}>Настройки</span>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            title="Закрыть (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* === TABS === */}
        <div style={styles.tabsBar}>
          {TABS.map(function (t) {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: active ? 'var(--accent)' : 'transparent',
                  color: active
                    ? 'var(--accent-text)'
                    : 'var(--text-secondary)',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                }}
                onClick={function () {
                  setTab(t.id);
                }}
              >
                <Icon size={12} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* === CONTENT === */}
        <div style={styles.content}>
          {tab === 'general' && (
            <GeneralTab settings={settings} onChange={onChange} />
          )}
          {tab === 'text' && (
            <TextTab settings={settings} onChange={onChange} />
          )}
          {tab === 'design' && (
            <DesignTab
              settings={settings}
              colors={colors}
              onColorsChange={onColorsChange}
              onChange={onChange}
            />
          )}
          {tab === 'measure' && (
            <MeasureTab settings={settings} onChange={onChange} />
          )}
          {tab === 'popup' && (
            <PopupTab settings={settings} onChange={onChange} />
          )}
          {tab === 'screenshot' && (
            <ScreenshotTab settings={settings} onChange={onChange} />
          )}
          {tab === 'createMenu' && (
            <CreateMenuTab settings={settings} onChange={onChange} />
          )}
          {tab === 'theme' && (
            <ThemeTab theme={theme} onThemeChange={onThemeChange} />
          )}
          {tab === 'map' && (
            <MapTab
              settings={settings}
              onChange={onChange}
              show3DBuildings={show3DBuildings}
              onToggle3DBuildings={onToggle3DBuildings}
              onNeedCustomDialog={onNeedCustomDialog}
            />
          )}
        </div>

        {/* === FOOTER === */}
        <div style={styles.footer}>
          <button style={styles.resetBtn} onClick={handleReset}>
            <RotateCcw size={13} /> Сбросить всё
          </button>
          <button style={styles.doneBtn} onClick={onClose}>
            <Check size={13} /> Готово
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--backdrop)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    fontFamily: 'Segoe UI, sans-serif',
    animation: 'fadeIn 0.15s ease',
  },
  modal: {
    width: 820,
    maxWidth: '96vw',
    maxHeight: '92vh',
    backgroundColor: 'var(--bg-modal)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xl)',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    animation: 'scaleIn 0.18s ease',
  },
  header: {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    backgroundColor: 'var(--bg-panel-header)',
    borderBottom: '1px solid var(--border)',
    gap: 8,
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
  },
  closeBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  tabsBar: {
    display: 'flex',
    gap: 4,
    padding: '8px 12px',
    backgroundColor: 'var(--bg-panel-header)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    overflowX: 'auto',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 20px',
    minHeight: 0,
  },
  footer: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    backgroundColor: 'var(--bg-panel-header)',
    borderTop: '1px solid var(--border)',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  doneBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 20px',
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: 'var(--accent-text)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default SettingsPanel;