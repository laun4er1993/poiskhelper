// =====================================================
// src/theme/sizes.ts
// Размеры тулбара и плотность дерева
// =====================================================

import type {
  ToolbarSizePreset,
  TreeDensityPreset,
} from './types';

// -----------------------------------------------------
// Тулбар
// -----------------------------------------------------
export const TOOLBAR_SMALL: ToolbarSizePreset = {
  id: 'small',
  label: 'Маленький',
  height: 38,
  padding: 8,
  gap: 4,
  btnSize: 26,
  iconSize: 13,
  radius: 5,
  brandFontSize: 12,
  brandDotSize: 7,
};

export const TOOLBAR_NORMAL: ToolbarSizePreset = {
  id: 'normal',
  label: 'Обычный',
  height: 42,
  padding: 10,
  gap: 6,
  btnSize: 28,
  iconSize: 14,
  radius: 5,
  brandFontSize: 13,
  brandDotSize: 8,
};

export const TOOLBAR_SIZES: ToolbarSizePreset[] = [
  TOOLBAR_SMALL,
  TOOLBAR_NORMAL,
];

export function getToolbarSize(id: string): ToolbarSizePreset {
  const found = TOOLBAR_SIZES.find(function (s) {
    return s.id === id;
  });
  return found || TOOLBAR_NORMAL;
}

// -----------------------------------------------------
// Плотность дерева
// -----------------------------------------------------
export const TREE_COMPACT: TreeDensityPreset = {
  id: 'compact',
  label: 'Компактная',
  rowHeight: 20,
  paddingX: 4,
  paddingY: 1,
  fontSize: 11.5,
  iconSize: 11,
  checkboxSize: 13,
  expanderSize: 11,
  gap: 2,
  childIndent: 12,
  minHeight: 20,
};

export const TREE_NORMAL: TreeDensityPreset = {
  id: 'normal',
  label: 'Обычная',
  rowHeight: 24,
  paddingX: 5,
  paddingY: 3,
  fontSize: 12,
  iconSize: 13,
  checkboxSize: 14,
  expanderSize: 12,
  gap: 3,
  childIndent: 14,
  minHeight: 22,
};

export const TREE_COMFORTABLE: TreeDensityPreset = {
  id: 'comfortable',
  label: 'Просторная',
  rowHeight: 28,
  paddingX: 8,
  paddingY: 5,
  fontSize: 12.5,
  iconSize: 14,
  checkboxSize: 15,
  expanderSize: 13,
  gap: 5,
  childIndent: 18,
  minHeight: 26,
};

export const TREE_DENSITIES: TreeDensityPreset[] = [
  TREE_COMPACT,
  TREE_NORMAL,
  TREE_COMFORTABLE,
];

export function getTreeDensity(id: string): TreeDensityPreset {
  const found = TREE_DENSITIES.find(function (d) {
    return d.id === id;
  });
  return found || TREE_COMPACT;
}