// =====================================================
// src/components/sidebar/SidebarSearch.tsx
// Поле поиска места на карте
// =====================================================

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { SidebarSearchProps } from './types';

function SidebarSearch({ onSearch }: SidebarSearchProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = function (e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const handleClear = function () {
    setQuery('');
  };

  return (
    <div style={styles.bar}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <Search size={11} color="var(--text-muted)" />
        <input
          type="text"
          value={query}
          onChange={function (e) {
            setQuery(e.target.value);
          }}
          placeholder="Найти место (Enter)"
          style={styles.input}
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
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  bar: {
    padding: '5px 6px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
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
};

export default SidebarSearch;