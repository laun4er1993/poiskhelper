// =====================================================
// src/components/globe/MapSourcesPanel.tsx
// Панель источников карт — адаптируется к размеру КОНТЕЙНЕРА,
// а не окна. Работает даже при сжатом сайдбаре.
// =====================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Layers,
  X,
  Check,
  RefreshCw,
  Calendar,
  Sun,
  Contrast,
  Droplet,
  Search,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Satellite,
  History,
  Map as MapIcon,
  Mountain,
} from 'lucide-react';

import type {
  MapSourceInfo,
  MapSourceCategory,
  CustomMapSource,
} from '../../types/map-sources';
import {
  getAllMapSources,
  getMapSourceInfo,
  resolveTimeMax,
} from '../../types/map-sources';
import type { MapSourceSettings } from '../../types/settings';
import {
  OVERLAY_SOURCES,
  readOverlaySettings,
  type OverlayId,
} from '../../types/overlay-sources';
import { useWaybackReleases } from '../../hooks/useWaybackReleases';
import { findClosestRelease } from '../../services/map-sources/wayback';

interface MapSourcesPanelProps {
  settings: MapSourceSettings;
  onChange: (updater: Partial<MapSourceSettings>) => void;
  onNeedCustomDialog: (edit?: CustomMapSource | null) => void;
  onDeleteCustom: (id: string) => void;
  top?: number;
  right?: number;
}

function formatDateRu(iso: string): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return m[3] + '.' + m[2] + '.' + m[1];
}

