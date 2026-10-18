// =====================================================
// src/services/file/dialogs.ts
// Обёртки над Tauri-диалогами + диагностика
// =====================================================

import { open, save } from '@tauri-apps/plugin-dialog';

// -----------------------------------------------------
// Детекция Tauri
// -----------------------------------------------------
export function isTauriAvailable(): boolean {
  try {
    // В Tauri window.__TAURI_INTERNALS__ существует,
    // в браузере его нет. Это надёжный признак.
    const anyWin = window as any;
    return !!(anyWin.__TAURI_INTERNALS__ || anyWin.__TAURI__);
  } catch (e) {
    return false;
  }
}

function warnNotTauri(action: string): void {
  const msg =
    'PoiskHelper: файловые диалоги недоступны в браузере. ' +
    'Для импорта/экспорта запустите приложение через "npm run tauri dev" ' +
    '(или собранный .exe). Действие: ' + action;
  console.warn(msg);
}

// -----------------------------------------------------
// Открытие файла
// -----------------------------------------------------
export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface OpenOptions {
  title?: string;
  multiple?: boolean;
  directory?: boolean;
  filters?: FileFilter[];
}

export async function openFileDialog(
  options: OpenOptions = {}
): Promise<string | null> {
  try {
    console.log(
      '[dialogs] openFileDialog:',
      options.title || '(без title)',
      'filters:',
      (options.filters || []).map((f) => f.extensions.join('/')).join(', ')
    );

    if (!isTauriAvailable()) {
      warnNotTauri('открытие файла');
      return null;
    }

    const path = (await open({
      title: options.title || 'Открыть файл',
      multiple: options.multiple ?? false,
      directory: options.directory ?? false,
      filters: options.filters,
    })) as string | string[] | null;

    console.log('[dialogs] openFileDialog → результат:', path);

    if (!path) return null;
    if (Array.isArray(path)) return path[0] || null;
    return path;
  } catch (err) {
    console.error('[dialogs] openFileDialog error:', err);
    return null;
  }
}

export async function openMultipleFiles(
  options: OpenOptions = {}
): Promise<string[]> {
  try {
    if (!isTauriAvailable()) {
      warnNotTauri('открытие нескольких файлов');
      return [];
    }

    const paths = (await open({
      title: options.title || 'Открыть файлы',
      multiple: true,
      directory: options.directory ?? false,
      filters: options.filters,
    })) as string | string[] | null;

    if (!paths) return [];
    if (Array.isArray(paths)) return paths;
    return [paths];
  } catch (err) {
    console.error('[dialogs] openMultipleFiles error:', err);
    return [];
  }
}

export async function pickDirectory(title?: string): Promise<string | null> {
  try {
    if (!isTauriAvailable()) {
      warnNotTauri('выбор папки');
      return null;
    }

    const path = (await open({
      title: title || 'Выберите папку',
      multiple: false,
      directory: true,
    })) as string | null;

    return path;
  } catch (err) {
    console.error('[dialogs] pickDirectory error:', err);
    return null;
  }
}

// -----------------------------------------------------
// Сохранение файла
// -----------------------------------------------------
export interface SaveOptions {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
}

export async function saveFileDialog(
  options: SaveOptions = {}
): Promise<string | null> {
  try {
    if (!isTauriAvailable()) {
      warnNotTauri('сохранение файла');
      return null;
    }

    const path = (await save({
      title: options.title || 'Сохранить файл',
      defaultPath: options.defaultPath,
      filters: options.filters,
    })) as string | null;

    return path;
  } catch (err) {
    console.error('[dialogs] saveFileDialog error:', err);
    return null;
  }
}