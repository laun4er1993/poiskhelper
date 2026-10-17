// =====================================================
// src/components/map-create-menu/MapCreateMenu.tsx
// Меню при двойном клике по карте
// =====================================================

import { useEffect, useRef, useState } from 'react';
import {
  X,
  MapPin,
  Ruler,
  Minus,
  Square,
  Crosshair,
  Copy,
  Check,
  FolderPlus,
} from 'lucide-react';
import type {
  MapCreateAction,
  MapCreateMenuSettings,
} from '../../types/settings';
import type { CoordinateFormat } from '../../types/units';
import { formatLatLon } from '../../types/format';
import { getActionColor } from './types';
import type { MenuAction } from './types';

interface MapCreateMenuProps {
  visible: boolean;
  x: number;
  y: number;
  lat: number;
  lon: number;
  height: number;
  settings: MapCreateMenuSettings;
  coordinateFormat: CoordinateFormat;
  highPrecision: boolean;
  containerWidth: number;
  containerHeight: number;
  onSelect: (action: MapCreateAction) => void;
  onClose: () => void;
}

function MapCreateMenu({
  visible,
  x,
  y,
  lat,
  lon,
  height,
  settings,
  coordinateFormat,
  highPrecision,
  containerWidth,
  containerHeight,
  onSelect,
  onClose,
}: MapCreateMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const actions: MenuAction[] = [];

  if (settings.showPlace) {
    actions.push({
      id: 'place',
      label: 'Метка',
      hint: 'Создать точку с координатами',
      icon: MapPin,
      color: getActionColor('place'),
      enabled: true,
    });
  }

  if (settings.showFolder) {
    actions.push({
      id: 'folder',
      label: 'Папка',
      hint: 'Создать папку в этом месте',
      icon: FolderPlus,
      color: getActionColor('folder'),
      enabled: true,
    });
  }

  if (settings.showLine) {
    actions.push({
      id: 'line',
      label: 'Линия',
      hint: 'Нарисовать линию (в разработке)',
      icon: Minus,
      color: getActionColor('line'),
      enabled: false,
    });
  }

  if (settings.showPolygon) {
    actions.push({
      id: 'polygon',
      label: 'Полигон',
      hint: 'Нарисовать полигон (в разработке)',
      icon: Square,
      color: getActionColor('polygon'),
      enabled: false,
    });
  }

  if (settings.showMeasure) {
    actions.push({
      id: 'measure',
      label: 'Измерение',
      hint: 'Начать измерение с этой точки',
      icon: Ruler,
      color: getActionColor('measure'),
      enabled: true,
    });
  }

  // =====================================================
  // === Позиционирование (центр над точкой + стрелка) ===
  // =====================================================
  const menuWidth = 260;
  const menuHeight = 60 + actions.length * 46;
  const arrowSize = 10;
  const edgePadding = 8;

  // 1. Горизонталь: центрируем меню над точкой
  let left = x - menuWidth / 2;
  if (left < edgePadding) left = edgePadding;
  if (left + menuWidth > containerWidth - edgePadding) {
    left = containerWidth - menuWidth - edgePadding;
  }

  // 2. Вертикаль: сначала пробуем снизу от точки
  let top = y + arrowSize + 4;
  let arrowSide: 'top' | 'bottom' = 'top';

  if (top + menuHeight > containerHeight - edgePadding) {
    // не влезло снизу — переворачиваем вверх
    top = y - menuHeight - arrowSize - 4;
    arrowSide = 'bottom';
    if (top < edgePadding) {
      // не влезает ни сверху, ни снизу — прижимаем к верху
      top = edgePadding;
      arrowSide = 'top';
    }
  }

  // 3. Стрелка: локальный X относительно левого края меню
  let arrowOffset = x - left;
  // Прижимаем к краям меню (стрелка не должна вылезать за скругления)
  const arrowMargin = arrowSize + 6;
  if (arrowOffset < arrowMargin) arrowOffset = arrowMargin;
  if (arrowOffset > menuWidth - arrowMargin) {
    arrowOffset = menuWidth - arrowMargin;
  }

  const handleCopyCoords = function () {
    const text = lat.toFixed(8) + ', ' + lon.toFixed(8);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
    setCopied(true);
    setTimeout(function () {
      setCopied(false);
    }, 1400);
  };

  useEffect(
    function () {
      if (!visible) return;

      const handler = function (e: KeyboardEvent) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(function (prev) {
            return Math.min(prev + 1, actions.length - 1);
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(function (prev) {
            return Math.max(prev - 1, 0);
          });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const act = actions[selectedIndex];
          if (act && act.enabled) {
            onSelect(act.id);
          }
        }
      };

      window.addEventListener('keydown', handler);
      return function () {
        window.removeEventListener('keydown', handler);
      };
      // eslint-disable-next-line
    },
    [visible, selectedIndex, actions.length]
  );

  useEffect(
    function () {
      if (!visible) return;

      const handler = function (e: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          onClose();
        }
      };

      const t = setTimeout(function () {
        document.addEventListener('mousedown', handler);
      }, 50);

      return function () {
        clearTimeout(t);
        document.removeEventListener('mousedown', handler);
      };
    },
    [visible, onClose]
  );

  useEffect(
    function () {
      if (visible) setSelectedIndex(0);
    },
    [visible]
  );

  if (!visible) return null;
  if (actions.length === 0) return null;

  // === Стили стрелки (двойной треугольник — рамка + фон) ===
  const borderColor =
    'var(--globe-popup-border, var(--border))';
  const bgColor = 'var(--globe-popup-bg, var(--bg-modal))';

  const outerArrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    pointerEvents: 'none',
  };
  const innerArrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    pointerEvents: 'none',
  };

  if (arrowSide === 'top') {
    // Стрелка сверху меню, смотрит вверх
    outerArrowStyle.top = -arrowSize;
    outerArrowStyle.left = arrowOffset - arrowSize;
    outerArrowStyle.borderLeft = arrowSize + 'px solid transparent';
    outerArrowStyle.borderRight = arrowSize + 'px solid transparent';
    outerArrowStyle.borderBottom = arrowSize + 'px solid ' + borderColor;

    innerArrowStyle.top = -arrowSize + 2;
    innerArrowStyle.left = arrowOffset - (arrowSize - 2);
    innerArrowStyle.borderLeft = arrowSize - 2 + 'px solid transparent';
    innerArrowStyle.borderRight = arrowSize - 2 + 'px solid transparent';
    innerArrowStyle.borderBottom = arrowSize - 2 + 'px solid ' + bgColor;
  } else {
    // Стрелка снизу меню, смотрит вниз
    outerArrowStyle.bottom = -arrowSize;
    outerArrowStyle.left = arrowOffset - arrowSize;
    outerArrowStyle.borderLeft = arrowSize + 'px solid transparent';
    outerArrowStyle.borderRight = arrowSize + 'px solid transparent';
    outerArrowStyle.borderTop = arrowSize + 'px solid ' + borderColor;

    innerArrowStyle.bottom = -arrowSize + 2;
    innerArrowStyle.left = arrowOffset - (arrowSize - 2);
    innerArrowStyle.borderLeft = arrowSize - 2 + 'px solid transparent';
    innerArrowStyle.borderRight = arrowSize - 2 + 'px solid transparent';
    innerArrowStyle.borderTop = arrowSize - 2 + 'px solid ' + bgColor;
  }

  return (
    <div
      ref={menuRef}
      style={{
        ...styles.menu,
        left: left,
        top: top,
        width: menuWidth,
      }}
      onMouseDown={function (e) {
        e.stopPropagation();
      }}
    >
      {/* ⚡ Стрелка-хвостик: внешняя (рамка) + внутренняя (фон) */}
      <div style={outerArrowStyle} />
      <div style={innerArrowStyle} />

      {/* HEADER: координаты */}
      <div style={styles.header}>
        <div style={styles.coordBlock}>
          <span style={styles.coordIcon}>
            <Crosshair size={11} />
          </span>
          <span style={styles.coordText}>
            {formatLatLon(lat, lon, coordinateFormat, highPrecision)}
          </span>
        </div>
        <button
          style={{
            ...styles.copyBtn,
            color: copied ? 'var(--success)' : 'var(--text-muted)',
          }}
          onClick={handleCopyCoords}
          title="Скопировать точные координаты (8 знаков)"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
        <button
          style={styles.closeBtn}
          onClick={onClose}
          title="Закрыть (Esc)"
        >
          <X size={12} />
        </button>
      </div>

      {isFinite(height) && (
        <div style={styles.heightRow}>
          <span style={styles.heightLabel}>Высота:</span>
          <span style={styles.heightValue}>{height.toFixed(2)} м</span>
        </div>
      )}

      <div style={styles.actions}>
        {actions.map(function (act, idx) {
          const Icon = act.icon;
          const isSelected = idx === selectedIndex;

          return (
            <button
              key={act.id}
              style={{
                ...styles.actionBtn,
                backgroundColor: isSelected
                  ? 'var(--accent-soft-hover)'
                  : 'transparent',
                borderColor: isSelected
                  ? 'var(--accent-border)'
                  : 'transparent',
                opacity: act.enabled ? 1 : 0.45,
                cursor: act.enabled ? 'pointer' : 'not-allowed',
              }}
              onClick={function () {
                if (!act.enabled) return;
                onSelect(act.id);
              }}
              onMouseEnter={function () {
                setSelectedIndex(idx);
              }}
              disabled={!act.enabled}
              title={act.hint}
            >
              <span
                style={{
                  ...styles.actionIcon,
                  color: act.color,
                }}
              >
                <Icon size={14} />
              </span>
              <span style={styles.actionTextWrap}>
                <span style={styles.actionLabel}>{act.label}</span>
                <span style={styles.actionHint}>{act.hint}</span>
              </span>
              {isSelected && act.enabled && (
                <span style={styles.enterHint}>↵</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={styles.footer}>
        <span style={styles.footerHint}>
          <kbd style={styles.kbd}>↑↓</kbd> выбор
        </span>
        <span style={styles.footerHint}>
          <kbd style={styles.kbd}>↵</kbd> ОК
        </span>
        <span style={styles.footerHint}>
          <kbd style={styles.kbd}>Esc</kbd> отмена
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  menu: {
    position: 'absolute',
    zIndex: 520,
    backgroundColor: 'var(--globe-popup-bg, var(--bg-modal))',
    border: '1px solid var(--globe-popup-border, var(--border))',
    borderRadius: 'var(--globe-popup-radius, 10px)',
    boxShadow: 'var(--shadow-lg)',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: 12,
    color: 'var(--globe-popup-text, var(--text-primary))',
    overflow: 'visible',
    animation: 'scaleIn 0.13s ease',
    transformOrigin: 'top center',
    pointerEvents: 'auto',
    padding: 4,
    backdropFilter: 'blur(12px) saturate(150%)',
    WebkitBackdropFilter: 'blur(12px) saturate(150%)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 6px 6px 8px',
    borderBottom:
      '1px solid var(--globe-popup-border, var(--border))',
  },
  coordBlock: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  coordIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--globe-popup-muted, var(--text-muted))',
    flexShrink: 0,
  },
  coordText: {
    fontSize: 10.5,
    fontFamily: 'Consolas, monospace',
    color: 'var(--globe-popup-text, var(--text-primary))',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  copyBtn: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'color 0.15s',
  },
  closeBtn: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  heightRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2px 8px 6px 8px',
    fontSize: 10.5,
  },
  heightLabel: {
    color: 'var(--globe-popup-muted, var(--text-muted))',
  },
  heightValue: {
    color: 'var(--globe-popup-text, var(--text-primary))',
    fontFamily: 'Consolas, monospace',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    padding: '2px 0',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    border: '1px solid transparent',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    color: 'var(--globe-popup-text, var(--text-primary))',
    transition: 'background-color 0.12s, border-color 0.12s',
    outline: 'none',
    width: '100%',
    minWidth: 0,
  },
  actionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    flexShrink: 0,
  },
  actionTextWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--globe-popup-title, var(--text-primary))',
  },
  actionHint: {
    fontSize: 10,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  enterHint: {
    fontSize: 10,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    opacity: 0.6,
    flexShrink: 0,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '4px 8px 2px 8px',
    borderTop: '1px solid var(--globe-popup-border, var(--border))',
    marginTop: 2,
  },
  footerHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 9.5,
    color: 'var(--globe-popup-muted, var(--text-muted))',
  },
  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1px 4px',
    backgroundColor: 'var(--kbd-bg)',
    border: '1px solid var(--kbd-border)',
    borderRadius: 3,
    fontSize: 9,
    fontFamily: 'Consolas, monospace',
    color: 'var(--globe-popup-text, var(--text-primary))',
    minWidth: 14,
    fontWeight: 600,
  },
};

export default MapCreateMenu;