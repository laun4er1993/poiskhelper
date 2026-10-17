// =====================================================
// src/components/properties/sections/MeasureSection.tsx
// Секция свойств сохранённой линейки — с редактированием точек
// =====================================================

import { useState } from 'react';
import {
  Ruler,
  Route,
  Square,
  Navigation,
  TrendingUp,
  Mountain,
  MapPin,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Crosshair,
  Copy,
  Check,
  Hash,
} from 'lucide-react';
import type {
  MeasureItem,
  Place,
  MeasureNumberStyle,
} from '../../../types/base';
import type { Draft } from '../types';
import type {
  DistanceUnit,
  HeightUnit,
  CoordinateFormat,
} from '../../../types/units';
import {
  computeMeasureMetrics,
  computeSegmentMetrics,
} from '../../../types/geometry';
import {
  formatDistance,
  formatArea,
  formatHeight,
  formatAngle,
} from '../../../types/format';

interface MeasureSectionProps {
  item: MeasureItem;
  getVal: <K extends keyof Draft>(field: K, fallback: any) => any;
  setField: <K extends keyof Draft>(field: K, value: Draft[K]) => void;
  distanceUnit: DistanceUnit;
  heightUnit: HeightUnit;
  coordinateFormat: CoordinateFormat;
  highPrecision: boolean;
  onCopyCoords: (text: string, label: string) => void;
  onFlyTo: (place: Place) => void;
}

interface MeasurePointLite {
  lat: number;
  lon: number;
  height: number;
}

