// =====================================================
// src/services/kml/parser.ts
// Парсинг KML → дерево объектов
// + startCollapsed для папок
// =====================================================

import type {
  TreeItem,
  Place,
  KmlLine,
  KmlPolygon,
  Folder,
  KmlFile,
  MeasureItem,
  AltitudeMode,
} from '../../types/base';
import { MEASURE_RULERS } from '../../types/measure';

const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_NOTE_LENGTH = 500;

function genId(): string {
  return 'kml-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

function kmlColorToCss(kmlColor: string): { css: string; alpha: number } {
  if (!kmlColor || kmlColor.length < 8) return { css: '', alpha: 1 };
  const aa = kmlColor.substring(0, 2);
  const bb = kmlColor.substring(2, 4);
  const gg = kmlColor.substring(4, 6);
  const rr = kmlColor.substring(6, 8);
  const alpha = parseInt(aa, 16) / 255;
  return {
    css: '#' + rr + gg + bb,
    alpha: isNaN(alpha) ? 1 : alpha,
  };
}

function parseCoordinates(
  text: string
): Array<{ lat: number; lon: number; height: number }> {
  const result: Array<{ lat: number; lon: number; height: number }> = [];
  if (!text) return result;
  const chunks = text.trim().split(/\s+/);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    const parts = chunk.split(',');
    if (parts.length < 2) continue;
    const lon = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    const height = parts.length >= 3 ? parseFloat(parts[2]) : 0;
    if (isNaN(lon) || isNaN(lat)) continue;
    if (!isFinite(lon) || !isFinite(lat)) continue;
    result.push({
      lat,
      lon,
      height: isNaN(height) || !isFinite(height) ? 0 : height,
    });
  }
  return result;
}

function firstDirect(el: Element, tagName: string): Element | null {
  const lower = tagName.toLowerCase();
  for (let i = 0; i < el.children.length; i++) {
    const c = el.children[i];
    if (c.tagName.toLowerCase() === lower) return c;
  }
  return null;
}

function textOf(el: Element | null): string {
  if (!el) return '';
  return (el.textContent || '').trim();
}

function parseAltitudeMode(
  placemark: Element,
  geometryEl: Element | null
): AltitudeMode {
  let modeEl: Element | null = null;
  if (geometryEl) {
    modeEl = firstDirect(geometryEl, 'altitudeMode');
  }
  if (!modeEl) {
    modeEl = firstDirect(placemark, 'altitudeMode');
  }
  let modeText = textOf(modeEl).toLowerCase();

  if (!modeText) {
    const gxModeEl = firstDirect(placemark, 'gx:altitudeMode');
    if (gxModeEl) modeText = textOf(gxModeEl).toLowerCase();
  }

  if (modeText === 'absolute') return 'absolute';
  if (modeText === 'relativetoground') return 'relativeToGround';
  return 'clampToGround';
}

function parseGxTrack(
  el: Element
): Array<{ lat: number; lon: number; height: number }> {
  const coords = el.getElementsByTagNameNS('*', 'coord');
  const result: Array<{ lat: number; lon: number; height: number }> = [];
  for (let i = 0; i < coords.length; i++) {
    const text = (coords[i].textContent || '').trim();
    if (!text) continue;
    const parts = text.split(/\s+/);
    if (parts.length < 2) continue;
    const lon = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    const height = parts.length >= 3 ? parseFloat(parts[2]) : 0;
    if (isFinite(lon) && isFinite(lat)) {
      result.push({
        lat,
        lon,
        height: isFinite(height) ? height : 0,
      });
    }
  }
  return result;
}

