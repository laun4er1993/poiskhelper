// =====================================================
// src/components/settings/index.ts
// Реэкспорт модуля settings
// =====================================================

export type {
  TabId,
  TabDef,
  SettingsPanelProps,
  BaseTabProps,
} from './types';

export { default as SettingsPanel } from './SettingsPanel';
export { default as GeneralTab } from './tabs/GeneralTab';
export { default as TextTab } from './tabs/TextTab';
export { default as DesignTab } from './tabs/DesignTab';
export { default as PopupTab } from './tabs/PopupTab';
export { default as ScreenshotTab } from './tabs/ScreenshotTab';
export { default as CreateMenuTab } from './tabs/CreateMenuTab';
export { default as MeasureTab } from './tabs/MeasureTab';
export { default as ThemeTab } from './tabs/ThemeTab';
export { default as MapTab } from './tabs/MapTab';