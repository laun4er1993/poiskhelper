// =====================================================
// src/components/settings/types.ts
// Типы и общие константы для SettingsPanel
// =====================================================

import type { Theme, ThemeColors } from '../../theme/types';
import type { AppSettings } from '../../types/settings';
import type { CustomMapSource } from '../../types/map-sources';

// -----------------------------------------------------
// Вкладки
// -----------------------------------------------------
export type TabId =
  | 'general'
  | 'text'
  | 'design'
  | 'popup'
  | 'screenshot'
  | 'createMenu'
  | 'measure'
  | 'theme'
  | 'map';

export interface TabDef {
  id: TabId;
  label: string;
  icon: any;
}

// -----------------------------------------------------
// Пропсы вкладок (общие)
// -----------------------------------------------------
export interface BaseTabProps {
  settings: AppSettings;
  onChange: (updater: Partial<AppSettings>) => void;
}

// -----------------------------------------------------
// Пропсы главной панели настроек
// -----------------------------------------------------
export interface SettingsPanelProps {
  settings: AppSettings;
  theme: Theme;
  colors: ThemeColors;
  show3DBuildings: boolean;
  onChange: (updater: Partial<AppSettings>) => void;
  onThemeChange: (theme: Theme) => void;
  onColorsChange: (colors: ThemeColors) => void;
  onToggle3DBuildings: () => void;
  /** ⚡ Открыть диалог добавления/редактирования своей карты */
  onNeedCustomDialog: (edit?: CustomMapSource | null) => void;
  onClose: () => void;
}