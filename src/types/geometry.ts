// =====================================================
// src/types/geometry.ts
// Геометрические вычисления
// =====================================================

/**
 * Азимут (bearing) между двумя точками в градусах.
 * 0° = север, 90° = восток.
 */
export function computeBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  const brng = Math.atan2(y, x);
  return (brng * toDeg + 360) % 360;
}

/**
 * Расстояние между двумя точками по формуле хаверсинуса (метры).
 */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371008.8;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) *
      Math.cos(lat2 * toRad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Площадь полигона (м²) по формуле сферического избытка.
 */
export function computePolygonArea(
  points: Array<{ lat: number; lon: number }>
): number {
  if (!points || points.length < 3) return 0;
  const toRad = Math.PI / 180;
  const R = 6371008.8;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    sum +=
      (p2.lon - p1.lon) *
      toRad *
      (2 + Math.sin(p1.lat * toRad) + Math.sin(p2.lat * toRad));
  }
  return Math.abs((sum * R * R) / 2);
}

/**
 * Полный набор метрик для линейки.
 */
import type {
  MeasureMetrics,
  MeasurePoint,
  SegmentMetrics,
  SegmentMetricsResult,
} from './measure';

export function computeMeasureMetrics(
  points: MeasurePoint[],
  closed: boolean
): MeasureMetrics {
  if (!points || points.length < 2) {
    return {
      totalDist: 0,
      area: 0,
      minHeight: 0,
      maxHeight: 0,
      avgHeight: 0,
      hasHeights: false,
      segmentCount: 0,
    };
  }

  let totalDist = 0;
  let segmentCount = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if (!closed && i === points.length - 1) break;
    totalDist += haversineMeters(a.lat, a.lon, b.lat, b.lon);
    segmentCount++;
  }

  let minH = Infinity;
  let maxH = -Infinity;
  let sumH = 0;
  let heightCount = 0;
  for (let i = 0; i < points.length; i++) {
    const h = points[i].height || 0;
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
    sumH += h;
    heightCount++;
  }

  let area = 0;
  if (closed && points.length >= 3) {
    area = computePolygonArea(points);
  }

  return {
    totalDist,
    area,
    minHeight: heightCount > 0 ? minH : 0,
    maxHeight: heightCount > 0 ? maxH : 0,
    avgHeight: heightCount > 0 ? sumH / heightCount : 0,
    hasHeights: heightCount > 0,
    segmentCount,
  };
}

/**
 * Метрики по каждому сегменту линейки.
 * Возвращает массив сегментов + суммы.
 */
export function computeSegmentMetrics(
  points: MeasurePoint[],
  closed: boolean
): SegmentMetricsResult {
  const empty: SegmentMetricsResult = {
    segments: [],
    totalDistance: 0,
    totalDistance3D: 0,
    totalDeltaHeight: 0,
    minHeight: 0,
    maxHeight: 0,
    avgHeight: 0,
    hasHeights: false,
  };

  if (!points || points.length < 2) return empty;

  const segments: SegmentMetrics[] = [];
  let totalDistance = 0;
  let totalDistance3D = 0;
  let totalDeltaHeight = 0;

  // Считаем количество сегментов
  const segCount = closed ? points.length : points.length - 1;

  for (let i = 0; i < segCount; i++) {
    const from = points[i];
    const to = points[(i + 1) % points.length];

    const d2d = haversineMeters(from.lat, from.lon, to.lat, to.lon);
    const dh = (to.height || 0) - (from.height || 0);
    const d3d = Math.sqrt(d2d * d2d + dh * dh);

    const azimuth = computeBearing(from.lat, from.lon, to.lat, to.lon);

    // Уклон: arcsin(dh / d3d) в градусах
    let slopeDeg = 0;
    if (d3d > 0.0001) {
      slopeDeg = (Math.asin(dh / d3d) * 180) / Math.PI;
    }
    const slopePercent = d2d > 0.0001 ? (dh / d2d) * 100 : 0;

    segments.push({
      index: i,
      fromNumber: i + 1,
      toNumber: ((i + 1) % points.length) + 1,
      from: { ...from },
      to: { ...to },
      distance: d2d,
      distance3D: d3d,
      azimuth,
      slopeDeg,
      slopePercent,
      deltaHeight: dh,
    });

    totalDistance += d2d;
    totalDistance3D += d3d;
    totalDeltaHeight += dh;
  }

  // Высоты
  let minH = Infinity;
  let maxH = -Infinity;
  let sumH = 0;
  for (let i = 0; i < points.length; i++) {
    const h = points[i].height || 0;
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
    sumH += h;
  }

  const hasHeights = points.length > 0;

  return {
    segments,
    totalDistance,
    totalDistance3D,
    totalDeltaHeight,
    minHeight: hasHeights ? minH : 0,
    maxHeight: hasHeights ? maxH : 0,
    avgHeight: hasHeights ? sumH / points.length : 0,
    hasHeights,
  };
}