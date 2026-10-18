// =====================================================
// src/services/file/kml-io.ts
// Импорт KML/KMZ с прогрессом, лимитами памяти и watchdog
// =====================================================

import {
  open as fsOpen,
  writeFile as fsWriteFile,
  writeTextFile as fsWriteTextFile,
} from '@tauri-apps/plugin-fs';
import { openFileDialog, saveFileDialog, isTauriAvailable } from './dialogs';

// -----------------------------------------------------
// Константы
// -----------------------------------------------------
const CHUNK_SIZE = 4 * 1024 * 1024; // 4 МБ
const STEP_TIMEOUT_MS = 60000;
const LOCK_STALE_MS = 180000;

// ⚡ Жёсткий предел на размер файла. Выше — JS-движок не выделит
//   ArrayBuffer, а следующий шаг (JSZip + DOMParser) съест ещё
//   3-5× от этого размера.
const MAX_MEMORY_BYTES = 1500 * 1024 * 1024; // 1.5 ГБ

const CONFIRM_THRESHOLDS_BYTES: number[] = [
  128 * 1024 * 1024,
  512 * 1024 * 1024,
  1024 * 1024 * 1024,
];

const STALL_WARNING_MS = 8000;

export interface OpenFileResult {
  path: string;
  name: string;
  data: Uint8Array;
  extension: string;
  sizeBytes: number;
}

export interface OpenFileProgress {
  loadedBytes: number;
  totalBytes: number | null;
  chunkCount: number;
  elapsedMs: number;
  stalled: boolean;
}

export interface OpenFileOptions {
  onProgress?: (progress: OpenFileProgress) => void;
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '';
  return name.substring(idx + 1).toLowerCase();
}

