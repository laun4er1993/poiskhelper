// =====================================================
// src/utils/coordinate-parser.ts
// Парсер координат разных форматов: DD, DMS, DDM
// =====================================================

export interface ParsedCoordinate {
  lat: number;
  lon: number;
  height?: number;
}

export function tryParseCoordinate(input: string): ParsedCoordinate | null {
  const s = (input || '').trim();
  if (!s) return null;

  let height: number | undefined;
  let cleaned = s;

  const heightMatch = s.match(
    /[\(\[]?\s*h\s*[:=]\s*([-+]?\d+(?:[.,]\d+)?)\s*[\)\]]?\s*(?:m|м)?\s*$/i
  );
  if (heightMatch) {
    height = parseFloat(heightMatch[1].replace(',', '.'));
    if (!isFinite(height)) height = undefined;
    cleaned = s.slice(0, heightMatch.index).trim();
  }

  const dd = tryParseDD(cleaned);
  if (dd) return { ...dd, height };

  const dms = tryParseDMS(cleaned);
  if (dms) return { ...dms, height };

  const ddm = tryParseDDM(cleaned);
  if (ddm) return { ...ddm, height };

  return null;
}

function tryParseDD(s: string): ParsedCoordinate | null {
  if (/[°'"]/.test(s)) return null;

  let normalized = s;
  normalized = normalized.replace(/(\d),(\d)/g, '$1.$2');

  const numberRegex = /[-+]?\d+(?:\.\d+)?/g;
  const nums: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = numberRegex.exec(normalized)) !== null) {
    const n = parseFloat(m[0]);
    if (isFinite(n)) nums.push(n);
  }

  if (nums.length !== 2) return null;

  const upper = normalized.toUpperCase().replace(/[ЕЕ]/g, 'E');

  const hasN = /N/.test(upper);
  const hasS = /S/.test(upper);
  const hasE = /E/.test(upper);
  const hasW = /W/.test(upper);

  let lat = nums[0];
  let lon = nums[1];

  if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
    const tmp = lat;
    lat = lon;
    lon = tmp;
  }

  if (hasS) lat = -Math.abs(lat);
  else if (hasN) lat = Math.abs(lat);

  if (hasW) lon = -Math.abs(lon);
  else if (hasE) lon = Math.abs(lon);

  if (!isFinite(lat) || !isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

  return { lat, lon };
}

function tryParseDMS(s: string): ParsedCoordinate | null {
  if (!/[°]/.test(s)) return null;

  const upper = s.toUpperCase().replace(/[ЕЕ]/g, 'E');

  const re =
    /([-+]?\d+(?:[.,]\d+)?)\s*[°]\s*(?:(\d+(?:[.,]\d+)?)\s*['′’])?\s*(?:(\d+(?:[.,]\d+)?)\s*["″”])?\s*([NSEW])?/g;

  const parts: Array<{
    deg: number;
    min: number;
    sec: number;
    hemi: string | null;
  }> = [];

  let m: RegExpExecArray | null;
  while ((m = re.exec(upper)) !== null) {
    const deg = parseFloat(m[1].replace(',', '.'));
    const min = m[2] !== undefined ? parseFloat(m[2].replace(',', '.')) : 0;
    const sec = m[3] !== undefined ? parseFloat(m[3].replace(',', '.')) : 0;
    const hemi = m[4] || null;
    if (!isFinite(deg) || !isFinite(min) || !isFinite(sec)) continue;
    if (m[0].trim() === '') continue;
    parts.push({ deg, min, sec, hemi });
  }

  if (parts.length < 2) return null;

  const lat = dmsToDecimal(parts[0]);
  const lon = dmsToDecimal(parts[1]);
  if (lat === null || lon === null) return null;

  if (!isFinite(lat) || !isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

  return { lat, lon };
}

function tryParseDDM(s: string): ParsedCoordinate | null {
  if (!/[°]/.test(s)) return null;
  if (/["″”]/.test(s)) return null;

  const upper = s.toUpperCase().replace(/[ЕЕ]/g, 'E');

  const re =
    /([-+]?\d+(?:[.,]\d+)?)\s*[°]\s*(\d+(?:[.,]\d+)?)\s*['′’]\s*([NSEW])?/g;

  const parts: Array<{ deg: number; min: number; hemi: string | null }> = [];

  let m: RegExpExecArray | null;
  while ((m = re.exec(upper)) !== null) {
    const deg = parseFloat(m[1].replace(',', '.'));
    const min = parseFloat(m[2].replace(',', '.'));
    const hemi = m[3] || null;
    if (!isFinite(deg) || !isFinite(min)) continue;
    parts.push({ deg, min, hemi });
  }

  if (parts.length < 2) return null;

  const lat = ddmToDecimal(parts[0]);
  const lon = ddmToDecimal(parts[1]);
  if (lat === null || lon === null) return null;

  if (!isFinite(lat) || !isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

  return { lat, lon };
}

function dmsToDecimal(part: {
  deg: number;
  min: number;
  sec: number;
  hemi: string | null;
}): number | null {
  if (!isFinite(part.deg)) return null;
  if (part.min < 0 || part.min >= 60) return null;
  if (part.sec < 0 || part.sec >= 60) return null;

  const sign = part.deg < 0 ? -1 : 1;
  let value = Math.abs(part.deg) + part.min / 60 + part.sec / 3600;

  if (part.hemi === 'S' || part.hemi === 'W') value = -value;
  else if (part.hemi === 'N' || part.hemi === 'E') value = Math.abs(value);
  else value = sign * value;

  return value;
}

function ddmToDecimal(part: {
  deg: number;
  min: number;
  hemi: string | null;
}): number | null {
  if (!isFinite(part.deg)) return null;
  if (part.min < 0 || part.min >= 60) return null;

  const sign = part.deg < 0 ? -1 : 1;
  let value = Math.abs(part.deg) + part.min / 60;

  if (part.hemi === 'S' || part.hemi === 'W') value = -value;
  else if (part.hemi === 'N' || part.hemi === 'E') value = Math.abs(value);
  else value = sign * value;

  return value;
}