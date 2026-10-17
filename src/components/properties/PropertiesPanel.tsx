// =====================================================
// src/components/properties/PropertiesPanel.tsx
// Правая панель свойств объекта
// =====================================================

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  MapPin,
  Copy,
  Folder as FolderIcon,
  FileText,
  Minus,
  Square,
  Ruler,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Type,
  Sliders,
} from 'lucide-react';

import type {
  TreeItem,
  Place,
  Folder,
  KmlFile,
  MeasureItem,
} from '../../types/base';
import {
  isFolder,
  isPlace,
  isKmlFile,
  isKmlLine,
  isKmlPolygon,
  isMeasure,
  isContainer,
  getItemTypeLabel,
} from '../../types/base';
import { getItemOpacity } from '../../types/tree-utils';
import type {
  LabelSettings,
  PartialLabelSettings,
} from '../../types/labels';

import IconPreview from './IconPreview';
import LabelEditor from './LabelEditor';
import PlaceSection from './sections/PlaceSection';
import LineSection from './sections/LineSection';
import PolygonSection from './sections/PolygonSection';
import ContainerSection from './sections/ContainerSection';
import MeasureSection from './sections/MeasureSection';
import type { PropertiesPanelProps, Draft } from './types';
import {
  DEFAULT_PIXEL_SIZE,
  DEFAULT_OUTLINE_COLOR,
  DEFAULT_OUTLINE_WIDTH,
} from './types';

