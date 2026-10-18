// =====================================================
// src/services/kml/exporter.ts
// Экспорт дерева объектов в KML/KMZ
// Исправлено: altitudeMode параметром, chunks[] вместо +=",
// measureToKml пишет clampToGround если высот нет.
// =====================================================

import JSZip from 'jszip';
import type {
  TreeItem,
  Place,
  KmlLine,
  KmlPolygon,
  MeasureItem,
  AltitudeMode,
} from '../../types/base';
import {
  isPlace,
  isKmlLine,
  isKmlPolygon,
  isMeasure,
  isContainer,
} from '../../types/base';

// -----------------------------------------------------
// Утилиты
// -----------------------------------------------------
function escapeXml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cssColorToKml(css: string, alpha: number): string {
  const hex = (css || '#e74c3c').replace('#', '');
  let r = '00';
  let g = '00';
  let b = '00';
  if (hex.length === 6) {
    r = hex.substring(0, 2);
    g = hex.substring(2, 4);
    b = hex.substring(4, 6);
  } else if (hex.length === 3) {
    r = hex[0] + hex[0];
    g = hex[1] + hex[1];
    b = hex[2] + hex[2];
  }
  const aa = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return aa + b + g + r;
}

/**
 * ⚡ N5/N6: KML altitudeMode. Возвращает строку, которая
 * пойдёт в <altitudeMode>...</altitudeMode>.
 * - 'absolute' → absolute (прилипает к высоте над эллипсоидом)
 * - 'clampToGround' → clampToGround (прилипает к рельефу)
 * - 'relativeToGround' → relativeToGround
 */
function altitudeModeToKml(mode: AltitudeMode | undefined): string {
  if (mode === 'absolute') return 'absolute';
  if (mode === 'relativeToGround') return 'relativeToGround';
  return 'clampToGround';
}

// -----------------------------------------------------
// Place → KML
// -----------------------------------------------------
function placeToKml(place: Place, indent: string, out: string[]): void {
  out.push(indent + '<Placemark>\n');
  out.push(indent + '  <name>' + escapeXml(place.name) + '</name>\n');
  if (place.description) {
    out.push(
      indent +
        '  <description><![CDATA[' +
        place.description +
        ']]></description>\n'
    );
  }
  const scale = ((place.pixelSize || 12) / 12).toFixed(2);
  const color = cssColorToKml(place.color || '#e74c3c', 1);
  out.push(indent + '  <Style>\n');
  out.push(indent + '    <IconStyle>\n');
  out.push(indent + '      <color>' + color + '</color>\n');
  out.push(indent + '      <scale>' + scale + '</scale>\n');
  out.push(indent + '      <Icon>\n');
  if (place.iconHref) {
    out.push(
      indent +
        '        <href>' +
        escapeXml(place.iconHref) +
        '</href>\n'
    );
  } else {
    out.push(
      indent +
        '        <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>\n'
    );
  }
  out.push(indent + '      </Icon>\n');
  out.push(indent + '    </IconStyle>\n');
  out.push(indent + '  </Style>\n');
  out.push(indent + '  <Point>\n');

  const altitudeMode = altitudeModeToKml(place.altitudeMode);
  // absolute / relativeToGround — пишем altitudeMode
  if (altitudeMode !== 'clampToGround') {
    out.push(
      indent + '    <altitudeMode>' + altitudeMode + '</altitudeMode>\n'
    );
  }

  out.push(
    indent +
      '    <coordinates>' +
      place.lon.toFixed(8) +
      ',' +
      place.lat.toFixed(8) +
      ',' +
      (place.height || 0).toFixed(2) +
      '</coordinates>\n'
  );
  out.push(indent + '  </Point>\n');
  out.push(indent + '</Placemark>\n');
}

