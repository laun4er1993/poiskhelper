// =====================================================
// src/components/globe/hooks/useRendering.ts
// Отрисовка объектов дерева на карте
// =====================================================

import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';

import type {
  TreeItem,
  Place,
  AltitudeMode,
  MeasureItem,
  MeasureNumberStyle,
} from '../../../types/base';
import type { MeasurePoint } from '../../../types/measure';
import { isContainer, isMeasure } from '../../../types/base';
import { getItemOpacity } from '../../../types/tree-utils';

import type { AppSettings } from '../../../types/settings';
import type { ThemeColors } from '../../../theme/types';

import {
  DEFAULT_PIXEL_SIZE,
  DEFAULT_ICON_NATIVE_SIZE,
  DEFAULT_OUTLINE_COLOR,
  DEFAULT_OUTLINE_WIDTH,
  CIRCLE_RENDER_SCALE,
} from '../constants';
import type { BillboardInfo } from '../types';
import {
  tintColor,
  getCircleDataUrl,
  getStyledIconDataUrl,
  subscribeIconVersion,
} from '../utils/colors';
import { buildLabel } from '../utils/labels';

interface UseRenderingParams {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  viewerReady: boolean;
  items: TreeItem[];
  importedItems: TreeItem[];
  settings: AppSettings;
  colors: ThemeColors;
  billboardsRef: React.MutableRefObject<Map<string, BillboardInfo>>;
  onAfterRender?: () => void;
  measurePoints?: MeasurePoint[];
  measureClosed?: boolean;
  editingItemId?: string | null;
}

function getHeightReference(
  altitudeMode: AltitudeMode | undefined
): Cesium.HeightReference {
  if (!altitudeMode) return Cesium.HeightReference.NONE;
  if (altitudeMode === 'absolute') return Cesium.HeightReference.NONE;
  return Cesium.HeightReference.CLAMP_TO_GROUND;
}

// =====================================================
// === Удаление entity по ID ===
// =====================================================
function safeRemoveById(viewer: Cesium.Viewer, id: string): void {
  try {
    const existing = viewer.entities.getById(id);
    if (existing) viewer.entities.remove(existing);
  } catch (e) {}
}

// =====================================================
// === Материал линии ===
// =====================================================
function buildLineMaterial(
  color: Cesium.Color,
  dash: 'solid' | 'dashed' | 'dotted' | undefined
): Cesium.MaterialProperty {
  if (dash === 'dashed') {
    try {
      return new Cesium.PolylineDashMaterialProperty({
        color: color,
        dashLength: 16.0,
      });
    } catch (e) {
      return new Cesium.ColorMaterialProperty(color);
    }
  }
  if (dash === 'dotted') {
    try {
      return new Cesium.PolylineDashMaterialProperty({
        color: color,
        dashLength: 4.0,
      });
    } catch (e) {
      return new Cesium.ColorMaterialProperty(color);
    }
  }
  return new Cesium.ColorMaterialProperty(color);
}

// =====================================================
// === Простая линия (без обводки) ===
// =====================================================
function addSimpleLine(
  viewer: Cesium.Viewer,
  id: string,
  positions: Cesium.Cartesian3[],
  lineColor: string,
  lineOpacity: number,
  lineWidth: number,
  dash: 'solid' | 'dashed' | 'dotted' | undefined,
  clampToGround: boolean,
  op: number,
  measureId?: string
) {
  if (positions.length < 2) return;

  const baseColor = (function () {
    try {
      return Cesium.Color.fromCssColorString(lineColor);
    } catch (e) {
      return Cesium.Color.YELLOW;
    }
  })();

  const alpha = Math.max(0, Math.min(1, lineOpacity * op));
  const finalColor = baseColor.withAlpha(alpha);

  try {
    safeRemoveById(viewer, id);

    const material = buildLineMaterial(finalColor, dash);

    const ent = viewer.entities.add({
      id: id,
      polyline: new Cesium.PolylineGraphics({
        positions: positions,
        width: lineWidth,
        material: material,
        clampToGround: clampToGround,
      }),
    });

    ent.properties = new Cesium.PropertyBag({
      isMeasureLine: true,
      ...(measureId ? { measureId: measureId } : {}),
    });
  } catch (err) {
    console.error('addSimpleLine error:', err);
  }
}

