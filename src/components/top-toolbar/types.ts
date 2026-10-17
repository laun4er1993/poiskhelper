// =====================================================
// src/components/top-toolbar/types.ts
// Типы для верхней панели инструментов
// =====================================================

export interface TopToolbarProps {
  clickMode: 'select' | 'add-marker' | 'measure';
  projectName: string;
  hasUnsavedChanges: boolean;

  onSetMode: (mode: 'select' | 'add-marker' | 'measure') => void;
  onAddMarker: () => void;
  onAddFolder: () => void;
  onStartMeasure: () => void;

  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onSaveProjectAs: () => void;
  /** Закрыть текущий проект и вернуться на экран приветствия */
  onExitProject: () => void;

  onImport: () => void;
  onExportSelected: () => void;
  onExportProjectKmz: () => void;
  onScreenshot: () => void;

  onOpenSettings: () => void;
  onOpenProjectDetails: () => void;
  onRenameProject?: () => void;
}