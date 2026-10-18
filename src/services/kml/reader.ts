// =====================================================
// src/services/kml/reader.ts
// Чтение KML/KMZ с проверками размера
// =====================================================

import JSZip from 'jszip';

// ⚡ Лимит на распакованный KML. DOMParser держит DOM в 3-5× размера текста,
//   и для 800 МБ KML это уже 2.4-4 ГБ RAM — верхняя граница для WebView2.
const MAX_KML_SIZE = 800 * 1024 * 1024; // 800 МБ
const MAX_KMZ_SIZE = 1500 * 1024 * 1024; // 1.5 ГБ (совпадает с kml-io)

const MAX_NAMESPACE_FIX_SIZE = 10 * 1024 * 1024;
const MAX_ERROR_SAMPLE_LENGTH = 500;

function formatMb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1) + ' МБ';
}

// -----------------------------------------------------
// Декодирование байтов в строку
// -----------------------------------------------------
export function decodeBytes(bytes: Uint8Array): string {
  if (!bytes || bytes.length === 0) return '';

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3));
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.subarray(2));
  }

  let text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  const checkLimit = Math.min(text.length, 50000);
  let replacementCount = 0;
  let searchIdx = 0;
  while (searchIdx < checkLimit) {
    const pos = text.indexOf('\uFFFD', searchIdx);
    if (pos < 0) break;
    replacementCount++;
    searchIdx = pos + 1;
    if (replacementCount > 20) break;
  }

  if (replacementCount > 3) {
    try {
      const win1251 = new TextDecoder('windows-1251', {
        fatal: false,
      }).decode(bytes);
      const winCheckLimit = Math.min(win1251.length, 50000);
      let winReplacements = 0;
      let winIdx = 0;
      while (winIdx < winCheckLimit) {
        const pos = win1251.indexOf('\uFFFD', winIdx);
        if (pos < 0) break;
        winReplacements++;
        winIdx = pos + 1;
        if (winReplacements > 20) break;
      }
      if (winReplacements < replacementCount) {
        console.log(
          'decodeBytes: использована Windows-1251 (replacement ' +
            replacementCount +
            ' → ' +
            winReplacements +
            ')'
        );
        text = win1251;
      }
    } catch (e) {
      console.warn('decodeBytes: Windows-1251 не сработал');
    }
  }

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return text;
}

// -----------------------------------------------------
// Фикс namespace
// -----------------------------------------------------
function fixUndeclaredNamespaces(text: string): string {
  if (!text) return text;

  if (text.length > MAX_NAMESPACE_FIX_SIZE) {
    console.log(
      'fixUndeclaredNamespaces: пропущено (документ ' +
        formatMb(text.length) +
        ' > ' +
        formatMb(MAX_NAMESPACE_FIX_SIZE) +
        ')'
    );
    return text;
  }

  const declared = new Set<string>();
  const declRe = /xmlns:([A-Za-z_][\w\-]*)\s*=/g;
  let m: RegExpExecArray | null;
  while ((m = declRe.exec(text)) !== null) {
    declared.add(m[1]);
  }

  const used = new Set<string>();
  const useRe = /(?:(<\/?)|(\s))([A-Za-z_][\w\-]*):(?=[\w\-])/g;
  while ((m = useRe.exec(text)) !== null) {
    used.add(m[3]);
  }

  const missing: string[] = [];
  used.forEach(function (p) {
    if (p === 'xml' || p === 'xmlns') return;
    if (!declared.has(p)) missing.push(p);
  });

  if (missing.length === 0) return text;

  console.log(
    'fixUndeclaredNamespaces: ДОБАВЛЯЮ объявления для',
    missing.join(', ')
  );

  const kmlOpenMatch = text.match(/<kml\b[^>]*>/i);
  if (!kmlOpenMatch) {
    console.warn(
      'fixUndeclaredNamespaces: тег <kml> не найден'
    );
    return text;
  }

  const kmlTag = kmlOpenMatch[0];
  const decls = missing
    .map(function (p) {
      return ' xmlns:' + p + '="urn:auto:ns:' + p + '"';
    })
    .join('');
  const newKmlTag = kmlTag.replace(/\s*>$/, decls + '>');

  const idx = text.indexOf(kmlTag);
  if (idx < 0) return text;

  return text.slice(0, idx) + newKmlTag + text.slice(idx + kmlTag.length);
}

// -----------------------------------------------------
// Парсинг текста в DOM
// -----------------------------------------------------
interface ParseResult {
  doc: Document;
  fixedText: string;
}

function parseToDocument(text: string): ParseResult {
  const fixedText = fixUndeclaredNamespaces(text);

  const parser = new DOMParser();
  const doc = parser.parseFromString(fixedText, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    const errText = parseError.textContent || 'неизвестная ошибка XML';
    console.error('parseToDocument: XML невалиден!');
    console.error(
      'parseToDocument: первые ' +
        MAX_ERROR_SAMPLE_LENGTH +
        ' символов:\n' +
        fixedText.slice(0, MAX_ERROR_SAMPLE_LENGTH)
    );
    console.error(
      'parseToDocument: ошибка:',
      errText.slice(0, MAX_ERROR_SAMPLE_LENGTH)
    );
    throw new Error('XML невалиден: ' + errText.slice(0, 300));
  }

  const root = doc.documentElement;
  if (!root) {
    throw new Error('XML не имеет корневого элемента');
  }

  return { doc: doc, fixedText: fixedText };
}

