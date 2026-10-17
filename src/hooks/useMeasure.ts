// =====================================================
// src/hooks/useMeasure.ts
// Управление режимом измерения (линейка)
// =====================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  MeasurePoint,
  MeasureMetrics,
  MeasureRulerType,
  MeasureSettings,
} from '../types/measure';
import { getRulerInfo } from '../types/measure';
import { computeMeasureMetrics } from '../types/geometry';
import { formatDistance, formatArea } from '../types/format';
import type { DistanceUnit } from '../types/units';
import { generateId } from '../types/ids';
import type {
  TreeItem,
  MeasureItem,
} from '../types/base';
import { addItemToFolder } from '../types/tree-utils';

export interface UseMeasureParams {
  settings: MeasureSettings;
  distanceUnit: DistanceUnit;
  highPrecision: boolean;
  activeFolderId: string;
  setTree: React.Dispatch<React.SetStateAction<TreeItem[]>>;
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  addLog: (
    type: 'measure' | 'add' | 'update',
    message: string,
    details?: string
  ) => void;
  markDirty: () => void;
  copyToClipboard: (text: string, label: string) => void;
}

export interface UseMeasureResult {
  points: MeasurePoint[];
  closed: boolean;
  selectedIndex: number | null;
  metrics: MeasureMetrics;
  rulerInfo: ReturnType<typeof getRulerInfo>;

  addPoint: (lat: number, lon: number, height: number) => void;
  removePoint: (index: number) => void;
  removeLastPoint: () => void;
  clearAll: () => void;
  toggleClosed: () => void;
  setSelectedIndex: (index: number | null) => void;
  movePoint: (
    index: number,
    lat: number,
    lon: number,
    height: number
  ) => void;

  saveAsMeasureItem: (name?: string) => string | null;
  copyCoords: () => void;
  setRulerType: (type: MeasureRulerType) => void;
}

function buildDefaultName(
  rulerType: MeasureRulerType,
  totalDist: number,
  area: number,
  closed: boolean,
  distanceUnit: DistanceUnit,
  highPrecision: boolean
): string {
  if (rulerType === 'simple') {
    return 'Прямая ' + formatDistance(totalDist, distanceUnit, highPrecision);
  }
  if (rulerType === 'area') {
    if (closed && area > 0) {
      return 'Площадь ' + formatArea(area, distanceUnit);
    }
    return 'Контур ' + formatDistance(totalDist, distanceUnit, highPrecision);
  }
  return 'Путь ' + formatDistance(totalDist, distanceUnit, highPrecision);
}

