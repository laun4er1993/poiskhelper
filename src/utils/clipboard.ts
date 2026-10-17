// =====================================================
// src/utils/clipboard.ts
// Утилиты для работы с буфером обмена
// =====================================================

/**
 * Универсальное копирование текста в буфер.
 * Сначала пробует нативный Clipboard API, при неудаче — fallback через
 * временный textarea + execCommand.
 *
 * Возвращает Promise<boolean> — успех/неудача.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Пытаемся через нативный API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Падаем в fallback
    }
  }

  return fallbackCopyText(text);
}

/**
 * Синхронный fallback через скрытый textarea + document.execCommand('copy').
 */
export function fallbackCopyText(text: string): boolean {
  if (!text) return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    console.warn('fallbackCopyText: не удалось скопировать', e);
    return false;
  }
}