// -----------------------------------------------------
// Результат чтения
// -----------------------------------------------------
export interface ReadKmlResult {
  kmlDocument: Document;
  text: string;
  sourceFormat: 'kml' | 'kmz';
  innerFileName: string;
  subFiles: string[];
}

// -----------------------------------------------------
// Публичный API
// -----------------------------------------------------
export async function readKmlDocument(
  bytes: Uint8Array,
  ext: string
): Promise<ReadKmlResult> {
  if (ext === 'kmz') {
    console.log(
      'readKmlDocument: KMZ, размер ' + formatMb(bytes.length)
    );

    if (bytes.length > MAX_KMZ_SIZE) {
      throw new Error(
        'KMZ больше ' +
          formatMb(MAX_KMZ_SIZE) +
          ' (' +
          formatMb(bytes.length) +
          '). Такой объём нельзя распаковать в памяти браузера. ' +
          'Распакуйте архив вручную (7-Zip / WinRAR), возьмите doc.kml ' +
          'и попробуйте импортировать KML — но учтите, что распакованный ' +
          'KML тоже может не влезть в память.'
      );
    }

    const zip = await JSZip.loadAsync(bytes);

    let docPath: string | null = null;
    const allFiles: string[] = [];

    for (const name of Object.keys(zip.files)) {
      const lower = name.toLowerCase();
      if (lower.startsWith('__macosx') || lower.endsWith('/')) continue;
      allFiles.push(name);
      if (lower.endsWith('.kml')) {
        if (lower === 'doc.kml' || docPath === null) {
          docPath = name;
          if (lower === 'doc.kml') break;
        }
      }
    }

    console.log('readKmlDocument: файлов в KMZ =', allFiles.length);

    if (!docPath) {
      throw new Error(
        'В KMZ не найден .kml. Содержимое: ' +
          allFiles.slice(0, 20).join(', ')
      );
    }

    // ⚡ Проверяем размер до распаковки в память
    let docSizeBytes = 0;
    try {
      const entry = zip.file(docPath);
      if (entry) {
        // JSZip хранит размер в _data.uncompressedSize, если загружали с metadata
        const anyEntry = entry as any;
        if (
          anyEntry._data &&
          typeof anyEntry._data.uncompressedSize === 'number'
        ) {
          docSizeBytes = anyEntry._data.uncompressedSize;
        }
      }
    } catch (e) {}

    if (docSizeBytes > MAX_KML_SIZE) {
      throw new Error(
        'Внутри KMZ файл ' +
          docPath +
          ' размером ' +
          formatMb(docSizeBytes) +
          ' — больше лимита ' +
          formatMb(MAX_KML_SIZE) +
          '. Разбейте на части или используйте KML-файл с меньшим числом объектов.'
      );
    }

    const docBytes = await zip.file(docPath)!.async('uint8array');
    const docMb = docBytes.length / 1024 / 1024;
    console.log(
      'readKmlDocument: doc.kml распакован, размер ' + formatMb(docBytes.length)
    );

    if (docBytes.length > MAX_KML_SIZE) {
      throw new Error(
        'Распакованный ' +
          docPath +
          ' (' +
          formatMb(docBytes.length) +
          ') больше лимита ' +
          formatMb(MAX_KML_SIZE) +
          '. Импорт прерван, чтобы не упасть по OOM.'
      );
    }

    if (docMb > 200) {
      console.warn(
        'readKmlDocument: doc.kml ' +
          formatMb(docBytes.length) +
          '. DOMParser загрузит DOM в память (≈3× размер текста). ' +
          'Возможна нехватка ОЗУ.'
      );
    }

    const text = decodeBytes(docBytes);
    console.log(
      'readKmlDocument: длина текста =',
      text.length,
      'символов'
    );

    const { doc: kmlDocument, fixedText } = parseToDocument(text);

    return {
      kmlDocument: kmlDocument,
      text: fixedText,
      sourceFormat: 'kmz',
      innerFileName: docPath,
      subFiles: allFiles,
    };
  } else {
    console.log(
      'readKmlDocument: KML, размер ' + formatMb(bytes.length)
    );

    if (bytes.length > MAX_KML_SIZE) {
      throw new Error(
        'KML больше ' +
          formatMb(MAX_KML_SIZE) +
          ' (' +
          formatMb(bytes.length) +
          '). DOMParser не сможет загрузить DOM такого размера. ' +
          'Разбейте файл на несколько KML или уменьшите число объектов.'
      );
    }

    const text = decodeBytes(bytes);
    console.log(
      'readKmlDocument: длина текста =',
      text.length,
      'символов'
    );

    const { doc: kmlDocument, fixedText } = parseToDocument(text);

    return {
      kmlDocument: kmlDocument,
      text: fixedText,
      sourceFormat: 'kml',
      innerFileName: '',
      subFiles: [],
    };
  }
}