// =====================================================
// === Компонент ===
// =====================================================
function PropertiesPanel({
  item,
  settings,
  hasPreview,
  onRequestDelete,
  onFlyTo,
  onClose,
  onDuplicate,
  onToggleVisible,
  onTogglePin,
  onCopyCoords,
  onAddFolder,
  onAddPlace,
  onPreview,
  onCancelPreviewFor,
  onSaveItem,
}: PropertiesPanelProps) {
  const [draft, setDraft] = useState<Draft>({});
  const [draftTouched, setDraftTouched] = useState(false);
  const [labelSectionOpen, setLabelSectionOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const prevItemIdRef = useRef<string>(item.id);
  const draftRef = useRef<Draft>({});
  const touchedRef = useRef(false);

  const hasChanges = draftTouched || hasPreview;

  useEffect(
    function () {
      draftRef.current = draft;
    },
    [draft]
  );
  useEffect(
    function () {
      touchedRef.current = draftTouched;
    },
    [draftTouched]
  );

  // Сброс при смене объекта
  useEffect(
    function () {
      if (prevItemIdRef.current !== item.id) {
        draftRef.current = {};
        touchedRef.current = false;
        setDraft({});
        setDraftTouched(false);
        setLabelSectionOpen(false);
        prevItemIdRef.current = item.id;
      }
    },
    [item.id]
  );

  // =====================================================
  // === Draft ===
  // =====================================================
  const getVal = function <K extends keyof Draft>(
    field: K,
    fallback: any
  ): any {
    if (Object.prototype.hasOwnProperty.call(draftRef.current, field)) {
      return draftRef.current[field];
    }
    return fallback;
  };

  const setField = function <K extends keyof Draft>(
    field: K,
    value: Draft[K]
  ) {
    const next: Draft = { ...draftRef.current, [field]: value };
    draftRef.current = next;
    touchedRef.current = true;
    setDraft(next);
    setDraftTouched(true);
    const payload: Partial<any> = {};
    (payload as any)[field as string] = value;
    onPreview(item.id, payload);
  };

  // =====================================================
  // === Подписи ===
  // =====================================================
  const getEffectiveLabel = function (): LabelSettings {
    const base = settings.labelDefaults;
    const override = getVal('labelSettings', item.labelSettings);
    if (!override) return base;
    return { ...base, ...override };
  };

  const setLabelField = function <K extends keyof LabelSettings>(
    key: K,
    value: LabelSettings[K]
  ) {
    const current =
      draftRef.current.labelSettings !== undefined
        ? draftRef.current.labelSettings
        : item.labelSettings || {};
    const nextLabel: PartialLabelSettings = { ...current, [key]: value };
    const next: Draft = { ...draftRef.current, labelSettings: nextLabel };
    draftRef.current = next;
    touchedRef.current = true;
    setDraft(next);
    setDraftTouched(true);
    onPreview(item.id, { labelSettings: nextLabel });
  };

  const labelIsOverridden =
    getVal('labelSettings', item.labelSettings) !== undefined &&
    getVal('labelSettings', item.labelSettings) !== null;

  const handleEnableLabelOverride = function () {
    const nextLabel: PartialLabelSettings =
      draftRef.current.labelSettings || {};
    const next: Draft = { ...draftRef.current, labelSettings: nextLabel };
    draftRef.current = next;
    touchedRef.current = true;
    setDraft(next);
    setDraftTouched(true);
    onPreview(item.id, { labelSettings: nextLabel });
  };

  const handleResetLabelOverride = function () {
    const next = { ...draftRef.current };
    delete next.labelSettings;
    draftRef.current = next;
    touchedRef.current = true;
    setDraft(next);
    setDraftTouched(true);
    onPreview(item.id, { labelSettings: undefined });
  };

  // =====================================================
  // === Кнопки ===
  // =====================================================
  const handleSave = function () {
    if (!hasChanges) return;
    const payload: Partial<any> = { ...draftRef.current };
    if (
      payload.labelSettings &&
      typeof payload.labelSettings === 'object' &&
      Object.keys(payload.labelSettings).length === 0
    ) {
      payload.labelSettings = undefined;
    }
    onSaveItem(item.id, payload);
    draftRef.current = {};
    touchedRef.current = false;
    setDraft({});
    setDraftTouched(false);
  };

  const handleReset = function () {
    draftRef.current = {};
    touchedRef.current = false;
    setDraft({});
    setDraftTouched(false);
    onCancelPreviewFor(item.id);
  };

  const handleClose = function () {
    if (hasChanges) {
      draftRef.current = {};
      touchedRef.current = false;
      setDraft({});
      setDraftTouched(false);
      onCancelPreviewFor(item.id);
    }
    onClose();
  };

  const handleDeleteClick = function () {
    if (deleting) return;
    setDeleting(true);
    if (hasPreview) onCancelPreviewFor(item.id);
    draftRef.current = {};
    touchedRef.current = false;
    setDraft({});
    setDraftTouched(false);
    onRequestDelete(item.id, item.name);
    setTimeout(function () {
      setDeleting(false);
    }, 600);
  };

  // =====================================================
  // === Заголовок: иконка ===
  // =====================================================
  const renderHeaderIcon = function () {
    if (isFolder(item))
      return <FolderIcon size={16} color="var(--warning)" />;
    if (isKmlFile(item))
      return <FileText size={16} color="var(--success)" />;
    if (isMeasure(item))
      return <Ruler size={16} color="var(--warning)" />;
    if (isPlace(item)) {
      const iconHref =
        (getVal('iconHref', item.iconHref || '') as string) || '';
      const color =
        (getVal('color', item.color || '#e74c3c') as string) || '#e74c3c';
      const outlineColor =
        (getVal(
          'outlineColor',
          item.outlineColor || DEFAULT_OUTLINE_COLOR
        ) as string) || DEFAULT_OUTLINE_COLOR;
      const outlineWidth =
        (getVal(
          'outlineWidth',
          item.outlineWidth !== undefined
            ? item.outlineWidth
            : DEFAULT_OUTLINE_WIDTH
        ) as number) || 0;
      return (
        <IconPreview
          iconHref={iconHref}
          sizePx={14}
          fillColor={color}
          outlineColor={outlineColor}
          outlineFraction={outlineWidth}
          title="Метка"
        />
      );
    }
    if (isKmlLine(item))
      return (
        <Minus
          size={16}
          color={
            (getVal('color', item.color) as string) || 'var(--warning)'
          }
        />
      );
    if (isKmlPolygon(item))
      return (
        <Square
          size={16}
          color={
            (getVal('fillColor', item.fillColor) as string) || 'var(--accent)'
          }
        />
      );
    return <MapPin size={16} color="var(--danger)" />;
  };

  const typeLabel = getItemTypeLabel(item.type);
  const isVisible = item.visible !== false;
  const currentOpacity = getVal('opacity', getItemOpacity(item));

  const showLabelSection =
    isPlace(item) ||
    isKmlLine(item) ||
    isKmlPolygon(item) ||
    isContainer(item) ||
    isMeasure(item);

  // =====================================================
  // === Рендер ===
  // =====================================================
  return (
    <div style={styles.panel}>
      {/* HEADER */}
      <div style={styles.header}>
        {renderHeaderIcon()}
        <span style={styles.headerTitle}>{typeLabel}</span>
        {hasChanges && (
          <span
            style={styles.dirtyDot}
            title={
              hasPreview && !draftTouched
                ? 'Позиция изменена перетаскиванием'
                : 'Есть несохранённые изменения'
            }
          />
        )}
        <button
          style={styles.headerIconBtn}
          onClick={function () {
            onTogglePin(item.id);
          }}
          title={item.pinned ? 'Открепить' : 'Закрепить'}
        >
          {item.pinned ? (
            <PinOff size={14} color="var(--warning)" />
          ) : (
            <Pin size={14} />
          )}
        </button>
        <button
          style={styles.headerIconBtn}
          onClick={function () {
            onToggleVisible(item.id);
          }}
          title={isVisible ? 'Скрыть' : 'Показать'}
        >
          {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          style={styles.headerIconBtn}
          onClick={handleClose}
          title="Закрыть (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {/* Название */}
        <div style={styles.field}>
          <label style={styles.label}>Название</label>
          <div style={styles.rowWithPreview}>
            <input
              type="text"
              value={getVal('name', item.name)}
              onChange={function (e) {
                setField('name', e.target.value);
              }}
              style={styles.input}
              placeholder="Название"
            />
            {isPlace(item) && (
              <IconPreview
                iconHref={
                  (getVal('iconHref', item.iconHref || '') as string) || ''
                }
                sizePx={Math.max(
                  8,
                  Math.min(
                    20,
                    (getVal(
                      'pixelSize',
                      item.pixelSize || DEFAULT_PIXEL_SIZE
                    ) as number) || DEFAULT_PIXEL_SIZE
                  )
                )}
                fillColor={
                  (getVal('color', item.color || '#e74c3c') as string) ||
                  '#e74c3c'
                }
                outlineColor={
                  (getVal(
                    'outlineColor',
                    item.outlineColor || DEFAULT_OUTLINE_COLOR
                  ) as string) || DEFAULT_OUTLINE_COLOR
                }
                outlineFraction={
                  (getVal(
                    'outlineWidth',
                    item.outlineWidth !== undefined
                      ? item.outlineWidth
                      : DEFAULT_OUTLINE_WIDTH
                  ) as number) || 0
                }
                title="Превью"
              />
            )}
          </div>
        </div>

        {/* Заметка */}
        <div style={styles.field}>
          <label style={styles.label}>
            <StickyNote size={10} style={{ marginRight: 4 }} />
            Заметка
          </label>
          <input
            type="text"
            value={getVal('note', item.note || '')}
            onChange={function (e) {
              setField('note', e.target.value);
            }}
            style={styles.input}
            placeholder="Например: срочно проверить"
          />
        </div>

        {/* Прозрачность */}
        <div style={styles.field}>
          <label style={styles.label}>
            <Sliders size={10} style={{ marginRight: 4 }} />
            Прозрачность:{' '}
            <span style={styles.accent}>
              {Math.round((currentOpacity as number) * 100)}%
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((currentOpacity as number) * 100)}
            onChange={function (e) {
              setField('opacity', parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
          {isContainer(item) && (
            <div style={styles.hintSmall}>
              Применяется каскадно ко всем вложенным объектам.
            </div>
          )}
        </div>

        {/* Секции по типу */}
        {isPlace(item) && (
          <PlaceSection
            item={item}
            draft={draft}
            getVal={getVal}
            setField={setField}
            onCopyCoords={onCopyCoords}
            onFlyTo={onFlyTo}
          />
        )}

        {isKmlLine(item) && (
          <LineSection item={item} getVal={getVal} setField={setField} />
        )}

        {isKmlPolygon(item) && (
          <PolygonSection
            item={item}
            getVal={getVal}
            setField={setField}
          />
        )}

        {isContainer(item) && (
          <ContainerSection
            item={item as Folder | KmlFile}
            getVal={getVal}
            setField={setField}
            onAddFolder={onAddFolder}
            onAddPlace={onAddPlace}
          />
        )}

        {isMeasure(item) && (
          <MeasureSection
            item={item as MeasureItem}
            getVal={getVal}
            setField={setField}
            distanceUnit={settings.distanceUnit}
            heightUnit={settings.heightUnit}
            coordinateFormat={settings.coordinateFormat}
            highPrecision={settings.highPrecision}
          />
        )}

        {/* Подпись */}
        {showLabelSection && (
          <div style={styles.labelSection}>
            <button
              style={styles.labelSectionHeader}
              onClick={function () {
                setLabelSectionOpen(!labelSectionOpen);
              }}
            >
              {labelSectionOpen ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              <Type size={12} style={{ marginLeft: 4 }} />
              <span style={styles.labelSectionTitle}>Подпись</span>
              <span style={styles.labelSectionBadge}>
                {labelIsOverridden ? 'своя' : 'по умолчанию'}
              </span>
            </button>

            {labelSectionOpen && (
              <div style={styles.labelSectionBody}>
                <div style={styles.overrideRow}>
                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={labelIsOverridden}
                      onChange={function (e) {
                        if (e.target.checked) handleEnableLabelOverride();
                        else handleResetLabelOverride();
                      }}
                    />
                    <span style={{ marginLeft: 6 }}>
                      Использовать свои настройки
                    </span>
                  </label>
                </div>

                {!labelIsOverridden && (
                  <div style={styles.hintSmall}>
                    Используются глобальные настройки подписей. Включите
                    галочку, чтобы переопределить их для этого объекта.
                  </div>
                )}

                {labelIsOverridden && (
                  <LabelEditor
                    label={getEffectiveLabel()}
                    setLabelField={setLabelField}
                    onResetToDefaults={handleResetLabelOverride}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <button
          style={styles.iconActionBtn}
          onClick={function () {
            onDuplicate(item.id);
          }}
          title="Дублировать"
        >
          <Copy size={13} />
        </button>
        <button
          style={{
            ...styles.iconActionBtn,
            opacity: hasChanges ? 1 : 0.4,
            cursor: hasChanges ? 'pointer' : 'not-allowed',
          }}
          onClick={handleReset}
          title="Сбросить изменения"
          disabled={!hasChanges}
        >
          <RotateCcw size={13} />
        </button>
        <button
          style={{
            ...styles.iconActionBtn,
            color: 'var(--danger)',
            opacity: deleting ? 0.5 : 1,
            cursor: deleting ? 'wait' : 'pointer',
          }}
          onClick={handleDeleteClick}
          disabled={deleting}
          title="Удалить"
        >
          <Trash2 size={13} />
        </button>
        <button
          style={{
            ...styles.saveBtn,
            opacity: hasChanges ? 1 : 0.4,
            cursor: hasChanges ? 'pointer' : 'not-allowed',
          }}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          <Save size={13} /> Сохранить
        </button>
      </div>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 340,
    minWidth: 320,
    maxWidth: 380,
    height: '100%',
    maxHeight: '100%',
    backgroundColor: 'var(--bg-panel)',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: 13,
    color: 'var(--text-primary)',
    flexShrink: 0,
    overflow: 'hidden',
    zIndex: 200,
    position: 'relative',
    transition: 'background-color 0.2s',
  },
  header: {
    height: 44,
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px 0 14px',
    backgroundColor: 'var(--bg-panel-header)',
    borderBottom: '1px solid var(--border)',
    gap: 6,
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dirtyDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'var(--warning)',
    marginRight: 4,
  },
  headerIconBtn: {
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 5,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  label: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '7px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    color: 'var(--text-primary)',
    fontSize: 12.5,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  rowWithPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  range: {
    width: '100%',
    accentColor: 'var(--accent)',
  },
  accent: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
  hintSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
    fontStyle: 'italic',
    marginTop: 2,
  },
  labelSection: {
    marginTop: 6,
    border: '1px solid var(--border)',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'var(--bg-surface)',
  },
  labelSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'var(--bg-panel-header)',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  },
  labelSectionTitle: {
    flex: 1,
    marginLeft: 4,
  },
  labelSectionBadge: {
    fontSize: 10,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-input)',
    padding: '1px 6px',
    borderRadius: 8,
    fontWeight: 400,
  },
  labelSectionBody: {
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  overrideRow: {
    display: 'flex',
    alignItems: 'center',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    gap: 6,
    padding: 10,
    borderTop: '1px solid var(--border)',
    backgroundColor: 'var(--bg-panel-header)',
    flexShrink: 0,
    alignItems: 'center',
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 5,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  saveBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '8px 12px',
    backgroundColor: 'var(--success)',
    border: 'none',
    borderRadius: 5,
    color: '#fff',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default PropertiesPanel;