// =====================================================
// src/components/globe/hooks/useSelectionScale.ts
// Масштабирование выделенной метки (1.2×) без перерисовки
// =====================================================
//
// Работает через реестр билбордов, созданный в useRendering.
// При смене selectedId — проходит по всем билбордам и меняет
// их scale: выделенный получает ×1.2, остальные — базовый.
//
// Никаких пересозданий entities — попап не сбрасывается, drag
// не сбивается, подписи не мигают.
// =====================================================

import { useCallback, useEffect } from 'react';
import * as Cesium from 'cesium';
import { SELECTED_SCALE_FACTOR } from '../constants';
import type { BillboardInfo } from '../types';

// =====================================================
// === Пропсы ===
// =====================================================
interface UseSelectionScaleParams {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  viewerReady: boolean;
  selectedId: string | null;
  billboardsRef: React.MutableRefObject<Map<string, BillboardInfo>>;
}

// =====================================================
// === Результат ===
// =====================================================
export interface UseSelectionScaleResult {
  /**
   * Ручное применение масштаба выделения.
   * Вызывается снаружи (например, из useRendering через onAfterRender).
   */
  applySelectionScale: (selId: string | null) => void;
}

// =====================================================
// === Хук ===
// =====================================================
export function useSelectionScale({
  viewerRef,
  viewerReady,
  selectedId,
  billboardsRef,
}: UseSelectionScaleParams): UseSelectionScaleResult {
  // -----------------------------------------------------
  // Применение масштаба ко всем билбордам
  // -----------------------------------------------------
  const applySelectionScale = useCallback(
    function (selId: string | null) {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      let collection: Cesium.EntityCollection | null = null;
      try {
        collection = viewer.entities;
      } catch (e) {
        return;
      }
      if (!collection) return;

      billboardsRef.current.forEach(function (info) {
        try {
          if (!info || !info.entity) return;
          // Правильный способ проверить, что entity ещё в коллекции
          // (у Entity нет метода isDestroyed)
          if (!collection!.contains(info.entity)) return;

          const bb = info.entity.billboard;
          if (!bb) return;

          const isSelected = info.ownerId === selId;
          const s = isSelected
            ? info.baseScale * SELECTED_SCALE_FACTOR
            : info.baseScale;

          bb.scale = new Cesium.ConstantProperty(s);
        } catch (e) {
          // Тихо игнорируем — entity могла быть удалена во время итерации
        }
      });

      try {
        viewer.scene.requestRender();
      } catch (e) {}
    },
    [viewerRef, billboardsRef]
  );

  // -----------------------------------------------------
  // Реакция на смену selectedId
  // -----------------------------------------------------
  useEffect(
    function () {
      if (!viewerReady) return;
      applySelectionScale(selectedId);
    },
    [viewerReady, selectedId, applySelectionScale]
  );

  return { applySelectionScale };
}