// -----------------------------------------------------
// LineString → KML
// -----------------------------------------------------
function lineToKml(line: KmlLine, indent: string, out: string[]): void {
  out.push(indent + '<Placemark>\n');
  out.push(indent + '  <name>' + escapeXml(line.name) + '</name>\n');
  if (line.description) {
    out.push(
      indent +
        '  <description><![CDATA[' +
        line.description +
        ']]></description>\n'
    );
  }
  const color = cssColorToKml(line.color || '#f1c40f', 1);
  out.push(indent + '  <Style>\n');
  out.push(indent + '    <LineStyle>\n');
  out.push(indent + '      <color>' + color + '</color>\n');
  out.push(indent + '      <width>' + (line.width || 3) + '</width>\n');
  out.push(indent + '    </LineStyle>\n');
  out.push(indent + '  </Style>\n');
  out.push(indent + '  <LineString>\n');
  out.push(indent + '    <tessellate>1</tessellate>\n');

  // ⚡ N5: altitudeMode линии
  const altitudeMode = altitudeModeToKml(line.altitudeMode);
  if (altitudeMode !== 'clampToGround') {
    out.push(
      indent + '    <altitudeMode>' + altitudeMode + '</altitudeMode>\n'
    );
  }

  out.push(indent + '    <coordinates>\n');
  line.positions.forEach(function (p) {
    out.push(
      indent +
        '      ' +
        p.lon.toFixed(8) +
        ',' +
        p.lat.toFixed(8) +
        ',' +
        (p.height || 0).toFixed(2) +
        '\n'
    );
  });
  out.push(indent + '    </coordinates>\n');
  out.push(indent + '  </LineString>\n');
  out.push(indent + '</Placemark>\n');
}

// -----------------------------------------------------
// Polygon → KML
// -----------------------------------------------------
function polygonToKml(poly: KmlPolygon, indent: string, out: string[]): void {
  out.push(indent + '<Placemark>\n');
  out.push(indent + '  <name>' + escapeXml(poly.name) + '</name>\n');
  if (poly.description) {
    out.push(
      indent +
        '  <description><![CDATA[' +
        poly.description +
        ']]></description>\n'
    );
  }
  const fillColor = cssColorToKml(poly.fillColor || '#4a90d9', 0.6);
  const outlineColor = cssColorToKml(poly.outlineColor || '#ffffff', 1);
  out.push(indent + '  <Style>\n');
  out.push(indent + '    <PolyStyle>\n');
  out.push(indent + '      <color>' + fillColor + '</color>\n');
  out.push(indent + '    </PolyStyle>\n');
  out.push(indent + '    <LineStyle>\n');
  out.push(indent + '      <color>' + outlineColor + '</color>\n');
  out.push(indent + '      <width>' + (poly.outlineWidth || 2) + '</width>\n');
  out.push(indent + '    </LineStyle>\n');
  out.push(indent + '  </Style>\n');
  out.push(indent + '  <Polygon>\n');

  // ⚡ N6: altitudeMode полигона
  const altitudeMode = altitudeModeToKml(poly.altitudeMode);
  if (altitudeMode !== 'clampToGround') {
    out.push(
      indent + '    <altitudeMode>' + altitudeMode + '</altitudeMode>\n'
    );
  }

  out.push(indent + '    <outerBoundaryIs>\n');
  out.push(indent + '      <LinearRing>\n');
  out.push(indent + '        <coordinates>\n');
  poly.positions.forEach(function (p) {
    out.push(
      indent +
        '          ' +
        p.lon.toFixed(8) +
        ',' +
        p.lat.toFixed(8) +
        ',' +
        (p.height || 0).toFixed(2) +
        '\n'
    );
  });
  if (poly.positions.length > 0) {
    const first = poly.positions[0];
    const last = poly.positions[poly.positions.length - 1];
    const isClosed =
      Math.abs(first.lat - last.lat) < 1e-9 &&
      Math.abs(first.lon - last.lon) < 1e-9;
    if (!isClosed) {
      out.push(
        indent +
          '          ' +
          first.lon.toFixed(8) +
          ',' +
          first.lat.toFixed(8) +
          ',' +
          (first.height || 0).toFixed(2) +
          '\n'
      );
    }
  }
  out.push(indent + '        </coordinates>\n');
  out.push(indent + '      </LinearRing>\n');
  out.push(indent + '    </outerBoundaryIs>\n');
  out.push(indent + '  </Polygon>\n');
  out.push(indent + '</Placemark>\n');
}