function formatMb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1) + ' МБ';
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise<T>(function (resolve, reject) {
    let settled = false;
    const t = setTimeout(function () {
      if (settled) return;
      settled = true;
      reject(
        new Error(
          'Операция "' +
            label +
            '" зависла (таймаут ' +
            Math.round(ms / 1000) +
            ' с).'
        )
      );
    }, ms);

    promise.then(
      function (v) {
        if (settled) return;
        settled = true;
        clearTimeout(t);
        resolve(v);
      },
      function (e) {
        if (settled) return;
        settled = true;
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

let importLocked = false;
let importLockTimestamp = 0;

function acquireImportLock(): boolean {
  if (importLocked) {
    const elapsed = Date.now() - importLockTimestamp;
    if (elapsed < LOCK_STALE_MS) {
      const sec = Math.round(elapsed / 1000);
      console.warn(
        '[kml-io] lock уже удерживается, прошло ' + sec + ' с'
      );
      alert(
        'Импорт уже идёт (' +
          sec +
          ' с). Подождите ' +
          Math.ceil((LOCK_STALE_MS - elapsed) / 1000) +
          ' с или перезагрузите приложение (Ctrl+R).'
      );
      return false;
    }
    console.warn(
      '[kml-io] снимаю зависший lock (прошло ' +
        Math.round(elapsed / 1000) +
        ' с)'
    );
    importLocked = false;
  }
  importLocked = true;
  importLockTimestamp = Date.now();
  return true;
}

function releaseImportLock(): void {
  importLocked = false;
  importLockTimestamp = 0;
}

// -----------------------------------------------------
// Чтение файла чанками БЕЗ fstat + Blob-склейка
// -----------------------------------------------------
async function readFileWithWatchdog(
  path: string,
  options: OpenFileOptions = {}
): Promise<Uint8Array> {
  const startAt = Date.now();
  console.log('[kml-io] open(): старт');

  const file = await withTimeout(
    fsOpen(path, { read: true }),
    STEP_TIMEOUT_MS,
    'open'
  );
  console.log('[kml-io] open(): OK');

  try {
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    let chunkCount = 0;
    let lastChunkAt = Date.now();
    let nextConfirmIdx = 0;

    const progressTimer = window.setInterval(function () {
      if (!options.onProgress) return;
      const sinceLastChunk = Date.now() - lastChunkAt;
      options.onProgress({
        loadedBytes: totalBytes,
        totalBytes: null,
        chunkCount: chunkCount,
        elapsedMs: Date.now() - startAt,
        stalled: sinceLastChunk > STALL_WARNING_MS,
      });
    }, 1000);

    try {
      console.log(
        '[kml-io] read(): старт, чанк = ' +
          CHUNK_SIZE / 1024 / 1024 +
          ' МБ'
      );

      while (true) {
        const buffer = new Uint8Array(CHUNK_SIZE);
        const read = await withTimeout(
          file.read(buffer),
          STEP_TIMEOUT_MS,
          'read (chunk ' + (chunkCount + 1) + ')'
        );
        lastChunkAt = Date.now();

        if (read === null || read === undefined || read === 0) {
          break;
        }

        const actual = buffer.subarray(0, read);
        chunks.push(actual);
        totalBytes += read;
        chunkCount++;

        if (options.onProgress) {
          options.onProgress({
            loadedBytes: totalBytes,
            totalBytes: null,
            chunkCount: chunkCount,
            elapsedMs: Date.now() - startAt,
            stalled: false,
          });
        }

        if (chunkCount % 4 === 0 || read < CHUNK_SIZE) {
          console.log(
            '[kml-io] read(): ' +
              formatMb(totalBytes) +
              ' прочитано (чанков: ' +
              chunkCount +
              ')'
          );
        }

        // ⚡ Лимит размера — прерываем ДО выделения финального буфера
        if (totalBytes > MAX_MEMORY_BYTES) {
          throw new Error(
            'Файл больше ' +
              formatMb(MAX_MEMORY_BYTES) +
              ' (' +
              formatMb(totalBytes) +
              '). Такой объём нельзя загрузить в память браузера — ' +
              'выделение одного ArrayBuffer такого размера падает с RangeError. ' +
              'Разбейте файл на части или импортируйте KML после ручной ' +
              'распаковки (не KMZ).'
          );
        }

        // ⚡ Порог подтверждения
        if (
          nextConfirmIdx < CONFIRM_THRESHOLDS_BYTES.length &&
          totalBytes >= CONFIRM_THRESHOLDS_BYTES[nextConfirmIdx]
        ) {
          const mb = Math.round(totalBytes / 1024 / 1024);
          const ok = window.confirm(
            'Прочитано уже ' +
              mb +
              ' МБ.\n\n' +
              'Продолжить импорт?\n\n' +
              '⚠️ Большие файлы читаются и парсятся долго. ' +
              'Не закрывайте окно.'
          );
          if (!ok) {
            throw new Error(
              'Импорт отменён пользователем на ' + mb + ' МБ'
            );
          }
          nextConfirmIdx++;
        }

        if (read < CHUNK_SIZE) {
          break;
        }
      }
    } finally {
      window.clearInterval(progressTimer);
    }

    console.log(
      '[kml-io] read(): завершено, ' +
        totalBytes +
        ' байт за ' +
        chunkCount +
        ' чанков'
    );

    if (totalBytes === 0) {
      throw new Error('Файл пустой (0 байт).');
    }

    // ⚡ Blob-склейка вместо new Uint8Array(totalBytes).
    //   Blob может быть >2 ГБ (в отличие от ArrayBuffer) и
    //   аллоцируется эффективнее по памяти.
    console.log('[kml-io] склейка через Blob…');
    let result: Uint8Array;
    try {
      const blob = new Blob(chunks as BlobPart[]);
      const arrayBuf = await blob.arrayBuffer();
      result = new Uint8Array(arrayBuf);
    } catch (blobErr) {
      console.warn(
        '[kml-io] Blob.arrayBuffer() упал, пробую новый Uint8Array:',
        blobErr
      );
      // Fallback — прямая аллокация (сработает для <1.5 ГБ)
      const fallback = new Uint8Array(totalBytes);
      let off = 0;
      for (let i = 0; i < chunks.length; i++) {
        fallback.set(chunks[i], off);
        off += chunks[i].length;
      }
      result = fallback;
    }

    console.log(
      '[kml-io] склейка готова, размер ' + formatMb(result.length)
    );

    return result;
  } finally {
    console.log('[kml-io] close(): старт');
    try {
      await withTimeout(file.close(), 5000, 'close');
      console.log('[kml-io] close(): OK');
    } catch (e) {
      console.warn('[kml-io] close() упал/завис (игнорируем):', e);
    }
  }
}

// -----------------------------------------------------
// Публичный API
// -----------------------------------------------------
export async function openKmlFile(
  options: OpenFileOptions = {}
): Promise<OpenFileResult | null> {
  console.log('[kml-io] openKmlFile: старт');

  if (!isTauriAvailable()) {
    const msg =
      'Импорт файлов доступен только в десктоп-версии PoiskHelper. ' +
      'Вы сейчас в браузере — запустите "npm run tauri dev".';
    console.error('[kml-io]', msg);
    alert(msg);
    return null;
  }

  if (!acquireImportLock()) {
    return null;
  }

  try {
    const path = await openFileDialog({
      title: 'Импорт KML / KMZ',
      multiple: false,
      directory: false,
      filters: [
        { name: 'KML/KMZ', extensions: ['kml', 'kmz'] },
        { name: 'Все файлы', extensions: ['*'] },
      ],
    });

    console.log('[kml-io] openKmlFile: путь =', path);

    if (!path) {
      console.log('[kml-io] openKmlFile: диалог закрыт/отменён');
      return null;
    }

    const name = path.split(/[\\/]/).pop() || 'file';
    const ext = getExtension(name);

    if (ext !== 'kml' && ext !== 'kmz') {
      alert(
        'Неподдерживаемый формат: .' +
          ext +
          '\n\nПоддерживаются: .kml, .kmz'
      );
      return null;
    }

    console.log('[kml-io] openKmlFile: читаю файл', name, 'ext=', ext);
    const rawData = await readFileWithWatchdog(path, options);
    const sizeBytes = rawData.length;

    console.log(
      '[kml-io] openKmlFile: файл прочитан, ' + formatMb(sizeBytes)
    );

    return {
      path,
      name,
      data: rawData,
      extension: ext,
      sizeBytes,
    };
  } catch (err) {
    console.error('[kml-io] openKmlFile error:', err);
    const errMsg = (err as Error)?.message || 'причина неизвестна';
    alert('Не удалось прочитать файл:\n' + errMsg);
    return null;
  } finally {
    releaseImportLock();
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
    if (!isTauriAvailable()) {
      const msg =
        'Экспорт доступен только в десктоп-версии PoiskHelper. ' +
        'Запустите через "npm run tauri dev".';
      console.error('[kml-io]', msg);
      alert(msg);
      return null;
    }

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
      await fsWriteFile(path, kmzBytes);
    } else if (ext === 'kml') {
      if (!kmlText) throw new Error('KML данные недоступны');
      await fsWriteTextFile(path, kmlText);
    } else {
      const msg =
        'Расширение "' +
        ext +
        '" не поддерживается.\n\nСохранить как KMZ (сжатый)?';
      if (!window.confirm(msg)) return null;
      if (!kmzBytes) throw new Error('KMZ данные недоступны');
      await fsWriteFile(path, kmzBytes);
    }

    return path;
  } catch (err) {
    console.error('[kml-io] saveKmlOrKmz error:', err);
    throw err;
  }
}