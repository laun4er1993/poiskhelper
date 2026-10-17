// =====================================================
// src/components/settings/tabs/ScreenshotTab.tsx
// Настройки скриншотов
// =====================================================

import { useState, useEffect } from 'react';
import {
  FolderOpen,
  FileImage,
  Sliders,
  Copy,
  X,
  RotateCcw,
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import type { AppSettings } from '../../../types/settings';
import type {
  ScreenshotFormat,
  ScreenshotSettings,
} from '../../../types/settings';
import {
  DEFAULT_SCREENSHOT,
  formatScreenshotName,
} from '../../../types/settings';
import Section from '../ui/Section';
import FieldRow from '../ui/FieldRow';
import SegmentButton from '../ui/SegmentButton';
import ToggleOption from '../ui/ToggleOption';

interface ScreenshotTabProps {
  settings: AppSettings;
  onChange: (updater: Partial<AppSettings>) => void;
}

function ScreenshotTab({ settings, onChange }: ScreenshotTabProps) {
  const S = settings.screenshot;
  const [previewName, setPreviewName] = useState('');

  useEffect(
    function () {
      const update = function () {
        setPreviewName(formatScreenshotName(S.prefix, S.format));
      };
      update();
      const id = setInterval(update, 1000);
      return function () {
        clearInterval(id);
      };
    },
    [S.prefix, S.format]
  );

  const updateScreenshot = function <K extends keyof ScreenshotSettings>(
    key: K,
    value: ScreenshotSettings[K]
  ) {
    onChange({
      screenshot: { ...settings.screenshot, [key]: value },
    });
  };

  const handlePickFolder = async function () {
    try {
      const path = (await open({
        title: 'Выберите папку для скриншотов',
        multiple: false,
        directory: true,
      })) as string | null;
      if (path) {
        updateScreenshot('autoSaveDir', path);
      }
    } catch (err) {
      console.error('pickDirectory error:', err);
      alert('Не удалось выбрать папку: ' + (err as Error).message);
    }
  };

  const handleClearFolder = function () {
    updateScreenshot('autoSaveDir', null);
  };

  const handleResetScreenshot = function () {
    if (window.confirm('Сбросить настройки скриншотов?')) {
      onChange({ screenshot: DEFAULT_SCREENSHOT });
    }
  };

  return (
    <>
      {/* ============ КУДА СОХРАНЯТЬ ============ */}
      <Section title="Куда сохранять" icon={<FolderOpen size={13} />}>
        <FieldRow label="Папка автосохранения:">
          <div style={styles.folderRow}>
            <span
              style={{
                ...styles.folderPath,
                color: S.autoSaveDir
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
              }}
              title={S.autoSaveDir || 'Не задана — будет диалог сохранения'}
            >
              {S.autoSaveDir || '(не задана — открывать диалог)'}
            </span>
            <button
              style={styles.smallBtn}
              onClick={handlePickFolder}
              title="Выбрать папку"
            >
              <FolderOpen size={11} /> Выбрать
            </button>
            {S.autoSaveDir && (
              <button
                style={{
                  ...styles.smallBtn,
                  color: 'var(--danger)',
                  borderColor: 'var(--danger)',
                }}
                onClick={handleClearFolder}
                title="Убрать автосохранение"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </FieldRow>
        <div style={styles.hintSmall}>
          Если папка задана — скриншот сохраняется туда без диалога. Если
          нет — откроется диалог сохранения.
        </div>
      </Section>

      {/* ============ ФОРМАТ ============ */}
      <Section title="Формат и имя" icon={<FileImage size={13} />}>
        <FieldRow label="Формат:">
          <SegmentButton
            label="PNG"
            active={S.format === 'png'}
            onClick={function () {
              updateScreenshot('format', 'png' as ScreenshotFormat);
            }}
          />
          <SegmentButton
            label="JPG"
            active={S.format === 'jpg'}
            onClick={function () {
              updateScreenshot('format', 'jpg' as ScreenshotFormat);
            }}
          />
        </FieldRow>

        {S.format === 'jpg' && (
          <FieldRow
            label={'Качество JPG: ' + Math.round(S.quality * 100) + '%'}
          >
            <input
              type="range"
              min={50}
              max={100}
              value={Math.round(S.quality * 100)}
              onChange={function (e) {
                updateScreenshot('quality', parseInt(e.target.value) / 100);
              }}
              style={styles.range}
            />
          </FieldRow>
        )}

        <FieldRow label="Префикс имени:">
          <input
            type="text"
            value={S.prefix}
            onChange={function (e) {
              updateScreenshot('prefix', e.target.value);
            }}
            style={styles.input}
            placeholder="poiskhelper"
            maxLength={40}
          />
        </FieldRow>

        <div style={styles.previewNameRow}>
          <span style={styles.previewNameLabel}>Пример:</span>
          <span style={styles.previewName}>{previewName}</span>
        </div>
      </Section>

      {/* ============ ПАРАМЕТРЫ ============ */}
      <Section title="Параметры" icon={<Sliders size={13} />}>
        <FieldRow label={'Разрешение: ' + S.scale.toFixed(1) + 'x'}>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={S.scale}
            onChange={function (e) {
              updateScreenshot('scale', parseFloat(e.target.value));
            }}
            style={styles.range}
          />
        </FieldRow>
        <div style={styles.hintSmall}>
          1x = как на экране. 2x = удвоенное разрешение (для презентаций).
        </div>

        <ToggleOption
          label="Включать оверлеи (компас, инфо-линейку)"
          checked={S.includeOverlays}
          onChange={function (v) {
            updateScreenshot('includeOverlays', v);
          }}
        />
        <div style={styles.hintSmall}>
          По умолчанию скриншот делается только из canvas глобуса — без
          интерфейса.
        </div>

        <ToggleOption
          label="Показывать уведомление после сохранения"
          checked={S.showNotification}
          onChange={function (v) {
            updateScreenshot('showNotification', v);
          }}
        />

        <ToggleOption
          icon={<Copy size={12} color="var(--accent)" />}
          label="Копировать путь к файлу в буфер"
          checked={S.copyPathToClipboard}
          onChange={function (v) {
            updateScreenshot('copyPathToClipboard', v);
          }}
        />
      </Section>

      {/* ============ СБРОС ============ */}
      <div style={styles.resetRow}>
        <button style={styles.resetBtn} onClick={handleResetScreenshot}>
          <RotateCcw size={11} /> Сбросить скриншоты
        </button>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  range: {
    flex: 1,
    maxWidth: 260,
    accentColor: 'var(--accent)',
  },
  input: {
    flex: 1,
    padding: '5px 10px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'Consolas, monospace',
    outline: 'none',
    minWidth: 100,
    maxWidth: 260,
    boxSizing: 'border-box',
  },
  hintSmall: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    marginTop: 4,
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  folderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    maxWidth: 460,
  },
  folderPath: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Consolas, monospace',
    padding: '4px 8px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    direction: 'rtl',
    textAlign: 'left',
    minWidth: 0,
  },
  smallBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  previewNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-small)',
    marginTop: 4,
  },
  previewNameLabel: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  previewName: {
    fontSize: 11,
    fontFamily: 'Consolas, monospace',
    color: 'var(--accent)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  resetRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid var(--border)',
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-small)',
    color: 'var(--danger)',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
};

export default ScreenshotTab;