function collectStyles(doc: Document): Record<string, Element> {
  const result: Record<string, Element> = {};

  const styles = doc.getElementsByTagName('Style');
  for (let i = 0; i < styles.length; i++) {
    const s = styles[i];
    const id = s.getAttribute('id');
    if (id) result['#' + id] = s;
  }

  const styleMaps = doc.getElementsByTagName('StyleMap');
  for (let i = 0; i < styleMaps.length; i++) {
    const sm = styleMaps[i];
    const id = sm.getAttribute('id');
    if (!id) continue;
    const pairs = sm.getElementsByTagName('Pair');
    for (let j = 0; j < pairs.length; j++) {
      const pair = pairs[j];
      const key = textOf(firstDirect(pair, 'key'));
      if (key === 'normal' || !key) {
        const url = textOf(firstDirect(pair, 'styleUrl'));
        if (url && result[url]) {
          result['#' + id] = result[url];
          break;
        }
      }
    }
  }

  return result;
}

interface ParsedStyle {
  color: string;
  opacity: number;
  width: number;
  fillColor: string;
  outlineColor: string;
  iconHref: string;
  pixelSize: number;
  pointOutlineColor: string;
  pointOutlineWidth: number;
}

function clampPixelSize(v: number): number {
  if (!isFinite(v)) return 6;
  if (v < 4) return 4;
  if (v > 24) return 24;
  return Math.round(v);
}

function parseStyleEl(
  style: Element | null,
  fallback: ParsedStyle
): ParsedStyle {
  if (!style) return fallback;
  const result: ParsedStyle = { ...fallback };

  const iconStyle = firstDirect(style, 'IconStyle');
  if (iconStyle) {
    const colorEl = firstDirect(iconStyle, 'color');
    if (colorEl) {
      const c = kmlColorToCss(textOf(colorEl));
      if (c.css) result.color = c.css;
    }
    const scaleEl = firstDirect(iconStyle, 'scale');
    if (scaleEl) {
      const scale = parseFloat(textOf(scaleEl));
      if (!isNaN(scale) && isFinite(scale)) {
        result.pixelSize = clampPixelSize(12 * scale);
      }
    }
    const iconEl = firstDirect(iconStyle, 'Icon');
    if (iconEl) {
      const href = firstDirect(iconEl, 'href');
      if (href) {
        let hrefText = textOf(href);
        if (hrefText.startsWith('http://')) {
          hrefText = hrefText.replace('http://', 'https://');
        }
        result.iconHref = hrefText;
      }
    }
  }

  const lineStyle = firstDirect(style, 'LineStyle');
  if (lineStyle) {
    const colorEl = firstDirect(lineStyle, 'color');
    if (colorEl) {
      const c = kmlColorToCss(textOf(colorEl));
      if (c.css) {
        result.color = c.css;
        result.outlineColor = c.css;
      }
    }
    const widthEl = firstDirect(lineStyle, 'width');
    if (widthEl) {
      const w = parseFloat(textOf(widthEl));
      if (!isNaN(w) && isFinite(w)) result.width = w;
    }
  }

  const polyStyle = firstDirect(style, 'PolyStyle');
  if (polyStyle) {
    const colorEl = firstDirect(polyStyle, 'color');
    if (colorEl) {
      const c = kmlColorToCss(textOf(colorEl));
      if (c.css) result.fillColor = c.css;
    }
  }

  return result;
}

function resolveStyle(
  placemark: Element,
  styles: Record<string, Element>,
  defaultStyle: ParsedStyle
): ParsedStyle {
  const inlineStyle = firstDirect(placemark, 'Style');
  if (inlineStyle) {
    return parseStyleEl(inlineStyle, defaultStyle);
  }
  const styleUrlEl = firstDirect(placemark, 'styleUrl');
  if (styleUrlEl) {
    const url = textOf(styleUrlEl);
    if (url && styles[url]) {
      return parseStyleEl(styles[url], defaultStyle);
    }
  }
  return defaultStyle;
}

