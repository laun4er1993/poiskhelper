// =====================================================
// src/components/settings/tabs/MapTab.tsx
// Настройки карты + управление своими источниками
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
  Droplet,
  Sun,
  Contrast,
  Flag,
  Globe2,
  Satellite,
  Mountain,
  History,
  Search,
  X as XIcon,
} from 'lucide-react';

import type { AppSettings, MapSourceSettings } from '../../../types/settings';
import type {
  MapSourceInfo,
  CustomMapSource,
  CountryFilter,
} from '../../../types/map-sources';
import {
  getFilteredMapSources,
  getMapSourceInfo,
  resolveTimeMax,
} from '../../../types/map-sources';
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

function categoryIcon(cat: MapSourceInfo['category']) {
  if (cat === 'satellite') return Satellite;
  if (cat === 'topo') return Mountain;
  if (cat === 'history') return History;
  return MapIcon;
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
  const countryFilter: CountryFilter = mapSource.countryFilter || 'russia';

  const updateMapSource = function (updater: Partial<MapSourceSettings>) {
    onChange({ mapSource: { ...mapSource, ...updater } });
  };

  const availableSources = getFilteredMapSources(countryFilter, customSources);
  const filteredSources = searchQuery.trim()
    ? availableSources.filter(function (s) {
        const q = searchQuery.trim().toLowerCase();
        return (
          s.label.toLowerCase().indexOf(q) >= 0 ||
          s.description.toLowerCase().indexOf(q) >= 0
        );
      })
    : availableSources;

  const currentInfo = getMapSourceInfo(
    mapSource.baseLayer,
    customSources
  );

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
      {/* ============ ИСТОЧНИК КАРТЫ ============ */}
      <Section title="Источник карты" icon={<MapIcon size={13} />}>
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
                  : 'var(--text-primary)',
              borderColor:
                countryFilter === 'russia'
                  ? 'var(--accent)'
                  : 'var(--border)',
            }}
            onClick={function () {
              updateMapSource({ countryFilter: 'russia' });
            }}
          >
            <Flag size={11} />
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
                  : 'var(--text-primary)',
              borderColor:
                countryFilter === 'world'
                  ? 'var(--accent)'
                  : 'var(--border)',
            }}
            onClick={function () {
              updateMapSource({ countryFilter: 'world' });
            }}
          >
            <Globe2 size={11} />
            <span>Весь мир</span>
          </button>
        </div>

        {/* Поиск */}
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

        {/* Сетка карт */}
        <div style={styles.sourceGrid}>
          {filteredSources.map(function (b) {
            const active = mapSource.baseLayer === b.id;
            const CatIcon = categoryIcon(b.category);
            return (
              <button
                key={b.id}
                style={{
                  ...styles.sourceCard,
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
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
                    ...styles.sourcePreview,
                    backgroundColor: b.previewColor,
                  }}
                >
                  <CatIcon
                    size={14}
                    color="rgba(255,255,255,0.85)"
                    style={{ position: 'absolute', bottom: 4, left: 4 }}
                  />
                  {b.supportsTime && (
                    <Calendar
                      size={10}
                      color="rgba(255,255,255,0.9)"
                      style={{ position: 'absolute', top: 4, right: 4 }}
                    />
                  )}
                  {b.isCustom && (
                    <span style={styles.customBadge}>СВОЯ</span>
                  )}
                </div>
                <span style={styles.sourceLabel}>{b.label}</span>
                {active && (
                  <Check
                    size={12}
                    color="var(--accent)"
                    style={{ position: 'absolute', top: 6, right: 6 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {filteredSources.length === 0 && (
          <div style={styles.emptyState}>
            Ничего не найдено
          </div>
        )}

        <div style={styles.hintSmall}>
          {currentInfo.description}
          <br />
          <span style={styles.attribution}>{currentInfo.attribution}</span>
        </div>

        {/* Wayback: обновить релизы */}
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

      {/* ============ ВНЕШНИЙ ВИД ============ */}
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

      {/* ============ СВОИ КАРТЫ ============ */}
      <Section title="Свои карты" icon={<Plus size={13} />}>
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
              // Открываем диалог на вкладке «Импорт XML»
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

        {customSources.length === 0 ? (
          <div style={styles.emptyCustom}>
            Нет своих карт. Можно добавить любую тайловую карту
            (URL-шаблон с {'{z}'}/{' {x}'}/{' {y}'}) или импортировать
            providers.xml из Locus Map.
          </div>
        ) : (
          <div style={styles.customList}>
            {customSources.map(function (c) {
              const active = mapSource.baseLayer === c.id;
              return (
                <div
                  key={c.id}
                  style={{
                    ...styles.customItem,
                    borderColor: active
                      ? 'var(--accent)'
                      : 'var(--border)',
                    backgroundColor: active
                      ? 'var(--accent-soft)'
                      : 'var(--bg-surface)',
                  }}
                >
                  <span
                    style={{
                      ...styles.customDot,
                      backgroundColor: c.previewColor || '#4a90d9',
                    }}
                  />
                  <div style={styles.customInfo}>
                    <div style={styles.customName}>{c.name}</div>
                    <div style={styles.customUrl} title={c.urlTemplate}>
                      {c.urlTemplate}
                    </div>
                  </div>
                  <button
                    style={styles.iconBtn}
                    onClick={function () {
                      updateMapSource({ baseLayer: c.id });
                    }}
                    title="Активировать"
                  >
                    {active ? (
                      <Check size={11} color="var(--accent)" />
                    ) : (
                      <MapIcon size={11} />
                    )}
                  </button>
                  <button
                    style={styles.iconBtn}
                    onClick={function () {
                      onNeedCustomDialog(c);
                    }}
                    title="Редактировать"
                  >
                    <Edit3 size={11} />
                  </button>
                  <button
                    style={{ ...styles.iconBtn, color: 'var(--danger)' }}
                    onClick={function () {
                      handleDeleteCustom(c.id);
                    }}
                    title="Удалить"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ============ 3D-КОНТЕНТ ============ */}
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

      {/* ============ СОХРАНЕНИЕ ============ */}
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

      {/* ============ ЗАПУСК ============ */}
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
  },
  range: {
    flex: 1,
    maxWidth: 260,
    accentColor: 'var(--accent)',
  },
  rangeValue: {
    fontSize: 11,
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
    fontWeight: 600,
    minWidth: 48,
    textAlign: 'right',
  },
  countryTabs: {
    display: 'flex',
    gap: 4,
    padding: 3,
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 'var(--radius-small)',
    border: '1px solid var(--border)',
    marginBottom: 8,
  },
  countryTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '6px 10px',
    border: '1px solid',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11.5,
    fontWeight: 600,
    transition: 'all 0.15s',
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
  },
  sourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 6,
  },
  sourceCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '6px 6px 8px 6px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    transition: 'all 0.15s',
  },
  sourcePreview: {
    width: '100%',
    height: 52,
    borderRadius: 'var(--radius-small)',
    position: 'relative',
    overflow: 'hidden',
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    lineHeight: 1.3,
  },
  customBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: '1px 5px',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    fontSize: 7.5,
    fontWeight: 800,
    borderRadius: 3,
    letterSpacing: 0.5,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--text-muted)',
    padding: '20px 10px',
    fontStyle: 'italic',
  },
  waybackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
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
  customActionsRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 8,
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
  },
  emptyCustom: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    padding: '10px 0',
    lineHeight: 1.5,
  },
  customList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  customItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    border: '1px solid',
    borderRadius: 'var(--radius-small)',
  },
  customDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  customInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  customName: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  customUrl: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iconBtn: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
};

export default MapTab;