function daysBetween(a: string, b: string): number {
  const ta = new Date(a + 'T00:00:00Z').getTime();
  const tb = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((tb - ta) / (24 * 60 * 60 * 1000));
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

interface SourceGroup {
  id: string;
  label: string;
  icon: any;
  items: MapSourceInfo[];
}

function buildGroups(sources: MapSourceInfo[]): SourceGroup[] {
  const builtIn = sources.filter(function (s) {
    return !s.isCustom;
  });
  const custom = sources.filter(function (s) {
    return s.isCustom;
  });

  const byCategory = function (cat: MapSourceCategory) {
    return builtIn.filter(function (s) {
      return s.category === cat;
    });
  };

  const groups: SourceGroup[] = [
    {
      id: 'satellite',
      label: 'Спутник',
      icon: Satellite,
      items: byCategory('satellite'),
    },
    {
      id: 'history',
      label: 'История',
      icon: History,
      items: byCategory('history'),
    },
    {
      id: 'street',
      label: 'Схема',
      icon: MapIcon,
      items: byCategory('street'),
    },
    {
      id: 'topo',
      label: 'Топо',
      icon: Mountain,
      items: byCategory('topo'),
    },
  ];

  if (custom.length > 0) {
    groups.push({
      id: 'custom',
      label: 'Свои карты',
      icon: Plus,
      items: custom,
    });
  }

  return groups.filter(function (g) {
    return g.items.length > 0;
  });
}

// -----------------------------------------------------
// ⚡ Размер РОДИТЕЛЬСКОГО контейнера (глобус), не окна
// -----------------------------------------------------
interface Size {
  w: number;
  h: number;
}

function useParentSize(
  ref: React.RefObject<HTMLDivElement | null>
): Size {
  const [size, setSize] = useState<Size>(function () {
    return {
      w: typeof window !== 'undefined' ? window.innerWidth : 1024,
      h: typeof window !== 'undefined' ? window.innerHeight : 768,
    };
  });

  useEffect(
    function () {
      let raf: number | null = null;

      const update = function () {
        if (raf !== null) return;
        raf = window.requestAnimationFrame(function () {
          raf = null;
          const parent = ref.current?.parentElement;
          if (parent) {
            const w = parent.clientWidth;
            const h = parent.clientHeight;
            setSize(function (prev) {
              if (prev.w === w && prev.h === h) return prev;
              return { w: w, h: h };
            });
          } else {
            const w = window.innerWidth;
            const h = window.innerHeight;
            setSize(function (prev) {
              if (prev.w === w && prev.h === h) return prev;
              return { w: w, h: h };
            });
          }
        });
      };

      // Первичный замер
      update();

      // ResizeObserver на родителя — ловит сжатие сайдбара
      let ro: ResizeObserver | null = null;
      const parent = ref.current?.parentElement;
      if (parent && typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(update);
        ro.observe(parent);
      }

      // Fallback — на resize окна
      window.addEventListener('resize', update);

      return function () {
        if (ro) ro.disconnect();
        window.removeEventListener('resize', update);
        if (raf !== null) window.cancelAnimationFrame(raf);
      };
    },
    [ref]
  );

  return size;
}

// -----------------------------------------------------
// Компонент
// -----------------------------------------------------
function MapSourcesPanel({
  settings,
  onChange,
  onNeedCustomDialog,
  onDeleteCustom,
  top = 14,
  right = 14,
}: MapSourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const wrapRef = useRef<HTMLDivElement>(null);

  const parentSize = useParentSize(wrapRef);

  // ⚡ Адаптация по ширине РОДИТЕЛЯ, а не window
  const isFullScreen = parentSize.w < 520;
  const isTiny = parentSize.w < 380;
  const previewSize = isTiny ? 24 : isFullScreen ? 28 : 32;

  // Кнопка «Слои» не должна уходить за край контейнера
  const safeRight = Math.min(
    Math.max(8, right),
    Math.max(8, parentSize.w - 100)
  );
  const safeTop = Math.min(
    Math.max(8, top),
    Math.max(8, parentSize.h - 60)
  );

  const wayback = useWaybackReleases(true);
  const customSources = settings.customSources || [];

  const allSources = useMemo(
    function () {
      return getAllMapSources(customSources);
    },
    [customSources]
  );

  const filteredSources = useMemo(
    function () {
      if (!searchQuery.trim()) return allSources;
      const q = searchQuery.trim().toLowerCase();
      return allSources.filter(function (s) {
        return (
          s.label.toLowerCase().indexOf(q) >= 0 ||
          s.description.toLowerCase().indexOf(q) >= 0
        );
      });
    },
    [allSources, searchQuery]
  );

  const groups = useMemo(
    function () {
      return buildGroups(filteredSources);
    },
    [filteredSources]
  );

  const current = getMapSourceInfo(settings.baseLayer, customSources);

  useEffect(
    function () {
      if (!open) return;
      const handler = function (e: MouseEvent) {
        if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return function () {
        document.removeEventListener('mousedown', handler);
      };
    },
    [open]
  );

  useEffect(
    function () {
      if (!open) return;
      const handler = function (e: KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
      };
      window.addEventListener('keydown', handler);
      return function () {
        window.removeEventListener('keydown', handler);
      };
    },
    [open]
  );

  const handleSelect = function (layer: MapSourceInfo) {
    onChange({ baseLayer: layer.id });
  };

  const toggleGroup = function (id: string) {
    setCollapsedGroups(function (prev) {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const selectedWaybackRelease = useMemo(
    function () {
      if (current.provider !== 'esri-wayback') return null;
      return findClosestRelease(wayback.releases, settings.baseLayerDate);
    },
    [current, settings.baseLayerDate, wayback.releases]
  );

  const waybackRangeConfig = useMemo(
    function () {
      if (current.provider !== 'esri-wayback') return null;
      const releases = wayback.releases;
      if (releases.length === 0) return null;
      return {
        minDate: releases[0].date,
        maxDate: releases[releases.length - 1].date,
        releases: releases,
      };
    },
    [current, wayback.releases]
  );

  const otherTimeConfig = useMemo(
    function () {
      if (!current.supportsTime) return null;
      if (current.provider === 'esri-wayback') return null;

      const minDate = current.timeMin || '2000-01-01';
      const maxDate = resolveTimeMax(current.timeMax);
      const step = current.timeStepDays || 1;
      const totalDays = daysBetween(minDate, maxDate);
      return { minDate, maxDate, step, totalDays };
    },
    [current]
  );

  const overlays = readOverlaySettings(settings.overlays);
  const showOverlays =
    current.category === 'satellite' || current.provider === 'esri-wayback';

  const setOverlay = function (id: OverlayId, value: boolean) {
    const next = { ...overlays };
    next[id] = value;
    onChange({ overlays: next });
  };

  // -----------------------------------------------------
  // ⚡ Стили панели — зависят от размера КОНТЕЙНЕРА
  // -----------------------------------------------------
  const panelStyle: React.CSSProperties = isFullScreen
    ? {
        ...styles.panel,
        position: 'fixed',
        top: 8,
        left: 8,
        right: 8,
        bottom: 8,
        width: 'auto',
        maxWidth: 'none',
        maxHeight: 'none',
        height: 'auto',
        zIndex: 1000,
      }
    : {
        ...styles.panel,
        width: Math.min(480, parentSize.w - 24),
        maxHeight: Math.min(parentSize.h - safeTop - 40, 720),
      };

  return (
    <div
      ref={wrapRef}
      data-globe-overlay="true"
      style={{
        ...styles.wrap,
        top: safeTop,
        right: safeRight,
      }}
    >
      <button
        style={{
          ...styles.triggerBtn,
          backgroundColor: open
            ? 'var(--accent)'
            : 'var(--globe-nav-bg, rgba(20,24,32,0.8))',
          color: open
            ? 'var(--accent-text)'
            : 'var(--globe-nav-text, var(--text-primary))',
          borderColor: open
            ? 'var(--accent)'
            : 'var(--globe-nav-border, var(--border))',
        }}
        onClick={function () {
          setOpen(!open);
        }}
        title={'Источник карты: ' + current.label}
      >
        <Layers size={15} />
        <span style={styles.triggerLabel}>{current.shortLabel}</span>
      </button>

      {open && (
        <>
          {isFullScreen && (
            <div
              style={styles.backdrop}
              onClick={function () {
                setOpen(false);
              }}
            />
          )}

          <div style={panelStyle}>
            <div style={styles.panelHeader}>
              <Layers size={12} color="var(--accent)" />
              <span style={styles.panelTitle}>Источник карты</span>
              <button
                style={styles.closeBtn}
                onClick={function () {
                  setOpen(false);
                }}
                title="Закрыть"
              >
                <X size={12} />
              </button>
            </div>

            <div style={styles.panelBody}>
              <div style={styles.searchRow}>
                <Search size={11} color="var(--globe-popup-muted)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={function (e) {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Поиск карты…"
                  style={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    style={styles.clearSearch}
                    onClick={function () {
                      setSearchQuery('');
                    }}
                    title="Очистить"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              {groups.length === 0 && (
                <div style={styles.emptyState}>Ничего не найдено</div>
              )}

              {groups.map(function (group) {
                const GIcon = group.icon;
                const isCollapsed = collapsedGroups[group.id] === true;
                return (
                  <div key={group.id} style={styles.group}>
                    <button
                      style={styles.groupHeader}
                      onClick={function () {
                        toggleGroup(group.id);
                      }}
                    >
                      {isCollapsed ? (
                        <ChevronRight size={11} />
                      ) : (
                        <ChevronDown size={11} />
                      )}
                      <GIcon size={11} color="var(--accent)" />
                      <span style={styles.groupTitle}>{group.label}</span>
                      <span style={styles.groupCount}>
                        {group.items.length}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div style={styles.groupBody}>
                        {group.items.map(function (item) {
                          const active = settings.baseLayer === item.id;
                          return (
                            <div
                              key={item.id}
                              role="button"
                              tabIndex={0}
                              style={{
                                ...styles.sourceCard,
                                borderColor: active
                                  ? 'var(--accent)'
                                  : 'var(--globe-popup-border, var(--border))',
                                backgroundColor: active
                                  ? 'var(--accent-soft)'
                                  : 'var(--overlay-soft)',
                              }}
                              onClick={function () {
                                handleSelect(item);
                              }}
                              onKeyDown={function (e) {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSelect(item);
                                }
                              }}
                              title={item.description}
                            >
                              <span
                                style={{
                                  ...styles.sourcePreview,
                                  width: previewSize,
                                  height: previewSize,
                                  backgroundColor: item.previewColor,
                                }}
                              />
                              <span style={styles.sourceInfo}>
                                <span
                                  style={styles.sourceLabel}
                                  title={item.label}
                                >
                                  {item.label}
                                </span>
                                {!isTiny && (
                                  <span
                                    style={styles.sourceDesc}
                                    title={item.description}
                                  >
                                    {item.description}
                                  </span>
                                )}
                              </span>
                              {active && (
                                <Check
                                  size={11}
                                  color="var(--accent)"
                                  style={{ flexShrink: 0 }}
                                />
                              )}
                              {item.isCustom && !isTiny && (
                                <>
                                  <button
                                    style={styles.miniBtn}
                                    onClick={function (e) {
                                      e.stopPropagation();
                                      onNeedCustomDialog(
                                        customSources.find(function (c) {
                                          return c.id === item.id;
                                        }) || null
                                      );
                                    }}
                                    title="Редактировать"
                                  >
                                    <Edit3 size={10} />
                                  </button>
                                  <button
                                    style={{
                                      ...styles.miniBtn,
                                      color: 'var(--danger)',
                                    }}
                                    onClick={function (e) {
                                      e.stopPropagation();
                                      onDeleteCustom(item.id);
                                    }}
                                    title="Удалить"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                style={styles.addCustomBtn}
                onClick={function () {
                  onNeedCustomDialog(null);
                }}
                title="Добавить свою карту"
              >
                <Plus size={11} /> Добавить свою карту
              </button>

              {current.provider === 'esri-wayback' && waybackRangeConfig && (
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <Calendar size={11} color="var(--accent)" />
                    <span style={styles.sectionTitle}>Дата снимков</span>
                    <span style={styles.sectionValue}>
                      {selectedWaybackRelease
                        ? formatDateRu(selectedWaybackRelease.date)
                        : formatDateRu(settings.baseLayerDate)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={Math.max(
                      0,
                      waybackRangeConfig.releases.length - 1
                    )}
                    step={1}
                    value={
                      selectedWaybackRelease
                        ? Math.max(
                            0,
                            waybackRangeConfig.releases.findIndex(
                              function (r) {
                                return (
                                  r.release ===
                                  selectedWaybackRelease.release
                                );
                              }
                            )
                          )
                        : 0
                    }
                    onChange={function (e) {
                      const idx = parseInt(e.target.value);
                      const r = waybackRangeConfig.releases[idx];
                      if (r) onChange({ baseLayerDate: r.date });
                    }}
                    style={styles.range}
                  />
                  <div style={styles.rangeLabels}>
                    <span>{formatDateRu(waybackRangeConfig.minDate)}</span>
                    <span>{formatDateRu(waybackRangeConfig.maxDate)}</span>
                  </div>

                  <button
                    style={styles.refreshBtn}
                    onClick={wayback.refresh}
                    disabled={wayback.status === 'loading'}
                  >
                    <RefreshCw
                      size={10}
                      style={{
                        animation:
                          wayback.status === 'loading'
                            ? 'spin 0.9s linear infinite'
                            : 'none',
                      }}
                    />
                    {wayback.status === 'loading'
                      ? 'Загрузка…'
                      : 'Обновить релизы'}
                  </button>
                </div>
              )}

              {otherTimeConfig && (
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <Calendar size={11} color="var(--accent)" />
                    <span style={styles.sectionTitle}>Дата снимков</span>
                    <span style={styles.sectionValue}>
                      {formatDateRu(settings.baseLayerDate)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, otherTimeConfig.totalDays)}
                    step={otherTimeConfig.step}
                    value={Math.max(
                      0,
                      daysBetween(
                        otherTimeConfig.minDate,
                        settings.baseLayerDate
                      )
                    )}
                    onChange={function (e) {
                      const offset = parseInt(e.target.value);
                      onChange({
                        baseLayerDate: addDays(
                          otherTimeConfig.minDate,
                          offset
                        ),
                      });
                    }}
                    style={styles.range}
                  />
                  <div style={styles.rangeLabels}>
                    <span>{formatDateRu(otherTimeConfig.minDate)}</span>
                    <span>{formatDateRu(otherTimeConfig.maxDate)}</span>
                  </div>
                </div>
              )}

              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <Sun size={11} color="var(--accent)" />
                  <span style={styles.sectionTitle}>Внешний вид</span>
                </div>

                <div style={styles.sliderRow}>
                  <Droplet size={10} />
                  <span style={styles.sliderLabel}>Прозрачность</span>
                  <span style={styles.sliderValue}>
                    {Math.round(settings.baseLayerOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(settings.baseLayerOpacity * 100)}
                  onChange={function (e) {
                    onChange({
                      baseLayerOpacity: parseInt(e.target.value) / 100,
                    });
                  }}
                  style={styles.range}
                />

                <div style={styles.sliderRow}>
                  <Sun size={10} />
                  <span style={styles.sliderLabel}>Яркость</span>
                  <span style={styles.sliderValue}>
                    {settings.baseLayerBrightness.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={Math.round(settings.baseLayerBrightness * 100)}
                  onChange={function (e) {
                    onChange({
                      baseLayerBrightness:
                        parseInt(e.target.value) / 100,
                    });
                  }}
                  style={styles.range}
                />

                <div style={styles.sliderRow}>
                  <Contrast size={10} />
                  <span style={styles.sliderLabel}>Контраст</span>
                  <span style={styles.sliderValue}>
                    {settings.baseLayerContrast.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={Math.round(settings.baseLayerContrast * 100)}
                  onChange={function (e) {
                    onChange({
                      baseLayerContrast: parseInt(e.target.value) / 100,
                    });
                  }}
                  style={styles.range}
                />
              </div>

              {showOverlays && (
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <Layers size={11} color="var(--accent)" />
                    <span style={styles.sectionTitle}>Слои поверх</span>
                  </div>
                  <div style={styles.overlayHint}>
                    Дополнительные слои для спутниковой карты
                  </div>

                  {OVERLAY_SOURCES.map(function (ov) {
                    const checked = overlays[ov.id] === true;
                    return (
                      <label
                        key={ov.id}
                        style={styles.overlayRow}
                        title={ov.description}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={function (e) {
                            setOverlay(ov.id, e.target.checked);
                          }}
                        />
                        <span style={styles.overlayLabel}>{ov.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'absolute',
    zIndex: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    pointerEvents: 'auto',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 999,
  },
  triggerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: 32,
    padding: '0 10px',
    border: '1px solid',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11.5,
    fontWeight: 600,
    backdropFilter: 'blur(12px) saturate(150%)',
    WebkitBackdropFilter: 'blur(12px) saturate(150%)',
    boxShadow: 'var(--globe-shadow, var(--shadow-md))',
    transition: 'all 0.15s',
    flexShrink: 0,
  },
  triggerLabel: { whiteSpace: 'nowrap' },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--globe-popup-bg, var(--bg-modal))',
    border: '1px solid var(--globe-popup-border, var(--border))',
    borderRadius: 10,
    boxShadow: 'var(--shadow-lg)',
    backdropFilter: 'blur(14px) saturate(150%)',
    WebkitBackdropFilter: 'blur(14px) saturate(150%)',
    overflow: 'hidden',
    animation: 'scaleIn 0.13s ease',
    transformOrigin: 'top right',
    fontFamily: 'Segoe UI, sans-serif',
    zIndex: 1000,
  },
  panelHeader: {
    height: 36,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 8px 0 12px',
    borderBottom: '1px solid var(--globe-popup-border, var(--border))',
    backgroundColor: 'var(--overlay-soft)',
    flexShrink: 0,
  },
  panelTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--globe-popup-title, var(--text-primary))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
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
  panelBody: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    backgroundColor: 'var(--overlay-soft)',
    border: '1px solid var(--globe-popup-border, var(--border))',
    borderRadius: 6,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--globe-popup-text, var(--text-primary))',
    fontSize: 11.5,
    fontFamily: 'inherit',
    minWidth: 0,
  },
  clearSearch: {
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--globe-popup-muted)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 11.5,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    fontStyle: 'italic',
    padding: '20px 10px',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 6,
    border: '1px solid var(--globe-popup-border, var(--border))',
    overflow: 'hidden',
    flexShrink: 0,
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    backgroundColor: 'var(--overlay-soft)',
    border: 'none',
    color: 'var(--globe-popup-title, var(--text-primary))',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11.5,
    fontWeight: 600,
    textAlign: 'left',
    minHeight: 30,
  },
  groupTitle: {
    flex: 1,
    marginLeft: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  groupCount: {
    fontSize: 9.5,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    backgroundColor: 'var(--bg-input)',
    padding: '0px 5px',
    borderRadius: 8,
    fontFamily: 'Consolas, monospace',
    flexShrink: 0,
  },
  groupBody: {
    display: 'flex',
    flexDirection: 'column',
    padding: 4,
    gap: 3,
  },
  sourceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    border: '1px solid',
    borderRadius: 5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    color: 'var(--globe-popup-text, var(--text-primary))',
    transition: 'all 0.12s',
    outline: 'none',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  sourcePreview: {
    borderRadius: 4,
    flexShrink: 0,
  },
  sourceInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  sourceLabel: {
    fontSize: 11.5,
    fontWeight: 600,
    color: 'var(--globe-popup-title, var(--text-primary))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sourceDesc: {
    fontSize: 9.5,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  miniBtn: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--globe-popup-border, var(--border))',
    borderRadius: 3,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  addCustomBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '7px 10px',
    backgroundColor: 'var(--accent-soft)',
    border: '1px dashed var(--accent-border)',
    borderRadius: 6,
    color: 'var(--accent)',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  section: {
    padding: '8px 8px',
    backgroundColor: 'var(--overlay-soft)',
    border: '1px solid var(--globe-popup-border, var(--border))',
    borderRadius: 6,
    flexShrink: 0,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--globe-popup-title, var(--text-primary))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  sectionValue: {
    fontSize: 10.5,
    fontWeight: 600,
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
    flexShrink: 0,
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 9.5,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    marginTop: 3,
    fontFamily: 'Consolas, monospace',
  },
  range: {
    width: '100%',
    accentColor: 'var(--accent)',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    marginBottom: 2,
    fontSize: 10.5,
    color: 'var(--globe-popup-text, var(--text-primary))',
  },
  sliderLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sliderValue: {
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
    fontWeight: 600,
    minWidth: 40,
    textAlign: 'right',
    flexShrink: 0,
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    marginTop: 6,
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 5,
    color: 'var(--accent)',
    fontSize: 10.5,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  overlayHint: {
    fontSize: 10,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  overlayRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 2px',
    cursor: 'pointer',
    fontSize: 11.5,
    color: 'var(--globe-popup-text, var(--text-primary))',
  },
  overlayLabel: {
    flex: 1,
  },
};

export default MapSourcesPanel;