// =====================================================
// === ⚡ Canvas-текстура точки с цифрой внутри ===
// =====================================================
const POINT_CANVAS_SCALE = 4;
const pointCanvasCache: Map<string, string> = new Map();

function getMeasurePointBillboardUrl(
  shape: 'double-circle' | 'circle' | 'square' | undefined,
  sizePx: number,
  fillColor: string,
  outlineColor: string,
  outlineWidth: number,
  numberText: string | null,
  numberColor: string,
  numberOutlineColor: string,
  numberOutlineWidth: number,
  numberFontSize: number,
  numberStyle: MeasureNumberStyle | undefined
): string {
  const size = Math.max(2, Math.round(sizePx));
  const shapeKey = shape || 'double-circle';
  const key =
    shapeKey +
    '|' +
    size +
    '|' +
    fillColor +
    '|' +
    outlineColor +
    '|' +
    outlineWidth +
    '|' +
    (numberText || '') +
    '|' +
    numberColor +
    '|' +
    numberOutlineColor +
    '|' +
    numberOutlineWidth +
    '|' +
    numberFontSize +
    '|' +
    (numberStyle || '');
  const cached = pointCanvasCache.get(key);
  if (cached) return cached;

  const scale = POINT_CANVAS_SCALE;
  const innerPx = size * scale;
  const borderPx = Math.max(0, Math.round(outlineWidth * scale));
  const totalPx = innerPx + borderPx * 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalPx;
  canvas.height = totalPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = totalPx / 2;
  const cy = totalPx / 2;
  const rInner = innerPx / 2;
  const rOuter = rInner + borderPx;

  // ⚡ Форма
  if (shapeKey === 'square') {
    // Внешний квадрат (обводка)
    if (borderPx > 0) {
      ctx.fillStyle = outlineColor;
      ctx.fillRect(0, 0, totalPx, totalPx);
    }
    // Внутренний квадрат
    ctx.fillStyle = fillColor;
    ctx.fillRect(borderPx, borderPx, innerPx, innerPx);
  } else {
    // Внешний круг (обводка)
    if (borderPx > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.fillStyle = outlineColor;
      ctx.fill();
    }
    // Внутренний круг (заливка)
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  // ⚡ Цифра по центру
  if (numberText) {
    const fontSize = Math.max(6, Math.min(numberFontSize, size * 0.85)) * scale;
    ctx.font = 'bold ' + fontSize + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (numberStyle === 'outline') {
      // Только контур
      if (numberOutlineWidth > 0) {
        ctx.strokeStyle = numberOutlineColor;
        ctx.lineWidth = numberOutlineWidth * scale;
        ctx.strokeText(numberText, cx, cy);
      }
    } else if (numberStyle === 'fill') {
      // Только заливка
      ctx.fillStyle = numberColor;
      ctx.fillText(numberText, cx, cy);
    } else {
      // Заливка + обводка
      if (numberOutlineWidth > 0) {
        ctx.strokeStyle = numberOutlineColor;
        ctx.lineWidth = numberOutlineWidth * scale;
        ctx.strokeText(numberText, cx, cy);
      }
      ctx.fillStyle = numberColor;
      ctx.fillText(numberText, cx, cy);
    }
  }

  const url = canvas.toDataURL('image/png');
  pointCanvasCache.set(key, url);
  if (pointCanvasCache.size > 300) {
    const firstKey = pointCanvasCache.keys().next().value;
    if (firstKey !== undefined) pointCanvasCache.delete(firstKey);
  }
  return url;
}

// =====================================================
// === Точка измерения (billboard с цифрой внутри) ===
// =====================================================
function addMeasurePoint(
  viewer: Cesium.Viewer,
  id: string,
  position: Cesium.Cartesian3,
  shape: 'double-circle' | 'circle' | 'square' | undefined,
  size: number,
  fillColor: string,
  outlineColor: string,
  outlineWidth: number,
  numberText: string | null,
  numberColor: string,
  numberOutlineColor: string,
  numberOutlineWidth: number,
  numberFontSize: number,
  numberStyle: MeasureNumberStyle | undefined,
  pointOpacity: number,
  op: number,
  properties: Cesium.PropertyBag
): void {
  const alpha = Math.max(0, Math.min(1, op * pointOpacity));

  try {
    safeRemoveById(viewer, id);
    safeRemoveById(viewer, id + '-inner');

    const dataUrl = getMeasurePointBillboardUrl(
      shape,
      size,
      fillColor,
      outlineColor,
      outlineWidth,
      numberText,
      numberColor,
      numberOutlineColor,
      numberOutlineWidth,
      numberFontSize,
      numberStyle
    );

    // Размер canvas = size * scale + border. Итоговый пиксельный размер
    // на экране = size + outlineWidth * 2.
    const totalSize = size + outlineWidth * 2;
    const totalCanvas = totalSize * POINT_CANVAS_SCALE;
    const billboardScale = 1 / POINT_CANVAS_SCALE;

    const ent = viewer.entities.add({
      id: id,
      position: position,
      billboard: new Cesium.BillboardGraphics({
        image: dataUrl,
        scale: billboardScale,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        color: Cesium.Color.WHITE.withAlpha(alpha),
        heightReference: Cesium.HeightReference.NONE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }),
    });
    ent.properties = properties;

    // Для подавления warning "unused"
    void totalCanvas;
  } catch (err) {
    console.error('addMeasurePoint error:', err);
  }
}

// =====================================================
// Хук
// =====================================================
export function useRendering({
  viewerRef,
  viewerReady,
  items,
  importedItems,
  settings,
  colors,
  billboardsRef,
  onAfterRender,
  measurePoints = [],
  measureClosed = false,
  editingItemId = null,
}: UseRenderingParams): void {
  const onAfterRenderRef = useRef(onAfterRender);
  useEffect(
    function () {
      onAfterRenderRef.current = onAfterRender;
    },
    [onAfterRender]
  );

  useEffect(
    function () {
      const unsub = subscribeIconVersion(function () {
        if (onAfterRenderRef.current) onAfterRenderRef.current();
      });
      return unsub;
    },
    []
  );

  useEffect(
    function () {
      if (!viewerReady) return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const toRemove: Cesium.Entity[] = [];
      viewer.entities.values.forEach(function (entity) {
        if (
          entity.properties &&
          (entity.properties.isPlace ||
            entity.properties.isKmlItem ||
            entity.properties.isMeasureItem ||
            entity.properties.isMeasurePoint ||
            entity.properties.isMeasureLine)
        ) {
          toRemove.push(entity);
          return;
        }
        if (
          typeof entity.id === 'string' &&
          entity.id.indexOf('_tmp-measure-') === 0
        ) {
          toRemove.push(entity);
        }
      });
      toRemove.forEach(function (e) {
        try {
          viewer.entities.remove(e);
        } catch (err) {}
      });

      billboardsRef.current.clear();

      function drawItem(
        item: TreeItem,
        parentVisible: boolean,
        parentOpacity: number
      ) {
        const visible = parentVisible && item.visible !== false;
        if (!visible) return;

        const myOpacity = getItemOpacity(item);
        const op = parentOpacity * myOpacity;
        if (op <= 0.001) return;

        // ---------- PLACE ----------
        if (item.type === 'place') {
          const place = item as Place;
          if (!isFinite(place.lat) || !isFinite(place.lon)) return;

          const heightRef = getHeightReference(place.altitudeMode);
          const position = Cesium.Cartesian3.fromDegrees(
            place.lon,
            place.lat,
            place.height || 0
          );

          const pixelSize = place.pixelSize || DEFAULT_PIXEL_SIZE;
          const fillColorStr = place.color || colors.markerDefault;
          const showFill = place.showFill !== false;
          const fillOpacity =
            place.fillOpacity !== undefined ? place.fillOpacity : 1;

          const outlineColorStr =
            place.outlineColor || DEFAULT_OUTLINE_COLOR;
          const showOutline = place.showOutline !== false;
          const outlineOpacity =
            place.outlineOpacity !== undefined ? place.outlineOpacity : 1;
          const outlineWidth =
            place.outlineWidth !== undefined ? place.outlineWidth : 1;

          const outlineFraction =
            place.outlineWidth !== undefined
              ? place.outlineWidth
              : DEFAULT_OUTLINE_WIDTH;

          const hasIcon = !!(place.iconHref && place.iconHref.length > 0);

          const labelGraphics = buildLabel(
            item,
            settings,
            op,
            pixelSize,
            hasIcon,
            heightRef
          );

          try {
            safeRemoveById(viewer, place.id);
            safeRemoveById(viewer, place.id + '-outline');

            if (hasIcon) {
              const styledUrl = getStyledIconDataUrl(place.iconHref || '', {
                fillColor: fillColorStr,
                fillOpacity: fillOpacity,
                showFill: showFill,
                outlineColor: outlineColorStr,
                outlineOpacity: outlineOpacity,
                showOutline: showOutline,
                outlineWidth: outlineWidth,
              });

              const iconUrl = styledUrl || place.iconHref;
              const useTint = !styledUrl;

              const mainScale = pixelSize / DEFAULT_ICON_NATIVE_SIZE;

              const mainEntity = viewer.entities.add({
                id: place.id,
                position: position,
                billboard: new Cesium.BillboardGraphics({
                  image: iconUrl || '',
                  scale: mainScale,
                  verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  color: useTint
                    ? tintColor(fillColorStr, op)
                    : Cesium.Color.WHITE.withAlpha(op),
                  heightReference: heightRef,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                }),
                label: labelGraphics,
              });
              mainEntity.properties = new Cesium.PropertyBag({
                isPlace: true,
                placeId: place.id,
              });
              billboardsRef.current.set(mainEntity.id, {
                entity: mainEntity,
                baseScale: mainScale,
                ownerId: place.id,
              });
            } else {
              const circleFill =
                showFill && fillOpacity > 0.001 ? fillColorStr : 'transparent';
              const circleOutline =
                showOutline && outlineOpacity > 0.001
                  ? outlineColorStr
                  : 'transparent';

              const dataUrl = getCircleDataUrl(
                pixelSize,
                circleFill,
                circleOutline,
                outlineFraction
              );
              const scale = 1 / CIRCLE_RENDER_SCALE;
              const entity = viewer.entities.add({
                id: place.id,
                position: position,
                billboard: new Cesium.BillboardGraphics({
                  image: dataUrl,
                  scale: scale,
                  verticalOrigin: Cesium.VerticalOrigin.CENTER,
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  color: Cesium.Color.WHITE.withAlpha(op),
                  heightReference: heightRef,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                }),
                label: labelGraphics,
              });
              entity.properties = new Cesium.PropertyBag({
                isPlace: true,
                placeId: place.id,
              });
              billboardsRef.current.set(entity.id, {
                entity: entity,
                baseScale: scale,
                ownerId: place.id,
              });
            }
          } catch (err) {
            console.error('drawItem place error:', err);
          }
        }

        // ---------- LINE ----------
        if (item.type === 'kmlline') {
          const line = item as any;
          if (line.positions && line.positions.length >= 2) {
            try {
              safeRemoveById(viewer, line.id);
              const positions = line.positions.map(function (p: any) {
                return Cesium.Cartesian3.fromDegrees(
                  p.lon,
                  p.lat,
                  p.height || 0
                );
              });
              const clampToGround = line.altitudeMode !== 'absolute';
              const ent = viewer.entities.add({
                id: line.id,
                polyline: new Cesium.PolylineGraphics({
                  positions: positions,
                  width: line.width || 3,
                  material: tintColor(line.color || '#f1c40f', op),
                  clampToGround: clampToGround,
                }),
              });
              ent.properties = new Cesium.PropertyBag({
                isKmlItem: true,
                kmlItemId: line.id,
                kmlItemType: 'kmlline',
              });
            } catch (err) {
              console.error('drawItem line error:', err);
            }
          }
        }

        // ---------- POLYGON ----------
        if (item.type === 'kmlpolygon') {
          const poly = item as any;
          if (poly.positions && poly.positions.length >= 3) {
            try {
              safeRemoveById(viewer, poly.id);
              const positions = poly.positions.map(function (p: any) {
                return Cesium.Cartesian3.fromDegrees(
                  p.lon,
                  p.lat,
                  p.height || 0
                );
              });
              const ent = viewer.entities.add({
                id: poly.id,
                polygon: new Cesium.PolygonGraphics({
                  hierarchy: new Cesium.PolygonHierarchy(positions),
                  material: tintColor(poly.fillColor || '#4a90d9', op * 0.6),
                  outline: true,
                  outlineColor: tintColor(
                    poly.outlineColor || '#ffffff',
                    op
                  ),
                  outlineWidth: poly.outlineWidth || 2,
                  perPositionHeight: false,
                }),
              });
              ent.properties = new Cesium.PropertyBag({
                isKmlItem: true,
                kmlItemId: poly.id,
                kmlItemType: 'kmlpolygon',
              });
            } catch (err) {
              console.error('drawItem polygon error:', err);
            }
          }
        }

        // ---------- MEASURE (сохранённая) ----------
        if (isMeasure(item)) {
          const measure = item as MeasureItem;
          if (measure.positions && measure.positions.length > 0) {
            const mLineColor = measure.color || '#1a1a1a';
            const mLineWidth = measure.width || 2;
            const mLineOpacity = measure.lineOpacity ?? 0.7;
            const mLineDash = measure.lineDash || 'solid';

            const mPointShape = measure.pointShape || 'double-circle';
            const mPointSize = measure.pointSize || 14;
            const mPointOpacity = measure.pointOpacity ?? 1;
            const mPointFill = measure.pointFillColor || '#ffffff';
            const mPointOutline = measure.pointOutlineColor || '#1a1a1a';
            const mPointOutlineWidth = measure.pointOutlineWidth ?? 2;
            const mHighlight = measure.highlightEndpoints === true;

            const showNumbers = measure.showNumbers !== false;
            const numberFontSize = measure.numberFontSize ?? 10;
            const numberColor = measure.numberColor || '#1a1a1a';
            const numberOutlineColor =
              measure.numberOutlineColor || '#ffffff';
            const numberOutlineWidth = measure.numberOutlineWidth ?? 1;
            const numberStyle: MeasureNumberStyle | undefined =
              measure.numberStyle || 'fill-and-outline';

            const isBeingEdited = item.id === editingItemId;

            if (measure.positions.length >= 2) {
              const positions = measure.positions.map(function (p: any) {
                return Cesium.Cartesian3.fromDegrees(
                  p.lon,
                  p.lat,
                  p.height || 0
                );
              });
              const closedPositions = measure.closed
                ? positions.concat([positions[0]])
                : positions;

              addSimpleLine(
                viewer,
                measure.id + '-line',
                closedPositions,
                mLineColor,
                mLineOpacity,
                mLineWidth,
                mLineDash,
                false,
                op,
                measure.id
              );
            }

            measure.positions.forEach(function (p: any, idx: number) {
              const isStart = idx === 0;
              const isEnd =
                idx === measure.positions.length - 1 && !measure.closed;

              const pos = Cesium.Cartesian3.fromDegrees(
                p.lon,
                p.lat,
                p.height || 0
              );

              let fill = mPointFill;
              let outline = mPointOutline;
              if (mHighlight) {
                if (isStart) {
                  fill = '#ffffff';
                  outline = '#27ae60';
                } else if (isEnd) {
                  fill = '#ffffff';
                  outline = '#e74c3c';
                }
              }

              const numberText = showNumbers ? String(idx + 1) : null;

              const props = isBeingEdited
                ? new Cesium.PropertyBag({
                    isMeasureItem: true,
                    isMeasurePoint: true,
                    measureId: measure.id,
                    measureIndex: idx,
                  })
                : new Cesium.PropertyBag({
                    isMeasureItem: true,
                    measureId: measure.id,
                  });

              addMeasurePoint(
                viewer,
                measure.id + '-pt-' + idx,
                pos,
                mPointShape,
                mPointSize,
                fill,
                outline,
                mPointOutlineWidth,
                numberText,
                numberColor,
                numberOutlineColor,
                numberOutlineWidth,
                numberFontSize,
                numberStyle,
                mPointOpacity,
                op,
                props
              );
            });
          }
        }

        // ---------- FOLDER / KMLFILE ----------
        if (isContainer(item)) {
          const children = item.children;
          if (children) {
            children.forEach(function (child) {
              drawItem(child, visible, op);
            });
          }
        }
      }

      try {
        viewer.entities.suspendEvents();
        items.forEach(function (item) {
          drawItem(item, true, 1);
        });
        if (importedItems && importedItems.length > 0) {
          importedItems.forEach(function (item) {
            drawItem(item, true, 1);
          });
        }
      } finally {
        viewer.entities.resumeEvents();
      }

      // =====================================================
      // Временная линейка
      // =====================================================
      if (measurePoints.length > 0) {
        const ms = settings.measure;
        const lineColorStr = ms.lineColor || '#1a1a1a';
        const lineWidth = ms.lineWidth || 2;
        const lineOpacity = ms.lineOpacity ?? 0.7;
        const lineDash = ms.lineDash || 'solid';

        const pointShape = ms.pointShape || 'double-circle';
        const pointSize = ms.pointSize || 14;
        const pointOpacity = ms.pointOpacity ?? 1;
        const pointFill = ms.pointFillColor || '#ffffff';
        const pointOutline = ms.pointOutlineColor || '#1a1a1a';
        const pointOutlineWidth = ms.pointOutlineWidth ?? 2;
        const highlight = ms.highlightEndpoints === true;

        const showNumbers = ms.showNumbers !== false;
        const numberFontSize = ms.numberFontSize ?? 10;
        const numberColor = ms.numberColor || '#1a1a1a';
        const numberOutlineColor = ms.numberOutlineColor || '#ffffff';
        const numberOutlineWidth = ms.numberOutlineWidth ?? 1;
        const numberStyle = ms.numberStyle || 'fill-and-outline';

        if (measurePoints.length >= 2) {
          const positions = measurePoints.map(function (p) {
            return Cesium.Cartesian3.fromDegrees(
              p.lon,
              p.lat,
              p.height || 0
            );
          });
          const linePositions = measureClosed
            ? positions.concat([positions[0]])
            : positions;

          addSimpleLine(
            viewer,
            '_tmp-measure-line',
            linePositions,
            lineColorStr,
            lineOpacity,
            lineWidth,
            lineDash,
            false,
            1
          );
        }

        measurePoints.forEach(function (p, idx) {
          const isStart = idx === 0;
          const isEnd =
            idx === measurePoints.length - 1 && !measureClosed;

          let fill = pointFill;
          let outline = pointOutline;
          if (highlight) {
            if (isStart) {
              fill = '#ffffff';
              outline = '#27ae60';
            } else if (isEnd) {
              fill = '#ffffff';
              outline = '#e74c3c';
            }
          }

          const pos = Cesium.Cartesian3.fromDegrees(
            p.lon,
            p.lat,
            p.height || 0
          );

          const numberText = showNumbers ? String(idx + 1) : null;

          const props = new Cesium.PropertyBag({
            isMeasurePoint: true,
            measureIndex: idx,
          });

          addMeasurePoint(
            viewer,
            '_tmp-measure-point-' + idx,
            pos,
            pointShape,
            pointSize,
            fill,
            outline,
            pointOutlineWidth,
            numberText,
            numberColor,
            numberOutlineColor,
            numberOutlineWidth,
            numberFontSize,
            numberStyle,
            pointOpacity,
            1,
            props
          );
        });
      }

      if (onAfterRenderRef.current) onAfterRenderRef.current();

      try {
        viewer.scene.requestRender();
      } catch (e) {}
    },
    [
      viewerReady,
      viewerRef,
      items,
      importedItems,
      colors.markerDefault,
      settings,
      billboardsRef,
      measurePoints,
      measureClosed,
      editingItemId,
    ]
  );
}