function extractDescription(placemark: Element): string {
  const desc = textOf(firstDirect(placemark, 'description'));
  const extData = firstDirect(placemark, 'ExtendedData');
  if (!extData) return truncate(desc, MAX_DESCRIPTION_LENGTH);

  const parts: string[] = [];
  if (desc) parts.push(desc);

  const dataEls = extData.getElementsByTagName('Data');
  for (let i = 0; i < dataEls.length; i++) {
    const name = dataEls[i].getAttribute('name') || '';
    const value = textOf(firstDirect(dataEls[i], 'value'));
    if (name && value) parts.push(name + ': ' + value);
  }
  return truncate(parts.join('\n'), MAX_DESCRIPTION_LENGTH);
}

// -----------------------------------------------------
// Опции импорта
// -----------------------------------------------------
export interface ImportOptions {
  color: string;
  pixelSize: number;
  visible: boolean;
  flyToBounds: boolean;
  showLabels: boolean;
  showHidden: boolean;
  importLinesAsMeasures?: boolean;
  defaultRulerType?: 'path' | 'area';
  /** ⚡ Свернуть папки после импорта */
  startCollapsed?: boolean;
}

function makeDefaultStyle(options: ImportOptions): ParsedStyle {
  return {
    color: options.color,
    opacity: 1,
    width: 3,
    fillColor: '#4a90d9',
    outlineColor: '#ffffff',
    iconHref: '',
    pixelSize: clampPixelSize(options.pixelSize),
    pointOutlineColor: '#000000',
    pointOutlineWidth: 0.05,
  };
}

function parseGeometryElement(
  child: Element,
  name: string,
  visibleFlag: boolean,
  style: ParsedStyle,
  description: string,
  now: string,
  out: TreeItem[],
  options: ImportOptions,
  placemark: Element
): void {
  const tag = child.tagName.toLowerCase();

  if (tag === 'point') {
    const coords = parseCoordinates(textOf(firstDirect(child, 'coordinates')));
    if (coords.length > 0) {
      const c = coords[0];
      const altitudeMode = parseAltitudeMode(placemark, child);
      out.push({
        id: genId(),
        name,
        type: 'place',
        visible: visibleFlag,
        lat: c.lat,
        lon: c.lon,
        height: c.height,
        altitudeMode,
        color: style.color,
        pixelSize: style.pixelSize,
        iconHref: style.iconHref,
        outlineColor: style.pointOutlineColor,
        outlineWidth: style.pointOutlineWidth,
        description,
        createdAt: now,
      } as Place);
    }
  } else if (tag === 'linestring') {
    const coords = parseCoordinates(textOf(firstDirect(child, 'coordinates')));
    if (coords.length >= 2) {
      const altitudeMode = parseAltitudeMode(placemark, child);
      if (options.importLinesAsMeasures) {
        out.push(
          buildMeasureFromCoords(
            coords,
            name,
            visibleFlag,
            style,
            description,
            now,
            options
          )
        );
      } else {
        out.push({
          id: genId(),
          name,
          type: 'kmlline',
          visible: visibleFlag,
          positions: coords,
          altitudeMode,
          color: style.color,
          width: style.width,
          description,
          createdAt: now,
        } as KmlLine);
      }
    }
  } else if (tag === 'polygon') {
    const outer = firstDirect(child, 'outerBoundaryIs');
    let ring: Element | null = null;
    if (outer) ring = firstDirect(outer, 'LinearRing');
    if (!ring) ring = firstDirect(child, 'LinearRing');
    if (ring) {
      const coords = parseCoordinates(
        textOf(firstDirect(ring, 'coordinates'))
      );
      if (coords.length >= 3) {
        const altitudeMode = parseAltitudeMode(placemark, child);
        out.push({
          id: genId(),
          name,
          type: 'kmlpolygon',
          visible: visibleFlag,
          positions: coords,
          altitudeMode,
          fillColor: style.fillColor,
          outlineColor: style.outlineColor,
          outlineWidth: style.width,
          description,
          createdAt: now,
        } as KmlPolygon);
      }
    }
  } else if (tag === 'multigeometry') {
    const subChildren = Array.from(child.children);
    for (let i = 0; i < subChildren.length; i++) {
      parseGeometryElement(
        subChildren[i],
        name,
        visibleFlag,
        style,
        description,
        now,
        out,
        options,
        placemark
      );
    }
  } else if (tag === 'track') {
    const coords = parseGxTrack(child);
    if (coords.length >= 2) {
      const altitudeMode = parseAltitudeMode(placemark, child);
      out.push({
        id: genId(),
        name,
        type: 'kmlline',
        visible: visibleFlag,
        positions: coords,
        altitudeMode,
        color: style.color,
        width: style.width,
        description,
        createdAt: now,
      } as KmlLine);
    }
  } else if (tag === 'multitrack') {
    const tracks = child.getElementsByTagNameNS('*', 'Track');
    for (let i = 0; i < tracks.length; i++) {
      parseGeometryElement(
        tracks[i],
        name,
        visibleFlag,
        style,
        description,
        now,
        out,
        options,
        placemark
      );
    }
  }
}

