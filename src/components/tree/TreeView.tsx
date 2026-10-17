// =====================================================
// src/components/tree/TreeView.tsx
// Рекурсивный компонент дерева объектов
// =====================================================

import { useState, useEffect, useRef } from 'react';
import { MoveRight } from 'lucide-react';
import { createPortal } from 'react-dom';

import type { TreeItem, Place } from '../../types/base';
import { isContainer, isGeoItem } from '../../types/base';
import type { AppSettings } from '../../types/settings';
import {
  sortChildren,
  getSortField,
  getSortOrder,
  collectDescendantIds,
} from '../../types/tree-utils';

import type { TreeViewCommonProps } from './types';
import type { DragState } from './drag-state';
import {
  DRAG_THRESHOLD,
  AUTO_SCROLL_EDGE,
  AUTO_SCROLL_SPEED,
  HOVER_EXPAND_MS,
  subscribeDrag,
  setModuleDragState,
  getModuleDragState,
  wasJustDragged,
  markJustDragged,
  cleanupDragState,
  clearHoverTimer,
  getHoverId,
  setHoverId,
  setHoverTimer,
  findFolderAtPoint,
  findItemIn,
  openContextMenu,
} from './drag-state';

import TreeRow from './TreeRow';

interface TreeViewProps extends TreeViewCommonProps {
  settings: AppSettings;
}

