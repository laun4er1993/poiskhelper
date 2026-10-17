// =====================================================
// src/components/info-dialog/types.ts
// Типы для диалога «Свойства объекта»
// =====================================================

import type { TreeItem } from '../../types/base';

export interface InfoDialogProps {
  item: TreeItem;
  onClose: () => void;
  onCopyCoords: (text: string, label: string) => void;
}