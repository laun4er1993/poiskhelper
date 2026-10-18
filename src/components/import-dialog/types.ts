// =====================================================
// src/components/import-dialog/types.ts
// Типы для диалога импорта KML/KMZ
// =====================================================

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

/**
 * Опциональные дефолты из настроек приложения
 * (settings.importDefaults).
 */
export interface ImportDefaults {
  visible?: boolean;
  startCollapsed?: boolean;
  color?: string;
  pixelSize?: number;
}

export interface ImportDialogProps {
  fileName: string;
  objectCount: number;
  sizeBytes?: number;
  defaults?: ImportDefaults;
  onConfirm: (options: ImportOptions) => void;
  onCancel: () => void;
}