function TreeView(props: TreeViewProps) {
  const {
    items,
    selectedIds,
    lastClickedId,
    depth = 0,
    parentVisible = true,
    parentOpacity = 1,
    focusedId,
    design,
    settings,
    editingId,
    editValue,
    onEditValueChange,
    onFinishRename,
    onCancelRename,
    onFocusChange,
    onSelect,
    onToggleVisible,
    onSetVisibleCascade,
    onToggleExpanded,
    onSetExpandedDeep,
    onRename,
    onDelete,
    onDeleteMultiple,
    onToggleVisibleMultiple,
    onAddFolder,
    onAddPlace,
    onFlyTo,
    onExport,
    onExportMultiple,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    onMoveRequest,
    onMoveItem,
    onMoveUpDown,
    onSortChange,
    onTogglePin,
    onShowInfo,
    onCopyCoords,
    onEditItem,
    clipboardEmpty,
    clipboardOperation,
  } = props;

  const [drag, setDrag] = useState<DragState>(getModuleDragState());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(function () {
    const unsub = subscribeDrag(setDrag);
    return unsub;
  }, []);

  const onMoveItemRef = useRef(onMoveItem);
  useEffect(
    function () {
      onMoveItemRef.current = onMoveItem;
    },
    [onMoveItem]
  );

  const onToggleExpandedRef = useRef(onToggleExpanded);
  useEffect(
    function () {
      onToggleExpandedRef.current = onToggleExpanded;
    },
    [onToggleExpanded]
  );

  const itemsRef = useRef(items);
  useEffect(
    function () {
      itemsRef.current = items;
    },
    [items]
  );

  useEffect(
    function () {
      if (depth !== 0) return;
      return function () {
        cleanupDragState();
      };
    },
    [depth]
  );

  useEffect(
    function () {
      if (depth !== 0) return;

      const handleMouseMove = function (e: MouseEvent) {
        const state = getModuleDragState();

        if (state.pending && !state.active) {
          const dx = e.clientX - state.startX;
          const dy = e.clientY - state.startY;
          if (
            Math.abs(dx) > DRAG_THRESHOLD ||
            Math.abs(dy) > DRAG_THRESHOLD
          ) {
            setModuleDragState({
              ...state,
              active: true,
              pending: false,
              x: e.clientX,
              y: e.clientY,
            });
          }
          return;
        }

        if (!state.active) return;

        const target = findFolderAtPoint(e.clientX, e.clientY);
        let validTarget: string | null = target;
        let invalidTarget: string | null = null;

        if (target) {
          if (state.draggingIds.indexOf(target) >= 0) {
            validTarget = null;
            invalidTarget = target;
          } else {
            for (let i = 0; i < state.draggingIds.length; i++) {
              const draggedItem = findItemIn(
                itemsRef.current,
                state.draggingIds[i]
              );
              if (draggedItem && isContainer(draggedItem)) {
                const descendants = collectDescendantIds(draggedItem);
                if (descendants.indexOf(target) >= 0) {
                  validTarget = null;
                  invalidTarget = target;
                  break;
                }
              }
            }
          }
        }

        if (validTarget && validTarget !== getHoverId()) {
          clearHoverTimer();
          setHoverId(validTarget);
          const targetItem = findItemIn(itemsRef.current, validTarget);
          if (targetItem && isContainer(targetItem) && !targetItem.expanded) {
            const idToExpand = validTarget;
            const timer = window.setTimeout(function () {
              onToggleExpandedRef.current(idToExpand);
              setHoverTimer(null);
              setHoverId(null);
            }, HOVER_EXPAND_MS);
            setHoverTimer(timer);
          }
        } else if (!validTarget) {
          clearHoverTimer();
        }

        setModuleDragState({
          ...state,
          x: e.clientX,
          y: e.clientY,
          targetFolderId: validTarget,
          invalidTargetId: invalidTarget,
        });

        const scrollContainers = document.querySelectorAll(
          '[data-tree-scroll="true"]'
        );
        scrollContainers.forEach(function (container) {
          const rect = (container as HTMLElement).getBoundingClientRect();
          if (e.clientY > rect.top && e.clientY < rect.bottom) {
            if (e.clientY < rect.top + AUTO_SCROLL_EDGE) {
              container.scrollTop -= AUTO_SCROLL_SPEED;
            } else if (e.clientY > rect.bottom - AUTO_SCROLL_EDGE) {
              container.scrollTop += AUTO_SCROLL_SPEED;
            }
          }
        });
      };

      const handleMouseUp = function () {
        const state = getModuleDragState();
        clearHoverTimer();

        if (state.active && state.targetFolderId) {
          const target = state.targetFolderId;
          state.draggingIds.forEach(function (id) {
            if (id !== target) onMoveItemRef.current(id, target);
          });
          markJustDragged();
        }

        setModuleDragState({
          active: false,
          x: 0,
          y: 0,
          draggingIds: [],
          targetFolderId: null,
          invalidTargetId: null,
          startX: 0,
          startY: 0,
          pending: false,
        });
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return function () {
        clearHoverTimer();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    },
    [depth]
  );

  useEffect(
    function () {
      if (drag.active) {
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        document.body.classList.add('dragging');
      } else {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('dragging');
      }
      return function () {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('dragging');
      };
    },
    [drag.active]
  );

  const handleRowMouseDown = function (e: React.MouseEvent, item: TreeItem) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.getAttribute('data-no-drag') === 'true'
    )
      return;

    const isInSelection = selectedIds.indexOf(item.id) >= 0;
    const dragIds = isInSelection ? selectedIds.slice() : [item.id];

    setModuleDragState({
      active: false,
      pending: true,
      x: e.clientX,
      y: e.clientY,
      draggingIds: dragIds,
      targetFolderId: null,
      invalidTargetId: null,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  const handleItemClick = function (e: React.MouseEvent, item: TreeItem) {
    if (wasJustDragged()) return;
    onFocusChange(item.id);
    if (e.ctrlKey || e.metaKey) onSelect(item.id, 'toggle');
    else if (e.shiftKey && lastClickedId) onSelect(item.id, 'range');
    else onSelect(item.id, 'single');
  };

  // ⚡ Двойной клик: для geo-объектов — перелёт, для контейнеров — раскрыть
  const handleRowDoubleClick = function (item: TreeItem) {
    if (isGeoItem(item)) {
      onFlyTo(item);
      return;
    }
    if (isContainer(item)) {
      onToggleExpanded(item.id);
    }
  };

  const handleContextMenu = function (e: React.MouseEvent, item: TreeItem) {
    e.preventDefault();
    e.stopPropagation();
    const isBulk =
      selectedIds.length > 1 && selectedIds.indexOf(item.id) >= 0;
    if (!isBulk) onSelect(item.id, 'single');
    onFocusChange(item.id);
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId: item.id,
      itemType: item.type,
      isBulk: isBulk,
    });
  };

  const childIndent =
    design.treeDensity === 'compact'
      ? 12
      : design.treeDensity === 'comfortable'
      ? 18
      : 14;

  return (
    <>
      <ul
        style={{
          ...styles.list,
          paddingLeft: depth === 0 ? 0 : childIndent,
        }}
      >
        {items.map(function (item) {
          if (!item) return null;

          const expanded = isContainer(item) ? item.expanded : false;
          const isDragging =
            drag.active && drag.draggingIds.indexOf(item.id) >= 0;
          const isDropTarget =
            drag.active && drag.targetFolderId === item.id;
          const isInvalidTarget =
            drag.active && drag.invalidTargetId === item.id;
          const isHovered = hoveredId === item.id;

          const selfVisible = parentVisible && item.visible !== false;
          const childParentVisible = selfVisible;
          const childParentOpacity = parentOpacity * (item.opacity ?? 1);

          let displayedChildren: TreeItem[] = [];
          if (isContainer(item)) {
            const field = getSortField(item);
            const order = getSortOrder(item);
            displayedChildren = sortChildren(item.children, field, order);
          }

          return (
            <li key={item.id} style={styles.listItem}>
              <TreeRow
                item={item}
                depth={depth}
                parentVisible={parentVisible}
                parentOpacity={parentOpacity}
                selectedIds={selectedIds}
                focusedId={focusedId}
                isDragging={isDragging}
                isDropTarget={isDropTarget}
                isInvalidTarget={isInvalidTarget}
                design={design}
                settings={settings}
                isHovered={isHovered}
                onHoverChange={function (h) {
                  setHoveredId(h ? item.id : null);
                }}
                editingId={editingId}
                editValue={editValue}
                onEditValueChange={onEditValueChange}
                onFinishRename={onFinishRename}
                onCancelRename={onCancelRename}
                onRowMouseDown={handleRowMouseDown}
                onItemClick={handleItemClick}
                onRowDoubleClick={handleRowDoubleClick}
                onContextMenu={handleContextMenu}
                onToggleExpanded={onToggleExpanded}
                onSetExpandedDeep={onSetExpandedDeep}
                onSetVisibleCascade={onSetVisibleCascade}
                onFlyTo={onFlyTo}
                onCopyCoords={onCopyCoords}
              />

              {isContainer(item) &&
                expanded &&
                displayedChildren.length > 0 && (
                  <TreeView
                    {...props}
                    items={displayedChildren}
                    depth={depth + 1}
                    parentVisible={childParentVisible}
                    parentOpacity={childParentOpacity}
                  />
                )}
            </li>
          );
        })}
      </ul>

      {depth === 0 &&
        drag.active &&
        createPortal(
          <div
            style={{
              ...styles.ghost,
              left: drag.x + 14,
              top: drag.y + 14,
              backgroundColor: drag.invalidTargetId
                ? 'var(--danger)'
                : 'var(--accent)',
            }}
          >
            <MoveRight size={13} />
            <span>
              {drag.draggingIds.length === 1
                ? 'Переместить'
                : 'Переместить ' + drag.draggingIds.length + ' объектов'}
            </span>
            {drag.invalidTargetId && (
              <span style={styles.ghostHint}>✕ Нельзя сюда</span>
            )}
            {drag.targetFolderId && (
              <span style={styles.ghostHint}>→ Отпустите для переноса</span>
            )}
            {!drag.targetFolderId && !drag.invalidTargetId && (
              <span style={styles.ghostHint}>→ Наведите на папку</span>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  listItem: {
    listStyle: 'none',
  },
  ghost: {
    position: 'fixed',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    color: 'var(--accent-text)',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    boxShadow: 'var(--shadow-lg)',
    pointerEvents: 'none',
    zIndex: 9999,
    fontFamily: 'Segoe UI, sans-serif',
    whiteSpace: 'nowrap',
  },
  ghostHint: {
    fontSize: 11,
    color: 'var(--accent-text)',
    opacity: 0.9,
    marginLeft: 6,
    fontStyle: 'italic',
  },
};

export default TreeView;