// =====================================================
// src/components/properties/index.ts
// Реэкспорт модуля properties
// =====================================================

export type { PropertiesPanelProps, Draft } from './types';
export {
  DEFAULT_PIXEL_SIZE,
  DEFAULT_OUTLINE_COLOR,
  DEFAULT_OUTLINE_WIDTH,
} from './types';

export { default as PropertiesPanel } from './PropertiesPanel';
export { default as IconPreview } from './IconPreview';
export { default as IconPicker } from './IconPicker';
export { default as ColorSection } from './ColorSection';
export { default as LabelEditor } from './LabelEditor';
export { default as PlaceSection } from './sections/PlaceSection';
export { default as LineSection } from './sections/LineSection';
export { default as PolygonSection } from './sections/PolygonSection';
export { default as ContainerSection } from './sections/ContainerSection';
export { default as MeasureSection } from './sections/MeasureSection';