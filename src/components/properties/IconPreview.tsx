// =====================================================
// src/components/properties/IconPreview.tsx
// Превью иконки метки (учитывает заливку/обводку/прозрачности)
// =====================================================

import { useEffect, useState } from 'react';

// =====================================================
// === Пропсы ===
// =====================================================
interface IconPreviewProps {
  iconHref: string;
  sizePx: number;
  fillColor: string;
  fillOpacity?: number;
  showFill?: boolean;
  outlineColor: string;
  outlineOpacity?: number;
  showOutline?: boolean;
  outlineWidth?: number;
  title?: string;
}

// =====================================================
// === Утилиты ===
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

const BRIGHTNESS_THRESHOLD = 180;
const PREVIEW_SIZE = 64;

const previewCache: Map<string, string | null> = new Map();
const imageCache: Map<string, HTMLImageElement | null> = new Map();

interface RecolorOptions {
  fillColor: string;
  fillOpacity: number;
  showFill: boolean;
  outlineColor: string;
  outlineOpacity: number;
  showOutline: boolean;
  outlineWidth: number;
}

function recolorSync(
  img: HTMLImageElement,
  opts: RecolorOptions
): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = PREVIEW_SIZE;
    canvas.height = PREVIEW_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    let data: ImageData;
    try {
      data = ctx.getImageData(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    } catch (err) {
      return null;
    }

    const d = data.data;
    const total = PREVIEW_SIZE * PREVIEW_SIZE;
    const isOutline = new Uint8Array(total);
    const isFill = new Uint8Array(total);

    for (let i = 0; i < total; i++) {
      const a = d[i * 4 + 3];
      if (a < 10) continue;
      const r = d[i * 4];
      const g = d[i * 4 + 1];
      const b = d[i * 4 + 2];
      const brightness = (r + g + b) / 3;
      if (brightness > BRIGHTNESS_THRESHOLD) isFill[i] = 1;
      else isOutline[i] = 1;
    }

    // Дилатация контура (толщина)
    const scale = PREVIEW_SIZE / 32;
    const extra = Math.max(0, (opts.outlineWidth - 1) * scale);
    if (extra >= 1 && opts.showOutline) {
      const radius = Math.ceil(extra);
      const dilated = new Uint8Array(isOutline);
      for (let y = 0; y < PREVIEW_SIZE; y++) {
        for (let x = 0; x < PREVIEW_SIZE; x++) {
          const idx = y * PREVIEW_SIZE + x;
          if (isOutline[idx]) continue;
          if (!isFill[idx]) continue;
          let near = false;
          for (let dy = -radius; dy <= radius && !near; dy++) {
            const yy = y + dy;
            if (yy < 0 || yy >= PREVIEW_SIZE) continue;
            for (let dx = -radius; dx <= radius; dx++) {
              const xx = x + dx;
              if (xx < 0 || xx >= PREVIEW_SIZE) continue;
              if (isOutline[yy * PREVIEW_SIZE + xx]) {
                near = true;
                break;
              }
            }
          }
          if (near) {
            dilated[idx] = 1;
            isFill[idx] = 0;
          }
        }
      }
      for (let i = 0; i < total; i++) isOutline[i] = dilated[i];
    }

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
    return null;
  }
}

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

// =====================================================
// === Компонент ===
// =====================================================
function IconPreview({
  iconHref,
  sizePx,
  fillColor,
  fillOpacity = 1,
  showFill = true,
  outlineColor,
  outlineOpacity = 1,
  showOutline = true,
  outlineWidth = 1,
  title,
}: IconPreviewProps) {
  const [styledUrl, setStyledUrl] = useState<string | null>(null);

  const opts: RecolorOptions = {
    fillColor,
    fillOpacity,
    showFill,
    outlineColor,
    outlineOpacity,
    showOutline,
    outlineWidth,
  };

  useEffect(
    function () {
      if (!iconHref) {
        setStyledUrl(null);
        return;
      }

      const key = buildKey(iconHref, opts);
      if (previewCache.has(key)) {
        setStyledUrl(previewCache.get(key) || null);
        return;
      }

      const cachedImg = imageCache.get(iconHref);
      if (cachedImg) {
        const url = recolorSync(cachedImg, opts);
        previewCache.set(key, url);
        setStyledUrl(url);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        imageCache.set(iconHref, img);
        const url = recolorSync(img, opts);
        previewCache.set(key, url);
        setStyledUrl(url);
      };
      img.onerror = function () {
        imageCache.set(iconHref, null);
        previewCache.set(key, null);
        setStyledUrl(null);
      };
      img.src = iconHref;
      // eslint-disable-next-line
    },
    [
      iconHref,
      fillColor,
      fillOpacity,
      showFill,
      outlineColor,
      outlineOpacity,
      showOutline,
      outlineWidth,
    ]
  );

  // Без иконки — простой кружок
  if (!iconHref || iconHref.length === 0) {
    const fillPart = showFill && fillOpacity > 0.001 ? fillColor : 'transparent';
    const outlinePart =
      showOutline && outlineOpacity > 0.001 ? outlineColor : 'transparent';
    const borderPx = Math.max(1, Math.round(sizePx * 0.08));

    return (
      <span
        style={{
          width: sizePx,
          height: sizePx,
          borderRadius: '50%',
          backgroundColor: fillPart,
          border: borderPx + 'px solid ' + outlinePart,
          boxSizing: 'border-box',
          display: 'inline-block',
          flexShrink: 0,
        }}
        title={title}
      />
    );
  }

  if (styledUrl) {
    return (
      <img
        src={styledUrl}
        width={sizePx}
        height={sizePx}
        style={{
          display: 'inline-block',
          flexShrink: 0,
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        alt=""
        title={title}
        draggable={false}
      />
    );
  }

  // Fallback — кружок
  const fillPart = showFill && fillOpacity > 0.001 ? fillColor : 'transparent';
  const outlinePart =
    showOutline && outlineOpacity > 0.001 ? outlineColor : 'transparent';
  const borderPx = Math.max(1, Math.round(sizePx * 0.08));

  return (
    <span
      style={{
        width: sizePx,
        height: sizePx,
        borderRadius: '50%',
        backgroundColor: fillPart,
        border: borderPx + 'px solid ' + outlinePart,
        boxSizing: 'border-box',
        display: 'inline-block',
        flexShrink: 0,
        opacity: 0.65,
      }}
      title={title}
    />
  );
}

export default IconPreview;