function buildMeasureFromCoords(
  coords: Array<{ lat: number; lon: number; height: number }>,
  name: string,
  visibleFlag: boolean,
  style: ParsedStyle,
  description: string,
  now: string,
  options: ImportOptions
): MeasureItem {
  const rulerType = options.defaultRulerType || 'path';
  return {
    id: genId(),
    name,
    type: 'measure',
    rulerType,
    visible: visibleFlag,
    positions: coords,
    closed: false,
    color: style.color,
    width: style.width || 2,
    lineOpacity: 0.7,
    lineDash: 'solid',
    pointShape: 'double-circle',
    pointSize: 14,
    pointOpacity: 1,
    pointFillColor: '#ffffff',
    pointOutlineColor: style.color || '#1a1a1a',
    pointOutlineWidth: 2,
    showNumbers: true,
    numberFontSize: 10,
    numberColor: '#1a1a1a',
    numberOutlineColor: '#ffffff',
    numberOutlineWidth: 1,
    numberStyle: 'fill-and-outline',
    showHeights: false,
    showSegmentLengths: true,
    showAzimuths: true,
    highlightEndpoints: false,
    description,
    createdAt: now,
  } as MeasureItem;
}

function parsePlacemark(
  placemark: Element,
  options: ImportOptions,
  styles: Record<string, Element>
): TreeItem[] {
  const name = textOf(firstDirect(placemark, 'name')) || 'Без имени';
  const visibleText = textOf(firstDirect(placemark, 'visibility'));
  const isVisible = visibleText !== '0';
  const description = extractDescription(placemark);

  const defaultStyle = makeDefaultStyle(options);
  const style = resolveStyle(placemark, styles, defaultStyle);
  const visibleFlag = options.visible && (options.showHidden || isVisible);
  const now = new Date().toISOString();
  const items: TreeItem[] = [];

  const children = Array.from(placemark.children);
  for (let i = 0; i < children.length; i++) {
    const tag = children[i].tagName.toLowerCase();
    if (
      tag === 'point' ||
      tag === 'linestring' ||
      tag === 'polygon' ||
      tag === 'multigeometry' ||
      tag === 'track' ||
      tag === 'multitrack'
    ) {
      parseGeometryElement(
        children[i],
        name,
        visibleFlag,
        style,
        description,
        now,
        items,
        options,
        placemark
      );
    }
  }

  return items;
}

