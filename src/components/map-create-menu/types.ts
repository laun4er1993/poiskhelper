// =====================================================
// src/components/map-create-menu/types.ts
// Вспомогательные типы и функции для меню создания
// =====================================================

import type { MapCreateAction } from '../../types/settings';

/**
 * Описание одного пункта меню.
 */
export interface MenuAction {
  id: MapCreateAction;
  label: string;
  hint: string;
  /** Компонент иконки из lucide-react */
  icon: any;
  /** CSS-цвет иконки */
  color: string;
  enabled: boolean;
}

/**
 * Якорь меню — привязка к экранной позиции.
 */
export interface CreateMenuAnchor {
  worldPosX: number;
  worldPosY: number;
  worldPosZ: number;
  lat: number;
  lon: number;
  height: number;
  screenX: number;
  screenY: number;
}

/**
 * Дефолтные цвета пунктов меню (через семантические переменные).
 */
export function getActionColor(action: MapCreateAction): string {
  switch (action) {
    case 'place':
      return 'var(--danger)';
    case 'measure':
      return 'var(--success)';
    case 'line':
      return 'var(--warning)';
    case 'polygon':
      return 'var(--accent)';
    case 'folder':
      return 'var(--warning)';
    default:
      return 'var(--text-secondary)';
  }
}