// =====================================================
// src/components/settings/SettingsPanel.tsx
// Главный компонент панели настроек — полностью респонсивный
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
  Menu,
  ChevronDown,
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

// -----------------------------------------------------
// ⚡ Респонсив: смотрим реальную ширину окна
// -----------------------------------------------------
function useWindowWidth(): number {
  const [w, setW] = useState(function () {
    return typeof window !== 'undefined' ? window.innerWidth : 1024;
  });

  useEffect(
    function () {
      let raf: number | null = null;
      const update = function () {
        if (raf !== null) return;
        raf = window.requestAnimationFrame(function () {
          raf = null;
          setW(window.innerWidth);
        });
      };
      window.addEventListener('resize', update);
      return function () {
        window.removeEventListener('resize', update);
        if (raf !== null) window.cancelAnimationFrame(raf);
      };
    },
    []
  );

  return w;
}

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
  const windowWidth = useWindowWidth();

  // ⚡ Пороги
  const isNarrow = windowWidth < 760;
  const isVeryNarrow = windowWidth < 480;

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

  const activeTabDef = TABS.find(function (t) {
    return t.id === tab;
  });
  const ActiveIcon = activeTabDef ? activeTabDef.icon : SettingsIcon;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={{
          ...styles.modal,
          ...(isVeryNarrow ? styles.modalFullScreen : {}),
          width: isVeryNarrow ? '100vw' : Math.min(820, windowWidth - 24),
          maxHeight: isVeryNarrow ? '100vh' : 'calc(100vh - 24px)',
          borderRadius: isVeryNarrow ? 0 : 8,
        }}
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        {/* === HEADER === */}
        <div style={styles.header}>
          <SettingsIcon size={16} color="var(--accent)" />
          <span style={styles.title}>Настройки</span>
          {isNarrow && (
            <span style={styles.headerActiveTab}>
              <ActiveIcon size={11} />
              {activeTabDef?.label}
            </span>
          )}
          <button
            style={styles.closeBtn}
            onClick={onClose}
            title="Закрыть (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* === TABS === */}
        {isNarrow ? (
          // ⚡ Узкое окно — dropdown-переключатель
          <div style={styles.tabsDropdownWrap}>
            <div style={styles.tabsDropdown}>
              <Menu size={12} color="var(--accent)" />
              <select
                value={tab}
                onChange={function (e) {
                  setTab(e.target.value as TabId);
                }}
                style={styles.tabsSelect}
              >
                {TABS.map(function (t) {
                  return (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                size={12}
                color="var(--text-muted)"
                style={{ pointerEvents: 'none', marginLeft: -20 }}
              />
            </div>
          </div>
        ) : (
          // ⚡ Широкое окно — полоса с чипами
          <div style={styles.tabsBar}>
            {TABS.map(function (t) {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  style={{
                    ...styles.tabBtn,
                    backgroundColor: active
                      ? 'var(--accent)'
                      : 'transparent',
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
        )}

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
        <div
          style={{
            ...styles.footer,
            ...(isVeryNarrow ? styles.footerWrap : {}),
          }}
        >
          <button style={styles.resetBtn} onClick={handleReset}>
            <RotateCcw size={13} />
            {isVeryNarrow ? 'Сброс' : 'Сбросить всё'}
          </button>
          <button style={styles.doneBtn} onClick={onClose}>
            <Check size={13} /> Готово
          </button>
        </div>
      </div>
    </div>
  );
}

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
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 'calc(100vh - 24px)',
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
  modalFullScreen: {
    borderRadius: 0,
    border: 'none',
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
    fontSize: 14,
    fontWeight: 600,
    flexShrink: 0,
  },
  headerActiveTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11.5,
    color: 'var(--accent)',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    justifyContent: 'flex-end',
    paddingRight: 4,
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
    marginLeft: 'auto',
    flexShrink: 0,
  },
  tabsBar: {
    display: 'flex',
    gap: 4,
    padding: '8px 12px',
    backgroundColor: 'var(--bg-panel-header)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
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
  tabsDropdownWrap: {
    padding: '8px 12px',
    backgroundColor: 'var(--bg-panel-header)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  tabsDropdown: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    position: 'relative',
  },
  tabsSelect: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'inherit',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '2px 0',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
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
    gap: 8,
  },
  footerWrap: {
    height: 'auto',
    padding: '10px 12px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
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
    whiteSpace: 'nowrap',
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
    whiteSpace: 'nowrap',
  },
};

export default SettingsPanel;