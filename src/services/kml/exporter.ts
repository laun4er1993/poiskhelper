// =====================================================
// src/services/kml/exporter.ts
// Экспорт дерева объектов в KML/KMZ
// =====================================================

import JSZip from 'jszip';
import type {
  TreeItem,
  Place,
  KmlLine,
  KmlPolygon,
  MeasureItem,
} from '../../types/base';
import {
  isPlace,
  isKmlLine,
  isKmlPolygon,
  isMeasure,
  isContainer,
} from '../../types/base';

// =====================================================
// === Утилиты ===
// =====================================================
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

// =====================================================
// === Place → KML ===
// =====================================================
function placeToKml(place: Place, indent: string): string {
  let kml = indent + '<Placemark>\n';
  kml += indent + '  <name>' + escapeXml(place.name) + '</name>\n';
  if (place.description) {
    kml +=
      indent +
      '  <description><![CDATA[' +
      place.description +
      ']]></description>\n';
  }
  const scale = ((place.pixelSize || 12) / 12).toFixed(2);
  const color = cssColorToKml(place.color || '#e74c3c', 1);
  kml += indent + '  <Style>\n';
  kml += indent + '    <IconStyle>\n';
  kml += indent + '      <color>' + color + '</color>\n';
  kml += indent + '      <scale>' + scale + '</scale>\n';
  kml += indent + '      <Icon>\n';
  if (place.iconHref) {
    kml +=
      indent +
      '        <href>' +
      escapeXml(place.iconHref) +
      '</href>\n';
  } else {
    kml +=
      indent +
      '        <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>\n';
  }
  kml += indent + '      </Icon>\n';
  kml += indent + '    </IconStyle>\n';
  kml += indent + '  </Style>\n';
  kml += indent + '  <Point>\n';
  kml +=
    indent +
    '    <coordinates>' +
    place.lon.toFixed(8) +
    ',' +
    place.lat.toFixed(8) +
    ',' +
    (place.height || 0).toFixed(2) +
    '</coordinates>\n';
  kml += indent + '  </Point>\n';
  kml += indent + '</Placemark>\n';
  return kml;
}

// =====================================================
// === LineString → KML ===
// =====================================================
function lineToKml(line: KmlLine, indent: string): string {
  let kml = indent + '<Placemark>\n';
  kml += indent + '  <name>' + escapeXml(line.name) + '</name>\n';
  if (line.description) {
    kml +=
      indent +
      '  <description><![CDATA[' +
      line.description +
      ']]></description>\n';
  }
  const color = cssColorToKml(line.color || '#f1c40f', 1);
  kml += indent + '  <Style>\n';
  kml += indent + '    <LineStyle>\n';
  kml += indent + '      <color>' + color + '</color>\n';
  kml += indent + '      <width>' + (line.width || 3) + '</width>\n';
  kml += indent + '    </LineStyle>\n';
  kml += indent + '  </Style>\n';
  kml += indent + '  <LineString>\n';
  kml += indent + '    <tessellate>1</tessellate>\n';
  kml += indent + '    <coordinates>\n';
  line.positions.forEach(function (p) {
    kml +=
      indent +
      '      ' +
      p.lon.toFixed(8) +
      ',' +
      p.lat.toFixed(8) +
      ',' +
      (p.height || 0).toFixed(2) +
      '\n';
  });
  kml += indent + '    </coordinates>\n';
  kml += indent + '  </LineString>\n';
  kml += indent + '</Placemark>\n';
  return kml;
}