// -----------------------------------------------------
// MeasureItem → Folder(LineString + Points)
// -----------------------------------------------------
function measureToKml(
  measure: MeasureItem,
  indent: string,
  out: string[]
): void {
  const innerIndent = indent + '  ';
  const deepIndent = indent + '    ';

  out.push(indent + '<Folder>\n');
  out.push(indent + '  <name>' + escapeXml(measure.name) + '</name>\n');
  out.push(
    indent +
      '  <visibility>' +
      (measure.visible !== false ? '1' : '0') +
      '</visibility>\n'
  );

  if (measure.description) {
    out.push(
      innerIndent +
        '<description><![CDATA[' +
        measure.description +
        ']]></description>\n'
    );
  }

  const lineColor = cssColorToKml(
    measure.color || '#1a1a1a',
    measure.lineOpacity ?? 0.7
  );

  // ⚡ N6: measure — если все высоты ≈ 0, клампим к рельефу.
  //   Иначе absolute (точки в 3D).
  let allZero = true;
  if (measure.positions.length > 0) {
    for (let i = 0; i < measure.positions.length; i++) {
    const h = measure.positions[i].height || 0;
    if (Math.abs(h) > 0.001) {
      allZero = false;
      break;
    }
  }
  }
  const measureAltMode = allZero ? 'clampToGround' : 'absolute';

  // --- Линия ---
  if (measure.positions.length >= 2) {
    const positions =
      measure.closed && measure.positions.length >= 3
        ? measure.positions.concat([measure.positions[0]])
        : measure.positions;

    out.push(innerIndent + '<Placemark>\n');
    out.push(
      innerIndent +
        '  <name>' +
        escapeXml(measure.name + ' (линия)') +
        '</name>\n'
    );
    out.push(innerIndent + '  <Style>\n');
    out.push(innerIndent + '    <LineStyle>\n');
    out.push(innerIndent + '      <color>' + lineColor + '</color>\n');
    out.push(
      innerIndent +
        '      <width>' +
        (measure.width || 2) +
        '</width>\n'
    );
    out.push(innerIndent + '    </LineStyle>\n');
    out.push(innerIndent + '  </Style>\n');
    out.push(innerIndent + '  <LineString>\n');
    out.push(innerIndent + '    <tessellate>1</tessellate>\n');
    if (measureAltMode === 'absolute') {
      out.push(
        innerIndent + '    <altitudeMode>absolute</altitudeMode>\n'
      );
    }
    out.push(innerIndent + '    <coordinates>\n');
    positions.forEach(function (p) {
      out.push(
        deepIndent +
          p.lon.toFixed(8) +
          ',' +
          p.lat.toFixed(8) +
          ',' +
          (p.height || 0).toFixed(2) +
          '\n'
      );
    });
    out.push(innerIndent + '    </coordinates>\n');
    out.push(innerIndent + '  </LineString>\n');
    out.push(innerIndent + '</Placemark>\n');
  }

  // --- Точки ---
  const showNumbers = measure.showNumbers !== false;
  const pointSize = measure.pointSize || 14;
  const pointFill = measure.pointFillColor || '#ffffff';
  const pointOutline = measure.pointOutlineColor || '#1a1a1a';

  measure.positions.forEach(function (p, idx) {
    const pointColor = cssColorToKml(pointFill, 1);
    const pointOutlineColor = cssColorToKml(pointOutline, 1);

    out.push(innerIndent + '<Placemark>\n');
    out.push(
      innerIndent +
        '  <name>' +
        escapeXml(showNumbers ? 'Точка ' + (idx + 1) : 'Точка') +
        '</name>\n'
    );
    out.push(
      innerIndent +
        '  <description><![CDATA[' +
        'Широта: ' +
        p.lat.toFixed(8) +
        '\nДолгота: ' +
        p.lon.toFixed(8) +
        '\nВысота: ' +
        (p.height || 0).toFixed(2) +
        ' м' +
        ']]></description>\n'
    );
    out.push(innerIndent + '  <Style>\n');
    out.push(innerIndent + '    <IconStyle>\n');
    out.push(innerIndent + '      <color>' + pointColor + '</color>\n');
    out.push(
      innerIndent +
        '      <scale>' +
        (pointSize / 12).toFixed(2) +
        '</scale>\n'
    );
    out.push(innerIndent + '      <Icon>\n');
    out.push(
      innerIndent +
        '        <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>\n'
    );
    out.push(innerIndent + '      </Icon>\n');
    out.push(innerIndent + '    </IconStyle>\n');
    out.push(innerIndent + '    <LabelStyle>\n');
    out.push(
      innerIndent +
        '      <color>' +
        pointOutlineColor +
        '</color>\n'
    );
    out.push(innerIndent + '      <scale>1</scale>\n');
    out.push(innerIndent + '    </LabelStyle>\n');
    out.push(innerIndent + '  </Style>\n');
    out.push(innerIndent + '  <Point>\n');
    if (measureAltMode === 'absolute') {
      out.push(
        innerIndent + '    <altitudeMode>absolute</altitudeMode>\n'
      );
    }
    out.push(
      innerIndent +
        '    <coordinates>' +
        p.lon.toFixed(8) +
        ',' +
        p.lat.toFixed(8) +
        ',' +
        (p.height || 0).toFixed(2) +
        '</coordinates>\n'
    );
    out.push(innerIndent + '  </Point>\n');
    out.push(innerIndent + '</Placemark>\n');
  });

  out.push(indent + '</Folder>\n');
}

