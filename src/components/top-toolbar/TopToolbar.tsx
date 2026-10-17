// =====================================================
// src/components/top-toolbar/TopToolbar.tsx
// Верхняя панель инструментов
// =====================================================

import { useState } from 'react';
import {
  MousePointer2,
  MapPin,
  Save,
  SaveAll,
  FolderOpen,
  Settings,
  Ruler,
  Download,
  FilePlus,
  FolderPlus,
  Camera,
  Package,
  FileInput,
  Settings2,
  LogOut,
} from 'lucide-react';
import ToolbarButton from './ToolbarButton';
import ToolbarDivider from './ToolbarDivider';
import type { TopToolbarProps } from './types';

// =====================================================
// === Компонент ===
// =====================================================
function TopToolbar({
  clickMode,
  projectName,
  hasUnsavedChanges,
  onSetMode,
  onAddMarker,
  onAddFolder,
  onStartMeasure,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
  onExitProject,
  onImport,
  onExportSelected,
  onExportProjectKmz,
  onScreenshot,
  onOpenSettings,
  onOpenProjectDetails,
}: TopToolbarProps) {
  const [hoverGroup, setHoverGroup] = useState<string | null>(null);

  const iconSize = 14;

  const groupEnter = function (name: string) {
    return function () {
      setHoverGroup(name);
    };
  };
  const groupLeave = function () {
    setHoverGroup(null);
  };

  return (
    <div style={styles.toolbar}>
      {/* ============ ЛОГОТИП ============ */}
      <div style={styles.brand}>
        <span style={styles.brandDot} />
        <span style={styles.brandText}>PoiskHelper</span>
      </div>

      <ToolbarDivider
        label="Файл"
        isActive={hoverGroup === 'file'}
        onHover={function (v) {
          setHoverGroup(v ? 'file' : null);
        }}
      />

      {/* ============ ФАЙЛ ============ */}
      <div
        style={styles.group}
        title="Проект: создать, открыть, сохранить"
        onMouseEnter={groupEnter('file')}
        onMouseLeave={groupLeave}
      >
        <ToolbarButton
          icon={<FilePlus size={iconSize} />}
          title="Новый проект (Ctrl+N)"
          onClick={onNewProject}
        />
        <ToolbarButton
          icon={<FolderOpen size={iconSize} />}
          title="Открыть проект (Ctrl+O)"
          onClick={onOpenProject}
        />
        <ToolbarButton
          icon={<Save size={iconSize} />}
          title={
            hasUnsavedChanges
              ? 'Сохранить проект (Ctrl+S) — есть несохранённые изменения'
              : 'Сохранить проект (Ctrl+S)'
          }
          onClick={onSaveProject}
          hasDot={hasUnsavedChanges}
        />
        <ToolbarButton
          icon={<SaveAll size={iconSize} />}
          title="Сохранить как… (Ctrl+Shift+S)"
          onClick={onSaveProjectAs}
        />
        <ToolbarButton
          icon={<LogOut size={iconSize} />}
          title="Закрыть проект и вернуться на экран приветствия"
          onClick={onExitProject}
        />
      </div>

      <ToolbarDivider
        label="Инструменты"
        isActive={hoverGroup === 'tools'}
        onHover={function (v) {
          setHoverGroup(v ? 'tools' : null);
        }}
      />

      {/* ============ ИНСТРУМЕНТЫ ============ */}
      <div
        style={styles.group}
        title="Инструменты: режим, метка, измерение, папка"
        onMouseEnter={groupEnter('tools')}
        onMouseLeave={groupLeave}
      >
        <ToolbarButton
          icon={<MousePointer2 size={iconSize} />}
          title="Режим выбора (Esc)"
          onClick={function () {
            onSetMode('select');
          }}
          active={clickMode === 'select'}
        />
        <ToolbarButton
          icon={<MapPin size={iconSize} />}
          title="Добавить метку — клик по карте"
          onClick={onAddMarker}
          active={clickMode === 'add-marker'}
        />
        <ToolbarButton
          icon={<Ruler size={iconSize} />}
          title="Измерить расстояние"
          onClick={onStartMeasure}
          active={clickMode === 'measure'}
        />
        <ToolbarButton
          icon={<FolderPlus size={iconSize} />}
          title="Создать папку"
          onClick={onAddFolder}
        />
      </div>

      <ToolbarDivider
        label="Данные"
        isActive={hoverGroup === 'data'}
        onHover={function (v) {
          setHoverGroup(v ? 'data' : null);
        }}
      />

      {/* ============ ДАННЫЕ ============ */}
      <div
        style={styles.group}
        title="Импорт и экспорт данных"
        onMouseEnter={groupEnter('data')}
        onMouseLeave={groupLeave}
      >
        <ToolbarButton
          icon={<FileInput size={iconSize} />}
          title="Импорт KML / KMZ"
          onClick={onImport}
        />
        <ToolbarButton
          icon={<Download size={iconSize} />}
          title="Экспорт выделенного объекта"
          onClick={onExportSelected}
        />
        <ToolbarButton
          icon={<Package size={iconSize} />}
          title="Экспорт всего проекта в KMZ"
          onClick={onExportProjectKmz}
        />
      </div>

      <ToolbarDivider
        label="Вывод"
        isActive={hoverGroup === 'output'}
        onHover={function (v) {
          setHoverGroup(v ? 'output' : null);
        }}
      />

      {/* ============ ВЫВОД ============ */}
      <div
        style={styles.group}
        title="Снимок экрана глобуса"
        onMouseEnter={groupEnter('output')}
        onMouseLeave={groupLeave}
      >
        <ToolbarButton
          icon={<Camera size={iconSize} />}
          title="Снимок экрана (только глобус)"
          onClick={onScreenshot}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* ============ ИМЯ ПРОЕКТА ============ */}
      <div style={styles.projectBlock}>
        <button
          style={styles.projectName}
          onClick={onOpenProjectDetails}
          title={
            projectName +
            '\n\nКлик — открыть настройки проекта (название, автор, описание)'
          }
        >
          {hasUnsavedChanges && <span style={styles.projectDot} />}
          <span style={styles.projectText}>{projectName}</span>
        </button>

        <button
          style={styles.projectActionBtn}
          onClick={onOpenProjectDetails}
          title="Сведения о проекте"
        >
          <Settings2 size={12} />
        </button>
      </div>

      {/* ============ НАСТРОЙКИ ============ */}
      <ToolbarButton
        icon={<Settings size={iconSize} />}
        title="Настройки"
        onClick={onOpenSettings}
      />
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    height: 'var(--toolbar-height, 42px)',
    backgroundColor: 'var(--bg-panel-header)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 var(--toolbar-padding, 10px)',
    gap: 'var(--toolbar-gap, 4px)',
    borderBottom: '1px solid var(--border)',
    fontFamily: 'Segoe UI, sans-serif',
    flexShrink: 0,
    position: 'relative',
    zIndex: 100,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginRight: 6,
    flexShrink: 0,
  },
  brandDot: {
    width: 'var(--toolbar-brand-dot-size, 8px)',
    height: 'var(--toolbar-brand-dot-size, 8px)',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    boxShadow: '0 0 8px var(--accent)',
  },
  brandText: {
    color: 'var(--text-primary)',
    fontSize: 'var(--toolbar-brand-font-size, 13px)',
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  group: {
    display: 'flex',
    gap: 2,
    position: 'relative',
    flexShrink: 0,
    padding: '2px 4px',
    borderRadius: 6,
    transition: 'background-color 0.15s',
  },
  projectBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '2px 4px 2px 2px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    marginRight: 4,
    maxWidth: 340,
    minWidth: 0,
  },
  projectName: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    borderRadius: 4,
    maxWidth: 260,
    overflow: 'hidden',
    textAlign: 'left',
  },
  projectDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: 'var(--warning)',
    flexShrink: 0,
  },
  projectText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  projectActionBtn: {
    width: 22,
    height: 22,
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
};

export default TopToolbar;