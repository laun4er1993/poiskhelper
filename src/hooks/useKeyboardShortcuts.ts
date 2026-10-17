// =====================================================
// src/hooks/useKeyboardShortcuts.ts
// Глобальные горячие клавиши приложения
// =====================================================

import { useEffect } from 'react';

export interface KeyboardShortcutsParams {
  onSave: () => void;
  onSaveAs?: () => void;
  onOpen: () => void;
  onNew: () => void;
  onCopy?: (ids: string[]) => void;
  onCut?: (ids: string[]) => void;
  onPaste?: (targetFolderId: string) => void;
  onSelectAll: () => void;
  onToggleLogs: () => void;
  onDelete?: () => void;
  onEscape?: () => void;

  selectedIds: string[];
  activeFolderId: string;
  clipboardEmpty: boolean;

  enabled?: boolean;
}

// -----------------------------------------------------
// Проверка: внутри ли элемента фокус в input / textarea
// -----------------------------------------------------
function isEditingElement(active: Element | null): boolean {
  if (!active) return false;
  const tag = active.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((active as HTMLElement).isContentEditable) return true;
  return false;
}

// -----------------------------------------------------
// Проверка: внутри ли элемента диалог/модалка
// -----------------------------------------------------
function isInsideDialog(active: Element | null): boolean {
  if (!active) return false;
  let current: Element | null = active;
  while (current) {
    const role = current.getAttribute('role');
    if (role === 'dialog' || role === 'alertdialog') return true;
    current = current.parentElement;
  }
  return false;
}

export function useKeyboardShortcuts(params: KeyboardShortcutsParams): void {
  const {
    onSave,
    onSaveAs,
    onOpen,
    onNew,
    onCopy,
    onCut,
    onPaste,
    onSelectAll,
    onToggleLogs,
    onDelete,
    onEscape,
    selectedIds,
    activeFolderId,
    clipboardEmpty,
    enabled = true,
  } = params;

  useEffect(
    function () {
      if (!enabled) return;

      const handler = function (e: KeyboardEvent) {
        const active = document.activeElement;
        const isInput = isEditingElement(active);
        const inDialog = isInsideDialog(active);

        const hasCtrl = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        // === Esc ===
        // Срабатывает, если:
        //   - фокус НЕ в input/textarea, ИЛИ
        //   - фокус в input, но мы внутри модального диалога
        if (e.key === 'Escape') {
          if (!isInput || inDialog) {
            if (onEscape) onEscape();
          }
          return;
        }

        // === Ctrl+L — журнал (работает в т.ч. в полях ввода) ===
        if (hasCtrl && key === 'l') {
          e.preventDefault();
          onToggleLogs();
          return;
        }

        // Дальше — только вне полей ввода
        if (isInput) return;

        // === Ctrl+... ===
        if (hasCtrl) {
          if (e.shiftKey && key === 's') {
            e.preventDefault();
            if (onSaveAs) onSaveAs();
            return;
          }
          if (!e.shiftKey) {
            if (key === 's') {
              e.preventDefault();
              onSave();
              return;
            }
            if (key === 'o') {
              e.preventDefault();
              onOpen();
              return;
            }
            if (key === 'n') {
              e.preventDefault();
              onNew();
              return;
            }
            if (key === 'a') {
              e.preventDefault();
              onSelectAll();
              return;
            }
            if (key === 'c') {
              if (selectedIds.length > 0 && onCopy) {
                e.preventDefault();
                onCopy(selectedIds);
              }
              return;
            }
            if (key === 'x') {
              if (selectedIds.length > 0 && onCut) {
                e.preventDefault();
                onCut(selectedIds);
              }
              return;
            }
            if (key === 'v') {
              if (!clipboardEmpty && activeFolderId && onPaste) {
                e.preventDefault();
                onPaste(activeFolderId);
              }
              return;
            }
          }
          return;
        }

        // === Delete ===
        if (e.key === 'Delete' && selectedIds.length > 0 && onDelete) {
          e.preventDefault();
          onDelete();
          return;
        }
      };

      window.addEventListener('keydown', handler);
      return function () {
        window.removeEventListener('keydown', handler);
      };
    },
    [
      enabled,
      onSave,
      onSaveAs,
      onOpen,
      onNew,
      onCopy,
      onCut,
      onPaste,
      onSelectAll,
      onToggleLogs,
      onDelete,
      onEscape,
      selectedIds,
      activeFolderId,
      clipboardEmpty,
    ]
  );
}