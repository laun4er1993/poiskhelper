// =====================================================
// src/components/project-details/TagsEditor.tsx
// Редактор тегов проекта
// =====================================================

import { useState } from 'react';
import { X } from 'lucide-react';

interface TagsEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagsEditor({ tags, onChange }: TagsEditorProps) {
  const [tagInput, setTagInput] = useState('');

  const addTag = function () {
    const raw = tagInput.trim();
    if (!raw) return;
    const parts = raw
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 0;
      });

    const existing = new Set(tags);
    const next = tags.slice();
    parts.forEach(function (p) {
      if (!existing.has(p) && next.length < 20) next.push(p);
    });
    onChange(next);
    setTagInput('');
  };

  const removeTag = function (tag: string) {
    onChange(
      tags.filter(function (t) {
        return t !== tag;
      })
    );
  };

  return (
    <>
      <div style={styles.tagsWrap}>
        {tags.map(function (tag) {
          return (
            <span key={tag} style={styles.tagChip}>
              {tag}
              <button
                style={styles.tagRemove}
                onClick={function () {
                  removeTag(tag);
                }}
                title="Удалить тег"
              >
                <X size={9} />
              </button>
            </span>
          );
        })}
        {tags.length === 0 && (
          <span style={styles.tagsEmpty}>Пока нет тегов</span>
        )}
      </div>

      <div style={styles.tagInputRow}>
        <input
          type="text"
          value={tagInput}
          onChange={function (e) {
            setTagInput(e.target.value);
          }}
          onKeyDown={function (e) {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag();
            }
          }}
          style={styles.input}
          placeholder="Введите тег и нажмите Enter (можно через запятую)"
        />
        <button style={styles.outlineBtn} onClick={addTag}>
          Добавить
        </button>
      </div>
      <div style={styles.hintSmall}>
        До 20 тегов. Помогают быстро находить проект через поиск.
      </div>
    </>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  tagsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    minHeight: 28,
    padding: '4px 0',
  },
  tagChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 4px 3px 10px',
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 12,
    fontSize: 11.5,
    color: 'var(--accent)',
    fontWeight: 500,
  },
  tagRemove: {
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    borderRadius: '50%',
    padding: 0,
  },
  tagsEmpty: {
    fontSize: 11.5,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    padding: '4px 2px',
  },
  tagInputRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    width: '100%',
    padding: '7px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 12.5,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  outlineBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  hintSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
};

export default TagsEditor;