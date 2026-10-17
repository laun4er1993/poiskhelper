// =====================================================
// src/components/tree/TreeRow.tsx
// Одна строка дерева объектов
// =====================================================

import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Folder as FolderIcon,
  FolderOpen,
  FileText,
  Minus,
  Square,
  Ruler,
  Check,
  Hash,
  Pin,
  StickyNote,
  Sliders,
  Type as TypeIcon,
} from 'lucide-react';

import type { TreeItem, Place } from '../../types/base';
import { isContainer, isPlace } from '../../types/base';
import type { AppSettings, DesignSettings } from '../../types/settings';
import { getCheckedState, getItemOpacity } from '../../types/tree-utils';

import IconPreviewMini from './IconPreviewMini';

// =====================================================
// === Утилита: boost по глубине ===
// =====================================================
function getDepthBoost(depth: number): number {
  if (depth <= 0) return 2.1;
  if (depth === 1) return 1.4;
  if (depth === 2) return 0.7;
  return 0;
}

// =====================================================
// === Пропсы ===
// =====================================================
interface TreeRowProps {
  item: TreeItem;
  depth: number;
  parentVisible: boolean;
  parentOpacity: number;
  selectedIds: string[];
  focusedId: string | null;
  isDragging: boolean;
  isDropTarget: boolean;
  isInvalidTarget: boolean;
  design: DesignSettings;
  settings: AppSettings;

  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;

  editingId: string | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;

  onRowMouseDown: (e: React.MouseEvent, item: TreeItem) => void;
  onItemClick: (e: React.MouseEvent, item: TreeItem) => void;
  onRowDoubleClick: (item: TreeItem) => void;
  onContextMenu: (e: React.MouseEvent, item: TreeItem) => void;

  onToggleExpanded: (id: string) => void;
  onSetExpandedDeep: (id: string, value: boolean) => void;
  onSetVisibleCascade: (id: string, value: boolean) => void;
  onFlyTo: (place: Place) => void;
  onCopyCoords: (text: string, label: string) => void;
}

