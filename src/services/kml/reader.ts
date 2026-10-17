// =====================================================
// src/services/kml/reader.ts
// Чтение KML/KMZ, декодирование, фикс namespace
// =====================================================

import JSZip from 'jszip';

// =====================================================
// === Декодирование байтов в строку ===
// =====================================================
export function decodeBytes(bytes: Uint8Array): string {
  if (!bytes || bytes.length === 0) return '';

  // BOM UTF-8
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    return new TextDecoder('utf-8').decode(bytes.slice(3));
  }
  // BOM UTF-16 LE
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.slice(2));
  }
  // BOM UTF-16 BE
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.slice(2));
  }

  // Пробуем UTF-8
  let text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  const threshold = Math.max(3, text.length * 0.001);

  if (replacementCount > threshold) {
    try {
      text = new TextDecoder('windows-1251', { fatal: false }).decode(bytes);
      console.log('decodeBytes: использована Windows-1251');
    } catch (e) {
      console.warn('decodeBytes: Windows-1251 не сработал');
    }
  }

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return text;
}

// =====================================================
// === Фикс "грязных" KML: дописываем недостающие xmlns:pfx ===
// =====================================================
/**
 * Находит префиксы, которые используются в тегах и атрибутах,
 * но не объявлены через xmlns:pfx, и дописывает их в <kml ...>.
 *
 * Идемпотентна: повторный вызов не добавит дубликаты.
 */
function fixUndeclaredNamespaces(text: string): string {
  if (!text) return text;

  // 1) Собираем объявленные префиксы
  const declared = new Set<string>();
  const declRe = /xmlns:([A-Za-z_][\w\-]*)\s*=/g;
  let m: RegExpExecArray | null;
  while ((m = declRe.exec(text)) !== null) {
    declared.add(m[1]);
  }

  // 2) Собираем используемые префиксы (в тегах и атрибутах)
  const used = new Set<string>();
  const useRe = /(?:(<\/?)|(\s))([A-Za-z_][\w\-]*):(?=[\w\-])/g;
  while ((m = useRe.exec(text)) !== null) {
    used.add(m[3]);
  }

  // 3) Вычисляем недостающие
  const missing: string[] = [];
  used.forEach(function (p) {
    if (p === 'xml' || p === 'xmlns') return;
    if (!declared.has(p)) missing.push(p);
  });

  if (missing.length === 0) {
    console.log(
      'fixUndeclaredNamespaces: все префиксы объявлены (' +
        (Array.from(declared).join(', ') || 'нет') +
        ')'
    );
    return text;
  }

  console.log(
    'fixUndeclaredNamespaces: объявлено =',
    Array.from(declared).join(', ') || '(нет)'
  );
  console.log(
    'fixUndeclaredNamespaces: используется =',
    Array.from(used).join(', ')
  );
  console.log(
    'fixUndeclaredNamespaces: ДОБАВЛЯЮ объявления для =',
    missing.join(', ')
  );

  // 4) Инжектим недостающие объявления в <kml ...>
  const kmlOpenMatch = text.match(/<kml\b[^>]*>/i);
  if (!kmlOpenMatch) {
    console.warn(
      'fixUndeclaredNamespaces: тег <kml> не найден, оставляю как есть'
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

// =====================================================
// === Парсинг текста в DOM ===
// =====================================================
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
    console.error('parseToDocument: первые 500 символов:');
    console.error(fixedText.slice(0, 500));
    console.error('parseToDocument: ошибка:', errText.slice(0, 500));
    throw new Error('XML невалиден: ' + errText.slice(0, 300));
  }

  const root = doc.documentElement;
  if (!root) {
    throw new Error('XML не имеет корневого элемента');
  }

  const rootName = root.nodeName.toLowerCase();
  const placemarks = doc.getElementsByTagName('Placemark').length;
  const folders = doc.getElementsByTagName('Folder').length;
  console.log(
    'parseToDocument: корень =',
    rootName,
    ', Placemark =',
    placemarks,
    ', Folder =',
    folders
  );

  return { doc: doc, fixedText: fixedText };
}

// =====================================================
// === Результат чтения KML/KMZ ===
// =====================================================
export interface ReadKmlResult {
  kmlDocument: Document;
  text: string;
  sourceFormat: 'kml' | 'kmz';
  innerFileName: string;
  subFiles: string[];
}

// =====================================================
// === Публичный API ===
// =====================================================
export async function readKmlDocument(
  bytes: Uint8Array,
  ext: string
): Promise<ReadKmlResult> {
  if (ext === 'kmz') {
    console.log(
      'readKmlDocument: KMZ, размер',
      (bytes.length / 1024 / 1024).toFixed(2),
      'МБ'
    );

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
        'В KMZ не найден .kml. Содержимое: ' + allFiles.slice(0, 20).join(', ')
      );
    }

    const docBytes = await zip.file(docPath)!.async('uint8array');
    const docMb = docBytes.length / 1024 / 1024;
    console.log(
      'readKmlDocument: doc.kml распакован, размер',
      docMb.toFixed(2),
      'МБ'
    );

    if (docMb > 200) {
      console.warn(
        'readKmlDocument: doc.kml больше 200 МБ. ' +
          'Парсинг может занять несколько минут и много памяти.'
      );
    }

    const text = decodeBytes(docBytes);
    console.log('readKmlDocument: длина текста =', text.length, 'символов');

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
      'readKmlDocument: KML, размер',
      (bytes.length / 1024 / 1024).toFixed(2),
      'МБ'
    );

    const text = decodeBytes(bytes);
    console.log('readKmlDocument: длина текста =', text.length, 'символов');

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