// =====================================================
// src/components/project-details/ProjectDetailsDialog.tsx
// Диалог сведений о проекте
// =====================================================

import { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  User,
  Building2,
  Calendar,
  Clock,
  File,
  HardDrive,
  Tag as TagIcon,
  Palette,
  Camera,
  Check,
  RotateCcw,
  FolderOpen,
  Ruler,
  Hash,
  MapPin,
  Type,
  Sparkles,
  Layers,
  Map as MapIcon,
} from 'lucide-react';

import type { ProjectMeta } from '../../types/project';
import type { MapSourceSettings, CustomMapSource } from '../../types/settings';
import { DEFAULT_MAP_SOURCE_SETTINGS } from '../../types/settings';
import {
  getAllMapSources,
  getMapSourceInfo,
  resolveTimeMax,
  DEFAULT_MAP_SOURCE,
} from '../../types/map-sources';
import { formatDate } from '../../types/format';
import { isHexColor } from '../../types/ids';
import { NEW_PROJECT_PRESETS } from '../../services/project';
import type { NewProjectPreset } from '../../services/project';

import { Section, FieldRow, SegmentButton, StatCard } from './ui';
import TagsEditor from './TagsEditor';
import CameraCard from './CameraCard';
import type { ProjectDetailsDialogProps } from './types';
import { COLOR_TAGS } from './types';

