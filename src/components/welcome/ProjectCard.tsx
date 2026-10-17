// =====================================================
// src/components/welcome/ProjectCard.tsx
// Карточка недавнего проекта на экране приветствия
// =====================================================

import { FolderOpen, Trash2, Clock, HardDrive } from 'lucide-react';
import { formatFileSize, formatRelativeDate } from '../../types/format';
import type { ProjectCardProps } from './types';

function ProjectCard({
  project,
  onOpen,
  onRemove,
  disabled,
}: ProjectCardProps) {
  const handleOpen = function () {
    if (disabled) return;
    onOpen(project.path);
  };

  const handleRemove = function (e: React.MouseEvent) {
    e.stopPropagation();
    if (disabled) return;
    onRemove(project.path);
  };

  const handleKeyDown = function (e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      title={project.path}
    >
      <div style={styles.iconWrap}>
        <FolderOpen size={22} color="var(--accent)" />
      </div>

      <div style={styles.content}>
        <div style={styles.name} title={project.name}>
          {project.name}
        </div>
        <div style={styles.path} title={project.path}>
          {project.path}
        </div>
        <div style={styles.meta}>
          <span style={styles.metaItem}>
            <Clock size={10} />
            {formatRelativeDate(project.openedAt)}
          </span>
          {project.sizeBytes !== undefined && project.sizeBytes > 0 && (
            <span style={styles.metaItem}>
              <HardDrive size={10} />
              {formatFileSize(project.sizeBytes)}
            </span>
          )}
        </div>
      </div>

      <button
        style={styles.removeBtn}
        onClick={handleRemove}
        title="Убрать из списка (файл останется на диске)"
        disabled={disabled}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    transition: 'all 0.15s',
    position: 'relative',
    outline: 'none',
  },
  iconWrap: {
    width: 42,
    height: 42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-surface-hover)',
    borderRadius: 'var(--radius-small)',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  name: {
    fontSize: 13.5,
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  path: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    direction: 'rtl',
    textAlign: 'left',
  },
  meta: {
    display: 'flex',
    gap: 12,
    marginTop: 2,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10.5,
    color: 'var(--text-secondary)',
  },
  removeBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    flexShrink: 0,
    opacity: 0.6,
    transition: 'all 0.15s',
  },
};

export default ProjectCard;