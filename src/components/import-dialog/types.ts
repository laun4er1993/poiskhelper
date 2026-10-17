// =====================================================
// src/components/import-dialog/types.ts
// Типы для диалога импорта
// =====================================================

export interface ImportOptions {
  color: string;
  pixelSize: number;
  visible: boolean;
  flyToBounds: boolean;
  showLabels: boolean;
  showHidden: boolean;
  /** Импортировать LineString как MeasureItem */
  importLinesAsMeasures?: boolean;
  /** Тип линейки по умолчанию для импортированных линий */
  defaultRulerType?: 'path' | 'area' | 'profile';
}

export interface ImportDialogProps {
  fileName: string;
  objectCount: number;
  sizeBytes?: number;
  onConfirm: (options: ImportOptions) => void;
  onCancel: () => void;
}