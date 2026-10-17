// =====================================================
// src/components/welcome/types.ts
// Типы для экрана приветствия
// =====================================================

import type { RecentProject } from '../../types/project';
import type { AppSettings } from '../../types/settings';
import type { Theme } from '../../theme/types';

export interface WelcomeScreenProps {
  recentProjects: RecentProject[];
  settings: AppSettings;
  theme: Theme;
  busy?: boolean;
  busyMessage?: string;
  onNewProject: () => void;
  onOpenProject: () => void;
  onOpenRecent: (path: string) => void;
  onRemoveRecent: (path: string) => void;
  onClearRecent: () => void;
  onSettingsChange: (updater: Partial<AppSettings>) => void;
  onThemeChange: (theme: Theme) => void;
  onSkip: () => void;
}

export interface ProjectCardProps {
  project: RecentProject;
  onOpen: (path: string) => void;
  onRemove: (path: string) => void;
  disabled?: boolean;
}