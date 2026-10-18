// =====================================================
// src/components/sidebar/SidebarSearch.tsx
// Поиск с автодополнением: координаты + Cesium Ion + Nominatim
// =====================================================

import { useEffect, useRef, useState } from 'react';
import {
  Search,
  X,
  MapPin,
  Crosshair,
  Loader2,
  Globe2,
} from 'lucide-react';
import type { SidebarSearchProps } from './types';
import {
  searchPlaces,
  type GeocodeResult,
} from '../../services/geocoding';

const DEBOUNCE_MS = 400;

function SidebarSearch({
  onSearch,
  onSelectGeocodeResult,
  viewerRef,
}: SidebarSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    function () {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        setOpen(false);
        setError(null);
        setLoading(false);
        setHasSearched(false);
        return;
      }

      debounceRef.current = window.setTimeout(async function () {
        debounceRef.current = null;
        setLoading(true);
        setError(null);

        const abort = new AbortController();
        abortRef.current = abort;

        try {
          const viewer =
            viewerRef && viewerRef.current ? viewerRef.current : null;
          const res = await searchPlaces(trimmed, {
            viewer,
            signal: abort.signal,
          });
          if (abort.signal.aborted) return;
          setResults(res);
          setOpen(true);
          setSelectedIdx(0);
          setHasSearched(true);
          if (res.length === 0) {
            setError('Ничего не найдено');
          }
        } catch (e: any) {
          if (e && e.name === 'AbortError') return;
          console.warn('[SidebarSearch] error:', e);
          setResults([]);
          setError('Ошибка поиска');
          setHasSearched(true);
        } finally {
          if (!abort.signal.aborted) {
            setLoading(false);
          }
        }
      }, DEBOUNCE_MS);

      return function () {
        if (debounceRef.current !== null) {
          window.clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        if (abortRef.current) {
          abortRef.current.abort();
          abortRef.current = null;
        }
      };
    },
    [query, viewerRef]
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

  const handleSelect = function (r: GeocodeResult) {
    onSelectGeocodeResult(r);
    setQuery(r.displayName);
    setOpen(false);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleClear = function () {
    setQuery('');
    setResults([]);
    setOpen(false);
    setError(null);
    setHasSearched(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSubmit = function (e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (open && results.length > 0) {
      handleSelect(results[selectedIdx] || results[0]);
      return;
    }

    onSearch(trimmed);
  };

  const handleKeyDown = function (e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setOpen(true);
        setSelectedIdx(function (i) {
          return Math.min(i + 1, results.length - 1);
        });
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setOpen(true);
        setSelectedIdx(function (i) {
          return Math.max(i - 1, 0);
        });
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
  };

  const renderIcon = function (source: GeocodeResult['source']) {
    if (source === 'coordinate') {
      return <Crosshair size={11} color="var(--accent)" />;
    }
    if (source === 'cesium') {
      return <MapPin size={11} color="var(--success)" />;
    }
    return <Globe2 size={11} color="var(--info)" />;
  };

  const renderSourceLabel = function (source: GeocodeResult['source']) {
    if (source === 'coordinate') return 'коорд.';
    if (source === 'cesium') return 'Cesium';
    return 'OSM';
  };

  const showDropdown =
    open &&
    (loading ||
      results.length > 0 ||
      (error !== null && hasSearched));

  return (
    <div ref={wrapRef} style={styles.bar}>
      <form onSubmit={handleSubmit} style={styles.form}>
        {loading ? (
          <Loader2
            size={11}
            color="var(--accent)"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
        ) : (
          <Search size={11} color="var(--text-muted)" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={function (e) {
            setQuery(e.target.value);
          }}
          onFocus={function () {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Место, адрес или координаты (Enter)"
          style={styles.input}
          spellCheck={false}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            style={styles.clearBtn}
            onClick={handleClear}
            title="Очистить"
          >
            <X size={10} />
          </button>
        )}
      </form>

      {showDropdown && (
        <div style={styles.dropdown}>
          {loading && results.length === 0 && (
            <div style={styles.statusRow}>
              <Loader2
                size={11}
                style={{ animation: 'spin 0.9s linear infinite' }}
              />
              <span>Поиск…</span>
            </div>
          )}

          {!loading && error !== null && results.length === 0 && (
            <div style={styles.statusRow}>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {results.map(function (r, idx) {
            const isSelected = idx === selectedIdx;
            return (
              <button
                key={r.id}
                type="button"
                style={{
                  ...styles.resultRow,
                  backgroundColor: isSelected
                    ? 'var(--accent-soft)'
                    : 'transparent',
                  borderColor: isSelected
                    ? 'var(--accent-border)'
                    : 'transparent',
                }}
                onMouseEnter={function () {
                  setSelectedIdx(idx);
                }}
                onClick={function () {
                  handleSelect(r);
                }}
                title={r.displayName}
              >
                <span style={styles.resultIcon}>
                  {renderIcon(r.source)}
                </span>
                <span style={styles.resultText} title={r.displayName}>
                  {r.displayName}
                </span>
                <span style={styles.sourceBadge}>
                  {renderSourceLabel(r.source)}
                </span>
              </button>
            );
          })}

          {!loading && results.length > 0 && (
            <div style={styles.footer}>
              <span style={styles.footerHint}>
                <kbd style={styles.kbd}>↑↓</kbd> выбор
              </span>
              <span style={styles.footerHint}>
                <kbd style={styles.kbd}>↵</kbd> перелёт
              </span>
              <span style={styles.footerHint}>
                <kbd style={styles.kbd}>Esc</kbd> закрыть
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    padding: '5px 6px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    position: 'relative',
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    padding: '3px 7px',
    transition: 'border-color 0.15s',
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 11.5,
    outline: 'none',
    padding: '2px 0',
    minWidth: 0,
    fontFamily: 'inherit',
  },
  clearBtn: {
    width: 14,
    height: 14,
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 6,
    right: 6,
    marginTop: 2,
    backgroundColor: 'var(--bg-modal)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 100,
    maxHeight: 360,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: 3,
    animation: 'scaleIn 0.12s ease',
    transformOrigin: 'top center',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 10px',
    fontSize: 11.5,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    justifyContent: 'center',
  },
  errorText: {
    color: 'var(--text-muted)',
  },
  resultRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11.5,
    color: 'var(--text-primary)',
    textAlign: 'left',
    transition: 'background-color 0.1s',
  },
  resultIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    flexShrink: 0,
  },
  resultText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  sourceBadge: {
    fontSize: 9,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-input)',
    padding: '1px 5px',
    borderRadius: 6,
    fontFamily: 'Consolas, monospace',
    flexShrink: 0,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '4px 6px 2px 6px',
    marginTop: 2,
    borderTop: '1px solid var(--border)',
  },
  footerHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 9.5,
    color: 'var(--text-muted)',
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
    color: 'var(--text-primary)',
    minWidth: 14,
    fontWeight: 600,
  },
};

export default SidebarSearch;