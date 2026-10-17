// =====================================================
// src/types/icons.ts
// Пресеты иконок меток (совместимо с Google Earth Pro)
// =====================================================

export interface PlacemarkIcon {
  id: string;
  label: string;
  href: string;
}

export const PLACEMARK_ICONS: PlacemarkIcon[] = [
  { id: 'default', label: 'По умолчанию', href: '' },
  { id: 'red-circle', label: 'Красный круг', href: 'https://maps.google.com/mapfiles/kml/paddle/red-circle.png' },
  { id: 'blu-circle', label: 'Синий круг', href: 'https://maps.google.com/mapfiles/kml/paddle/blu-circle.png' },
  { id: 'grn-circle', label: 'Зелёный круг', href: 'https://maps.google.com/mapfiles/kml/paddle/grn-circle.png' },
  { id: 'ylw-circle', label: 'Жёлтый круг', href: 'https://maps.google.com/mapfiles/kml/paddle/ylw-circle.png' },
  { id: 'purple-circle', label: 'Фиолетовый круг', href: 'https://maps.google.com/mapfiles/kml/paddle/purple-circle.png' },
  { id: 'pink-circle', label: 'Розовый круг', href: 'https://maps.google.com/mapfiles/kml/paddle/pink-circle.png' },
  { id: 'orange-circle', label: 'Оранжевый круг', href: 'https://maps.google.com/mapfiles/kml/paddle/orange-circle.png' },
  { id: 'wht-circle', label: 'Белый круг', href: 'https://maps.google.com/mapfiles/kml/paddle/wht-circle.png' },
  { id: 'ltblu-circle', label: 'Голубой круг', href: 'https://maps.google.com/mapfiles/kml/paddle/ltblu-circle.png' },
  { id: 'red-pushpin', label: 'Красная булавка', href: 'https://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png' },
  { id: 'blue-pushpin', label: 'Синяя булавка', href: 'https://maps.google.com/mapfiles/kml/pushpin/blue-pushpin.png' },
  { id: 'grn-pushpin', label: 'Зелёная булавка', href: 'https://maps.google.com/mapfiles/kml/pushpin/grn-pushpin.png' },
  { id: 'ylw-pushpin', label: 'Жёлтая булавка', href: 'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png' },
  { id: 'purple-pushpin', label: 'Фиолетовая булавка', href: 'https://maps.google.com/mapfiles/kml/pushpin/purple-pushpin.png' },
  { id: 'pink-pushpin', label: 'Розовая булавка', href: 'https://maps.google.com/mapfiles/kml/pushpin/pink-pushpin.png' },
  { id: 'square', label: 'Квадрат', href: 'https://maps.google.com/mapfiles/kml/shapes/square.png' },
  { id: 'diamond', label: 'Ромб', href: 'https://maps.google.com/mapfiles/kml/shapes/donut.png' },
  { id: 'triangle', label: 'Треугольник', href: 'https://maps.google.com/mapfiles/kml/shapes/triangle.png' },
  { id: 'star', label: 'Звезда', href: 'https://maps.google.com/mapfiles/kml/shapes/star.png' },
  { id: 'cross', label: 'Крест', href: 'https://maps.google.com/mapfiles/kml/shapes/cross-hairs.png' },
  { id: 'target', label: 'Мишень', href: 'https://maps.google.com/mapfiles/kml/shapes/placemark_circle.png' },
];

export function findPlacemarkIcon(href: string): PlacemarkIcon | undefined {
  return PLACEMARK_ICONS.find(function (i) {
    return i.href === href;
  });
}