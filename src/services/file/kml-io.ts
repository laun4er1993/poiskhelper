// =====================================================
// src/services/file/kml-io.ts
// Импорт/экспорт KML/KMZ через нативные диалоги
// =====================================================

import { readFile, writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { openFileDialog, saveFileDialog } from './dialogs';

const MAX_SAFE_SIZE = 200 * 1024 * 1024; // 200 МБ

export interface OpenFileResult {
  path: string;
  name: string;
  data: Uint8Array;
  extension: string;
  sizeBytes: number;
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '';
  return name.substring(idx + 1).toLowerCase();
}

export async function openKmlFile(): Promise<OpenFileResult | null> {
  try {
    const path = await openFileDialog({
      title: 'Импорт KML / KMZ / GeoJSON',
      multiple: false,
      directory: false,
      filters: [
        {
          name: 'KML/KMZ/GeoJSON',
          extensions: ['kml', 'kmz', 'geojson', 'json'],
        },
        { name: 'Все файлы', extensions: ['*'] },
      ],
    });
    if (!path) return null;

    const name = path.split(/[\\/]/).pop() || 'file';
    const ext = getExtension(name);
    const rawData = await readFile(path);
    const sizeBytes = rawData.length;

    console.log(
      'openKmlFile: файл',
      name,
      ', размер',
      (sizeBytes / 1024 / 1024).toFixed(2),
      'МБ',
      ', формат',
      ext
    );

    if (sizeBytes > MAX_SAFE_SIZE) {
      const sizeMb = (sizeBytes / 1024 / 1024).toFixed(1);
      console.warn(
        'openKmlFile: файл больше 200 МБ (' + sizeMb + ' МБ). Возможны проблемы.'
      );
    }

    return {
      path,
      name,
      data: rawData,
      extension: ext,
      sizeBytes,
    };
  } catch (err) {
    console.error('openKmlFile error:', err);
    throw err;
  }
}

// -----------------------------------------------------
// Экспорт
// -----------------------------------------------------
export interface SaveKmlOptions {
  defaultBaseName: string;
}

export async function saveKmlOrKmz(
  kmzBytes: Uint8Array | null,
  kmlText: string | null,
  defaultBaseName: string
): Promise<string | null> {
  try {
    const path = await saveFileDialog({
      title: 'Сохранить как',
      defaultPath: defaultBaseName + '.kmz',
      filters: [
        { name: 'KMZ (сжатый)', extensions: ['kmz'] },
        { name: 'KML', extensions: ['kml'] },
      ],
    });
    if (!path) return null;

    const ext = getExtension(path);

    if (ext === 'kmz') {
      if (!kmzBytes) throw new Error('KMZ данные недоступны');
      await writeFile(path, kmzBytes);
    } else if (ext === 'kml') {
      if (!kmlText) throw new Error('KML данные недоступны');
      await writeTextFile(path, kmlText);
    } else {
      // ⚡ Неизвестное расширение — вместо тихого KMZ спрашиваем
      const msg =
        'Расширение "' +
        ext +
        '" не поддерживается.\n\n' +
        'Сохранить как KMZ (сжатый)?';
      if (!window.confirm(msg)) return null;
      if (!kmzBytes) throw new Error('KMZ данные недоступны');
      await writeFile(path, kmzBytes);
    }

    return path;
  } catch (err) {
    console.error('saveKmlOrKmz error:', err);
    throw err;
  }
}