// =====================================================
// === Компонент ===
// =====================================================
function TreeRow({
  item,
  depth,
  parentVisible,
  parentOpacity,
  selectedIds,
  focusedId,
  isDragging,
  isDropTarget,
  isInvalidTarget,
  design,
  isHovered,
  onHoverChange,
  editingId,
  editValue,
  onEditValueChange,
  onFinishRename,
  onCancelRename,
  onRowMouseDown,
  onItemClick,
  onRowDoubleClick,
  onContextMenu,
  onToggleExpanded,
  onSetExpandedDeep,
  onSetVisibleCascade,
  onFlyTo,
  onCopyCoords,
}: TreeRowProps) {
  // === Расчёт размеров по глубине ===
  const baseFontSize =
    design.treeDensity === 'compact'
      ? 11.5
      : design.treeDensity === 'comfortable'
      ? 12.5
      : 12;
  const baseIconSize = design.treeIconSize || 12;
  const depthBoost = getDepthBoost(depth);
  const fontSize = baseFontSize + depthBoost;
  const iconSize = baseIconSize + (depthBoost > 0 ? 1 : 0);
  const rowPadding =
    design.treeDensity === 'compact'
      ? 1
      : design.treeDensity === 'comfortable'
      ? 4
      : 2;

  // === Состояние ===
  const expanded = isContainer(item) ? item.expanded : false;
  const isSelected = selectedIds.indexOf(item.id) >= 0;
  const isFocused = focusedId === item.id;
  const checkState = getCheckedState(item, parentVisible);
  const selfVisible = parentVisible && item.visible !== false;

  const itemOpacity = getItemOpacity(item);
  const effectiveOpacity = parentOpacity * itemOpacity;

  const hasNote = item.note && item.note.trim().length > 0;
  const hasCustomLabel =
    item.labelSettings !== undefined &&
    item.labelSettings !== null &&
    Object.keys(item.labelSettings).length > 0;
  const hasCustomOpacity = itemOpacity < 0.999;

  const showActions = !design.treeActionsOnHover || isHovered || isFocused;

  // === Мини-превью метки ===
  let miniPreview: JSX.Element | null = null;
  if (item.type === 'place') {
    const place = item as Place;
    const iconHref = place.iconHref || '';
    const fillColor = place.color || 'var(--danger)';
    const outlineColor = place.outlineColor || 'var(--text-muted)';
    const outlineFraction =
      place.outlineWidth !== undefined ? place.outlineWidth : 0.05;
    const sizePx = Math.max(
      8,
      Math.min(iconSize + 4, place.pixelSize || 6)
    );
    miniPreview = (
      <IconPreviewMini
        iconHref={iconHref}
        sizePx={sizePx}
        fillColor={fillColor}
        outlineColor={outlineColor}
        outlineFraction={outlineFraction}
        visible={selfVisible}
        opacity={effectiveOpacity}
      />
    );
  }

  // =====================================================
  // === Обработчики ===
  // =====================================================
  const handleCheckboxClick = function (e: React.MouseEvent) {
    e.stopPropagation();
    const makeChecked = checkState === 'unchecked';
    onSetVisibleCascade(item.id, makeChecked);
  };

  const handleExpanderClick = function (e: React.MouseEvent) {
    e.stopPropagation();
    onToggleExpanded(item.id);
  };

  const handleCopyCoordsClick = function (e: React.MouseEvent) {
    e.stopPropagation();
    if (isPlace(item)) {
      const text = item.lat.toFixed(8) + ', ' + item.lon.toFixed(8);
      onCopyCoords(text, item.name);
    }
  };

  const handleDeepExpandClick = function (e: React.MouseEvent) {
    e.stopPropagation();
    onSetExpandedDeep(item.id, !expanded);
  };

  // =====================================================
  // === Рендер ===
  // =====================================================
  return (
    <div
      data-tree-item-id={item.id}
      data-tree-container={isContainer(item) ? 'true' : 'false'}
      style={{
        ...styles.row,
        paddingTop: rowPadding,
        paddingBottom: rowPadding,
        fontSize: fontSize,
        backgroundColor: isInvalidTarget
          ? 'var(--danger-soft)'
          : isDropTarget
          ? 'var(--success-soft)'
          : isSelected
          ? 'var(--bg-surface-hover)'
          : isHovered
          ? 'var(--overlay-soft)'
          : 'transparent',
        borderLeft: isInvalidTarget
          ? '3px solid var(--danger)'
          : isDropTarget
          ? '3px solid var(--success)'
          : isSelected
          ? '3px solid var(--accent)'
          : isFocused
          ? '3px solid var(--border-accent)'
          : '3px solid transparent',
        opacity: isDragging ? 0.35 : 1,
      }}
      onMouseDown={function (e) {
        onRowMouseDown(e, item);
      }}
      onClick={function (e) {
        onItemClick(e, item);
      }}
      onDoubleClick={function () {
        onRowDoubleClick(item);
      }}
      onContextMenu={function (e) {
        onContextMenu(e, item);
      }}
      onMouseEnter={function () {
        onHoverChange(true);
      }}
      onMouseLeave={function () {
        onHoverChange(false);
      }}
      title={
        item.name +
        (item.note ? ' — ' + item.note : '') +
        (hasCustomOpacity
          ? ' [прозрачность ' + Math.round(itemOpacity * 100) + '%]'
          : '')
      }
    >
      {/* EXPANDER (слева) */}
      {isContainer(item) ? (
        <span
          data-no-drag="true"
          style={{
            ...styles.expander,
            backgroundColor: isHovered
              ? 'var(--bg-surface-hover)'
              : 'transparent',
          }}
          onClick={handleExpanderClick}
          onMouseEnter={function (e) {
            (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
          }}
          onMouseLeave={function (e) {
            (e.currentTarget as HTMLElement).style.color = '';
          }}
          title={expanded ? 'Свернуть' : 'Развернуть'}
        >
          {expanded ? (
            <ChevronDown size={14} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={14} strokeWidth={2.5} />
          )}
        </span>
      ) : (
        <span style={styles.expanderPlaceholder} />
      )}

      {/* CHECKBOX (справа от expander) */}
      <span
        data-no-drag="true"
        style={styles.checkboxWrap}
        onClick={handleCheckboxClick}
        title={
          checkState === 'checked'
            ? 'Скрыть (со всеми вложенными)'
            : 'Показать (со всеми вложенными)'
        }
      >
        <span
          style={{
            ...styles.checkbox,
            borderColor:
              checkState === 'unchecked'
                ? 'var(--text-muted)'
                : 'var(--accent)',
            backgroundColor: 'transparent',
          }}
        >
          {checkState === 'checked' && (
            <Check size={10} strokeWidth={3.5} color="var(--accent)" />
          )}
          {checkState === 'indeterminate' && (
            <Minus size={10} strokeWidth={3.5} color="var(--accent)" />
          )}
        </span>
      </span>

      {/* PIN */}
      {item.pinned && (
        <Pin
          size={9}
          color="var(--warning)"
          style={{ flexShrink: 0, transform: 'rotate(45deg)' }}
        />
      )}

      {/* ICON + PREVIEW */}
      {item.type === 'folder' &&
        (expanded ? (
          <FolderOpen
            size={iconSize}
            color="var(--warning)"
            style={{ flexShrink: 0 }}
          />
        ) : (
          <FolderIcon
            size={iconSize}
            color="var(--warning)"
            style={{ flexShrink: 0 }}
          />
        ))}

      {item.type === 'kmlfile' && (
        <FileText
          size={iconSize}
          color="var(--success)"
          style={{ flexShrink: 0 }}
        />
      )}

      {item.type === 'kmlline' && (
        <Minus
          size={iconSize}
          color={(item as any).color || 'var(--warning)'}
          style={{ flexShrink: 0 }}
        />
      )}

      {item.type === 'kmlpolygon' && (
        <Square
          size={iconSize}
          color={(item as any).fillColor || 'var(--accent)'}
          style={{ flexShrink: 0 }}
        />
      )}

      {item.type === 'measure' && (
        <Ruler
          size={iconSize}
          color={(item as any).color || 'var(--warning)'}
          style={{ flexShrink: 0 }}
        />
      )}

      {item.type === 'place' && miniPreview}

      {/* NAME */}
      {editingId === item.id ? (
        <input
          autoFocus
          value={editValue}
          onChange={function (e) {
            onEditValueChange(e.target.value);
          }}
          onBlur={onFinishRename}
          onKeyDown={function (e) {
            if (e.key === 'Enter') onFinishRename();
            if (e.key === 'Escape') onCancelRename();
          }}
          style={{ ...styles.editInput, fontSize: fontSize }}
          onClick={function (e) {
            e.stopPropagation();
          }}
        />
      ) : (
        <span style={styles.nameBlock}>
          <span
            style={{
              ...styles.name,
              fontSize: fontSize,
              fontWeight: depthBoost > 0 ? 600 : 400,
              opacity: selfVisible ? 1 : 0.5,
              fontStyle: selfVisible ? 'normal' : 'italic',
              color:
                effectiveOpacity < 0.999
                  ? 'var(--text-secondary)'
                  : 'var(--text-primary)',
            }}
            title={item.name}
          >
            {item.name}
          </span>

          {design.treeShowNote && hasNote && (
            <span style={styles.noteBadge} title={item.note}>
              <StickyNote size={9} />
              <span style={styles.noteText}>{item.note}</span>
            </span>
          )}

          {design.treeShowOpacityBadge && hasCustomOpacity && (
            <span
              style={styles.opacityBadge}
              title={'Прозрачность: ' + Math.round(itemOpacity * 100) + '%'}
            >
              <Sliders size={8} />
              {Math.round(itemOpacity * 100)}%
            </span>
          )}

          {design.treeShowLabelBadge && hasCustomLabel && (
            <span style={styles.labelBadge} title="Свои настройки подписи">
              <TypeIcon size={8} />
            </span>
          )}
        </span>
      )}

      {/* CHILD COUNT */}
      {isContainer(item) && item.children.length > 0 && (
        <span style={styles.childCount}>{item.children.length}</span>
      )}

      {/* HOVER ACTIONS */}
      <span
        style={{
          ...styles.actions,
          opacity: showActions ? 1 : 0,
          pointerEvents: showActions ? 'auto' : 'none',
        }}
      >
        {item.type === 'place' && (
          <button
            data-no-drag="true"
            style={styles.actionIconBtn}
            onClick={handleCopyCoordsClick}
            title="Скопировать координаты"
          >
            <Hash size={12} />
          </button>
        )}
        {isContainer(item) && (
          <button
            data-no-drag="true"
            style={styles.actionIconBtn}
            onClick={handleDeepExpandClick}
            title={expanded ? 'Свернуть всё ниже' : 'Развернуть всё ниже'}
          >
            {expanded ? <ChevronsDown size={12} /> : <ChevronsUp size={12} />}
          </button>
        )}
      </span>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 4px',
    minHeight: 'var(--tree-min-height, 20px)',
    cursor: 'grab',
    borderRadius: 3,
    gap: 'var(--tree-gap, 2px)',
    userSelect: 'none',
    transition: 'background-color 0.1s ease',
  },
  expander: {
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    flexShrink: 0,
    borderRadius: 3,
    transition: 'color 0.12s, background-color 0.12s',
  },
  expanderPlaceholder: {
    width: 16,
    flexShrink: 0,
  },
  checkboxWrap: {
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  checkbox: {
    width: 12,
    height: 12,
    border: '1.5px solid',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.15s',
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
  },
  nameBlock: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    overflow: 'hidden',
    minWidth: 0,
    pointerEvents: 'none',
  },
  name: {
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
    minWidth: 0,
  },
  noteBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '0px 5px',
    backgroundColor: 'var(--bg-surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-secondary)',
    fontSize: 9.5,
    maxWidth: 110,
    overflow: 'hidden',
    flexShrink: 2,
    height: 14,
  },
  noteText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  opacityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '0px 4px',
    backgroundColor: 'var(--warning-soft)',
    border: '1px solid var(--warning-border)',
    borderRadius: 8,
    color: 'var(--warning)',
    fontSize: 9,
    fontWeight: 600,
    flexShrink: 0,
    fontFamily: 'Consolas, monospace',
    height: 14,
  },
  labelBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 3,
    color: 'var(--accent)',
    flexShrink: 0,
    width: 14,
    height: 14,
  },
  childCount: {
    fontSize: 9,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-surface-hover)',
    padding: '0px 4px',
    borderRadius: 6,
    fontFamily: 'Consolas, monospace',
    flexShrink: 0,
    minWidth: 14,
    textAlign: 'center',
    lineHeight: '14px',
    height: 14,
  },
  editInput: {
    flex: 1,
    padding: '1px 4px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--accent)',
    borderRadius: 3,
    color: 'var(--text-primary)',
    outline: 'none',
    minWidth: 0,
    fontFamily: 'inherit',
  },
  actions: {
    display: 'flex',
    gap: 1,
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
  actionIconBtn: {
    width: 22,
    height: 22,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: 3,
  },
};

export default TreeRow;