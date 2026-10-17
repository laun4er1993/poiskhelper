// =====================================================
// src/hooks/useLogger.ts
// Журнал действий: логи, очистка, экспорт в TXT
// =====================================================

import { useState, useCallback } from 'react';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import type { LogEntry, LogType } from '../types/logs';
import { generateId } from '../types/ids';
import { saveFileDialog } from '../services/file/dialogs';

const MAX_LOG_ENTRIES = 500;

function formatTime(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return hh + ':' + mm + ':' + ss;
}

function formatFullDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

export interface UseLoggerResult {
  logs: LogEntry[];
  addLog: (type: LogType, message: string, details?: string) => void;
  clearLogs: () => void;
  exportLogs: () => Promise<void>;
}

export function useLogger(): UseLoggerResult {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback(function (
    type: LogType,
    message: string,
    details?: string
  ) {
    const entry: LogEntry = {
      id: generateId('log'),
      time: formatTime(),
      type: type,
      message: message,
      details: details,
    };
    setLogs(function (prev) {
      const next = [entry].concat(prev);
      if (next.length > MAX_LOG_ENTRIES) {
        return next.slice(0, MAX_LOG_ENTRIES);
      }
      return next;
    });
  }, []);

  const clearLogs = useCallback(function () {
    setLogs([]);
  }, []);

  const exportLogs = useCallback(
    async function () {
      if (logs.length === 0) {
        alert('Журнал пуст — нечего экспортировать.');
        return;
      }

      const text = logs
        .slice()
        .reverse()
        .map(function (l) {
          return (
            '[' +
            l.time +
            '] [' +
            l.type.toUpperCase() +
            '] ' +
            l.message +
            (l.details ? ' — ' + l.details : '')
          );
        })
        .join('\n');

      try {
        const path = await saveFileDialog({
          title: 'Экспорт журнала действий',
          defaultPath:
            'poiskhelper-log-' + formatFullDate() + '-' + Date.now() + '.txt',
          filters: [
            { name: 'Текстовые файлы', extensions: ['txt'] },
            { name: 'Все файлы', extensions: ['*'] },
          ],
        });

        if (!path) return;

        await writeTextFile(path, text);
        console.log('Журнал экспортирован:', path);
      } catch (err) {
        console.error('Ошибка экспорта журнала:', err);
        // Fallback через Blob
        try {
          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'poiskhelper-log-' + Date.now() + '.txt';
          link.click();
          URL.revokeObjectURL(url);
        } catch (fallbackErr) {
          alert('Не удалось сохранить журнал: ' + (err as Error).message);
        }
      }
    },
    [logs]
  );

  return { logs, addLog, clearLogs, exportLogs };
}