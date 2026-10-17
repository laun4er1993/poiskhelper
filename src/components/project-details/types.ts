// =====================================================
// src/components/project-details/types.ts
// Типы для диалога сведений о проекте
// =====================================================

import type {
  ProjectMeta,
  HomeCamera,
  ProjectStats,
  DateFormat,
  AppLanguage,
} from '../../types/project';
import type {
  DistanceUnit,
  HeightUnit,
  CoordinateFormat,
} from '../../types/units';

export type {
  ProjectMeta,
  HomeCamera,
  ProjectStats,
  DateFormat,
  AppLanguage,
  DistanceUnit,
  HeightUnit,
  CoordinateFormat,
};

export interface ProjectDetailsDialogProps {
  meta: ProjectMeta;
  projectPath: string | null;
  stats: ProjectStats;
  /** Текущее положение камеры (для «Сохранить текущее как домашнее») */
  currentCamera: HomeCamera | null;
  onSave: (updates: Partial<ProjectMeta>) => void;
  onChangePath: () => void;
  onClose: () => void;
  onFlyToHome: (cam: HomeCamera) => void;
}

// -----------------------------------------------------
// Палитра цветов-меток проекта
// -----------------------------------------------------
export const COLOR_TAGS: string[] = [
  '#4a90d9',
  '#c9a227',
  '#2b7a78',
  '#c0392b',
  '#8e44ad',
  '#16a085',
  '#d35400',
  '#2c3e50',
];