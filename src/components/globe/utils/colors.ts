// =====================================================
// src/components/globe/utils/colors.ts
// Работа с цветами и canvas-текстурами
// =====================================================

import * as Cesium from 'cesium';
import { CIRCLE_RENDER_SCALE } from '../constants';

// =====================================================
// === tintColor ===
// =====================================================
export function tintColor(css: string, opacity: number): Cesium.Color {
  let c: Cesium.Color;
  try {
    c = Cesium.Color.fromCssColorString(css || '#ffffff');
  } catch (e) {
    c = Cesium.Color.WHITE;
  }
  const a = Math.max(0, Math.min(1, opacity));
  return new Cesium.Color(c.red, c.green, c.blue, a);
}

// =====================================================
// === Кэш кружков ===
// =====================================================
const circleCache: Map<string, string> = new Map();

export function getCircleDataUrl(
  sizePx: number,
  fillColor: string,
  outlineColor: string,
  outlineFraction: number
): string {
  const safeSize = Math.max(2, Math.round(sizePx));
  const safeFraction = Math.max(0, Math.min(1, outlineFraction));
  const key =
    safeSize +
    '|' +
    fillColor +
    '|' +
    outlineColor +
    '|' +
    safeFraction.toFixed(3);

  const cached = circleCache.get(key);
  if (cached) return cached;

  const borderPx = Math.round(safeSize * safeFraction);
  const totalPx = safeSize + borderPx * 2;
  const w = Math.max(2, totalPx * CIRCLE_RENDER_SCALE);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = w;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = w / 2;
  const cy = w / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, w / 2, 0, Math.PI * 2);
  ctx.fillStyle = outlineColor;
  ctx.fill();

  if (borderPx > 0) {
    const rInner = w / 2 - borderPx * CIRCLE_RENDER_SCALE;
    if (rInner > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
  }

  const url = canvas.toDataURL('image/png');
  circleCache.set(key, url);

  if (circleCache.size > 500) {
    const firstKey = circleCache.keys().next().value;
    if (firstKey !== undefined) circleCache.delete(firstKey);
  }

  return url;
}

// =====================================================
// === Рекраска иконок Google Earth ===
// =====================================================

const DEFAULT_ICON_SIZE = 32;
const RECOLOR_SCALE = 4;
const BRIGHTNESS_THRESHOLD = 180;

const iconImageCache: Map<string, HTMLImageElement> = new Map();
const iconLoadingPromise: Map<
  string,
  Promise<HTMLImageElement | null>
> = new Map();
const styledIconCache: Map<string, string> = new Map();

// =====================================================
// === Счётчик версий ===
// =====================================================
let iconVersion = 0;
const iconVersionListeners: Set<() => void> = new Set();

export function getIconVersion(): number {
  return iconVersion;
}

export function subscribeIconVersion(fn: () => void): () => void {
  iconVersionListeners.add(fn);
  return function () {
    iconVersionListeners.delete(fn);
  };
}

function notifyIconUpdate(): void {
  iconVersion++;
  iconVersionListeners.forEach(function (fn) {
    try {
      fn();
    } catch (e) {}
  });
}

// =====================================================
// === hexToRgb ===
// =====================================================
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = (hex || '#000000').replace('#', '');
  let r = '00';
  let g = '00';
  let b = '00';
  if (h.length === 6) {
    r = h.substring(0, 2);
    g = h.substring(2, 4);
    b = h.substring(4, 6);
  } else if (h.length === 3) {
    r = h[0] + h[0];
    g = h[1] + h[1];
    b = h[2] + h[2];
  }
  return {
    r: parseInt(r, 16) || 0,
    g: parseInt(g, 16) || 0,
    b: parseInt(b, 16) || 0,
  };
}

// =====================================================
// === Загрузка изображения ===
// =====================================================
function loadIconImage(
  iconHref: string
): Promise<HTMLImageElement | null> {
  if (iconImageCache.has(iconHref)) {
    return Promise.resolve(iconImageCache.get(iconHref) || null);
  }
  const existing = iconLoadingPromise.get(iconHref);
  if (existing) return existing;

  const promise = new Promise<HTMLImageElement | null>(function (resolve) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      iconImageCache.set(iconHref, img);
      iconLoadingPromise.delete(iconHref);
      resolve(img);
    };
    img.onerror = function () {
      iconLoadingPromise.delete(iconHref);
      resolve(null);
    };
    img.src = iconHref;
  });

  iconLoadingPromise.set(iconHref, promise);
  return promise;
}

// =====================================================
// === Параметры рекраски ===
// =====================================================
interface RecolorOptions {
  fillColor: string;
  fillOpacity: number;
  showFill: boolean;
  outlineColor: string;
  outlineOpacity: number;
  showOutline: boolean;
  /** Толщина обводки в пикселях исходной иконки (32×32) */
  outlineWidth: number;
}

