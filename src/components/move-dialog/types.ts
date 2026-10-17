// =====================================================
// src/components/move-dialog/types.ts
// Типы для диалога перемещения
// =====================================================

import type { TreeItem } from '../../types/base';

export interface MoveDialogProps {
  items: TreeItem[];
  movingIds: string[];
  onConfirm: (targetFolderId: string) => void;
  onCancel: () => void;
}

export interface FolderNode {
  id: string;
  name: string;
  depth: number;
  isKml: boolean;
  disabled: boolean;
  disabledReason?: string;
  hasChildren: boolean;
  parentId: string | null;
}