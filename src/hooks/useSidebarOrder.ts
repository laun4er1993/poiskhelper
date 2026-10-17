// =====================================================
// src/hooks/useSidebarOrder.ts
// Порядок модулей в сайдбаре («Добавленные» / «Мои объекты»)
// =====================================================

import { useCallback, useMemo } from 'react';
import type { AppSettings, SidebarOrder } from '../types/settings';

export interface UseSidebarOrderResult {
  order: SidebarOrder;
  isImportedFirst: boolean;
  isTreeFirst: boolean;
  toggleOrder: () => void;
  setOrder: (order: SidebarOrder) => void;
}

export function useSidebarOrder(
  settings: AppSettings,
  updateSettings: (updater: Partial<AppSettings>) => void
): UseSidebarOrderResult {
  const order: SidebarOrder = settings.sidebarOrder || 'imported-first';

  const setOrder = useCallback(
    function (next: SidebarOrder) {
      updateSettings({ sidebarOrder: next });
    },
    [updateSettings]
  );

  const toggleOrder = useCallback(
    function () {
      setOrder(order === 'imported-first' ? 'tree-first' : 'imported-first');
    },
    [order, setOrder]
  );

  return useMemo(
    function () {
      return {
        order,
        isImportedFirst: order === 'imported-first',
        isTreeFirst: order === 'tree-first',
        toggleOrder,
        setOrder,
      };
    },
    [order, toggleOrder, setOrder]
  );
}