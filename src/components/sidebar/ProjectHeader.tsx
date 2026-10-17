// =====================================================
// src/components/sidebar/ProjectHeader.tsx
// Шапка сайдбара: имя проекта + журнал
// =====================================================

import { FileText, Activity } from 'lucide-react';
import type { ProjectHeaderProps } from './types';

function ProjectHeader({
  projectName,
  logsCount,
  onOpenProjectDetails,
  onOpenLogs,
}: ProjectHeaderProps) {
  return (
    <div style={styles.header}>
      <span style={styles.icon}>
        <FileText size={11} color="var(--accent)" />
      </span>

      <button
        style={styles.nameBtn}
        onClick={onOpenProjectDetails}
        title={projectName + '\n\nКлик — открыть сведения о проекте'}
      >
        <span style={styles.name}>{projectName}</span>
      </button>

      <button
        style={styles.iconBtn}
        onClick={onOpenLogs}
        title="Журнал действий (Ctrl+L)"
      >
        <Activity size={11} />
        {logsCount > 0 && (
          <span style={styles.badge}>
            {logsCount > 99 ? '99+' : logsCount}
          </span>
        )}
      </button>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 6px 6px 8px',
    backgroundColor: 'var(--bg-panel-header)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    minHeight: 30,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    flexShrink: 0,
  },
  nameBtn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '2px 4px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 4,
    textAlign: 'left',
  },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  iconBtn: {
    position: 'relative',
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: 'var(--danger)',
    color: '#fff',
    fontSize: 8,
    fontWeight: 700,
    padding: '0px 3px',
    borderRadius: 6,
    minWidth: 12,
    textAlign: 'center',
    lineHeight: 1.4,
  },
};

export default ProjectHeader;