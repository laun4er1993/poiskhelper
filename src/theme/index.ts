// =====================================================
// src/theme/index.ts
// Единая точка входа для темы
// =====================================================

export type {
  Theme,
  GlobeSkinPreset,
  ToolbarSizePreset,
  TreeDensityPreset,
  ThemeColors,
} from './types';

export {
  DARK_THEME,
  LIGHT_THEME,
  HIGH_CONTRAST_THEME,
  SOFT_THEME,
  THEME_PRESETS,
  getThemeById,
} from './presets';

export { DEFAULT_COLORS, MARKER_COLOR_PRESETS } from './colors';

export {
  GLOBE_SKIN_MODERN,
  GLOBE_SKIN_GEP,
  GLOBE_SKIN_QGIS,
  GLOBE_SKIN_MINIMAL,
  GLOBE_SKIN_COMPACT,
  GLOBE_SKINS,
  getGlobeSkin,
} from './skins';

export {
  TOOLBAR_SMALL,
  TOOLBAR_NORMAL,
  TOOLBAR_SIZES,
  getToolbarSize,
  TREE_COMPACT,
  TREE_NORMAL,
  TREE_COMFORTABLE,
  TREE_DENSITIES,
  getTreeDensity,
} from './sizes';

export { applyTheme } from './apply';