export function useMeasure(params: UseMeasureParams): UseMeasureResult {
  const {
    settings,
    distanceUnit,
    highPrecision,
    activeFolderId,
    setTree,
    setSelectedIds,
    addLog,
    markDirty,
    copyToClipboard,
  } = params;

  const [points, setPoints] = useState<MeasurePoint[]>([]);
  const [closed, setClosed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const rulerInfo = useMemo(
    function () {
      return getRulerInfo(settings.rulerType);
    },
    [settings.rulerType]
  );

  const metrics = useMemo(
    function () {
      return computeMeasureMetrics(points, closed);
    },
    [points, closed]
  );

  useEffect(
    function () {
      if (rulerInfo.maxPoints > 0 && points.length > rulerInfo.maxPoints) {
        setPoints(points.slice(0, rulerInfo.maxPoints));
      }
    },
    [rulerInfo.maxPoints, points]
  );

  const addPoint = useCallback(
    function (lat: number, lon: number, height: number) {
      setPoints(function (prev) {
        if (rulerInfo.maxPoints > 0 && prev.length >= rulerInfo.maxPoints) {
          return prev;
        }
        return prev.concat([{ lat, lon, height: height || 0 }]);
      });
    },
    [rulerInfo.maxPoints]
  );

  const removePoint = useCallback(function (index: number) {
    setPoints(function (prev) {
      if (index < 0 || index >= prev.length) return prev;
      const next = prev.slice();
      next.splice(index, 1);
      return next;
    });
    setSelectedIndex(null);
  }, []);

  const removeLastPoint = useCallback(function () {
    setPoints(function (prev) {
      if (prev.length === 0) return prev;
      return prev.slice(0, prev.length - 1);
    });
    setSelectedIndex(null);
  }, []);

  const clearAll = useCallback(function () {
    setPoints([]);
    setClosed(false);
    setSelectedIndex(null);
  }, []);

  const toggleClosed = useCallback(
    function () {
      if (!rulerInfo.allowClose && !closed) {
        return;
      }
      setClosed(function (prev) {
        return !prev;
      });
    },
    [rulerInfo.allowClose, closed]
  );

  const movePoint = useCallback(
    function (
      index: number,
      lat: number,
      lon: number,
      height: number
    ) {
      setPoints(function (prev) {
        if (index < 0 || index >= prev.length) return prev;
        const next = prev.slice();
        next[index] = { lat, lon, height: height || 0 };
        return next;
      });
    },
    []
  );

  const saveAsMeasureItem = useCallback(
    function (customName?: string): string | null {
      if (points.length < 2) {
        alert('Нужно минимум 2 точки для сохранения измерения.');
        return null;
      }

      const defaultName = buildDefaultName(
        settings.rulerType,
        metrics.totalDist,
        metrics.area,
        closed,
        distanceUnit,
        highPrecision
      );
      const name = customName && customName.trim() ? customName.trim() : defaultName;

      const item: MeasureItem = {
        id: generateId('measure'),
        name,
        type: 'measure',
        rulerType: settings.rulerType,
        visible: true,
        positions: points.slice(),
        closed: closed,

        // Линия (без обводки)
        color: settings.lineColor,
        width: settings.lineWidth,
        lineOpacity: settings.lineOpacity,
        lineDash: settings.lineDash,

        // Точки
        pointShape: settings.pointShape,
        pointSize: settings.pointSize,
        pointOpacity: settings.pointOpacity,
        pointFillColor: settings.pointFillColor,
        pointOutlineColor: settings.pointOutlineColor,
        pointOutlineWidth: settings.pointOutlineWidth,

        // Цифры
        showNumbers: settings.showNumbers,
        numberFontSize: settings.numberFontSize,
        numberColor: settings.numberColor,
        numberOutlineColor: settings.numberOutlineColor,
        numberOutlineWidth: settings.numberOutlineWidth,
        numberStyle: settings.numberStyle,

        // Подписи
        showHeights: settings.showHeights,
        showSegmentLengths: settings.showSegmentLengths,
        showAzimuths: settings.showAzimuths,
        highlightEndpoints: settings.highlightEndpoints,

        description: '',
        createdAt: new Date().toISOString(),
      };

      setTree(function (prev) {
        return addItemToFolder(prev, activeFolderId, item);
      });
      setSelectedIds([item.id]);

      addLog('add', 'Измерение сохранено: ' + name);
      markDirty();

      setPoints([]);
      setClosed(false);
      setSelectedIndex(null);

      return item.id;
    },
    [
      points,
      closed,
      metrics.totalDist,
      metrics.area,
      distanceUnit,
      highPrecision,
      settings,
      activeFolderId,
      setTree,
      setSelectedIds,
      addLog,
      markDirty,
    ]
  );

  const copyCoords = useCallback(
    function () {
      if (points.length === 0) return;

      const lines: string[] = [];
      const typeLabel =
        settings.rulerType === 'simple'
          ? 'Прямая'
          : settings.rulerType === 'area'
          ? 'Площадь'
          : 'Путь';

      lines.push('=== ' + typeLabel + ' ===');
      lines.push('');

      let cumulative = 0;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const prefix = i === 0 ? '' : '→ ';
        const accLabel =
          i === 0 ? '' : ' [+' + formatDistance(
            cumulative,
            distanceUnit,
            highPrecision
          ) + ']';
        lines.push(
          prefix +
            'Точка ' +
            (i + 1) +
            ': ' +
            p.lat.toFixed(8) +
            ', ' +
            p.lon.toFixed(8) +
            ' (h=' +
            (p.height || 0).toFixed(2) +
            ' м)' +
            accLabel
        );

        if (i < points.length - 1) {
          const next = points[i + 1];
          cumulative += computeSegmentDistance(p, next);
        } else if (closed && points.length >= 3) {
          const first = points[0];
          cumulative += computeSegmentDistance(p, first);
          lines.push(
            '→ Замыкание к точке 1 [+' +
              formatDistance(cumulative, distanceUnit, highPrecision) +
              ']'
          );
        }
      }

      lines.push('');
      lines.push(
        'Общая длина: ' +
          formatDistance(metrics.totalDist, distanceUnit, highPrecision)
      );

      if (closed && metrics.area > 0) {
        lines.push('Площадь: ' + formatArea(metrics.area, distanceUnit));
      }

      if (metrics.hasHeights) {
        lines.push(
          'Высоты: ' +
            metrics.minHeight.toFixed(2) +
            ' / ' +
            metrics.avgHeight.toFixed(2) +
            ' / ' +
            metrics.maxHeight.toFixed(2) +
            ' м (min/avg/max)'
        );
      }

      const text = lines.join('\n');
      copyToClipboard(text, 'Координаты измерения');
    },
    [
      points,
      closed,
      metrics,
      settings.rulerType,
      distanceUnit,
      highPrecision,
      copyToClipboard,
    ]
  );

  const setRulerType = useCallback(
    function (type: MeasureRulerType) {
      const info = getRulerInfo(type);
      if (!info.allowClose && closed) {
        setClosed(false);
      }
      if (info.maxPoints > 0 && points.length > info.maxPoints) {
        setPoints(points.slice(0, info.maxPoints));
        setSelectedIndex(null);
      }
    },
    [closed, points]
  );

  return useMemo(
    function () {
      return {
        points,
        closed,
        selectedIndex,
        metrics,
        rulerInfo,

        addPoint,
        removePoint,
        removeLastPoint,
        clearAll,
        toggleClosed,
        setSelectedIndex,
        movePoint,

        saveAsMeasureItem,
        copyCoords,
        setRulerType,
      };
    },
    [
      points,
      closed,
      selectedIndex,
      metrics,
      rulerInfo,
      addPoint,
      removePoint,
      removeLastPoint,
      clearAll,
      toggleClosed,
      movePoint,
      saveAsMeasureItem,
      copyCoords,
      setRulerType,
    ]
  );
}

function computeSegmentDistance(a: MeasurePoint, b: MeasurePoint): number {
  const R = 6371008.8;
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a.lat * toRad) *
      Math.cos(b.lat * toRad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}