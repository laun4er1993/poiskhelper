// =====================================================
// src/components/globe/utils/labels.ts
// Построение подписи для объекта
// =====================================================

import * as Cesium from 'cesium';
import type { TreeItem, AppSettings, LabelSettings } from '../../../types';
import { mergeLabelSettings } from '../../../types/labels';
import { HUGE_DISTANCE } from '../constants';
import { tintColor } from './colors';
import {
  verticalOriginFromNumber,
  horizontalOriginFromNumber,
  labelStyleFromString,
} from './origins';

// Дефолтный offsetY, относительно которого считаем «дельту» пользователя
const DEFAULT_OFFSET_Y = -14;
// Зазор между верхушкой иконки и подписью (в пикселях)
const ICON_LABEL_GAP = 4;

/**
 * Создаёт Cesium.LabelGraphics на основе глобальных настроек и локальных
 * переопределений объекта.
 *
 * @param heightReference — как привязать подпись к рельефу.
 */
export function buildLabel(
  item: TreeItem,
  settings: AppSettings,
  effectiveOpacity: number,
  pixelSize: number,
  isIcon: boolean,
  heightReference: Cesium.HeightReference = Cesium.HeightReference.NONE
): Cesium.LabelGraphics | undefined {
  const ls: LabelSettings = mergeLabelSettings(
    settings.labelDefaults,
    item.labelSettings
  );
  if (!ls.show) return undefined;

  const labelAlpha = Math.max(0, Math.min(1, ls.opacity * effectiveOpacity));
  if (labelAlpha <= 0.001) return undefined;

  let near = 0;
  if (ls.fadeInAtDistance > 0) near = ls.fadeInAtDistance;

  let far = HUGE_DISTANCE;
  if (ls.hideAtDistance > 0) far = ls.hideAtDistance;
  if (settings.hideAllLabelsOnZoomOut && settings.zoomOutLabelThreshold > 0) {
    far = Math.min(far, settings.zoomOutLabelThreshold);
  }

  const font = ls.fontFamily
    ? ls.fontSize + 'px ' + ls.fontFamily
    : ls.fontSize + 'px Segoe UI';

  // =====================================================
  // ⚡ РАСЧЁТ СМЕЩЕНИЯ
  // =====================================================
  //
  // Для ИКОНКИ:
  //   - иконка «сидит» низом на позиции (verticalOrigin=BOTTOM)
  //   - подпись должна быть сразу над её верхушкой
  //   - отступ = -(pixelSize + gap) + (пользовательская дельта)
  //
  // Для КРУЖКА:
  //   - кружок в центре позиции
  //   - подпись смещена на ls.offsetY как раньше
  //
  let offsetY: number;
  if (isIcon) {
    const userDelta = ls.offsetY - DEFAULT_OFFSET_Y;
    offsetY = -(pixelSize + ICON_LABEL_GAP) + userDelta;
  } else {
    offsetY = ls.offsetY;
  }

  // Для иконки дополнительно выравниваем по центру
  const horizontalOrigin = horizontalOriginFromNumber(ls.horizontalOrigin);
  const verticalOrigin = verticalOriginFromNumber(ls.verticalOrigin);

  return new Cesium.LabelGraphics({
    text: item.name,
    font: font,
    scale: ls.scale || 1,
    fillColor: tintColor(ls.fillColor, labelAlpha),
    outlineColor: tintColor(ls.outlineColor, labelAlpha),
    outlineWidth: ls.outlineWidth,
    style: labelStyleFromString(ls.style),
    showBackground: ls.showBackground,
    backgroundColor: tintColor(
      ls.backgroundColor,
      labelAlpha * ls.backgroundAlpha
    ),
    backgroundPadding: new Cesium.Cartesian2(ls.paddingX, ls.paddingY),
    pixelOffset: new Cesium.Cartesian2(ls.offsetX, offsetY),
    verticalOrigin: verticalOrigin,
    horizontalOrigin: horizontalOrigin,
    heightReference: heightReference,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(near, far),
  });
}