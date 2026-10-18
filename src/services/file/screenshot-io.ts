// =====================================================
// src/services/file/screenshot-io.ts
// Сохранение скриншотов
// =====================================================

import { writeFile, mkdir } from '@tauri-apps/plugin-fs';
import { saveFileDialog } from './dialogs';

export type ScreenshotFormat = 'png' | 'jpg';

// -----------------------------------------------------
// Конвертация dataURL → Uint8Array
// -----------------------------------------------------
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) {
    throw new Error('dataUrlToUint8Array: неверный формат dataURL');
  }
  const base64 = dataUrl.substring(commaIdx + 1);
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// -----------------------------------------------------
// Имя файла с датой
// -----------------------------------------------------
export function buildScreenshotName(
  prefix?: string,
  format: ScreenshotFormat = 'png'
): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const p = (prefix || 'poiskhelper').replace(/[\\/:*?"<>|]/g, '_');
  const ext = format === 'jpg' ? 'jpg' : 'png';
  return (
    p + '-' + yyyy + '-' + mm + '-' + dd + '-' + hh + '-' + mi + '-' + ss + '.' + ext
  );
}

// -----------------------------------------------------
// Склейка папки и имени файла
// -----------------------------------------------------
function joinPath(dir: string, fileName: string): string {
  if (!dir) return fileName;
  const last = dir[dir.length - 1];
  if (last === '/' || last === '\\') return dir + fileName;
  const sep = dir.indexOf('\\') >= 0 ? '\\' : '/';
  return dir + sep + fileName;
}

// -----------------------------------------------------
// Сохранение скриншота
// -----------------------------------------------------
export interface SaveScreenshotOptions {
  autoSaveDir?: string | null;
  prefixName?: string;
  format?: ScreenshotFormat;
}

export async function saveScreenshot(
  dataUrl: string,
  options: SaveScreenshotOptions = {}
): Promise<string | null> {
  try {
    if (!dataUrl) throw new Error('saveScreenshot: пустой dataURL');

    const autoSaveDir = options.autoSaveDir || null;
    const prefixName = options.prefixName || 'poiskhelper';
    const format: ScreenshotFormat = options.format || 'png';
    const bytes = dataUrlToUint8Array(dataUrl);

    // === Автосохранение ===
    if (autoSaveDir) {
      try {
        await mkdir(autoSaveDir, { recursive: true });
      } catch (e) {
        // mkdir может кинуть, если папка уже есть — игнорируем
      }

      const fileName = buildScreenshotName(prefixName, format);
      const fullPath = joinPath(autoSaveDir, fileName);

      await writeFile(fullPath, bytes);
      console.log('saveScreenshot: сохранено в', fullPath);
      return fullPath;
    }

    // === Диалог сохранения ===
    const defaultName = buildScreenshotName(prefixName, format);
    const path = await saveFileDialog({
      title: 'Сохранить скриншот',
      defaultPath: defaultName,
      filters: [
        { name: 'PNG (без потерь)', extensions: ['png'] },
        { name: 'JPG', extensions: ['jpg', 'jpeg'] },
        { name: 'Все файлы', extensions: ['*'] },
      ],
    });

    if (!path) return null;

    await writeFile(path, bytes);
    return path;
  } catch (err) {
    console.error('saveScreenshot error:', err);
    throw err;
  }
}

// -----------------------------------------------------
// Работа с папками
// -----------------------------------------------------
export async function ensureDirectory(path: string): Promise<boolean> {
  try {
    await mkdir(path, { recursive: true });
    return true;
  } catch (e) {
    return true;
  }
}