// =====================================================
// === Рекраска с дилатацией контура ===
// =====================================================
function recolorImage(
  img: HTMLImageElement,
  opts: RecolorOptions
): string | null {
  try {
    const w = DEFAULT_ICON_SIZE * RECOLOR_SCALE;
    const h = DEFAULT_ICON_SIZE * RECOLOR_SCALE;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, w, h);

    let data: ImageData;
    try {
      data = ctx.getImageData(0, 0, w, h);
    } catch (err) {
      return null;
    }

    const d = data.data;

    // === 1. Классификация пикселей ===
    // isOutline[i] — true, если это контур
    // isFill[i]    — true, если это заливка
    // else         — прозрачно
    const total = w * h;
    const isOutline = new Uint8Array(total);
    const isFill = new Uint8Array(total);

    for (let i = 0; i < total; i++) {
      const a = d[i * 4 + 3];
      if (a < 10) continue;

      const r = d[i * 4];
      const g = d[i * 4 + 1];
      const b = d[i * 4 + 2];
      const brightness = (r + g + b) / 3;

      if (brightness > BRIGHTNESS_THRESHOLD) {
        isFill[i] = 1;
      } else {
        isOutline[i] = 1;
      }
    }

    // === 2. Дилатация контура (толщина обводки) ===
    // Если outlineWidth > 1 — расширяем контур внутрь заливки.
    // Работаем в координатах иконки 32×32, но маска у нас в 32×4=128,
    // поэтому радиус умножаем на RECOLOR_SCALE.
    const baseWidthPx = 1;
    const extraWidthPx = Math.max(
      0,
      (opts.outlineWidth - baseWidthPx) * RECOLOR_SCALE
    );

    if (extraWidthPx >= 1 && opts.showOutline) {
      const radius = Math.ceil(extraWidthPx);
      const dilated = new Uint8Array(isOutline);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (isOutline[idx]) continue;
          if (!isFill[idx]) continue;
          // Проверяем окрестность
          let nearOutline = false;
          for (let dy = -radius; dy <= radius && !nearOutline; dy++) {
            const yy = y + dy;
            if (yy < 0 || yy >= h) continue;
            for (let dx = -radius; dx <= radius; dx++) {
              const xx = x + dx;
              if (xx < 0 || xx >= w) continue;
              const nIdx = yy * w + xx;
              if (isOutline[nIdx]) {
                nearOutline = true;
                break;
              }
            }
          }
          if (nearOutline) {
            dilated[idx] = 1;
            isFill[idx] = 0;
          }
        }
      }
      for (let i = 0; i < total; i++) {
        isOutline[i] = dilated[i];
      }
    }

    // === 3. Финальная раскраска ===
    const fill = hexToRgb(opts.fillColor);
    const outline = hexToRgb(opts.outlineColor);
    const showFill = opts.showFill && opts.fillOpacity > 0.001;
    const showOutline = opts.showOutline && opts.outlineOpacity > 0.001;

    for (let i = 0; i < total; i++) {
      const a = d[i * 4 + 3];
      if (a < 10) continue;

      if (isOutline[i]) {
        if (showOutline) {
          d[i * 4] = outline.r;
          d[i * 4 + 1] = outline.g;
          d[i * 4 + 2] = outline.b;
          // Умножаем исходную альфу на прозрачность обводки
          d[i * 4 + 3] = Math.round(a * opts.outlineOpacity);
        } else {
          d[i * 4 + 3] = 0;
        }
      } else if (isFill[i]) {
        if (showFill) {
          d[i * 4] = fill.r;
          d[i * 4 + 1] = fill.g;
          d[i * 4 + 2] = fill.b;
          d[i * 4 + 3] = Math.round(a * opts.fillOpacity);
        } else {
          d[i * 4 + 3] = 0;
        }
      }
    }

    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('recolorImage error:', err);
    return null;
  }
}

// =====================================================
// === Публичный API ===
// =====================================================

function buildKey(iconHref: string, opts: RecolorOptions): string {
  return (
    iconHref +
    '|' +
    opts.fillColor +
    '|' +
    opts.fillOpacity.toFixed(2) +
    '|' +
    (opts.showFill ? '1' : '0') +
    '|' +
    opts.outlineColor +
    '|' +
    opts.outlineOpacity.toFixed(2) +
    '|' +
    (opts.showOutline ? '1' : '0') +
    '|' +
    opts.outlineWidth.toFixed(2)
  );
}

export function getStyledIconDataUrl(
  iconHref: string,
  opts: RecolorOptions
): string | null {
  if (!iconHref) return null;

  const key = buildKey(iconHref, opts);
  const cached = styledIconCache.get(key);
  if (cached) return cached;

  const img = iconImageCache.get(iconHref);
  if (img) {
    const result = recolorImage(img, opts);
    if (result) {
      styledIconCache.set(key, result);
      return result;
    }
    styledIconCache.set(key, '');
    return null;
  }

  // Запускаем фоновую загрузку
  loadIconImage(iconHref).then(function (loaded) {
    if (!loaded) return;
    const result = recolorImage(loaded, opts);
    if (result) {
      styledIconCache.set(key, result);
      notifyIconUpdate();
    } else {
      styledIconCache.set(key, '');
    }
  });

  return null;
}

export function preloadIcon(
  iconHref: string
): Promise<HTMLImageElement | null> {
  return loadIconImage(iconHref);
}

export function clearStyledIconCache(): void {
  styledIconCache.clear();
}