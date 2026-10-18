// =====================================================
// src/components/settings/tabs/MapTab.tsx
// Настройки карты + свои источники + настройки импорта
// =====================================================

import { useState } from 'react';
import {
  Building2,
  Save,
  Globe,
  Sparkles,
  Map as MapIcon,
  RefreshCw,
  Check,
  Layers,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Search,
  X as XIcon,
  Satellite,
  Mountain,
  History,
  FolderTree,
  Eye,
} from 'lucide-react';

import type { AppSettings, MapSourceSettings } from '../../../types/settings';
import type {
  MapSourceInfo,
  MapSourceCategory,
  CustomMapSource,
} from '../../../types/map-sources';
import {
  getAllMapSources,
  getMapSourceInfo,
  resolveTimeMax,
} from '../../../types/map-sources';
import {
  OVERLAY_SOURCES,
  readOverlaySettings,
  type OverlayId,
} from '../../../types/overlay-sources';
import { useWaybackReleases } from '../../../hooks/useWaybackReleases';

import Section from '../ui/Section';
import FieldRow from '../ui/FieldRow';
import ToggleOption from '../ui/ToggleOption';

interface MapTabProps {
  settings: AppSettings;
  onChange: (updater: Partial<AppSettings>) => void;
  show3DBuildings: boolean;
  onToggle3DBuildings: () => void;
  onNeedCustomDialog: (edit?: CustomMapSource | null) => void;
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

function MapTab({
  settings,
  onChange,
  show3DBuildings,
  onToggle3DBuildings,
  onNeedCustomDialog,
}: MapTabProps) {
  const mapSource = settings.mapSource;
  const wayback = useWaybackReleases(false);
  const [searchQuery, setSearchQuery] = useState('');

  const customSources = mapSource.customSources || [];

  const updateMapSource = function (updater: Partial<MapSourceSettings>) {
    onChange({ mapSource: { ...mapSource, ...updater } });
  };

  const updateImportDefaults = function (updater: {
    startHidden?: boolean;
    startCollapsed?: boolean;
  }) {
    onChange({
      importDefaults: { ...settings.importDefaults, ...updater },
    });
  };

  const allSources = getAllMapSources(customSources);
  const filteredSources = searchQuery.trim()
    ? allSources.filter(function (s) {
        const q = searchQuery.trim().toLowerCase();
        return (
          s.label.toLowerCase().indexOf(q) >= 0 ||
          s.description.toLowerCase().indexOf(q) >= 0
        );
      })
    : allSources;

  const groups = buildGroups(filteredSources);

  const currentInfo = getMapSourceInfo(
    mapSource.baseLayer,
    customSources
  );

  const overlays = readOverlaySettings(mapSource.overlays);
  const showOverlays =
    currentInfo.category === 'satellite' ||
    currentInfo.provider === 'esri-wayback';

  const setOverlay = function (id: OverlayId, value: boolean) {
    const next = { ...overlays };
    next[id] = value;
    updateMapSource({ overlays: next });
  };

  const handleDeleteCustom = function (id: string) {
    if (!window.confirm('Удалить эту карту?')) return;
    const next = customSources.filter(function (c) {
      return c.id !== id;
    });
    updateMapSource({ customSources: next });
    if (mapSource.baseLayer === id && next.length > 0) {
      updateMapSource({
        customSources: next,
        baseLayer: next[0].id,
      });
    }
  };

  return (
    <>
      <Section title="Источник карты" icon={<MapIcon size={13} />}>
        <div style={styles.searchRow}>
          <Search size={11} color="var(--text-muted)" />
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
              <XIcon size={10} />
            </button>
          )}
        </div>

        {groups.length === 0 && (
          <div style={styles.emptyState}>Ничего не найдено</div>
        )}