// =====================================================
// === Polygon → KML ===
// =====================================================
function polygonToKml(poly: KmlPolygon, indent: string): string {
  let kml = indent + '<Placemark>\n';
  kml += indent + '  <name>' + escapeXml(poly.name) + '</name>\n';
  if (poly.description) {
    kml +=
      indent +
      '  <description><![CDATA[' +
      poly.description +
      ']]></description>\n';
  }
  const fillColor = cssColorToKml(poly.fillColor || '#4a90d9', 0.6);
  const outlineColor = cssColorToKml(poly.outlineColor || '#ffffff', 1);
  kml += indent + '  <Style>\n';
  kml += indent + '    <PolyStyle>\n';
  kml += indent + '      <color>' + fillColor + '</color>\n';
  kml += indent + '    </PolyStyle>\n';
  kml += indent + '    <LineStyle>\n';
  kml += indent + '      <color>' + outlineColor + '</color>\n';
  kml += indent + '      <width>' + (poly.outlineWidth || 2) + '</width>\n';
  kml += indent + '    </LineStyle>\n';
  kml += indent + '  </Style>\n';
  kml += indent + '  <Polygon>\n';
  kml += indent + '    <altitudeMode>absolute</altitudeMode>\n';
  kml += indent + '    <outerBoundaryIs>\n';
  kml += indent + '      <LinearRing>\n';
  kml += indent + '        <coordinates>\n';
  poly.positions.forEach(function (p) {
    kml +=
      indent +
      '          ' +
      p.lon.toFixed(8) +
      ',' +
      p.lat.toFixed(8) +
      ',' +
      (p.height || 0).toFixed(2) +
      '\n';
  });
  if (poly.positions.length > 0) {
    const first = poly.positions[0];
    const last = poly.positions[poly.positions.length - 1];
    const isClosed =
      Math.abs(first.lat - last.lat) < 1e-9 &&
      Math.abs(first.lon - last.lon) < 1e-9;
    if (!isClosed) {
      kml +=
        indent +
        '          ' +
        first.lon.toFixed(8) +
        ',' +
        first.lat.toFixed(8) +
        ',' +
        (first.height || 0).toFixed(2) +
        '\n';
    }
  }
  kml += indent + '        </coordinates>\n';
  kml += indent + '      </LinearRing>\n';
  kml += indent + '    </outerBoundaryIs>\n';
  kml += indent + '  </Polygon>\n';
  kml += indent + '</Placemark>\n';
  return kml;
}

// =====================================================
// === MeasureItem → Folder(LineString + Points) ===
// =====================================================
function measureToKml(measure: MeasureItem, indent: string): string {
  const innerIndent = indent + '  ';
  const deepIndent = indent + '    ';

  let kml = indent + '<Folder>\n';
  kml += indent + '  <name>' + escapeXml(measure.name) + '</name>\n';
  kml +=
    indent +
    '  <visibility>' +
    (measure.visible !== false ? '1' : '0') +
    '</visibility>\n';

  if (measure.description) {
    kml +=
      innerIndent +
      '<description><![CDATA[' +
      measure.description +
      ']]></description>\n';
  }

  const lineColor = cssColorToKml(
    measure.color || '#a7d948',
    measure.lineOpacity ?? 0.55
  );

  // --- Линия ---
  if (measure.positions.length >= 2) {
    const positions =
      measure.closed && measure.positions.length >= 3
        ? measure.positions.concat([measure.positions[0]])
        : measure.positions;

    kml += innerIndent + '<Placemark>\n';
    kml +=
      innerIndent +
      '  <name>' +
      escapeXml(measure.name + ' (линия)') +
      '</name>\n';
    kml += innerIndent + '  <Style>\n';
    kml += innerIndent + '    <LineStyle>\n';
    kml += innerIndent + '      <color>' + lineColor + '</color>\n';
    kml +=
      innerIndent +
      '      <width>' +
      (measure.width || 2) +
      '</width>\n';
    kml += innerIndent + '    </LineStyle>\n';
    kml += innerIndent + '  </Style>\n';
    kml += innerIndent + '  <LineString>\n';
    kml += innerIndent + '    <tessellate>1</tessellate>\n';
    kml += innerIndent + '    <altitudeMode>absolute</altitudeMode>\n';
    kml += innerIndent + '    <coordinates>\n';
    positions.forEach(function (p) {
      kml +=
        deepIndent +
        p.lon.toFixed(8) +
        ',' +
        p.lat.toFixed(8) +
        ',' +
        (p.height || 0).toFixed(2) +
        '\n';
    });
    kml += innerIndent + '    </coordinates>\n';
    kml += innerIndent + '  </LineString>\n';
    kml += innerIndent + '</Placemark>\n';
  }

  // --- Точки ---
  const showNumbers = measure.showNumbers !== false;
  const pointSize = measure.pointSize || 11;
  const pointFill = measure.pointFillColor || '#ffffff';
  const pointOutline = measure.pointOutlineColor || '#a7d948';
  const pointOutlineWidth = measure.pointOutlineWidth ?? 2;

  measure.positions.forEach(function (p, idx) {
    const pointColor = cssColorToKml(pointFill, 1);
    const pointOutlineColor = cssColorToKml(pointOutline, 1);

    kml += innerIndent + '<Placemark>\n';
    kml +=
      innerIndent +
      '  <name>' +
      escapeXml(
        showNumbers ? 'Точка ' + (idx + 1) : 'Точка'
      ) +
      '</name>\n';
    kml +=
      innerIndent +
      '  <description><![CDATA[' +
      'Широта: ' +
      p.lat.toFixed(8) +
      '\nДолгота: ' +
      p.lon.toFixed(8) +
      '\nВысота: ' +
      (p.height || 0).toFixed(2) +
      ' м' +
      ']]></description>\n';
    kml += innerIndent + '  <Style>\n';
    kml += innerIndent + '    <IconStyle>\n';
    kml += innerIndent + '      <color>' + pointColor + '</color>\n';
    kml +=
      innerIndent +
      '      <scale>' +
      (pointSize / 12).toFixed(2) +
      '</scale>\n';
    kml += innerIndent + '      <Icon>\n';
    kml +=
      innerIndent +
      '        <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>\n';
    kml += innerIndent + '      </Icon>\n';
    kml += innerIndent + '    </IconStyle>\n';
    kml += innerIndent + '    <LabelStyle>\n';
    kml +=
      innerIndent +
      '      <color>' +
      pointOutlineColor +
      '</color>\n';
    kml += innerIndent + '      <scale>1</scale>\n';
    kml += innerIndent + '    </LabelStyle>\n';
    kml += innerIndent + '  </Style>\n';
    kml += innerIndent + '  <Point>\n';
    kml += innerIndent + '    <altitudeMode>absolute</altitudeMode>\n';
    kml +=
      innerIndent +
      '    <coordinates>' +
      p.lon.toFixed(8) +
      ',' +
      p.lat.toFixed(8) +
      ',' +
      (p.height || 0).toFixed(2) +
      '</coordinates>\n';
    kml += innerIndent + '  </Point>\n';
    kml += innerIndent + '</Placemark>\n';
  });

  kml += indent + '</Folder>\n';
  return kml;
}

