// =====================================================
// src/components/tree/SortSubmenu.tsx
// Подменю сортировки в контекстном меню
// =====================================================

import {
  ArrowDownAZ,
  ArrowUpZA,
  Calendar,
  Type as TypeIcon,
  ListOrdered,
  Check,
} from 'lucide-react';
import type { TreeItem } from '../../types/base';
import type { SortField, SortOrder } from '../../types/base';
import { getSortField, getSortOrder } from '../../types/tree-utils';

// =====================================================
// === Пропсы ===
// =====================================================
interface SortSubmenuProps {
  item: TreeItem;
  onSort: (field: SortField, order: SortOrder) => void;
}

// =====================================================
// === Компонент ===
// =====================================================
function SortSubmenu({ item, onSort }: SortSubmenuProps) {
  const currentField = getSortField(item);
  const currentOrder = getSortOrder(item);

  const options: Array<{
    field: SortField;
    order: SortOrder;
    label: string;
    icon: any;
  }> = [
    { field: 'name', order: 'asc', label: 'Имя (А → Я)', icon: ArrowDownAZ },
    { field: 'name', order: 'desc', label: 'Имя (Я → А)', icon: ArrowUpZA },
    { field: 'type', order: 'asc', label: 'По типу', icon: TypeIcon },
    { field: 'date', order: 'asc', label: 'По дате (старые)', icon: Calendar },
    { field: 'date', order: 'desc', label: 'По дате (новые)', icon: Calendar },
    {
      field: 'manual',
      order: 'asc',
      label: 'По порядку добавления',
      icon: ListOrdered,
    },
  ];

  return (
    <div style={styles.submenu}>
      {options.map(function (opt, idx) {
        const active = currentField === opt.field && currentOrder === opt.order;
        const IconComp = opt.icon;
        return (
          <button
            key={idx}
            style={{
              ...styles.menuItem,
              color: active ? 'var(--accent)' : 'var(--text-primary)',
            }}
            onClick={function () {
              onSort(opt.field, opt.order);
            }}
          >
            <IconComp size={12} />
            <span style={{ flex: 1 }}>{opt.label}</span>
            {active && <Check size={11} />}
          </button>
        );
      })}
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  submenu: {
    position: 'absolute',
    left: '100%',
    top: 0,
    marginLeft: 2,
    backgroundColor: 'var(--bg-modal)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    boxShadow: 'var(--shadow-lg)',
    padding: 5,
    minWidth: 220,
    zIndex: 2147483647,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    width: '100%',
    padding: '7px 11px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 12.5,
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: 5,
    fontFamily: 'Segoe UI, sans-serif',
  },
};

export default SortSubmenu;