function MeasureSection({
  item,
  getVal,
  setField,
  distanceUnit,
  heightUnit,
  coordinateFormat,
  highPrecision,
  onCopyCoords,
  onFlyTo,
}: MeasureSectionProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // === Текущие значения ===
  const positions =
    ((getVal('positions', item.positions) as MeasurePointLite[]) || []).slice();
  const closed = (getVal('closed', item.closed) as boolean) || false;
  const rulerType =
    (getVal('rulerType', item.rulerType) as string) || item.rulerType;

  // Цифры
  const showNumbers =
    (getVal('showNumbers', item.showNumbers !== false) as boolean) !== false;
  const numberFontSize =
    (getVal('numberFontSize', item.numberFontSize ?? 11) as number) ?? 11;
  const numberColor =
    (getVal('numberColor', item.numberColor || '#000000') as string) ||
    '#000000';
  const numberOutlineColor =
    (getVal(
      'numberOutlineColor',
      item.numberOutlineColor || '#ffffff'
    ) as string) || '#ffffff';
  const numberOutlineWidth =
    (getVal('numberOutlineWidth', item.numberOutlineWidth ?? 1) as number) ??
    1;
  const numberStyle =
    (getVal('numberStyle', item.numberStyle || 'fill-and-outline') as
      | MeasureNumberStyle
      | undefined) || 'fill-and-outline';

  // === Метрики ===
  const metrics = computeMeasureMetrics(positions, closed);
  const segments = computeSegmentMetrics(positions, closed);

  const rulerLabel =
    rulerType === 'simple'
      ? 'Прямая'
      : rulerType === 'area'
      ? 'Площадь'
      : 'Путь';

  const handleRemovePoint = function (index: number) {
    if (index < 0 || index >= positions.length) return;
    const next = positions.slice();
    next.splice(index, 1);
    setField('positions', next);
  };

  const handleAddPoint = function () {
    const last =
      positions.length > 0
        ? positions[positions.length - 1]
        : { lat: 0, lon: 0, height: 0 };
    const next = positions.concat([
      {
        lat: last.lat + 0.0001,
        lon: last.lon + 0.0001,
        height: last.height || 0,
      },
    ]);
    setField('positions', next);
  };

  const handleDuplicatePoint = function (index: number) {
    if (index < 0 || index >= positions.length) return;
    const src = positions[index];
    const next = positions.slice();
    next.splice(index + 1, 0, {
      lat: src.lat + 0.00005,
      lon: src.lon + 0.00005,
      height: src.height || 0,
    });
    setField('positions', next);
  };

  const handleMovePoint = function (index: number, dir: 'up' | 'down') {
    if (index < 0 || index >= positions.length) return;
    const targetIdx = dir === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= positions.length) return;
    const next = positions.slice();
    const tmp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = tmp;
    setField('positions', next);
  };

  const handleUpdatePointField = function (
    index: number,
    field: 'lat' | 'lon' | 'height',
    value: number
  ) {
    if (index < 0 || index >= positions.length) return;
    const next = positions.slice();
    next[index] = { ...next[index], [field]: value };
    setField('positions', next);
  };

  const handleCopyPointCoords = function (index: number) {
    if (index < 0 || index >= positions.length) return;
    const p = positions[index];
    const text =
      p.lat.toFixed(8) +
      ', ' +
      p.lon.toFixed(8) +
      ' (h=' +
      (p.height || 0).toFixed(2) +
      ' м)';
    onCopyCoords(text, 'Точка ' + (index + 1));
    setCopiedIdx(index);
    setTimeout(function () {
      setCopiedIdx(null);
    }, 1200);
  };

  const handleFlyToPoint = function (index: number) {
    if (index < 0 || index >= positions.length) return;
    const p = positions[index];
    const fakePlace: Place = {
      id: item.id,
      name: item.name,
      type: 'place',
      lat: p.lat,
      lon: p.lon,
      height: p.height || 0,
      color: item.color || '#a7d948',
      pixelSize: 6,
    };
    onFlyTo(fakePlace);
  };

  return (
    <>
      {/* === Сводка === */}
      <div style={styles.infoBlock}>
        <span style={styles.infoLabel}>
          <Ruler size={11} /> {rulerLabel}
        </span>
        <span style={styles.infoValue}>{positions.length} точек</span>
      </div>

      <div style={styles.metricsBlock}>
        <div style={styles.metricRow}>
          <span style={styles.metricLabel}>
            <Route size={11} /> Длина:
          </span>
          <span style={styles.metricValue}>
            {formatDistance(metrics.totalDist, distanceUnit, highPrecision)}
          </span>
        </div>

        {closed && metrics.area > 0 && (
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>
              <Square size={11} /> Площадь:
            </span>
            <span style={styles.metricValue}>
              {formatArea(metrics.area, distanceUnit)}
            </span>
          </div>
        )}

        {metrics.hasHeights && (
          <>
            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>
                <Mountain size={11} /> Высоты:
              </span>
              <span style={styles.metricValue}>
                {formatHeight(metrics.minHeight, heightUnit)}
                {' / '}
                {formatHeight(metrics.avgHeight, heightUnit)}
                {' / '}
                {formatHeight(metrics.maxHeight, heightUnit)}
              </span>
            </div>
            <div style={styles.hintRow}>
              <span style={styles.hint}>min / средняя / max</span>
            </div>
          </>
        )}
      </div>

      {/* === Тип линейки === */}
      <div style={styles.field}>
        <label style={styles.label}>Тип</label>
        <select
          value={rulerType}
          onChange={function (e) {
            setField('rulerType', e.target.value as any);
          }}
          style={styles.select}
        >
          <option value="simple">Прямая (2 точки)</option>
          <option value="path">Путь (ломаная)</option>
          <option value="area">Площадь (замкнутая)</option>
        </select>
      </div>

      {/* === Замкнута === */}
      {(rulerType === 'area' || rulerType === 'path') && (
        <div style={styles.field}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={closed}
              onChange={function (e) {
                setField('closed', e.target.checked);
              }}
            />
            <span style={{ marginLeft: 6 }}>Замкнуть фигуру</span>
          </label>
        </div>
      )}

      {/* === ТОЧКИ === */}
      <div style={styles.subsection}>
        <div style={styles.subsectionHeader}>
          <span style={styles.subsectionTitle}>
            <MapPin size={11} style={{ verticalAlign: -1 }} /> Точки
          </span>
          <button
            style={styles.addBtn}
            onClick={handleAddPoint}
            title="Добавить точку (рядом с последней)"
          >
            <Plus size={11} /> Добавить
          </button>
        </div>

        <div style={styles.hintSmall}>
          Точки можно перетаскивать мышью на карте, пока линейка открыта
          в этой панели.
        </div>

        {positions.length === 0 ? (
          <div style={styles.empty}>Нет точек</div>
        ) : (
          <div style={styles.pointsList}>
            {positions.map(function (p, i) {
              const isCopied = copiedIdx === i;
              return (
                <div key={i} style={styles.pointCard}>
                  <div style={styles.pointHead}>
                    <span style={styles.pointNum}>{i + 1}</span>

                    <div style={styles.pointActions}>
                      <button
                        style={styles.iconBtn}
                        onClick={function () {
                          handleMovePoint(i, 'up');
                        }}
                        disabled={i === 0}
                        title="Вверх"
                      >
                        <ArrowUp size={10} />
                      </button>
                      <button
                        style={styles.iconBtn}
                        onClick={function () {
                          handleMovePoint(i, 'down');
                        }}
                        disabled={i === positions.length - 1}
                        title="Вниз"
                      >
                        <ArrowDown size={10} />
                      </button>
                      <button
                        style={styles.iconBtn}
                        onClick={function () {
                          handleFlyToPoint(i);
                        }}
                        title="Перелететь"
                      >
                        <Crosshair size={10} />
                      </button>
                      <button
                        style={{
                          ...styles.iconBtn,
                          color: isCopied ? 'var(--success)' : undefined,
                        }}
                        onClick={function () {
                          handleCopyPointCoords(i);
                        }}
                        title="Копировать координаты"
                      >
                        {isCopied ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                      <button
                        style={styles.iconBtn}
                        onClick={function () {
                          handleDuplicatePoint(i);
                        }}
                        title="Дублировать"
                      >
                        <Plus size={10} />
                      </button>
                      <button
                        style={{
                          ...styles.iconBtn,
                          color: 'var(--danger)',
                        }}
                        onClick={function () {
                          handleRemovePoint(i);
                        }}
                        disabled={positions.length <= 2}
                        title={
                          positions.length <= 2
                            ? 'Минимум 2 точки'
                            : 'Удалить'
                        }
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>

                  <div style={styles.coordGrid}>
                    <div style={styles.coordField}>
                      <label style={styles.miniLabel}>Широта</label>
                      <input
                        type="number"
                        step={0.000001}
                        value={p.lat}
                        onChange={function (e) {
                          handleUpdatePointField(
                            i,
                            'lat',
                            parseFloat(e.target.value) || 0
                          );
                        }}
                        style={styles.coordInput}
                      />
                    </div>
                    <div style={styles.coordField}>
                      <label style={styles.miniLabel}>Долгота</label>
                      <input
                        type="number"
                        step={0.000001}
                        value={p.lon}
                        onChange={function (e) {
                          handleUpdatePointField(
                            i,
                            'lon',
                            parseFloat(e.target.value) || 0
                          );
                        }}
                        style={styles.coordInput}
                      />
                    </div>
                    <div style={styles.coordField}>
                      <label style={styles.miniLabel}>Высота (м)</label>
                      <input
                        type="number"
                        step={10}
                        value={p.height || 0}
                        onChange={function (e) {
                          handleUpdatePointField(
                            i,
                            'height',
                            parseFloat(e.target.value) || 0
                          );
                        }}
                        style={styles.coordInput}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* === ЛИНИЯ (без обводки) === */}
      <div style={styles.subsection}>
        <div style={styles.subsectionTitle}>Линия</div>

        <div style={styles.field}>
          <label style={styles.miniLabel}>Цвет линии</label>
          <input
            type="color"
            value={(getVal('color', item.color || '#a7d948') as string) || '#a7d948'}
            onChange={function (e) {
              setField('color', e.target.value);
            }}
            style={styles.colorInput}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.miniLabel}>
            Толщина:{' '}
            <span style={styles.accent}>
              {getVal('width', item.width || 2)} px
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={getVal('width', item.width || 2) as number}
            onChange={function (e) {
              setField('width', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.miniLabel}>
            Прозрачность:{' '}
            <span style={styles.accent}>
              {Math.round(
                ((getVal('lineOpacity', item.lineOpacity ?? 0.55) as number) ||
                  0) * 100
              )}
              %
            </span>
          </label>
          <input
            type="range"
            min={10}
            max={100}
            value={Math.round(
              ((getVal('lineOpacity', item.lineOpacity ?? 0.55) as number) ||
                0) * 100
            )}
            onChange={function (e) {
              setField('lineOpacity', parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.miniLabel}>Стиль линии</label>
          <select
            value={
              (getVal('lineDash', item.lineDash || 'solid') as string) ||
              'solid'
            }
            onChange={function (e) {
              setField('lineDash', e.target.value as any);
            }}
            style={styles.select}
          >
            <option value="solid">Сплошная</option>
            <option value="dashed">Пунктир</option>
            <option value="dotted">Точки</option>
          </select>
        </div>
      </div>

      {/* === ТОЧКИ — дизайн === */}
      <div style={styles.subsection}>
        <div style={styles.subsectionTitle}>Дизайн точек</div>

        <div style={styles.field}>
          <label style={styles.miniLabel}>Форма</label>
          <select
            value={
              (getVal(
                'pointShape',
                item.pointShape || 'double-circle'
              ) as string) || 'double-circle'
            }
            onChange={function (e) {
              setField('pointShape', e.target.value as any);
            }}
            style={styles.select}
          >
            <option value="double-circle">Двойной круг</option>
            <option value="circle">Круг</option>
            <option value="square">Квадрат</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.miniLabel}>
            Размер:{' '}
            <span style={styles.accent}>
              {getVal('pointSize', item.pointSize || 11)} px
            </span>
          </label>
          <input
            type="range"
            min={6}
            max={24}
            value={getVal('pointSize', item.pointSize || 11) as number}
            onChange={function (e) {
              setField('pointSize', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.miniLabel}>
            Прозрачность:{' '}
            <span style={styles.accent}>
              {Math.round(
                ((getVal('pointOpacity', item.pointOpacity ?? 1) as number) ||
                  0) * 100
              )}
              %
            </span>
          </label>
          <input
            type="range"
            min={10}
            max={100}
            value={Math.round(
              ((getVal('pointOpacity', item.pointOpacity ?? 1) as number) ||
                0) * 100
            )}
            onChange={function (e) {
              setField('pointOpacity', parseInt(e.target.value) / 100);
            }}
            style={styles.range}
          />
        </div>

        <div style={styles.twoCols}>
          <div style={styles.col}>
            <label style={styles.miniLabel}>Заливка</label>
            <input
              type="color"
              value={
                (getVal(
                  'pointFillColor',
                  item.pointFillColor || '#ffffff'
                ) as string) || '#ffffff'
              }
              onChange={function (e) {
                setField('pointFillColor', e.target.value);
              }}
              style={styles.colorInput}
            />
          </div>
          <div style={styles.col}>
            <label style={styles.miniLabel}>Обводка</label>
            <input
              type="color"
              value={
                (getVal(
                  'pointOutlineColor',
                  item.pointOutlineColor || '#a7d948'
                ) as string) || '#a7d948'
              }
              onChange={function (e) {
                setField('pointOutlineColor', e.target.value);
              }}
              style={styles.colorInput}
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.miniLabel}>
            Толщина обводки точки:{' '}
            <span style={styles.accent}>
              {getVal('pointOutlineWidth', item.pointOutlineWidth ?? 2)} px
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={6}
            value={
              getVal('pointOutlineWidth', item.pointOutlineWidth ?? 2) as number
            }
            onChange={function (e) {
              setField('pointOutlineWidth', parseInt(e.target.value));
            }}
            style={styles.range}
          />
        </div>

        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={
              (getVal(
                'highlightEndpoints',
                item.highlightEndpoints !== false
              ) as boolean) !== false
            }
            onChange={function (e) {
              setField('highlightEndpoints', e.target.checked);
            }}
          />
          <span style={{ marginLeft: 6 }}>
            Выделять начало (зелёный) и конец (красный)
          </span>
        </label>
      </div>

      {/* === ЦИФРЫ НА ТОЧКАХ === */}
      <div style={styles.subsection}>
        <div style={styles.subsectionHeader}>
          <span style={styles.subsectionTitle}>
            <Hash size={11} style={{ verticalAlign: -1 }} /> Цифры на точках
          </span>
        </div>

        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={showNumbers}
            onChange={function (e) {
              setField('showNumbers', e.target.checked);
            }}
          />
          <span style={{ marginLeft: 6 }}>Показывать номера</span>
        </label>

        {showNumbers && (
          <>
            <div style={styles.field}>
              <label style={styles.miniLabel}>
                Размер шрифта:{' '}
                <span style={styles.accent}>{numberFontSize} px</span>
              </label>
              <input
                type="range"
                min={8}
                max={24}
                value={numberFontSize}
                onChange={function (e) {
                  setField('numberFontSize', parseInt(e.target.value));
                }}
                style={styles.range}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.miniLabel}>Цвет цифр</label>
              <input
                type="color"
                value={numberColor}
                onChange={function (e) {
                  setField('numberColor', e.target.value);
                }}
                style={styles.colorInput}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.miniLabel}>Цвет обводки цифр</label>
              <input
                type="color"
                value={numberOutlineColor}
                onChange={function (e) {
                  setField('numberOutlineColor', e.target.value);
                }}
                style={styles.colorInput}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.miniLabel}>
                Толщина обводки цифр:{' '}
                <span style={styles.accent}>
                  {numberOutlineWidth} px
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={5}
                value={numberOutlineWidth}
                onChange={function (e) {
                  setField(
                    'numberOutlineWidth',
                    parseInt(e.target.value)
                  );
                }}
                style={styles.range}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.miniLabel}>Стиль цифр</label>
              <select
                value={numberStyle}
                onChange={function (e) {
                  setField('numberStyle', e.target.value as any);
                }}
                style={styles.select}
              >
                <option value="fill">Только заливка</option>
                <option value="outline">Только обводка</option>
                <option value="fill-and-outline">Заливка + обводка</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* === ПОДПИСИ === */}
      <div style={styles.subsection}>
        <div style={styles.subsectionTitle}>Дополнительно</div>

        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={
              (getVal('showHeights', item.showHeights === true) as boolean) ===
              true
            }
            onChange={function (e) {
              setField('showHeights', e.target.checked);
            }}
          />
          <span style={{ marginLeft: 6 }}>Показывать высоты у точек</span>
        </label>
      </div>

      {/* === СЕГМЕНТЫ === */}
      {segments.segments.length > 0 && (
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>
            <Navigation size={11} style={{ verticalAlign: -1 }} /> Сегменты
          </div>
          <div style={styles.segmentsList}>
            {segments.segments.map(function (s) {
              return (
                <div key={s.index} style={styles.segmentRow}>
                  <span style={styles.segmentBadge}>
                    {s.fromNumber}→{s.toNumber}
                  </span>
                  <span style={styles.segmentDist}>
                    {formatDistance(s.distance, distanceUnit, highPrecision)}
                  </span>
                  <span style={styles.segmentAz}>
                    {formatAngle(s.azimuth, highPrecision)}
                  </span>
                  {Math.abs(s.slopeDeg) > 0.1 && (
                    <span style={styles.segmentSlope}>
                      <TrendingUp size={9} style={{ verticalAlign: -1 }} />{' '}
                      {s.slopeDeg.toFixed(1)}°
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  miniLabel: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginBottom: 2,
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    color: 'var(--text-primary)',
    fontSize: 12,
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  colorInput: {
    width: 46,
    height: 30,
    padding: 2,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    cursor: 'pointer',
  },
  range: {
    width: '100%',
    accentColor: 'var(--accent)',
  },
  accent: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '3px 0',
  },
  infoBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    fontSize: 12,
  },
  infoLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: 'var(--text-secondary)',
  },
  infoValue: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
  metricsBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '8px 10px',
    backgroundColor: 'var(--overlay-soft)',
    border: '1px solid var(--border)',
    borderRadius: 5,
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  metricLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: 'var(--text-secondary)',
    fontSize: 11.5,
  },
  metricValue: {
    fontWeight: 600,
    color: 'var(--accent)',
    fontFamily: 'Consolas, monospace',
    fontSize: 11.5,
  },
  hintRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  hint: {
    color: 'var(--text-muted)',
    fontSize: 10,
    fontStyle: 'italic',
  },
  hintSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    lineHeight: 1.45,
    fontStyle: 'italic',
    marginTop: 2,
  },
  subsection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '10px 10px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
  },
  subsectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  subsectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: 'var(--accent)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '3px 8px',
    fontSize: 10.5,
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 4,
    color: 'var(--accent)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
  },
  twoCols: {
    display: 'flex',
    gap: 10,
  },
  col: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  pointsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 400,
    overflowY: 'auto',
  },
  pointCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    padding: '6px 8px',
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 5,
    border: '1px solid var(--border)',
  },
  pointHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  pointNum: {
    minWidth: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent)',
    borderRadius: '50%',
    fontWeight: 700,
    fontSize: 10,
    flexShrink: 0,
  },
  pointActions: {
    display: 'flex',
    gap: 2,
  },
  iconBtn: {
    width: 22,
    height: 22,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 3,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  coordGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 70px',
    gap: 4,
  },
  coordField: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  coordInput: {
    width: '100%',
    padding: '4px 6px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text-primary)',
    fontSize: 10.5,
    outline: 'none',
    fontFamily: 'Consolas, monospace',
    boxSizing: 'border-box',
  },
  empty: {
    padding: '12px 10px',
    textAlign: 'center',
    fontSize: 11,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  segmentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    maxHeight: 220,
    overflowY: 'auto',
  },
  segmentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 6px',
    backgroundColor: 'var(--overlay-soft)',
    borderRadius: 4,
    fontSize: 10.5,
  },
  segmentBadge: {
    padding: '1px 5px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent)',
    borderRadius: 8,
    fontSize: 9.5,
    fontWeight: 700,
    fontFamily: 'Consolas, monospace',
    flexShrink: 0,
  },
  segmentDist: {
    flex: 1,
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'Consolas, monospace',
  },
  segmentAz: {
    color: 'var(--text-muted)',
    fontFamily: 'Consolas, monospace',
    fontSize: 10,
    flexShrink: 0,
  },
  segmentSlope: {
    color: 'var(--warning)',
    fontFamily: 'Consolas, monospace',
    fontSize: 10,
    flexShrink: 0,
  },
};

export default MeasureSection;