// -----------------------------------------------------
// Универсальный обход
// -----------------------------------------------------
function itemToKml(item: TreeItem, indent: string, out: string[]): void {
  if (isPlace(item)) {
    placeToKml(item, indent, out);
    return;
  }
  if (isKmlLine(item)) {
    lineToKml(item, indent, out);
    return;
  }
  if (isKmlPolygon(item)) {
    polygonToKml(item, indent, out);
    return;
  }
  if (isMeasure(item)) {
    measureToKml(item, indent, out);
    return;
  }

  if (isContainer(item)) {
    out.push(indent + '<Folder>\n');
    out.push(indent + '  <name>' + escapeXml(item.name) + '</name>\n');
    out.push(
      indent +
        '  <visibility>' +
        (item.visible ? '1' : '0') +
        '</visibility>\n'
    );
    out.push(
      indent + '  <open>' + (item.expanded ? '1' : '0') + '</open>\n'
    );
    if (item.note) {
      out.push(
        indent +
          '  <description><![CDATA[' +
          item.note +
          ']]></description>\n'
      );
    }
    item.children.forEach(function (child) {
      itemToKml(child, indent + '  ', out);
    });
    out.push(indent + '</Folder>\n');
  }
}

// -----------------------------------------------------
// Публичный API
// -----------------------------------------------------
export interface ExportMeta {
  author?: string;
  organization?: string;
  description?: string;
}

export function exportTreeToKml(
  tree: TreeItem[],
  projectName: string,
  meta?: ExportMeta
): string {
  // ⚡ N7: собираем в массив чанков и join один раз.
  //   Для 100k+ объектов это O(N), а не O(N²).
  const out: string[] = [];

  out.push('<?xml version="1.0" encoding="UTF-8"?>\n');
  out.push(
    '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:atom="http://www.w3.org/2005/Atom">\n'
  );
  out.push('  <Document>\n');
  out.push('    <name>' + escapeXml(projectName) + '</name>\n');

  if (meta && (meta.author || meta.organization)) {
    const name = meta.author || meta.organization || '';
    out.push('    <atom:author>\n');
    out.push('      <atom:name>' + escapeXml(name) + '</atom:name>\n');
    out.push('    </atom:author>\n');
  }

  if (meta && meta.description) {
    out.push(
      '    <description><![CDATA[' +
        meta.description +
        ']]></description>\n'
    );
  } else {
    out.push('    <description>Создано в PoiskHelper</description>\n');
  }

  tree.forEach(function (item) {
    itemToKml(item, '    ', out);
  });

  out.push('  </Document>\n');
  out.push('</kml>\n');

  return out.join('');
}

export async function exportTreeToKmz(
  tree: TreeItem[],
  projectName: string,
  meta?: ExportMeta
): Promise<Uint8Array> {
  const kmlString = exportTreeToKml(tree, projectName, meta);
  const zip = new JSZip();
  zip.file('doc.kml', kmlString);

  // ⚡ N8: DEFLATE с уровнем 6 — хороший баланс
  //   скорость/размер. Для 100+ МБ KML всё равно держит всё в памяти,
  //   но хотя бы не раздувает зря.
  const uint8 = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  return uint8;
}