// =====================================================
// src/components/measure/MeasurePanel.tsx
// Панель измерения (линейка) с вкладками
// =====================================================

import {
  X,
  Undo2,
  Check,
  Save,
  Trash2,
  MapPin,
  Route,
  Download,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  computeMeasureMetrics,
  computeSegmentMetrics,
} from '../../types/geometry';
import { getRulerInfo } from '../../types/measure';
import { formatDistance } from '../../types/format';
import RulerTypeSelector from './RulerTypeSelector';
import MetricsBlock from './MetricsBlock';
import PointsList from './PointsList';
import SegmentsList from './SegmentsList';
import ExportBlock from './ExportBlock';
import type {
  MeasurePanelProps,
  MeasurePanelTab,
} from './types';
import type { MeasureRulerType } from '../../types/measure';

function MeasurePanel({
  points,
  closed,
  settings,
  onClear,
  onUndo,
  onToggleClosed,
  onSave,
  onRemovePoint,
  onSelectPoint,
  onFlyToPoint,
  onCopyCoordsToClipboard,
  onSetRulerType,
  selectedIndex: externalSelectedIndex,
}: MeasurePanelProps) {
  const [tab, setTab] = useState<MeasurePanelTab>('points');
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(
    null
  );

  const selectedIndex =
    externalSelectedIndex !== undefined
      ? externalSelectedIndex
      : localSelectedIndex;

  const rulerType: MeasureRulerType = settings.measure?.rulerType || 'path';
  const rulerInfo = useMemo(
    function () {
      return getRulerInfo(rulerType);
    },
    [rulerType]
  );

  const metrics = useMemo(
    function () {
      return computeMeasureMetrics(points, closed);
    },
    [points, closed]
  );

  const segments = useMemo(
    function () {
      return computeSegmentMetrics(points, closed);
    },
    [points, closed]
  );

  const headerSummary = useMemo(
    function () {
      if (points.length < 2) return points.length + ' точек';
      return formatDistance(
        metrics.totalDist,
        settings.distanceUnit,
        settings.highPrecision
      );
    },
    [
      points.length,
      metrics.totalDist,
      settings.distanceUnit,
      settings.highPrecision,
    ]
  );

  const handleSetRulerType = function (type: MeasureRulerType) {
    if (onSetRulerType) onSetRulerType(type);
  };

  const handleSelectPoint = function (index: number | null) {
    setLocalSelectedIndex(index);
    if (onSelectPoint) onSelectPoint(index);
  };

  const handleRemovePoint = function (index: number) {
    if (onRemovePoint) onRemovePoint(index);
    if (selectedIndex === index) {
      setLocalSelectedIndex(null);
      if (onSelectPoint) onSelectPoint(null);
    }
  };

  const handleFlyTo = function (index: number) {
    if (index < 0 || index >= points.length) return;
    if (!onFlyToPoint) return;
    const p = points[index];
    onFlyToPoint(p.lat, p.lon, p.height || 0);
  };

  const handleCopyCoords = function (index: number) {
    if (index < 0 || index >= points.length) return;
    const p = points[index];
    const text =
      p.lat.toFixed(8) +
      ', ' +
      p.lon.toFixed(8) +
      ' (h=' +
      (p.height || 0).toFixed(2) +
      ' м)';
    if (onCopyCoordsToClipboard) {
      onCopyCoordsToClipboard(text, 'Точка ' + (index + 1));
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  };

  const handleSave = function () {
    if (points.length < 2) {
      alert('Нужно минимум 2 точки для сохранения.');
      return;
    }
    onSave();
  };

  const handleCopyReport = function (text: string, label: string) {
    if (onCopyCoordsToClipboard) {
      onCopyCoordsToClipboard(text, label);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  };

  return (
    <div style={styles.panel} data-globe-overlay="true">
      <div style={styles.header}>
        <span style={styles.title}>Измерение</span>
        <span style={styles.badge}>{headerSummary}</span>
        <button
          style={styles.headerBtn}
          onClick={onClear}
          title="Очистить всё (закрыть измерение)"
        >
          <X size={13} />
        </button>
      </div>

      <RulerTypeSelector
        active={rulerType}
        onChange={handleSetRulerType}
      />

      <MetricsBlock
        metrics={metrics}
        closed={closed}
        distanceUnit={settings.distanceUnit}
        heightUnit={settings.heightUnit}
        highPrecision={settings.highPrecision}
        showWalkingTime={settings.measure.showWalkingTime}
        walkingSpeed={settings.measure.walkingSpeed}
      />

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tabBtn,
            ...(tab === 'points' ? styles.tabBtnActive : {}),
          }}
          onClick={function () {
            setTab('points');
          }}
        >
          <MapPin size={11} />
          <span>Точки ({points.length})</span>
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(tab === 'segments' ? styles.tabBtnActive : {}),
          }}
          onClick={function () {
            setTab('segments');
          }}
        >
          <Route size={11} />
          <span>Сегменты ({segments.segments.length})</span>
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(tab === 'export' ? styles.tabBtnActive : {}),
          }}
          onClick={function () {
            setTab('export');
          }}
        >
          <Download size={11} />
          <span>Экспорт</span>
        </button>
      </div>

      <div style={styles.tabContent}>
        {tab === 'points' && (
          <PointsList
            points={points}
            selectedIndex={selectedIndex}
            coordinateFormat={settings.coordinateFormat}
            heightUnit={settings.heightUnit}
            distanceUnit={settings.distanceUnit}
            highPrecision={settings.highPrecision}
            showHeights={settings.measure.showHeights}
            closed={closed}
            onSelect={handleSelectPoint}
            onRemove={handleRemovePoint}
            onFlyTo={handleFlyTo}
            onCopyCoords={handleCopyCoords}
          />
        )}

        {tab === 'segments' && (
          <SegmentsList
            data={segments}
            distanceUnit={settings.distanceUnit}
            heightUnit={settings.heightUnit}
            highPrecision={settings.highPrecision}
          />
        )}

        {tab === 'export' && (
          <ExportBlock
            points={points}
            closed={closed}
            metrics={metrics}
            segments={segments}
            distanceUnit={settings.distanceUnit}
            heightUnit={settings.heightUnit}
            coordinateFormat={settings.coordinateFormat}
            highPrecision={settings.highPrecision}
            rulerLabel={rulerInfo.label}
            onCopyToClipboard={handleCopyReport}
          />
        )}
      </div>

      <div style={styles.actionsRow}>
        <button
          style={styles.actionBtn}
          onClick={onUndo}
          title="Убрать последнюю точку"
          disabled={points.length === 0}
        >
          <Undo2 size={12} /> Отменить
        </button>

        {rulerInfo.allowClose && (
          <button
            style={styles.actionBtn}
            onClick={onToggleClosed}
            title="Замкнуть / разомкнуть полигон"
            disabled={points.length < 3}
          >
            <Check size={12} />
            {closed ? 'Разомкнуть' : 'Замкнуть'}
          </button>
        )}

        <button
          style={styles.actionBtn}
          onClick={onClear}
          title="Очистить всё измерение"
        >
          <Trash2 size={12} /> Очистить
        </button>
      </div>

      <div style={styles.actionsRow}>
        <button
          style={styles.actionBtnAccent}
          onClick={handleSave}
          title="Сохранить как объект-измерение"
          disabled={points.length < 2}
        >
          <Save size={12} /> Сохранить измерение
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    bottom: 42,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--bg-modal)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '12px 14px',
    color: 'var(--text-primary)',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: 12,
    boxShadow: 'var(--shadow-lg)',
    minWidth: 380,
    maxWidth: 480,
    maxHeight: 'calc(100% - 100px)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 20,
    backdropFilter: 'blur(var(--blur))',
    WebkitBackdropFilter: 'blur(var(--blur))',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    borderBottom: '1px solid var(--border)',
    marginBottom: 8,
  },
  title: {
    fontSize: 12.5,
    fontWeight: 700,
    color: 'var(--warning)',
    flex: 1,
  },
  badge: {
    fontSize: 10.5,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10,
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
  },
  headerBtn: {
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
  },
  tabs: {
    display: 'flex',
    gap: 2,
    marginTop: 6,
    padding: 2,
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 'var(--radius-small)',
    border: '1px solid var(--border)',
  },
  tabBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '5px 6px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    fontSize: 10.5,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  tabBtnActive: {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
  },
  tabContent: {
    marginTop: 6,
    marginBottom: 4,
    minHeight: 80,
    maxHeight: 300,
    overflowY: 'auto',
  },
  actionsRow: {
    display: 'flex',
    gap: 4,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '6px 8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 11.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  actionBtnAccent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '6px 8px',
    backgroundColor: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--accent-text)',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
};

export default MeasurePanel;