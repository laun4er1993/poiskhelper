// =====================================================
// src/types/format.ts
// Форматирование координат, дистанций, дат
// =====================================================

import type {
  CoordinateFormat,
  DistanceUnit,
  HeightUnit,
} from './units';
import type { DateFormat } from './project';

// -----------------------------------------------------
// Координаты
// -----------------------------------------------------
export function formatCoordinate(
  value: number,
  isLatitude: boolean,
  format: CoordinateFormat,
  highPrecision: boolean
): string {
  if (!isFinite(value)) return '—';
  const abs = Math.abs(value);
  const hemisphere = isLatitude
    ? value >= 0 ? 'N' : 'S'
    : value >= 0 ? 'E' : 'W';
  if (format === 'DD') {
    const decimals = highPrecision ? 6 : 4;
    return value.toFixed(decimals) + '°';
  }
  if (format === 'DMS') {
    const degrees = Math.floor(abs);
    const minutesFull = (abs - degrees) * 60;
    const minutes = Math.floor(minutesFull);
    const seconds = (minutesFull - minutes) * 60;
    const secDecimals = highPrecision ? 2 : 0;
    return degrees + '° ' + minutes + "' " + seconds.toFixed(secDecimals) + '" ' + hemisphere;
  }
  if (format === 'DDM') {
    const degrees = Math.floor(abs);
    const minutesFull = (abs - degrees) * 60;
    const minDecimals = highPrecision ? 4 : 2;
    return degrees + '° ' + minutesFull.toFixed(minDecimals) + "' " + hemisphere;
  }
  return value + '°';
}

export function formatLatLon(
  lat: number,
  lon: number,
  format: CoordinateFormat,
  highPrecision: boolean
): string {
  return (
    formatCoordinate(lat, true, format, highPrecision) +
    ', ' +
    formatCoordinate(lon, false, format, highPrecision)
  );
}

export function formatPlainLatLon(lat: number, lon: number): string {
  return lat.toFixed(6) + ', ' + lon.toFixed(6);
}

// -----------------------------------------------------
// Высота
// -----------------------------------------------------
export function formatHeight(meters: number, unit: HeightUnit): string {
  if (!isFinite(meters)) return '—';
  if (unit === 'meters') return meters.toFixed(1) + ' м';
  if (unit === 'kilometers') return (meters / 1000).toFixed(3) + ' км';
  if (unit === 'feet') return (meters * 3.28084).toFixed(1) + ' ft';
  if (unit === 'miles') return (meters * 0.000621371).toFixed(4) + ' mi';
  return meters.toFixed(1) + ' м';
}

// -----------------------------------------------------
// Дистанция
// -----------------------------------------------------
export function formatDistance(
  meters: number,
  unit: DistanceUnit,
  highPrecision: boolean
): string {
  if (!isFinite(meters)) return '—';
  if (unit === 'metric') {
    if (meters >= 1000) {
      const decimals = highPrecision ? 2 : 0;
      return (meters / 1000).toFixed(decimals) + ' км';
    }
    const decimals = highPrecision ? 1 : 0;
    return meters.toFixed(decimals) + ' м';
  }
  const feet = meters * 3.28084;
  if (feet >= 5280) {
    const decimals = highPrecision ? 3 : 1;
    return (feet / 5280).toFixed(decimals) + ' mi';
  }
  const decimals = highPrecision ? 1 : 0;
  return feet.toFixed(decimals) + ' ft';
}

// -----------------------------------------------------
// Углы
// -----------------------------------------------------
export function formatAngle(degrees: number, highPrecision: boolean): string {
  if (!isFinite(degrees)) return '—';
  const normalized = ((degrees % 360) + 360) % 360;
  const decimals = highPrecision ? 1 : 0;
  return normalized.toFixed(decimals) + '°';
}

// -----------------------------------------------------
// Площадь
// -----------------------------------------------------
export function formatArea(sqMeters: number, unit: DistanceUnit): string {
  if (!isFinite(sqMeters)) return '—';
  if (unit === 'metric') {
    if (sqMeters >= 1000000) return (sqMeters / 1000000).toFixed(3) + ' км²';
    if (sqMeters >= 10000) return (sqMeters / 10000).toFixed(3) + ' га';
    return sqMeters.toFixed(1) + ' м²';
  }
  const sqFeet = sqMeters * 10.7639;
  if (sqFeet >= 27878400) return (sqFeet / 27878400).toFixed(3) + ' mi²';
  if (sqFeet >= 43560) return (sqFeet / 43560).toFixed(3) + ' акр';
  return sqFeet.toFixed(1) + ' ft²';
}

// -----------------------------------------------------
// Файлы
// -----------------------------------------------------
export function formatFileSize(bytes: number): string {
  if (!isFinite(bytes) || bytes <= 0) return '0 Б';
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' МБ';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' ГБ';
}

// -----------------------------------------------------
// Даты
// -----------------------------------------------------
export function formatRelativeDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'только что';
    if (min < 60) return min + ' мин назад';
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' ч назад';
    const days = Math.floor(hr / 24);
    if (days < 7) return days + ' дн назад';
    return d.toLocaleDateString('ru-RU');
  } catch (e) {
    return '';
  }
}

export function formatDate(iso: string, format: DateFormat): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    if (format === 'MM/DD/YYYY') return mm + '/' + dd + '/' + yyyy;
    if (format === 'YYYY-MM-DD') return yyyy + '-' + mm + '-' + dd;
    return dd + '.' + mm + '.' + yyyy;
  } catch (e) {
    return '';
  }
}