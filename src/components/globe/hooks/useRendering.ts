// =====================================================
// src/components/globe/hooks/useRendering.ts
// Отрисовка с инкрементальным diff + защита от коллизии id
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

interface DrawnEntry {
  entities: Cesium.Entity[];
  item: TreeItem;
  patch: Partial<any> | null;
}

interface UseRenderingParams {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  viewerReady: boolean;
  items: TreeItem[];
  importedItems: TreeItem[];
  previewOverrides: Record<string, Partial<any>>;
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

function getMeasureHeightReference(
  height: number | undefined | null
): Cesium.HeightReference {
  if (height === undefined || height === null) {
    return Cesium.HeightReference.CLAMP_TO_GROUND;
  }
  if (!isFinite(height)) {
    return Cesium.HeightReference.CLAMP_TO_GROUND;
  }
  if (Math.abs(height) < 0.001) {
    return Cesium.HeightReference.CLAMP_TO_GROUND;
  }
  return Cesium.HeightReference.NONE;
}

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

// ⚡ Безопасный add: если entity с таким id уже существует — удалить и добавить заново.
function safeAdd(
  viewer: Cesium.Viewer,
  options: Cesium.Entity.ConstructorOptions
): Cesium.Entity {
  if (options.id) {
    try {
      const existing = viewer.entities.getById(options.id);
      if (existing) {
        viewer.entities.remove(existing);
      }
    } catch (e) {}
  }
  return viewer.entities.add(options);
}

function removeAllOwnedEntities(viewer: Cesium.Viewer): void {
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
}

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

