// =====================================================
// src/types/ids.ts
// Генерация ID и мелкие утилиты
// =====================================================

export function generateId(prefix?: string): string {
  const p = prefix || 'item';
  return p + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

export function clamp(v: number, min: number, max: number): number {
  if (!isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

export function hexToRgba(hex: string, alpha: number): string {
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
  const ri = parseInt(r, 16);
  const gi = parseInt(g, 16);
  const bi = parseInt(b, 16);
  const a = Math.max(0, Math.min(1, alpha));
  return (
    'rgba(' +
    (isNaN(ri) ? 0 : ri) + ', ' +
    (isNaN(gi) ? 0 : gi) + ', ' +
    (isNaN(bi) ? 0 : bi) + ', ' +
    a + ')'
  );
}

export function isHexColor(s: string): boolean {
  if (!s) return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s.trim());
}