// =====================================================
// === Универсальный обход ===
// =====================================================
function itemToKml(item: TreeItem, indent: string): string {
  if (isPlace(item)) return placeToKml(item, indent);
  if (isKmlLine(item)) return lineToKml(item, indent);
  if (isKmlPolygon(item)) return polygonToKml(item, indent);
  if (isMeasure(item)) return measureToKml(item, indent);

  if (isContainer(item)) {
    let kml = indent + '<Folder>\n';
    kml += indent + '  <name>' + escapeXml(item.name) + '</name>\n';
    kml +=
      indent +
      '  <visibility>' +
      (item.visible ? '1' : '0') +
      '</visibility>\n';
    kml += indent + '  <open>' + (item.expanded ? '1' : '0') + '</open>\n';
    item.children.forEach(function (child) {
      kml += itemToKml(child, indent + '  ');
    });
    kml += indent + '</Folder>\n';
    return kml;
  }

  return '';
}

// =====================================================
// === Публичный API ===
// =====================================================
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
  let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  kml +=
    '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  kml += '  <Document>\n';
  kml += '    <name>' + escapeXml(projectName) + '</name>\n';

  if (meta && (meta.author || meta.organization)) {
    const name = meta.author || meta.organization || '';
    kml += '    <atom:author>\n';
    kml += '      <atom:name>' + escapeXml(name) + '</atom:name>\n';
    kml += '    </atom:author>\n';
  }

  if (meta && meta.description) {
    kml +=
      '    <description><![CDATA[' +
      meta.description +
      ']]></description>\n';
  } else {
    kml += '    <description>Создано в PoiskHelper</description>\n';
  }

  tree.forEach(function (item) {
    kml += itemToKml(item, '    ');
  });

  kml += '  </Document>\n';
  kml += '</kml>\n';
  return kml;
}

export async function exportTreeToKmz(
  tree: TreeItem[],
  projectName: string,
  meta?: ExportMeta
): Promise<Uint8Array> {
  const kmlString = exportTreeToKml(tree, projectName, meta);
  const zip = new JSZip();
  zip.file('doc.kml', kmlString);
  const uint8 = await zip.generateAsync({ type: 'uint8array' });
  return uint8;
}