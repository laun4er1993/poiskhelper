// =====================================================
// src/theme/apply.ts
// Применение темы к :root — установка CSS-переменных
// =====================================================

import type { Theme, ThemeColors } from './types';
import type { DesignSettings } from '../types/settings';
import { getGlobeSkin } from './skins';
import { getToolbarSize, getTreeDensity } from './sizes';
import { hexToRgba } from '../types/ids';

// -----------------------------------------------------
// Тип для набора теней в зависимости от уровня
// -----------------------------------------------------
interface ShadowSet {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

function getShadowsForLevel(
  level: 'light' | 'medium' | 'heavy' | undefined,
  enabled: boolean
): ShadowSet {
  if (!enabled) {
    return { sm: 'none', md: 'none', lg: 'none', xl: 'none' };
  }
  if (level === 'light') {
    return {
      sm: '0 1px 2px rgba(0, 0, 0, 0.08)',
      md: '0 4px 12px rgba(0, 0, 0, 0.1)',
      lg: '0 8px 24px rgba(0, 0, 0, 0.14)',
      xl: '0 16px 48px rgba(0, 0, 0, 0.18)',
    };
  }
  if (level === 'heavy') {
    return {
      sm: '0 2px 6px rgba(0, 0, 0, 0.6)',
      md: '0 6px 18px rgba(0, 0, 0, 0.7)',
      lg: '0 12px 40px rgba(0, 0, 0, 0.8)',
      xl: '0 24px 72px rgba(0, 0, 0, 0.85)',
    };
  }
  // medium (по умолчанию)
  return {
    sm: '0 1px 4px rgba(0, 0, 0, 0.3)',
    md: '0 4px 14px rgba(0, 0, 0, 0.45)',
    lg: '0 12px 40px rgba(0, 0, 0, 0.6)',
    xl: '0 24px 64px rgba(0, 0, 0, 0.7)',
  };
}

// -----------------------------------------------------
// Основная функция применения темы
// -----------------------------------------------------
export function applyTheme(
  theme: Theme,
  colors: ThemeColors,
  design?: DesignSettings
): void {
  const root = document.documentElement;

  // === Базовая тема ===
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-hover', theme.accentHover);
  root.style.setProperty('--accent-text', theme.accentText);

  // Полупрозрачные производные от акцента
  root.style.setProperty('--accent-soft', hexToRgba(theme.accent, 0.1));
  root.style.setProperty('--accent-soft-hover', hexToRgba(theme.accent, 0.18));
  root.style.setProperty('--accent-border', hexToRgba(theme.accent, 0.4));
  root.style.setProperty('--accent-border-strong', hexToRgba(theme.accent, 0.6));

  root.style.setProperty('--bg-app', theme.bgApp);
  root.style.setProperty('--bg-surface', theme.bgSurface);
  root.style.setProperty('--bg-surface-hover', theme.bgSurfaceHover);
  root.style.setProperty('--bg-input', theme.bgInput);
  root.style.setProperty('--bg-modal', theme.bgModal);
  root.style.setProperty('--bg-panel', theme.bgPanel);
  root.style.setProperty('--bg-panel-header', theme.bgPanelHeader);

  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--border-accent', theme.borderAccent);
  root.style.setProperty('--text-primary', theme.textPrimary);
  root.style.setProperty('--text-secondary', theme.textSecondary);
  root.style.setProperty('--text-muted', theme.textMuted);

  root.style.setProperty('--danger', theme.danger);
  root.style.setProperty('--warning', theme.warning);
  root.style.setProperty('--success', theme.success);
  root.style.setProperty('--info', theme.info);

  // Полупрозрачные варианты семантических цветов
  root.style.setProperty('--danger-soft', hexToRgba(theme.danger, 0.12));
  root.style.setProperty('--danger-border', hexToRgba(theme.danger, 0.4));
  root.style.setProperty('--warning-soft', hexToRgba(theme.warning, 0.12));
  root.style.setProperty('--warning-border', hexToRgba(theme.warning, 0.4));
  root.style.setProperty('--success-soft', hexToRgba(theme.success, 0.12));
  root.style.setProperty('--success-border', hexToRgba(theme.success, 0.4));
  root.style.setProperty('--info-soft', hexToRgba(theme.info, 0.12));
  root.style.setProperty('--info-border', hexToRgba(theme.info, 0.4));

  // Универсальные мягкие overlay-подложки
  const isDark = theme.dark;
  root.style.setProperty(
    '--overlay-soft',
    isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'
  );
  root.style.setProperty(
    '--overlay-medium',
    isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.06)'
  );
  root.style.setProperty(
    '--overlay-strong',
    isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.12)'
  );

  // Backdrop для модалок
  root.style.setProperty(
    '--backdrop',
    isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.35)'
  );
  root.style.setProperty(
    '--backdrop-light',
    isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.2)'
  );

  // kbd-клавиши
  root.style.setProperty(
    '--kbd-bg',
    isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
  );
  root.style.setProperty(
    '--kbd-border',
    isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
  );

  // Шахматная заливка (для превью иконок)
  root.style.setProperty(
    '--stripe-pattern-color',
    isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'
  );

  // Радиусы, размеры, эффекты
  const baseRadius = design ? design.radius : theme.radius;
  root.style.setProperty('--radius', baseRadius + 'px');
  root.style.setProperty('--radius-small', Math.max(0, baseRadius - 3) + 'px');
  root.style.setProperty('--font-size', theme.fontSize + 'px');
  root.style.setProperty('--icon-size', theme.iconSize + 'px');
  root.style.setProperty('--panel-opacity', String(theme.opacity));

  const blurValue = design && !design.blur ? 0 : theme.blur;
  root.style.setProperty('--blur', blurValue + 'px');

  // Тени — зависят от уровня яркости темы
  const shadowEnabled = design ? design.shadows : true;
  const shadows = getShadowsForLevel(theme.shadowLevel, shadowEnabled);
  root.style.setProperty('--shadow-sm', shadows.sm);
  root.style.setProperty('--shadow-md', shadows.md);
  root.style.setProperty('--shadow-lg', shadows.lg);
  root.style.setProperty('--shadow-xl', shadows.xl);

  // === Цвета объектов ===
  root.style.setProperty('--marker-default', colors.markerDefault);
  root.style.setProperty('--line-color', colors.lineColor);
  root.style.setProperty('--selection-color', colors.selectionColor);
  root.style.setProperty('--polygon-fill', colors.polygonFill);
  root.style.setProperty('--polygon-outline', colors.polygonOutline);

  // === Дизайн (если передан) ===
  if (design) {
    const skin = getGlobeSkin(design.globeSkin);
    const toolbar = getToolbarSize(design.toolbarSize);
    const tree = getTreeDensity(design.treeDensity);

    // --- Тулбар ---
    root.style.setProperty('--toolbar-height', toolbar.height + 'px');
    root.style.setProperty('--toolbar-padding', toolbar.padding + 'px');
    root.style.setProperty('--toolbar-gap', toolbar.gap + 'px');
    root.style.setProperty('--toolbar-btn-size', toolbar.btnSize + 'px');
    root.style.setProperty('--toolbar-icon-size', toolbar.iconSize + 'px');
    root.style.setProperty('--toolbar-radius', toolbar.radius + 'px');
    root.style.setProperty(
      '--toolbar-brand-font-size',
      toolbar.brandFontSize + 'px'
    );
    root.style.setProperty(
      '--toolbar-brand-dot-size',
      toolbar.brandDotSize + 'px'
    );

    // --- Дерево ---
    root.style.setProperty('--tree-row-height', tree.rowHeight + 'px');
    root.style.setProperty('--tree-padding-x', tree.paddingX + 'px');
    root.style.setProperty('--tree-padding-y', tree.paddingY + 'px');
    root.style.setProperty('--tree-font-size', tree.fontSize + 'px');
    root.style.setProperty('--tree-icon-size', design.treeIconSize + 'px');
    root.style.setProperty('--tree-checkbox-size', tree.checkboxSize + 'px');
    root.style.setProperty('--tree-expander-size', tree.expanderSize + 'px');
    root.style.setProperty('--tree-gap', tree.gap + 'px');
    root.style.setProperty('--tree-child-indent', tree.childIndent + 'px');
    root.style.setProperty('--tree-min-height', tree.minHeight + 'px');

    // --- Скин глобуса: компас ---
    root.style.setProperty('--globe-compass-bg', skin.compassBg);
    root.style.setProperty('--globe-compass-border', skin.compassBorder);
    root.style.setProperty('--globe-compass-text', skin.compassText);
    root.style.setProperty('--globe-compass-north', skin.compassNorth);
    root.style.setProperty('--globe-compass-ring', skin.compassRingColor);
    root.style.setProperty('--globe-compass-size', skin.compassSize + 'px');

    // --- Скин глобуса: навигация ---
    root.style.setProperty('--globe-nav-bg', skin.navBg);
    root.style.setProperty('--globe-nav-border', skin.navBorder);
    root.style.setProperty('--globe-nav-text', skin.navText);
    root.style.setProperty('--globe-nav-hover', skin.navHoverBg);
    root.style.setProperty('--globe-nav-size', skin.navSize + 'px');
    root.style.setProperty('--globe-nav-radius', skin.navRadius + 'px');

    // --- Скин глобуса: инфо-линейка ---
    root.style.setProperty('--globe-infobar-bg', skin.infobarBg);
    root.style.setProperty('--globe-infobar-border', skin.infobarBorder);
    root.style.setProperty('--globe-infobar-text', skin.infobarText);
    root.style.setProperty('--globe-infobar-accent', skin.infobarAccent);
    root.style.setProperty('--globe-infobar-height', skin.infobarHeight + 'px');

    // --- Скин глобуса: попап ---
    root.style.setProperty('--globe-popup-bg', skin.popupBg);
    root.style.setProperty('--globe-popup-border', skin.popupBorder);
    root.style.setProperty('--globe-popup-text', skin.popupText);
    root.style.setProperty('--globe-popup-title', skin.popupTitle);
    root.style.setProperty('--globe-popup-muted', skin.popupMuted);
    root.style.setProperty('--globe-popup-accent', skin.popupAccent);
    root.style.setProperty('--globe-popup-radius', skin.popupRadius + 'px');
    root.style.setProperty('--globe-popup-shadow', skin.popupShadow);

    // --- Общее для скина ---
    root.style.setProperty('--globe-accent', skin.accent);
    root.style.setProperty('--globe-shadow', skin.shadow);
    const globeBlur = design.blur ? skin.blur : 0;
    root.style.setProperty('--globe-blur', globeBlur + 'px');
    root.style.setProperty(
      '--globe-show-ticks',
      skin.compassShowTicks ? '1' : '0'
    );

    // --- Кастомный фон попапа из дизайна ---
    if (design.popupBackground) {
      root.style.setProperty('--popup-custom-bg', design.popupBackground);
    } else {
      root.style.setProperty('--popup-custom-bg', skin.popupBg);
    }
  }

  // === Базовый фон body ===
  document.body.style.backgroundColor = theme.bgApp;
  document.body.style.color = theme.textPrimary;
  document.body.style.colorScheme = theme.dark ? 'dark' : 'light';

  // === Класс темы на html ===
  root.classList.remove('theme-dark', 'theme-light');
  root.classList.add(theme.dark ? 'theme-dark' : 'theme-light');
}