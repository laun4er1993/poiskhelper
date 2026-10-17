// =====================================================
// src/types/logs.ts
// Типы для журнала действий и буфера обмена
// =====================================================

import type { TreeItem } from './base';

export type LogType =
  | 'add'
  | 'delete'
  | 'move'
  | 'copy'
  | 'paste'
  | 'cut'
  | 'rename'
  | 'import'
  | 'export'
  | 'visibility'
  | 'update'
  | 'measure'
  | 'save'
  | 'load'
  | 'new'
  | 'undo'
  | 'redo'
  | 'sort'
  | 'pin'
  | 'project';

export interface LogEntry {
  id: string;
  time: string;
  type: LogType;
  message: string;
  details?: string;
}

export interface ClipboardData {
  items: TreeItem[];
  operation: 'copy' | 'cut';
  sourceFolderId: string | null;
}