function parseContainer(
  container: Element,
  options: ImportOptions,
  styles: Record<string, Element>
): TreeItem[] {
  const result: TreeItem[] = [];
  const children = Array.from(container.children);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const tag = child.tagName.toLowerCase();

    if (tag === 'placemark') {
      const items = parsePlacemark(child, options, styles);
      for (let k = 0; k < items.length; k++) result.push(items[k]);
    } else if (tag === 'folder' || tag === 'document') {
      const name =
        textOf(firstDirect(child, 'name')) ||
        (tag === 'folder' ? 'Папка' : 'Документ');
      const visibleText = textOf(firstDirect(child, 'visibility'));
      const isVisible = visibleText !== '0';
      const openText = textOf(firstDirect(child, 'open'));
      const isOpen = openText !== '0';
      const folderDesc = truncate(
        textOf(firstDirect(child, 'description')),
        MAX_NOTE_LENGTH
      );

      const subChildren = parseContainer(child, options, styles);

      if (subChildren.length > 0) {
        // ⚡ startCollapsed — все папки свёрнуты
        const expanded = options.startCollapsed ? false : isOpen;

        const folder: Folder = {
          id: genId(),
          name,
          type: 'folder',
          visible: options.visible && (options.showHidden || isVisible),
          expanded,
          children: subChildren,
          sortField: 'manual',
          sortOrder: 'asc',
          note: folderDesc || undefined,
        };
        result.push(folder);
      }
    } else if (tag === 'networklink') {
      const name =
        textOf(firstDirect(child, 'name')) || 'NetworkLink';
      const href = textOf(
        firstDirect(
          firstDirect(child, 'Link') || child,
          'href'
        )
      );
      console.warn(
        '[parser] NetworkLink "' +
          name +
          '" пропущен (внешний KML не загружается):',
        href || '(нет href)'
      );
    }
  }

  return result;
}

export function countTreeItems(items: TreeItem[]): number {
  if (!Array.isArray(items)) return 0;
  let n = 0;
  for (let i = 0; i < items.length; i++) {
    n++;
    const item = items[i];
    if (!item) continue;
    if (item.type === 'folder' || item.type === 'kmlfile') {
      n += countTreeItems((item as Folder | KmlFile).children);
    }
  }
  return n;
}

export function countTreeItemsByType(items: TreeItem[]): {
  total: number;
  places: number;
  lines: number;
  polygons: number;
  measures: number;
  folders: number;
} {
  let total = 0;
  let places = 0;
  let lines = 0;
  let polygons = 0;
  let measures = 0;
  let folders = 0;

  function walk(list: TreeItem[]) {
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (!it) continue;
      total++;
      if (it.type === 'place') places++;
      else if (it.type === 'kmlline') lines++;
      else if (it.type === 'kmlpolygon') polygons++;
      else if (it.type === 'measure') measures++;
      else if (it.type === 'folder' || it.type === 'kmlfile') {
        folders++;
        walk((it as Folder | KmlFile).children);
      }
    }
  }
  walk(items);

  return { total, places, lines, polygons, measures, folders };
}

export function parseKmlDocumentToTree(
  doc: Document,
  options: ImportOptions,
  fileName: string
): TreeItem[] {
  console.log('[parser] старт, файл:', fileName);

  const styles = collectStyles(doc);
  console.log('[parser] найдено стилей:', Object.keys(styles).length);

  const root = doc.documentElement;
  if (!root) {
    console.warn('[parser] нет корневого элемента');
    return [];
  }

  let children: TreeItem[] = [];

  const docEl = firstDirect(root, 'Document');
  if (docEl) {
    children = parseContainer(docEl, options, styles);
  } else {
    children = parseContainer(root, options, styles);
  }

  const byType = countTreeItemsByType(children);
  console.log(
    '[parser] результат: total=' +
      byType.total +
      ', place=' +
      byType.places +
      ', line=' +
      byType.lines +
      ', poly=' +
      byType.polygons +
      ', measure=' +
      byType.measures +
      ', folders=' +
      byType.folders
  );

  return children;
}

export function buildKmlFolder(
  fileName: string,
  children: TreeItem[],
  visible: boolean,
  expanded: boolean = true
): KmlFile {
  return {
    id: genId(),
    name: fileName,
    type: 'kmlfile',
    visible: visible,
    expanded: expanded,
    children: children,
    sourceFile: fileName,
    importedAt: new Date().toISOString(),
  };
}

export { MEASURE_RULERS };