// =====================================================
// src/components/welcome/WelcomeScreen.tsx
// Стартовый экран с recent projects и настройками
// =====================================================

import { useState, useEffect } from 'react';
import {
  FilePlus,
  FolderOpen,
  Clock,
  Globe2,
  Sun,
  Moon,
  Trash2,
  Zap,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import ProjectCard from './ProjectCard';
import WindowControls from './WindowControls';
import { THEME_PRESETS } from '../../theme/presets';
import type { WelcomeScreenProps } from './types';

function WelcomeScreen({
  recentProjects,
  settings,
  theme,
  busy,
  busyMessage,
  onNewProject,
  onOpenProject,
  onOpenRecent,
  onRemoveRecent,
  onClearRecent,
  onSettingsChange,
  onThemeChange,
  onSkip,
}: WelcomeScreenProps) {
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Подтверждение очистки — отменить через 3 сек
  useEffect(
    function () {
      if (!confirmClear) return;
      const t = setTimeout(function () {
        setConfirmClear(false);
      }, 3000);
      return function () {
        clearTimeout(t);
      };
    },
    [confirmClear]
  );

  const visibleRecent = showAllRecent
    ? recentProjects
    : recentProjects.slice(0, 5);

  const handleClear = function () {
    if (confirmClear) {
      onClearRecent();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  const handleKeyDown = function (e: React.KeyboardEvent) {
    if (busy) return;
    if (e.key === 'Escape') {
      onSkip();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      onNewProject();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      onOpenProject();
    }
  };

  return (
    <div style={styles.overlay} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div style={styles.container}>
        <WindowControls />

        {/* === ЛЕВАЯ КОЛОНКА === */}
        <div style={styles.left}>
          <div style={styles.brandBlock}>
            <div style={styles.brandIcon}>
              <Globe2 size={44} color="var(--accent)" strokeWidth={1.4} />
              <div style={styles.brandGlow} />
            </div>
            <div style={styles.brandText}>
              <div style={styles.brandTitle}>PoiskHelper</div>
              <div style={styles.brandSubtitle}>
                Десктопный редактор KML/KMZ и 3D-глобус
              </div>
            </div>
          </div>

          <div style={styles.actionsBlock}>
            <button
              style={{ ...styles.bigBtn, ...styles.bigBtnPrimary }}
              onClick={onNewProject}
              disabled={busy}
            >
              <FilePlus size={18} />
              <div style={styles.bigBtnTextWrap}>
                <div style={styles.bigBtnTitle}>Новый проект</div>
                <div style={styles.bigBtnHint}>Начать с чистого листа</div>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.7 }} />
            </button>

            <button
              style={styles.bigBtn}
              onClick={onOpenProject}
              disabled={busy}
            >
              <FolderOpen size={18} />
              <div style={styles.bigBtnTextWrap}>
                <div style={styles.bigBtnTitle}>Открыть проект</div>
                <div style={styles.bigBtnHint}>
                  Файл .poiskhelper или .json
                </div>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.7 }} />
            </button>

            {recentProjects.length > 0 && (
              <button
                style={styles.bigBtn}
                onClick={function () {
                  onOpenRecent(recentProjects[0].path);
                }}
                disabled={busy}
              >
                <Zap size={18} color="var(--warning)" />
                <div style={styles.bigBtnTextWrap}>
                  <div style={styles.bigBtnTitle}>Продолжить работу</div>
                  <div
                    style={styles.bigBtnHint}
                    title={recentProjects[0].name}
                  >
                    {recentProjects[0].name}
                  </div>
                </div>
                <ChevronRight size={16} style={{ opacity: 0.7 }} />
              </button>
            )}
          </div>

          <div style={styles.hotkeysBlock}>
            <div style={styles.hotkeysTitle}>Горячие клавиши</div>
            <div style={styles.hotkeyRow}>
              <kbd style={styles.kbd}>Ctrl</kbd>
              <span style={styles.kbdPlus}>+</span>
              <kbd style={styles.kbd}>N</kbd>
              <span style={styles.kbdLabel}>новый проект</span>
            </div>
            <div style={styles.hotkeyRow}>
              <kbd style={styles.kbd}>Ctrl</kbd>
              <span style={styles.kbdPlus}>+</span>
              <kbd style={styles.kbd}>O</kbd>
              <span style={styles.kbdLabel}>открыть</span>
            </div>
            <div style={styles.hotkeyRow}>
              <kbd style={styles.kbd}>Esc</kbd>
              <span style={styles.kbdLabel}>
                продолжить без проекта
              </span>
            </div>
          </div>

          {busy && (
            <div style={styles.busyBar}>
              <div style={styles.busySpinner} />
              <span style={styles.busyText}>
                {busyMessage || 'Загрузка проекта...'}
              </span>
            </div>
          )}
        </div>

        {/* === ПРАВАЯ КОЛОНКА === */}
        <div style={styles.right}>
          <div style={styles.rightHeader}>
            <Clock size={14} color="var(--accent)" />
            <span style={styles.rightTitle}>Недавние проекты</span>
            {recentProjects.length > 0 && (
              <button
                style={{
                  ...styles.clearBtn,
                  color: confirmClear
                    ? 'var(--danger)'
                    : 'var(--text-muted)',
                  borderColor: confirmClear
                    ? 'var(--danger)'
                    : 'var(--border)',
                }}
                onClick={handleClear}
                title={
                  confirmClear
                    ? 'Нажмите ещё раз для подтверждения'
                    : 'Очистить список'
                }
              >
                <Trash2 size={11} />
                {confirmClear ? 'Точно?' : 'Очистить'}
              </button>
            )}
          </div>

          {recentProjects.length === 0 ? (
            <div style={styles.emptyState}>
              <Clock size={42} color="var(--text-muted)" strokeWidth={1} />
              <div style={styles.emptyTitle}>Пока ничего нет</div>
              <div style={styles.emptyHint}>
                Здесь появятся проекты, которые вы открывали.
                <br />
                Создайте новый или откройте существующий.
              </div>
            </div>
          ) : (
            <>
              <div style={styles.recentList}>
                {visibleRecent.map(function (p) {
                  return (
                    <ProjectCard
                      key={p.path}
                      project={p}
                      onOpen={onOpenRecent}
                      onRemove={onRemoveRecent}
                      disabled={busy}
                    />
                  );
                })}
              </div>
              {recentProjects.length > 5 && (
                <button
                  style={styles.showMoreBtn}
                  onClick={function () {
                    setShowAllRecent(!showAllRecent);
                  }}
                >
                  {showAllRecent
                    ? 'Свернуть список'
                    : 'Показать все (' + recentProjects.length + ')'}
                </button>
              )}
            </>
          )}
        </div>

        {/* === НИЖНЯЯ ПОЛОСА === */}
        <div style={styles.bottomBar}>
          <div style={styles.bottomLeft}>
            <div style={styles.themeSwitcher}>
              {THEME_PRESETS.map(function (t) {
                const isActive = theme.id === t.id;
                return (
                  <button
                    key={t.id}
                    style={{
                      ...styles.themeChip,
                      borderColor: isActive
                        ? 'var(--accent)'
                        : 'var(--border)',
                      backgroundColor: isActive
                        ? 'var(--bg-surface-hover)'
                        : 'transparent',
                    }}
                    onClick={function () {
                      onThemeChange(t);
                    }}
                    title={t.label}
                  >
                    {t.dark ? <Moon size={11} /> : <Sun size={11} />}
                    <span style={styles.themeChipLabel}>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={settings.autoLoadLastProject}
                onChange={function (e) {
                  onSettingsChange({
                    autoLoadLastProject: e.target.checked,
                  });
                }}
              />
              <span style={styles.checkText}>
                Загружать последний проект
              </span>
            </label>

            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={settings.showWelcomeScreen}
                onChange={function (e) {
                  onSettingsChange({
                    showWelcomeScreen: e.target.checked,
                  });
                }}
              />
              <span style={styles.checkText}>Показывать это окно</span>
            </label>
          </div>

          <button
            style={styles.skipBtn}
            onClick={onSkip}
            disabled={busy}
            title="Продолжить без загрузки проекта (Esc)"
          >
            <EyeOff size={13} />
            Пропустить
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
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--bg-app)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    fontFamily: 'Segoe UI, sans-serif',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  container: {
    width: 980,
    maxWidth: '95vw',
    height: 620,
    maxHeight: '92vh',
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gridTemplateRows: '1fr auto',
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-xl)',
    overflow: 'hidden',
    position: 'relative',
  },
  left: {
    gridRow: '1 / 2',
    gridColumn: '1 / 2',
    padding: '30px 26px',
    borderRight: '1px solid var(--border)',
    backgroundColor: 'var(--bg-panel-header)',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    overflowY: 'auto',
  },
  brandBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  brandIcon: {
    position: 'relative',
    width: 60,
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: '50%',
    background:
      'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 0.3,
    color: 'var(--text-primary)',
  },
  brandSubtitle: {
    fontSize: 11.5,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  actionsBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  bigBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 14px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    outline: 'none',
  },
  bigBtnPrimary: {
    backgroundColor: 'var(--accent)',
    border: '1px solid var(--accent)',
    color: 'var(--accent-text)',
  },
  bigBtnTextWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  bigBtnTitle: {
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  bigBtnHint: {
    fontSize: 10.5,
    opacity: 0.75,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  hotkeysBlock: {
    marginTop: 'auto',
    padding: '12px 14px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  hotkeysTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'var(--text-muted)',
    marginBottom: 2,
  },
  hotkeyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 7px',
    backgroundColor: 'var(--kbd-bg)',
    border: '1px solid var(--kbd-border)',
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'Consolas, monospace',
    color: 'var(--text-primary)',
    minWidth: 22,
    fontWeight: 600,
  },
  kbdPlus: {
    color: 'var(--text-muted)',
    fontSize: 10,
  },
  kbdLabel: {
    color: 'var(--text-muted)',
    fontSize: 10.5,
    marginLeft: 4,
  },
  busyBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius-small)',
  },
  busySpinner: {
    width: 14,
    height: 14,
    border: '2px solid var(--accent)',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  },
  busyText: {
    fontSize: 12,
    color: 'var(--accent)',
    fontWeight: 500,
  },
  right: {
    gridRow: '1 / 2',
    gridColumn: '2 / 3',
    padding: '24px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    overflow: 'hidden',
    minWidth: 0,
  },
  rightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  rightTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: 0.2,
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    fontSize: 11,
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  recentList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflowY: 'auto',
    paddingRight: 4,
    minHeight: 0,
  },
  showMoreBtn: {
    alignSelf: 'center',
    padding: '6px 14px',
    fontSize: 11.5,
    color: 'var(--accent)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    color: 'var(--text-muted)',
    padding: '40px 20px',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginTop: 6,
  },
  emptyHint: {
    fontSize: 12,
    color: 'var(--text-muted)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  bottomBar: {
    gridRow: '2 / 3',
    gridColumn: '1 / 3',
    padding: '12px 18px',
    backgroundColor: 'var(--bg-panel-header)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  bottomLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  themeSwitcher: {
    display: 'flex',
    gap: 4,
  },
  themeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    fontSize: 11,
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  themeChipLabel: {
    fontSize: 11,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11.5,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  checkText: {
    userSelect: 'none',
  },
  skipBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
};

export default WelcomeScreen;