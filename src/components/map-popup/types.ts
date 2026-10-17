// =====================================================
// src/components/map-popup/types.ts
// Вспомогательные функции для попапа
// =====================================================

import type { TreeItem, Place } from '../../types/base';
import {
  isFolder,
  isKmlFile,
  isPlace,
  isKmlLine,
  isKmlPolygon,
  isMeasure,
} from '../../types/base';
import type { ThemeColors } from '../../theme/types';

export function getItemTypeColor(item: TreeItem, colors?: ThemeColors): string {
  if (isFolder(item)) return 'var(--warning)';
  if (isKmlFile(item)) return 'var(--success)';
  if (isPlace(item))
    return (item as Place).color || colors?.markerDefault || 'var(--danger)';
  if (isKmlLine(item))
    return (item as any).color || colors?.lineColor || 'var(--warning)';
  if (isKmlPolygon(item))
    return (item as any).fillColor || colors?.polygonFill || 'var(--accent)';
  if (isMeasure(item))
    return (item as any).color || '#a7d948';
  return 'var(--accent)';
}