function ProjectDetailsDialog({
  meta,
  projectPath,
  stats,
  currentCamera,
  defaultMapSource,
  onSave,
  onChangePath,
  onClose,
  onFlyToHome,
}: ProjectDetailsDialogProps) {
  const [draft, setDraft] = useState<ProjectMeta>({ ...meta });
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const prevMetaRef = useRef<ProjectMeta>(meta);

  useEffect(
    function () {
      if (prevMetaRef.current !== meta) {
        if (
          prevMetaRef.current.title !== meta.title ||
          prevMetaRef.current.createdAt !== meta.createdAt
        ) {
          setDraft({ ...meta });
          setHasChanges(false);
        }
        prevMetaRef.current = meta;
      }
    },
    [meta]
  );

  useEffect(
    function () {
      if (!confirmReset) return;
      const t = setTimeout(function () {
        setConfirmReset(false);
      }, 3000);
      return function () {
        clearTimeout(t);
      };
    },
    [confirmReset]
  );

  useEffect(function () {
    const handler = function (e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return function () {
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  const update = function <K extends keyof ProjectMeta>(
    key: K,
    value: ProjectMeta[K]
  ) {
    setDraft(function (prev) {
      return { ...prev, [key]: value };
    });
    setHasChanges(true);
  };

  const updateUnits = function <K extends keyof ProjectMeta['units']>(
    key: K,
    value: ProjectMeta['units'][K]
  ) {
    setDraft(function (prev) {
      return { ...prev, units: { ...prev.units, [key]: value } };
    });
    setHasChanges(true);
  };

  const updateMapSource = function (updater: Partial<MapSourceSettings>) {
    setDraft(function (prev) {
      return {
        ...prev,
        mapSource: { ...(prev.mapSource || {}), ...updater },
      };
    });
    setHasChanges(true);
  };

  const handleClearMapSourceOverride = function () {
    setDraft(function (prev) {
      const next: ProjectMeta = { ...prev };
      delete next.mapSource;
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = function () {
    if (!hasChanges) {
      onClose();
      return;
    }
    onSave(draft);
  };

  const handleResetDraft = function () {
    setDraft({ ...meta });
    setHasChanges(false);
  };

  const applyPreset = function (preset: NewProjectPreset) {
    setDraft(function (prev) {
      const next: ProjectMeta = { ...prev };
      if (preset.meta.description !== undefined)
        next.description = preset.meta.description;
      if (preset.meta.tags !== undefined) next.tags = preset.meta.tags.slice();
      if (preset.meta.colorTag !== undefined)
        next.colorTag = preset.meta.colorTag;
      if (preset.meta.author !== undefined) next.author = preset.meta.author;
      if (preset.meta.organization !== undefined)
        next.organization = preset.meta.organization;
      return next;
    });
    setHasChanges(true);
  };

  const handleSetHomeFromCurrent = function () {
    if (!currentCamera) return;
    update('homeCamera', { ...currentCamera });
  };

  const handleClearHome = function () {
    update('homeCamera', null);
  };

  const handleSetColorTag = function (hex: string) {
    update('colorTag', hex);
  };

  // Эффективный mapSource = override проекта + дефолты
  const effectiveMapSource: MapSourceSettings = {
    ...DEFAULT_MAP_SOURCE_SETTINGS,
    ...defaultMapSource,
    ...(draft.mapSource || {}),
  };
  const allSources = getAllMapSources(effectiveMapSource.customSources || []);
  const currentInfo = getMapSourceInfo(
    effectiveMapSource.baseLayer,
    effectiveMapSource.customSources || []
  );
  const hasOverride = !!draft.mapSource;

  const pathDisplay = projectPath || 'Проект не сохранён';
  const createdDate = formatDate(draft.createdAt, draft.dateFormat);
  const updatedDate = formatDate(draft.updatedAt, draft.dateFormat);

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <FileText size={16} color="var(--accent)" />
          <span style={styles.title}>Настройки проекта</span>
          {hasChanges && <span style={styles.dirtyDot} />}
          <button
            style={styles.closeBtn}
            onClick={onClose}
            title="Закрыть (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        <div style={styles.content}>
          {/* ПРЕСЕТЫ */}
          <Section title="Быстрые пресеты" icon={<Sparkles size={13} />}>
            <div style={styles.presetRow}>
              {NEW_PROJECT_PRESETS.map(function (preset) {
                return (
                  <button
                    key={preset.id}
                    style={styles.presetBtn}
                    onClick={function () {
                      applyPreset(preset);
                    }}
                    title={preset.description}
                  >
                    <span style={styles.presetLabel}>{preset.label}</span>
                    <span style={styles.presetHint}>
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ОСНОВНОЕ */}
          <Section title="Основное" icon={<Type size={13} />}>
            <FieldRow label="Название проекта" required>
              <input
                type="text"
                value={draft.title}
                onChange={function (e) {
                  update('title', e.target.value);
                }}
                style={styles.input}
                maxLength={200}
              />
            </FieldRow>

            <FieldRow label="Имя файла по умолчанию">
              <input
                type="text"
                value={draft.fileBaseName}
                onChange={function (e) {
                  update(
                    'fileBaseName',
                    e.target.value.replace(/[\\/:*?"<>|]/g, '_')
                  );
                }}
                style={styles.input}
                maxLength={80}
              />
            </FieldRow>

            <div style={styles.twoCols}>
              <div style={styles.col}>
                <label style={styles.miniLabel}>
                  <User size={11} /> Автор
                </label>
                <input
                  type="text"
                  value={draft.author}
                  onChange={function (e) {
                    update('author', e.target.value);
                  }}
                  style={styles.input}
                />
              </div>
              <div style={styles.col}>
                <label style={styles.miniLabel}>
                  <Building2 size={11} /> Организация
                </label>
                <input
                  type="text"
                  value={draft.organization}
                  onChange={function (e) {
                    update('organization', e.target.value);
                  }}
                  style={styles.input}
                />
              </div>
            </div>

            <label style={styles.miniLabel}>Описание</label>
            <textarea
              value={draft.description}
              onChange={function (e) {
                update('description', e.target.value);
              }}
              style={styles.textarea}
              rows={3}
              maxLength={4000}
            />
          </Section>

          {/* ⚡ ИСТОЧНИК КАРТЫ */}
          <Section title="Источник карты" icon={<Layers size={13} />}>
            <div style={styles.mapSourceGrid}>
              {allSources.map(function (b) {
                const active = effectiveMapSource.baseLayer === b.id;
                return (
                  <button
                    key={b.id}
                    style={{
                      ...styles.mapSourceCard,
                      borderColor: active
                        ? 'var(--accent)'
                        : 'var(--border)',
                      backgroundColor: active
                        ? 'var(--bg-surface-hover)'
                        : 'var(--bg-surface)',
                    }}
                    onClick={function () {
                      updateMapSource({ baseLayer: b.id });
                    }}
                    title={b.description}
                  >
                    <div
                      style={{
                        ...styles.mapSourcePreview,
                        backgroundColor: b.previewColor,
                      }}
                    />
                    <span style={styles.mapSourceLabel}>{b.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <div style={styles.hintSmall}>
              {currentInfo.description}
              <br />
              <span style={styles.attribution}>
                {currentInfo.attribution}
              </span>
            </div>

            {currentInfo.supportsTime && (
              <FieldRow label="Дата снимков:">
                <input
                  type="date"
                  value={effectiveMapSource.baseLayerDate}
                  min={currentInfo.timeMin}
                  max={resolveTimeMax(currentInfo.timeMax)}
                  onChange={function (e) {
                    updateMapSource({ baseLayerDate: e.target.value });
                  }}
                  style={styles.input}
                />
              </FieldRow>
            )}

            {hasOverride ? (
              <button
                style={styles.outlineBtn}
                onClick={handleClearMapSourceOverride}
                title="Использовать источник из глобальных настроек"
              >
                <RotateCcw size={12} />
                Использовать глобальный источник
              </button>
            ) : (
              <div style={styles.hintSmall}>
                Не задан — используется источник из глобальных настроек
                ({getMapSourceInfo(DEFAULT_MAP_SOURCE).label} по дефолту).
              </div>
            )}

            <div style={styles.baseLayerPreview}>
              <MapIcon size={14} color="var(--accent)" />
              <span style={styles.baseLayerPreviewText}>
                Применяется при открытии этого проекта. Переключить можно
                кнопкой «Слои» в правом верхнем углу глобуса. Свои карты
                добавляются в Настройках → Карта.
              </span>
            </div>
          </Section>

          {/* ФАЙЛ */}
          <Section title="Файл проекта" icon={<File size={13} />}>
            <div style={styles.fileRow}>
              <div style={styles.fileInfo}>
                <div style={styles.filePath} title={pathDisplay}>
                  {pathDisplay}
                </div>
                {projectPath && (
                  <div style={styles.fileMeta}>
                    {stats.totalItems} объектов
                  </div>
                )}
              </div>
              <button style={styles.outlineBtn} onClick={onChangePath}>
                <FolderOpen size={12} />
                {projectPath ? 'Изменить путь' : 'Указать путь'}
              </button>
            </div>

            <div style={styles.twoCols}>
              <div style={styles.col}>
                <label style={styles.miniLabel}>
                  <Calendar size={11} /> Создан
                </label>
                <div style={styles.readOnlyValue}>{createdDate || '—'}</div>
              </div>
              <div style={styles.col}>
                <label style={styles.miniLabel}>
                  <Clock size={11} /> Изменён
                </label>
                <div style={styles.readOnlyValue}>{updatedDate || '—'}</div>
              </div>
            </div>

            <FieldRow label="Формат даты">
              <SegmentButton
                label="DD.MM.YYYY"
                active={draft.dateFormat === 'DD.MM.YYYY'}
                onClick={function () {
                  update('dateFormat', 'DD.MM.YYYY');
                }}
              />
              <SegmentButton
                label="MM/DD/YYYY"
                active={draft.dateFormat === 'MM/DD/YYYY'}
                onClick={function () {
                  update('dateFormat', 'MM/DD/YYYY');
                }}
              />
              <SegmentButton
                label="YYYY-MM-DD"
                active={draft.dateFormat === 'YYYY-MM-DD'}
                onClick={function () {
                  update('dateFormat', 'YYYY-MM-DD');
                }}
              />
            </FieldRow>

            <FieldRow label="Версия формата">
              <input
                type="text"
                value={draft.version}
                onChange={function (e) {
                  update('version', e.target.value);
                }}
                style={{ ...styles.input, maxWidth: 120 }}
                maxLength={10}
              />
            </FieldRow>
          </Section>

          {/* ЕДИНИЦЫ */}
          <Section
            title="Единицы измерения проекта"
            icon={<Ruler size={13} />}
          >
            <FieldRow label="Расстояние">
              <SegmentButton
                label="Метрическая"
                active={draft.units.distance === 'metric'}
                onClick={function () {
                  updateUnits('distance', 'metric');
                }}
              />
              <SegmentButton
                label="Имперская"
                active={draft.units.distance === 'imperial'}
                onClick={function () {
                  updateUnits('distance', 'imperial');
                }}
              />
            </FieldRow>

            <FieldRow label="Высота">
              <SegmentButton
                label="м"
                active={draft.units.height === 'meters'}
                onClick={function () {
                  updateUnits('height', 'meters');
                }}
              />
              <SegmentButton
                label="км"
                active={draft.units.height === 'kilometers'}
                onClick={function () {
                  updateUnits('height', 'kilometers');
                }}
              />
              <SegmentButton
                label="ft"
                active={draft.units.height === 'feet'}
                onClick={function () {
                  updateUnits('height', 'feet');
                }}
              />
              <SegmentButton
                label="mi"
                active={draft.units.height === 'miles'}
                onClick={function () {
                  updateUnits('height', 'miles');
                }}
              />
            </FieldRow>

            <FieldRow label="Координаты">
              <SegmentButton
                label="DD"
                active={draft.units.coordinate === 'DD'}
                onClick={function () {
                  updateUnits('coordinate', 'DD');
                }}
              />
              <SegmentButton
                label="DMS"
                active={draft.units.coordinate === 'DMS'}
                onClick={function () {
                  updateUnits('coordinate', 'DMS');
                }}
              />
              <SegmentButton
                label="DDM"
                active={draft.units.coordinate === 'DDM'}
                onClick={function () {
                  updateUnits('coordinate', 'DDM');
                }}
              />
            </FieldRow>
          </Section>

          {/* ЦВЕТ-МЕТКА */}
          <Section title="Цвет-метка проекта" icon={<Palette size={13} />}>
            <div style={styles.colorRow}>
              {COLOR_TAGS.map(function (hex) {
                const active = draft.colorTag === hex;
                return (
                  <button
                    key={hex}
                    style={{
                      ...styles.colorSwatch,
                      backgroundColor: hex,
                      borderColor: active
                        ? 'var(--text-primary)'
                        : 'transparent',
                      transform: active ? 'scale(1.15)' : 'scale(1)',
                    }}
                    onClick={function () {
                      handleSetColorTag(hex);
                    }}
                    title={hex}
                  />
                );
              })}
              <input
                type="color"
                value={
                  isHexColor(draft.colorTag) ? draft.colorTag : '#4a90d9'
                }
                onChange={function (e) {
                  handleSetColorTag(e.target.value);
                }}
                style={styles.colorInput}
              />
            </div>
          </Section>

          {/* ТЕГИ */}
          <Section title="Теги" icon={<TagIcon size={13} />}>
            <TagsEditor
              tags={draft.tags}
              onChange={function (next) {
                update('tags', next);
              }}
            />
          </Section>

          {/* ЗАМЕТКИ */}
          <Section title="Заметки" icon={<FileText size={13} />}>
            <textarea
              value={draft.notes}
              onChange={function (e) {
                update('notes', e.target.value);
              }}
              style={styles.textarea}
              rows={3}
              maxLength={8000}
            />
          </Section>

          {/* ДОМАШНЯЯ КАМЕРА */}
          <Section title="Домашняя камера" icon={<Camera size={13} />}>
            <CameraCard
              camera={draft.homeCamera}
              currentCamera={currentCamera}
              onFlyToHome={onFlyToHome}
              onSetFromCurrent={handleSetHomeFromCurrent}
              onClear={handleClearHome}
            />
          </Section>

          {/* СТАТИСТИКА */}
          <Section title="Статистика" icon={<HardDrive size={13} />}>
            <div style={styles.statsGrid}>
              <StatCard
                icon={<MapPin size={14} />}
                label="Метки"
                value={stats.places}
                color="var(--danger)"
              />
              <StatCard
                icon={<FolderOpen size={14} />}
                label="Папки"
                value={stats.folders}
                color="var(--warning)"
              />
              <StatCard
                icon={<Hash size={14} />}
                label="Линии"
                value={stats.lines}
                color="var(--warning)"
              />
              <StatCard
                icon={<Hash size={14} />}
                label="Полигоны"
                value={stats.polygons}
                color="var(--accent)"
              />
              <StatCard
                icon={<File size={14} />}
                label="KML-файлы"
                value={stats.kmlFiles}
                color="var(--success)"
              />
              <StatCard
                icon={<Sparkles size={14} />}
                label="Импорт"
                value={stats.importedItems}
                color="var(--info)"
              />
            </div>
            <div style={styles.statsTotal}>
              Всего объектов:{' '}
              <b>{stats.totalItems + stats.importedItems}</b>
            </div>
          </Section>
        </div>

        <div style={styles.footer}>
          <button
            style={{
              ...styles.outlineBtn,
              color: confirmReset
                ? 'var(--danger)'
                : 'var(--text-secondary)',
              borderColor: confirmReset
                ? 'var(--danger)'
                : 'var(--border)',
              opacity: hasChanges ? 1 : 0.4,
              cursor: hasChanges ? 'pointer' : 'not-allowed',
            }}
            onClick={function () {
              if (!hasChanges) return;
              if (confirmReset) {
                handleResetDraft();
                setConfirmReset(false);
              } else {
                setConfirmReset(true);
              }
            }}
            disabled={!hasChanges}
          >
            <RotateCcw size={12} />
            {confirmReset ? 'Точно?' : 'Сбросить'}
          </button>

          <div style={{ flex: 1 }} />

          <button style={styles.cancelBtn} onClick={onClose}>
            Отмена
          </button>

          <button
            style={{
              ...styles.saveBtn,
              opacity: hasChanges ? 1 : 0.55,
              cursor: hasChanges ? 'pointer' : 'default',
            }}
            onClick={handleSave}
          >
            <Check size={13} />
            {hasChanges ? 'Сохранить изменения' : 'Готово'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--backdrop)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1500,
    fontFamily: 'Segoe UI, sans-serif',
    animation: 'fadeIn 0.15s ease',
  },
  modal: {
    width: 720,
    maxWidth: '95vw',
    maxHeight: '92vh',
    backgroundColor: 'var(--bg-modal)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-xl)',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    animation: 'scaleIn 0.18s ease',
  },
  header: {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    backgroundColor: 'var(--bg-panel-header)',
    borderBottom: '1px solid var(--border)',
    gap: 8,
    flexShrink: 0,
  },
  title: { flex: 1, fontSize: 14, fontWeight: 600 },
  dirtyDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'var(--warning)',
    marginRight: 6,
  },
  closeBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minHeight: 0,
  },
  input: {
    flex: 1,
    width: '100%',
    padding: '7px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 12.5,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '7px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 12.5,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    minHeight: 60,
  },
  miniLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginBottom: 3,
  },
  twoCols: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  col: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  presetRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: 6,
  },
  presetBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    padding: '8px 10px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    color: 'var(--text-primary)',
    transition: 'all 0.15s',
  },
  presetLabel: { fontSize: 12, fontWeight: 600, color: 'var(--accent)' },
  presetHint: {
    fontSize: 10,
    color: 'var(--text-muted)',
    lineHeight: 1.35,
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  filePath: {
    fontSize: 11.5,
    color: 'var(--text-primary)',
    fontFamily: 'Consolas, monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    direction: 'rtl',
    textAlign: 'left',
  },
  fileMeta: { fontSize: 10.5, color: 'var(--text-muted)' },
  readOnlyValue: {
    padding: '6px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontFamily: 'Consolas, monospace',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    border: '2px solid transparent',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.15s',
  },
  colorInput: {
    width: 42,
    height: 28,
    padding: 2,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    marginLeft: 6,
  },
  hintSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    lineHeight: 1.45,
    marginTop: 2,
  },
  attribution: {
    fontSize: 10,
    color: 'var(--text-muted)',
    opacity: 0.8,
  },
  mapSourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
    gap: 5,
  },
  mapSourceCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: 4,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    transition: 'all 0.15s',
  },
  mapSourcePreview: {
    width: '100%',
    height: 32,
    borderRadius: 4,
  },
  mapSourceLabel: {
    fontSize: 9.5,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  baseLayerPreview: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '8px 10px',
    marginTop: 4,
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--radius-small)',
  },
  baseLayerPreviewText: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
    gap: 6,
  },
  statsTotal: {
    marginTop: 6,
    fontSize: 12,
    color: 'var(--text-secondary)',
    textAlign: 'right',
  },
  footer: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    backgroundColor: 'var(--bg-panel-header)',
    borderTop: '1px solid var(--border)',
    gap: 8,
    flexShrink: 0,
  },
  outlineBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  cancelBtn: {
    padding: '7px 16px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 20px',
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: 'var(--accent-text)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default ProjectDetailsDialog;