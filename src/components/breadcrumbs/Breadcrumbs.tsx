// =====================================================
// src/components/breadcrumbs/Breadcrumbs.tsx
// Хлебные крошки над деревом
// =====================================================

import { ChevronRight, Home, Folder as FolderIcon, FileText } from 'lucide-react';
import type { TreeItem } from '../../types/base';
import { isKmlFile, isFolder } from '../../types/base';

interface BreadcrumbsProps {
  path: TreeItem[];
  onNavigate: (id: string | null) => void;
}

function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
  if (path.length === 0) {
    return (
      <div style={styles.container}>
        <button
          style={styles.crumbRoot}
          onClick={function () {
            onNavigate(null);
          }}
          title="Корень проекта"
        >
          <Home size={11} />
          <span>Корень</span>
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button
        style={styles.crumbRoot}
        onClick={function () {
          onNavigate(null);
        }}
        title="Корень проекта"
      >
        <Home size={11} />
        <span>Корень</span>
      </button>

      {path.map(function (item, idx) {
        const isLast = idx === path.length - 1;
        return (
          <span key={item.id} style={styles.crumbSegment}>
            <ChevronRight size={10} color="var(--text-muted)" />
            <button
              style={{
                ...styles.crumb,
                color: isLast ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: isLast ? 600 : 500,
              }}
              onClick={function () {
                onNavigate(item.id);
              }}
              title={item.name}
            >
              {isFolder(item) && (
                <FolderIcon size={10} color="var(--warning)" />
              )}
              {isKmlFile(item) && (
                <FileText size={10} color="var(--success)" />
              )}
              <span style={styles.crumbText}>{item.name}</span>
            </button>
          </span>
        );
      })}
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    padding: '5px 8px',
    backgroundColor: 'var(--overlay-medium)',
    borderBottom: '1px solid var(--border)',
    fontSize: 11,
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontFamily: 'Segoe UI, sans-serif',
    userSelect: 'none',
    minHeight: 26,
  },
  crumbRoot: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 6px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  crumbSegment: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  crumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '2px 6px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
    maxWidth: 160,
  },
  crumbText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

export default Breadcrumbs;