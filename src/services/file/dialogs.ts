// =====================================================
// src/services/file/dialogs.ts
// Обёртки над Tauri-диалогами (открытие/сохранение файлов)
// =====================================================

import { open, save } from '@tauri-apps/plugin-dialog';

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

/**
 * Открывает нативный диалог выбора файла.
 * Возвращает путь или null, если пользователь отменил.
 */
export async function openFileDialog(
  options: OpenOptions = {}
): Promise<string | null> {
  try {
    const path = (await open({
      title: options.title || 'Открыть файл',
      multiple: options.multiple ?? false,
      directory: options.directory ?? false,
      filters: options.filters,
    })) as string | string[] | null;

    if (!path) return null;
    if (Array.isArray(path)) return path[0] || null;
    return path;
  } catch (err) {
    console.error('openFileDialog error:', err);
    return null;
  }
}

/**
 * Открывает диалог выбора нескольких файлов.
 */
export async function openMultipleFiles(
  options: OpenOptions = {}
): Promise<string[]> {
  try {
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
    console.error('openMultipleFiles error:', err);
    return [];
  }
}

/**
 * Открывает диалог выбора папки.
 */
export async function pickDirectory(
  title?: string
): Promise<string | null> {
  try {
    const path = (await open({
      title: title || 'Выберите папку',
      multiple: false,
      directory: true,
    })) as string | null;
    return path;
  } catch (err) {
    console.error('pickDirectory error:', err);
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

/**
 * Открывает нативный диалог сохранения.
 * Возвращает путь или null, если пользователь отменил.
 */
export async function saveFileDialog(
  options: SaveOptions = {}
): Promise<string | null> {
  try {
    const path = (await save({
      title: options.title || 'Сохранить файл',
      defaultPath: options.defaultPath,
      filters: options.filters,
    })) as string | null;
    return path;
  } catch (err) {
    console.error('saveFileDialog error:', err);
    return null;
  }
}