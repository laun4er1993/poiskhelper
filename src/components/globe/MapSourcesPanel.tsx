// =====================================================
// src/components/globe/MapSourcesPanel.tsx
// Улучшенная панель источников карт
// =====================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Layers,
  X,
  Check,
  Satellite,
  Map as MapIcon,
  Mountain,
  History,
  RefreshCw,
  Sun,
  Contrast,
  Droplet,
  Calendar,
  Globe2,
  Flag,
  Search,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';

import type {
  MapSourceId,
  MapSourceInfo,
  CountryFilter,
  CustomMapSource,
} from '../../types/map-sources';
import {
  getFilteredMapSources,
  getMapSourceInfo,
  resolveTimeMax,
} from '../../types/map-sources';
import type { MapSourceSettings } from '../../types/settings';
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

function categoryIcon(cat: MapSourceInfo['category']) {
  if (cat === 'satellite') return Satellite;
  if (cat === 'topo') return Mountain;
  if (cat === 'history') return History;
  return MapIcon;
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

function MapSourcesPanel({
  settings,
  onChange,
  onNeedCustomDialog,
  onDeleteCustom,
  top = 14,
  right = 80,
}: MapSourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const wayback = useWaybackReleases(true);
  const customSources = settings.customSources || [];
  const countryFilter: CountryFilter = settings.countryFilter || 'russia';

  const availableSources = useMemo(
    function () {
      return getFilteredMapSources(countryFilter, customSources);
    },
    [countryFilter, customSources]
  );

  const filteredBySearch = useMemo(
    function () {
      if (!searchQuery.trim()) return availableSources;
      const q = searchQuery.trim().toLowerCase();
      return availableSources.filter(function (s) {
        return (
          s.label.toLowerCase().indexOf(q) >= 0 ||
          s.description.toLowerCase().indexOf(q) >= 0
        );
      });
    },
    [availableSources, searchQuery]
  );

  const current = getMapSourceInfo(settings.baseLayer, customSources);
  const activeIndex = useMemo(
    function () {
      const idx = filteredBySearch.findIndex(function (s) {
        return s.id === settings.baseLayer;
      });
      return idx >= 0 ? idx : 0;
    },
    [filteredBySearch, settings.baseLayer]
  );

  useEffect(
    function () {
      if (filteredBySearch.length === 0) return;
      const inList = filteredBySearch.some(function (s) {
        return s.id === settings.baseLayer;
      });
      if (!inList) {
        onChange({ baseLayer: filteredBySearch[0].id });
      }
    },
    [filteredBySearch, settings.baseLayer, onChange]
  );

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

  const handleSliderChange = function (newIndex: number) {
    const idx = Math.max(0, Math.min(filteredBySearch.length - 1, newIndex));
    const target = filteredBySearch[idx];
    if (target) handleSelect(target);
  };

  // --- Wayback время ---
  const timeSliderConfig = useMemo(
    function () {
      if (!current.supportsTime) return null;

      if (current.provider === 'esri-wayback') {
        const releases = wayback.releases;
        if (releases.length === 0) return null;
        return {
          kind: 'wayback' as const,
          minDate: releases[0].date,
          maxDate: releases[releases.length - 1].date,
          releases: releases,
        };
      }

      const minDate = current.timeMin || '2000-01-01';
      const maxDate = resolveTimeMax(current.timeMax);
      const step = current.timeStepDays || 1;
      const totalDays = daysBetween(minDate, maxDate);
      return {
        kind: 'range' as const,
        minDate: minDate,
        maxDate: maxDate,
        step: step,
        totalDays: totalDays,
      };
    },
    [current, wayback.releases]
  );

  const selectedWaybackRelease = useMemo(
    function () {
      if (current.provider !== 'esri-wayback') return null;
      return findClosestRelease(wayback.releases, settings.baseLayerDate);
    },
    [current, settings.baseLayerDate, wayback.releases]
  );

  return (
    <div
      ref={wrapRef}
      data-globe-overlay="true"
      style={{ ...styles.wrap, top: top, right: right }}
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
        <div style={styles.panel}>
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
            {/* Поиск */}
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
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Страновой фильтр */}
            <div style={styles.countryTabs}>
              <button
                style={{
                  ...styles.countryTab,
                  backgroundColor:
                    countryFilter === 'russia'
                      ? 'var(--accent)'
                      : 'transparent',
                  color:
                    countryFilter === 'russia'
                      ? 'var(--accent-text)'
                      : 'var(--globe-popup-text, var(--text-primary))',
                  borderColor:
                    countryFilter === 'russia'
                      ? 'var(--accent)'
                      : 'var(--globe-popup-border, var(--border))',
                }}
                onClick={function () {
                  onChange({ countryFilter: 'russia' });
                }}
              >
                <Flag size={10} />
                <span>Россия</span>
              </button>
              <button
                style={{
                  ...styles.countryTab,
                  backgroundColor:
                    countryFilter === 'world'
                      ? 'var(--accent)'
                      : 'transparent',
                  color:
                    countryFilter === 'world'
                      ? 'var(--accent-text)'
                      : 'var(--globe-popup-text, var(--text-primary))',
                  borderColor:
                    countryFilter === 'world'
                      ? 'var(--accent)'
                      : 'var(--globe-popup-border, var(--border))',
                }}
                onClick={function () {
                  onChange({ countryFilter: 'world' });
                }}
              >
                <Globe2 size={10} />
                <span>Весь мир</span>
              </button>
            </div>

            {/* Ползунок переключения */}
            {filteredBySearch.length > 0 && (
              <div style={styles.sliderSection}>
                <div style={styles.sliderHeader}>
                  <button
                    style={{
                      ...styles.stepperBtn,
                      opacity: activeIndex > 0 ? 1 : 0.35,
                    }}
                    onClick={function () {
                      handleSliderChange(activeIndex - 1);
                    }}
                    disabled={activeIndex === 0}
                  >
                    ‹
                  </button>
                  <span style={styles.sliderCurrentLabel}>
                    {current.label}
                  </span>
                  <button
                    style={{
                      ...styles.stepperBtn,
                      opacity:
                        activeIndex < filteredBySearch.length - 1 ? 1 : 0.35,
                    }}
                    onClick={function () {
                      handleSliderChange(activeIndex + 1);
                    }}
                    disabled={activeIndex === filteredBySearch.length - 1}
                  >
                    ›
                  </button>
                </div>

                <input
                  type="range"
                  min={0}
                  max={Math.max(0, filteredBySearch.length - 1)}
                  step={1}
                  value={activeIndex}
                  onChange={function (e) {
                    handleSliderChange(parseInt(e.target.value));
                  }}
                  style={styles.slider}
                />

                <div style={styles.sliderLabels}>
                  {filteredBySearch.map(function (src, i) {
                    const isActive = i === activeIndex;
                    return (
                      <button
                        key={src.id}
                        style={{
                          ...styles.sliderLabelBtn,
                          color: isActive
                            ? 'var(--accent)'
                            : 'var(--globe-popup-muted, var(--text-muted))',
                          fontWeight: isActive ? 700 : 500,
                        }}
                        onClick={function () {
                          handleSliderChange(i);
                        }}
                        title={src.label}
                      >
                        <span
                          style={{
                            ...styles.sliderDot,
                            backgroundColor: src.previewColor,
                            borderColor: isActive
                              ? 'var(--accent)'
                              : 'transparent',
                          }}
                        />
                        <span style={styles.sliderLabelText}>
                          {src.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={styles.sliderCounter}>
                  {activeIndex + 1} / {filteredBySearch.length}
                </div>
              </div>
            )}

            {/* Обновление релизов Wayback */}
            {current.provider === 'esri-wayback' && (
              <div style={styles.refreshRow}>
                <button
                  style={styles.refreshBtn}
                  onClick={wayback.refresh}
                  disabled={wayback.status === 'loading'}
                >
                  <RefreshCw
                    size={11}
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
                {wayback.status === 'success' && (
                  <span style={styles.refreshStatusOk}>
                    <Check size={10} /> {wayback.releases.length}
                  </span>
                )}
                {wayback.status === 'error' && (
                  <span style={styles.refreshStatusErr}>Ошибка</span>
                )}
              </div>
            )}

            {/* Дата */}
            {current.supportsTime && timeSliderConfig && (
              <div style={styles.timeSection}>
                <div style={styles.timeHeader}>
                  <Calendar size={11} color="var(--accent)" />
                  <span style={styles.timeTitle}>Дата снимков</span>
                  <span style={styles.timeValue}>
                    {current.provider === 'esri-wayback' &&
                    selectedWaybackRelease
                      ? formatDateRu(selectedWaybackRelease.date)
                      : formatDateRu(settings.baseLayerDate)}
                  </span>
                </div>

                {timeSliderConfig.kind === 'wayback' && (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, timeSliderConfig.releases.length - 1)}
                      step={1}
                      value={
                        selectedWaybackRelease
                          ? Math.max(
                              0,
                              timeSliderConfig.releases.findIndex(
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
                        const r = timeSliderConfig.releases[idx];
                        if (r) onChange({ baseLayerDate: r.date });
                      }}
                      style={styles.range}
                    />
                    <div style={styles.timeRange}>
                      <span>{formatDateRu(timeSliderConfig.minDate)}</span>
                      <span>{formatDateRu(timeSliderConfig.maxDate)}</span>
                    </div>
                  </>
                )}

                {timeSliderConfig.kind === 'range' && (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(1, timeSliderConfig.totalDays)}
                      step={timeSliderConfig.step}
                      value={Math.max(
                        0,
                        daysBetween(
                          timeSliderConfig.minDate,
                          settings.baseLayerDate
                        )
                      )}
                      onChange={function (e) {
                        const offset = parseInt(e.target.value);
                        onChange({
                          baseLayerDate: addDays(
                            timeSliderConfig.minDate,
                            offset
                          ),
                        });
                      }}
                      style={styles.range}
                    />
                    <div style={styles.timeRange}>
                      <span>{formatDateRu(timeSliderConfig.minDate)}</span>
                      <span>{formatDateRu(timeSliderConfig.maxDate)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Внешний вид */}
            <div style={styles.appearanceSection}>
              <div style={styles.timeHeader}>
                <Layers size={11} color="var(--accent)" />
                <span style={styles.timeTitle}>Внешний вид</span>
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
                    baseLayerBrightness: parseInt(e.target.value) / 100,
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

            {/* Свои карты */}
            <div style={styles.customSection}>
              <div style={styles.timeHeader}>
                <Plus size={11} color="var(--accent)" />
                <span style={styles.timeTitle}>Свои карты</span>
                <button
                  style={styles.addCustomBtn}
                  onClick={function () {
                    onNeedCustomDialog(null);
                  }}
                  title="Добавить свою карту"
                >
                  <Plus size={10} /> Добавить
                </button>
              </div>

              {customSources.length === 0 ? (
                <div style={styles.emptyCustom}>
                  Нет своих карт. Добавьте URL-шаблон или импортируйте XML
                  из Locus.
                </div>
              ) : (
                <div style={styles.customList}>
                  {customSources.map(function (c) {
                    const active = settings.baseLayer === c.id;
                    return (
                      <div
                        key={c.id}
                        style={{
                          ...styles.customItem,
                          borderColor: active
                            ? 'var(--accent)'
                            : 'var(--globe-popup-border, var(--border))',
                          backgroundColor: active
                            ? 'var(--accent-soft)'
                            : 'transparent',
                        }}
                      >
                        <button
                          style={styles.customItemMain}
                          onClick={function () {
                            onChange({ baseLayer: c.id });
                          }}
                          title={c.urlTemplate}
                        >
                          <span
                            style={{
                              ...styles.customDot,
                              backgroundColor: c.previewColor,
                            }}
                          />
                          <span style={styles.customName}>{c.name}</span>
                          {active && <Check size={10} color="var(--accent)" />}
                        </button>
                        <button
                          style={styles.iconBtnSmall}
                          onClick={function () {
                            onNeedCustomDialog(c);
                          }}
                          title="Редактировать"
                        >
                          <Edit3 size={10} />
                        </button>
                        <button
                          style={{
                            ...styles.iconBtnSmall,
                            color: 'var(--danger)',
                          }}
                          onClick={function () {
                            onDeleteCustom(c.id);
                          }}
                          title="Удалить"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
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
  },
  triggerLabel: { whiteSpace: 'nowrap' },
  panel: {
    minWidth: 380,
    maxWidth: 420,
    maxHeight: 'calc(100vh - 100px)',
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
  },
  panelBody: {
    flex: 1,
    overflowY: 'auto',
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
  },
  countryTabs: {
    display: 'flex',
    gap: 4,
    padding: 2,
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 6,
    border: '1px solid var(--globe-popup-border, var(--border))',
  },
  countryTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '6px 8px',
    border: '1px solid',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  sliderSection: {
    padding: 8,
    backgroundColor: 'var(--overlay-soft)',
    border: '1px solid var(--globe-popup-border, var(--border))',
    borderRadius: 6,
  },
  sliderHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--overlay-medium)',
    border: '1px solid var(--globe-popup-border, var(--border))',
    borderRadius: 4,
    color: 'var(--globe-popup-text, var(--text-primary))',
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'inherit',
    lineHeight: 1,
    padding: 0,
  },
  sliderCurrentLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--accent)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  slider: {
    width: '100%',
    accentColor: 'var(--accent)',
    marginBottom: 6,
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 1,
    overflowX: 'auto',
    paddingBottom: 2,
  },
  sliderLabelBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '2px 4px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 8.5,
    flexShrink: 0,
    minWidth: 32,
  },
  sliderDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    border: '2px solid',
    boxSizing: 'content-box',
  },
  sliderLabelText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 46,
  },
  sliderCounter: {
    textAlign: 'center',
    fontSize: 9.5,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    fontFamily: 'Consolas, monospace',
    marginTop: 4,
  },
  refreshRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 4px 8px 4px',
    marginBottom: 4,
    borderBottom: '1px dashed var(--globe-popup-border, var(--border))',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 6,
    color: 'var(--accent)',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  refreshStatusOk: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10,
    color: 'var(--success)',
    fontWeight: 600,
  },
  refreshStatusErr: {
    fontSize: 10,
    color: 'var(--danger)',
    fontWeight: 600,
  },
  timeSection: {
    padding: '8px 6px',
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 6,
    border: '1px solid var(--globe-popup-border, var(--border))',
  },
  timeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  timeTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--globe-popup-title, var(--text-primary))',
  },
  timeValue: {
    fontSize: 10.5,
    fontWeight: 600,
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
  },
  timeRange: {
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
  appearanceSection: {
    padding: '8px 6px',
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 6,
    border: '1px solid var(--globe-popup-border, var(--border))',
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
  sliderLabel: { flex: 1 },
  sliderValue: {
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
    fontWeight: 600,
    minWidth: 40,
    textAlign: 'right',
  },
  customSection: {
    padding: '8px 6px',
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 6,
    border: '1px solid var(--globe-popup-border, var(--border))',
  },
  addCustomBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '3px 8px',
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 4,
    color: 'var(--accent)',
    fontSize: 10.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  customList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    marginTop: 4,
  },
  customItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 6px',
    border: '1px solid',
    borderRadius: 4,
  },
  customItemMain: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--globe-popup-text, var(--text-primary))',
    fontSize: 11,
    textAlign: 'left',
    minWidth: 0,
    padding: 0,
  },
  customDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  customName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iconBtnSmall: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--globe-popup-muted, var(--text-muted))',
    cursor: 'pointer',
    borderRadius: 3,
    padding: 0,
    flexShrink: 0,
  },
  emptyCustom: {
    fontSize: 10.5,
    color: 'var(--globe-popup-muted, var(--text-muted))',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '10px 6px',
    lineHeight: 1.45,
  },
};

export default MapSourcesPanel;