        {groups.map(function (group) {
          const GIcon = group.icon;
          return (
            <div key={group.id} style={styles.group}>
              <div style={styles.groupHeader}>
                <GIcon size={11} color="var(--accent)" />
                <span style={styles.groupTitle}>{group.label}</span>
                <span style={styles.groupCount}>
                  {group.items.length}
                </span>
              </div>
              <div style={styles.groupBody}>
                {group.items.map(function (item) {
                  const active = mapSource.baseLayer === item.id;
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      style={{
                        ...styles.sourceCard,
                        borderColor: active
                          ? 'var(--accent)'
                          : 'var(--border)',
                        backgroundColor: active
                          ? 'var(--bg-surface-hover)'
                          : 'var(--bg-surface)',
                      }}
                      onClick={function () {
                        updateMapSource({ baseLayer: item.id });
                      }}
                      onKeyDown={function (e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          updateMapSource({ baseLayer: item.id });
                        }
                      }}
                      title={item.description}
                    >
                      <span
                        style={{
                          ...styles.sourcePreview,
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
                        <span
                          style={styles.sourceDesc}
                          title={item.description}
                        >
                          {item.description}
                        </span>
                      </span>
                      {active && (
                        <Check
                          size={12}
                          color="var(--accent)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      {item.isCustom && (
                        <>
                          <button
                            style={styles.iconBtn}
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
                            <Edit3 size={11} />
                          </button>
                          <button
                            style={{
                              ...styles.iconBtn,
                              color: 'var(--danger)',
                            }}
                            onClick={function (e) {
                              e.stopPropagation();
                              handleDeleteCustom(item.id);
                            }}
                            title="Удалить"
                          >
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={styles.customActionsRow}>
          <button
            style={styles.primaryBtn}
            onClick={function () {
              onNeedCustomDialog(null);
            }}
          >
            <Plus size={12} /> Добавить карту
          </button>
          <button
            style={styles.secondaryBtn}
            onClick={function () {
              onNeedCustomDialog({
                id: '__import_xml__',
                name: '',
                urlTemplate: '',
                maxLevel: 19,
                attribution: '',
                category: 'satellite',
                previewColor: '#4a90d9',
                addedAt: '',
              });
            }}
            title="Импорт providers.xml из Locus Map"
          >
            <Upload size={12} /> Импорт XML
          </button>
        </div>

        <div style={styles.hintSmall}>
          {currentInfo.description}
          <br />
          <span style={styles.attribution}>{currentInfo.attribution}</span>
        </div>

        {currentInfo.provider === 'esri-wayback' && (
          <div style={styles.waybackRow}>
            <button
              style={{
                ...styles.refreshBtn,
                opacity: wayback.status === 'loading' ? 0.6 : 1,
                cursor: wayback.status === 'loading' ? 'wait' : 'pointer',
              }}
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
                : 'Обновить релизы Wayback'}
            </button>
            <span style={styles.waybackInfo}>
              {wayback.releases.length} релизов
            </span>
            {wayback.status === 'success' && (
              <Check size={11} color="var(--success)" />
            )}
            {wayback.status === 'error' && (
              <span style={styles.errorText}>Ошибка</span>
            )}
          </div>
        )}

        {currentInfo.supportsTime && (
          <FieldRow label="Дата снимков:">
            <input
              type="date"
              value={mapSource.baseLayerDate}
              min={currentInfo.timeMin}
              max={resolveTimeMax(currentInfo.timeMax)}
              onChange={function (e) {
                updateMapSource({ baseLayerDate: e.target.value });
              }}
              style={styles.dateInput}
            />
          </FieldRow>
        )}
      </Section>

      <Section title="Внешний вид слоя" icon={<Layers size={13} />}>
        <FieldRow label="Прозрачность:">
          <input
            type="range"
            min={10}
            max={100}
            value={Math.round(mapSource.baseLayerOpacity * 100)}
            onChange={function (e) {
              updateMapSource({
                baseLayerOpacity: parseInt(e.target.value) / 100,
              });
            }}
            style={styles.range}
          />
          <span style={styles.rangeValue}>
            {Math.round(mapSource.baseLayerOpacity * 100)}%
          </span>
        </FieldRow>

        <FieldRow label="Яркость:">
          <input
            type="range"
            min={50}
            max={150}
            value={Math.round(mapSource.baseLayerBrightness * 100)}
            onChange={function (e) {
              updateMapSource({
                baseLayerBrightness: parseInt(e.target.value) / 100,
              });
            }}
            style={styles.range}
          />
          <span style={styles.rangeValue}>
            {mapSource.baseLayerBrightness.toFixed(2)}
          </span>
        </FieldRow>

        <FieldRow label="Контраст:">
          <input
            type="range"
            min={50}
            max={150}
            value={Math.round(mapSource.baseLayerContrast * 100)}
            onChange={function (e) {
              updateMapSource({
                baseLayerContrast: parseInt(e.target.value) / 100,
              });
            }}
            style={styles.range}
          />
          <span style={styles.rangeValue}>
            {mapSource.baseLayerContrast.toFixed(2)}
          </span>
        </FieldRow>
      </Section>

      {showOverlays && (
        <Section title="Слои поверх" icon={<Layers size={13} />}>
          <div style={styles.hintSmall}>
            Дополнительные слои для спутниковой карты. Работают для Esri,
            Sentinel-2, Bing и своих спутниковых источников.
          </div>

          {OVERLAY_SOURCES.map(function (ov) {
            return (
              <ToggleOption
                key={ov.id}
                label={ov.label}
                checked={overlays[ov.id] === true}
                onChange={function (v) {
                  setOverlay(ov.id, v);
                }}
              />
            );
          })}
        </Section>
      )}

      <Section title="Импорт KML/KMZ" icon={<FolderTree size={13} />}>
        <ToggleOption
          icon={<Eye size={13} color="var(--accent)" />}
          label="Импортированные объекты скрыты на глобусе"
          checked={settings.importDefaults.startHidden}
          onChange={function (v) {
            updateImportDefaults({ startHidden: v });
          }}
        />
        <div style={styles.hintSmall}>
          Если включено — новые метки, линии и полигоны появятся в
          дереве, но не будут отрисованы на глобусе. Показать можно
          чекбоксом в дереве.
        </div>

        <ToggleOption
          icon={<FolderTree size={13} color="var(--warning)" />}
          label="Папки импорта свёрнуты"
          checked={settings.importDefaults.startCollapsed}
          onChange={function (v) {
            updateImportDefaults({ startCollapsed: v });
          }}
        />
        <div style={styles.hintSmall}>
          Если включено — после импорта все папки из KML будут
          свёрнуты, чтобы дерево не раздувалось.
        </div>
      </Section>

      <Section title="3D-контент" icon={<Building2 size={13} />}>
        <ToggleOption
          icon={<Building2 size={13} color="var(--accent)" />}
          label="Показывать 3D-здания OpenStreetMap"
          checked={show3DBuildings}
          onChange={onToggle3DBuildings}
        />
        <div style={styles.hintSmall}>
          Включение может снизить плавность на слабых компьютерах.
        </div>
      </Section>

      <Section title="Сохранение и загрузка" icon={<Save size={13} />}>
        <ToggleOption
          icon={<Save size={13} color="var(--success)" />}
          label="Показывать уведомления о несохранённых изменениях"
          checked={settings.showSaveNotifications}
          onChange={function (v) {
            onChange({ showSaveNotifications: v });
          }}
        />
        <FieldRow label="Автосохранение:">
          <select
            value={settings.autoSaveIntervalSec}
            onChange={function (e) {
              onChange({ autoSaveIntervalSec: parseInt(e.target.value) });
            }}
            style={styles.select}
          >
            <option value={0}>Отключено</option>
            <option value={15}>15 секунд</option>
            <option value={30}>30 секунд</option>
            <option value={60}>1 минута</option>
            <option value={120}>2 минуты</option>
          </select>
        </FieldRow>
      </Section>

      <Section title="При запуске" icon={<Globe size={13} />}>
        <ToggleOption
          icon={<Sparkles size={13} color="var(--warning)" />}
          label="Показывать экран приветствия"
          checked={settings.showWelcomeScreen}
          onChange={function (v) {
            onChange({ showWelcomeScreen: v });
          }}
        />
        <ToggleOption
          icon={<Save size={13} color="var(--accent)" />}
          label="Автоматически открывать последний проект"
          checked={settings.autoLoadLastProject}
          onChange={function (v) {
            onChange({ autoLoadLastProject: v });
          }}
          disabled={settings.showWelcomeScreen}
        />
      </Section>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hintSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    marginTop: 4,
    lineHeight: 1.45,
    fontStyle: 'italic',
  },
  attribution: {
    fontSize: 10,
    color: 'var(--text-muted)',
    opacity: 0.8,
  },
  select: {
    padding: '5px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: 'pointer',
    minWidth: 130,
    maxWidth: '100%',
    outline: 'none',
  },
  dateInput: {
    padding: '5px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  range: {
    flex: 1,
    maxWidth: 260,
    accentColor: 'var(--accent)',
    minWidth: 0,
  },
  rangeValue: {
    fontSize: 11,
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
    fontWeight: 600,
    minWidth: 48,
    textAlign: 'right',
    flexShrink: 0,
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: 12,
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
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--text-muted)',
    padding: '20px 10px',
    fontStyle: 'italic',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-small)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 8px',
    backgroundColor: 'var(--overlay-soft)',
    borderBottom: '1px solid var(--border)',
    minHeight: 28,
  },
  groupTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  groupCount: {
    fontSize: 9.5,
    color: 'var(--text-muted)',
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
    color: 'var(--text-primary)',
    transition: 'all 0.12s',
    outline: 'none',
    minWidth: 0,
  },
  sourcePreview: {
    width: 32,
    height: 32,
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
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sourceDesc: {
    fontSize: 9.5,
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iconBtn: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 3,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  customActionsRow: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-small)',
    color: 'var(--accent-text)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  waybackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--accent)',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  waybackInfo: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
  },
  errorText: {
    fontSize: 10,
    color: 'var(--danger)',
    fontWeight: 600,
  },
};

export default MapTab;