  if (shapeKey === 'square') {
    if (borderPx > 0) {
      ctx.fillStyle = outlineColor;
      ctx.fillRect(0, 0, totalPx, totalPx);
    }
    ctx.fillStyle = fillColor;
    ctx.fillRect(borderPx, borderPx, innerPx, innerPx);
  } else {
    if (borderPx > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.fillStyle = outlineColor;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  if (numberText) {
    const fontSize =
      Math.max(6, Math.min(numberFontSize, size * 0.85)) * scale;
    ctx.font = 'bold ' + fontSize + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (numberStyle === 'outline') {
      if (numberOutlineWidth > 0) {
        ctx.strokeStyle = numberOutlineColor;
        ctx.lineWidth = numberOutlineWidth * scale;
        ctx.strokeText(numberText, cx, cy);
      }
    } else if (numberStyle === 'fill') {
      ctx.fillStyle = numberColor;
      ctx.fillText(numberText, cx, cy);
    } else {
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
  if (pointCanvasCache.size > 500) {
    const firstKey = pointCanvasCache.keys().next().value;
    if (firstKey !== undefined) pointCanvasCache.delete(firstKey);
  }
  return url;
}

export function useRendering({
  viewerRef,
  viewerReady,
  items,
  importedItems,
  previewOverrides,
  settings,
  colors,
  billboardsRef,
  onAfterRender,
  measurePoints = [],
  measureClosed = false,
  editingItemId = null,
}: UseRenderingParams): void {
  const drawnRef = useRef<Map<string, DrawnEntry>>(new Map());
  const settingsHashRef = useRef<string>('');
  // ⚡ Force redraw — счётчик, чтобы форсировать re-run основного useEffect
  const forceRedrawRef = useRef<number>(0);

  const onAfterRenderRef = useRef(onAfterRender);
  useEffect(
    function () {
      onAfterRenderRef.current = onAfterRender;
    },
    [onAfterRender]
  );

  // ⚡ Подписка на подгрузку иконок.
  //   ВАЖНО: очищаем и drawn, и entity из viewer, чтобы не было коллизии id.
  useEffect(
    function () {
      const unsub = subscribeIconVersion(function () {
        const viewer = viewerRef.current;
        if (viewer && !viewer.isDestroyed()) {
          removeAllOwnedEntities(viewer);
        }
        drawnRef.current.clear();
        billboardsRef.current.clear();
        settingsHashRef.current = '';
        // ⚡ Форсируем re-run основного useEffect через смену "пустого"
        //   хэша. Но React не отследит изменение ref. Поэтому
        //   просто вызовем onAfterRender — следующий walk сработает.
        if (onAfterRenderRef.current) onAfterRenderRef.current();
      });
      return unsub;
    },
    [viewerRef, billboardsRef]
  );

  useEffect(
    function () {
      if (!viewerReady) return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const settingsHash =
        colors.markerDefault +
        '|' +
        (settings.labelDefaults.fillColor || '') +
        '|' +
        (settings.labelDefaults.fontSize || 0) +
        '|' +
        (settings.labelDefaults.show ? '1' : '0') +
        '|' +
        (settings.measure.lineColor || '') +
        '|' +
        (settings.measure.pointSize || 0) +
        '|' +
        (settings.measure.numberColor || '');

      const settingsChanged = settingsHashRef.current !== settingsHash;
      if (settingsChanged) {
        settingsHashRef.current = settingsHash;
        removeAllOwnedEntities(viewer);
        drawnRef.current.clear();
        billboardsRef.current.clear();
      }

      const drawn = drawnRef.current;

      function drawOne(
        rawItem: TreeItem,
        parentVisible: boolean,
        parentOpacity: number,
        patch: Partial<any> | null
      ): Cesium.Entity[] {
        const item = patch
          ? ({ ...rawItem, ...patch } as TreeItem)
          : rawItem;
        const visible = parentVisible && item.visible !== false;
        if (!visible) return [];

        const myOpacity = getItemOpacity(item);
        const op = parentOpacity * myOpacity;
        if (op <= 0.001) return [];

        const result: Cesium.Entity[] = [];

        // ---------- PLACE ----------
        if (item.type === 'place') {
          const place = item as Place;
          if (!isFinite(place.lat) || !isFinite(place.lon)) return [];

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
            if (hasIcon) {
              const styledUrl = getStyledIconDataUrl(
                place.iconHref || '',
                {
                  fillColor: fillColorStr,
                  fillOpacity: fillOpacity,
                  showFill: showFill,
                  outlineColor: outlineColorStr,
                  outlineOpacity: outlineOpacity,
                  showOutline: showOutline,
                  outlineWidth: outlineWidth,
                }
              );

              const iconUrl = styledUrl || place.iconHref;
              const useTint = !styledUrl;
              const mainScale = pixelSize / DEFAULT_ICON_NATIVE_SIZE;

              const entity = safeAdd(viewer, {
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
              entity.properties = new Cesium.PropertyBag({
                isPlace: true,
                placeId: place.id,
              });
              billboardsRef.current.set(entity.id, {
                entity: entity,
                baseScale: mainScale,
                ownerId: place.id,
              });
              result.push(entity);
            } else {
              const circleFill =
                showFill && fillOpacity > 0.001
                  ? fillColorStr
                  : 'transparent';
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
              const entity = safeAdd(viewer, {
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
              result.push(entity);
            }
          } catch (err) {
            console.error('drawOne place error:', err);
          }
        }

        // ---------- LINE ----------
        if (item.type === 'kmlline') {
          const line = item as any;
          if (line.positions && line.positions.length >= 2) {
            try {
              const positions = line.positions.map(function (p: any) {
                return Cesium.Cartesian3.fromDegrees(
                  p.lon,
                  p.lat,
                  p.height || 0
                );
              });
              const clampToGround = line.altitudeMode !== 'absolute';
              const entity = safeAdd(viewer, {
                id: line.id,
                polyline: new Cesium.PolylineGraphics({
                  positions: positions,
                  width: line.width || 3,
                  material: tintColor(line.color || '#f1c40f', op),
                  clampToGround: clampToGround,
                }),
              });
              entity.properties = new Cesium.PropertyBag({
                isKmlItem: true,
                kmlItemId: line.id,
                kmlItemType: 'kmlline',
              });
              result.push(entity);
            } catch (err) {
              console.error('drawOne line error:', err);
            }
          }
        }

        // ---------- POLYGON ----------
        if (item.type === 'kmlpolygon') {
          const poly = item as any;
          if (poly.positions && poly.positions.length >= 3) {
            try {
              const positions = poly.positions.map(function (p: any) {
                return Cesium.Cartesian3.fromDegrees(
                  p.lon,
                  p.lat,
                  p.height || 0
                );
              });
              const entity = safeAdd(viewer, {
                id: poly.id,
                polygon: new Cesium.PolygonGraphics({
                  hierarchy: new Cesium.PolygonHierarchy(positions),
                  material: tintColor(
                    poly.fillColor || '#4a90d9',
                    op * 0.6
                  ),
                  outline: true,
                  outlineColor: tintColor(
                    poly.outlineColor || '#ffffff',
                    op
                  ),
                  outlineWidth: poly.outlineWidth || 2,
                  perPositionHeight: false,
                }),
              });
              entity.properties = new Cesium.PropertyBag({
                isKmlItem: true,
                kmlItemId: poly.id,
                kmlItemType: 'kmlpolygon',
              });
              result.push(entity);
            } catch (err) {
              console.error('drawOne polygon error:', err);
            }
          }
        }

        // ---------- MEASURE ----------
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

              const baseColor = (function () {
                try {
                  return Cesium.Color.fromCssColorString(mLineColor);
                } catch (e) {
                  return Cesium.Color.YELLOW;
                }
              })();
              const alpha = Math.max(0, Math.min(1, mLineOpacity * op));
              const finalColor = baseColor.withAlpha(alpha);

              try {
                const material = buildLineMaterial(finalColor, mLineDash);
                const entity = safeAdd(viewer, {
                  id: measure.id + '-line',
                  polyline: new Cesium.PolylineGraphics({
                    positions: closedPositions,
                    width: mLineWidth,
                    material: material,
                    clampToGround: false,
                  }),
                });
                entity.properties = new Cesium.PropertyBag({
                  isMeasureLine: true,
                  measureId: measure.id,
                });
                result.push(entity);
              } catch (e) {
                console.error('drawOne measure line error:', e);
              }
            }

            measure.positions.forEach(function (p: any, idx: number) {
              if (!isFinite(p.lat) || !isFinite(p.lon)) return;

              const isStart = idx === 0;
              const isEnd =
                idx === measure.positions.length - 1 && !measure.closed;

              const pos = Cesium.Cartesian3.fromDegrees(
                p.lon,
                p.lat,
                p.height || 0
              );
              const heightRef = getMeasureHeightReference(p.height);

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
              const pointAlpha = Math.max(
                0,
                Math.min(1, op * mPointOpacity)
              );

              try {
                const dataUrl = getMeasurePointBillboardUrl(
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
                  numberStyle
                );

                const billboardScale = 1 / POINT_CANVAS_SCALE;

                const entity = safeAdd(viewer, {
                  id: measure.id + '-pt-' + idx,
                  position: pos,
                  billboard: new Cesium.BillboardGraphics({
                    image: dataUrl,
                    scale: billboardScale,
                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    color: Cesium.Color.WHITE.withAlpha(pointAlpha),
                    heightReference: heightRef,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                  }),
                });
                entity.properties = isBeingEdited
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
                result.push(entity);
              } catch (err) {
                console.error('drawOne measure point error:', err);
              }
            });
          }
        }

        return result;
      }

      const seenIds = new Set<string>();

      function walk(
        rawItem: TreeItem,
        parentVisible: boolean,
        parentOpacity: number
      ) {
        if (!rawItem) return;
        seenIds.add(rawItem.id);

        const patch = previewOverrides[rawItem.id] || null;
        const prev = drawn.get(rawItem.id);

        const patchItem = patch
          ? ({ ...rawItem, ...patch } as TreeItem)
          : rawItem;
        const isVisible =
          parentVisible && patchItem.visible !== false;

        const wasVisible = !!(prev && prev.entities.length > 0);

        const itemChanged = !prev || prev.item !== rawItem;
        const patchChanged = !prev || prev.patch !== patch;
        const needsRedraw =
          settingsChanged || itemChanged || patchChanged;

        if (needsRedraw || (wasVisible && !isVisible)) {
          if (prev) {
            for (let i = 0; i < prev.entities.length; i++) {
              try {
                viewer.entities.remove(prev.entities[i]);
              } catch (e) {}
            }
            billboardsRef.current.delete(rawItem.id);
          }

          if (isVisible) {
            const newEntities = drawOne(
              rawItem,
              parentVisible,
              parentOpacity,
              patch
            );
            drawn.set(rawItem.id, {
              entities: newEntities,
              item: rawItem,
              patch: patch,
            });
          } else {
            drawn.set(rawItem.id, {
              entities: [],
              item: rawItem,
              patch: patch,
            });
          }
        }

        if (isContainer(rawItem)) {
          const effectiveItem = patchItem;
          const childVisible =
            parentVisible && effectiveItem.visible !== false;
          const childOpacity =
            parentOpacity * getItemOpacity(effectiveItem);

          effectiveItem.children.forEach(function (child) {
            walk(child, childVisible, childOpacity);
          });
        }
      }

      try {
        viewer.entities.suspendEvents();
        items.forEach(function (item) {
          walk(item, true, 1);
        });
        if (importedItems && importedItems.length > 0) {
          importedItems.forEach(function (item) {
            walk(item, true, 1);
          });
        }
      } finally {
        viewer.entities.resumeEvents();
      }

      const toDeleteKeys: string[] = [];
      drawn.forEach(function (entry, id) {
        if (!seenIds.has(id)) {
          toDeleteKeys.push(id);
          for (let i = 0; i < entry.entities.length; i++) {
            try {
              viewer.entities.remove(entry.entities[i]);
            } catch (e) {}
          }
          billboardsRef.current.delete(id);
        }
      });
      for (let i = 0; i < toDeleteKeys.length; i++) {
        drawn.delete(toDeleteKeys[i]);
      }

      // Временная линейка
      const tmpToRemove: Cesium.Entity[] = [];
      viewer.entities.values.forEach(function (entity) {
        if (
          typeof entity.id === 'string' &&
          entity.id.indexOf('_tmp-measure-') === 0
        ) {
          tmpToRemove.push(entity);
        }
      });
      tmpToRemove.forEach(function (e) {
        try {
          viewer.entities.remove(e);
        } catch (err) {}
      });

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
          try {
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

            const baseColor = (function () {
              try {
                return Cesium.Color.fromCssColorString(lineColorStr);
              } catch (e) {
                return Cesium.Color.YELLOW;
              }
            })();
            const finalColor = baseColor.withAlpha(
              Math.max(0, Math.min(1, lineOpacity))
            );
            const material = buildLineMaterial(finalColor, lineDash);

            const entity = safeAdd(viewer, {
              id: '_tmp-measure-line',
              polyline: new Cesium.PolylineGraphics({
                positions: linePositions,
                width: lineWidth,
                material: material,
                clampToGround: false,
              }),
            });
            entity.properties = new Cesium.PropertyBag({
              isMeasureLine: true,
            });
          } catch (e) {}
        }

        measurePoints.forEach(function (p, idx) {
          if (!isFinite(p.lat) || !isFinite(p.lon)) return;

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
          const heightRef = getMeasureHeightReference(p.height);
          const numberText = showNumbers ? String(idx + 1) : null;

          try {
            const dataUrl = getMeasurePointBillboardUrl(
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
              numberStyle
            );
            const billboardScale = 1 / POINT_CANVAS_SCALE;

            const entity = safeAdd(viewer, {
              id: '_tmp-measure-point-' + idx,
              position: pos,
              billboard: new Cesium.BillboardGraphics({
                image: dataUrl,
                scale: billboardScale,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                color: Cesium.Color.WHITE.withAlpha(pointOpacity),
                heightReference: heightRef,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              }),
            });
            entity.properties = new Cesium.PropertyBag({
              isMeasurePoint: true,
              measureIndex: idx,
            });
          } catch (err) {
            console.error('tmp measure point error:', err);
          }
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
      previewOverrides,
      settings,
      colors,
      billboardsRef,
      measurePoints,
      measureClosed,
      editingItemId,
    ]
  );
}