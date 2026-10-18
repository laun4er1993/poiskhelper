// =====================================================
// src/hooks/useLogger.ts
// Журнал действий с буферизацией (flush раз в 300 мс)
// =====================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import type { LogEntry, LogType } from '../types/logs';
import { generateId } from '../types/ids';
import { saveFileDialog } from '../services/file/dialogs';

const MAX_LOG_ENTRIES = 500;
// ⚡ B10: накапливаем записи в буфере и сливаем раз в 300 мс.
//   При импорте 5000 объектов это не 5000 setState, а ~15.
const FLUSH_INTERVAL_MS = 300;
const FLUSH_THRESHOLD = 50;

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
  flush: () => void;
}

export function useLogger(): UseLoggerResult {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // ⚡ Буфер — накапливает записи, чтобы не дёргать setState на каждую
  const bufferRef = useRef<LogEntry[]>([]);
  const flushTimerRef = useRef<number | null>(null);

  const flush = useCallback(function () {
    const buffer = bufferRef.current;
    if (buffer.length === 0) return;
    bufferRef.current = [];

    setLogs(function (prev) {
      // Новые записи в начале (свежие сверху)
      const next = buffer.concat(prev);
      if (next.length > MAX_LOG_ENTRIES) {
        return next.slice(0, MAX_LOG_ENTRIES);
      }
      return next;
    });
  }, []);

  // Периодический flush
  useEffect(function () {
    const id = window.setInterval(flush, FLUSH_INTERVAL_MS);
    return function () {
      window.clearInterval(id);
      // Финальный flush при размонтировании
      flush();
    };
  }, [flush]);

  const addLog = useCallback(
    function (type: LogType, message: string, details?: string) {
      const entry: LogEntry = {
        id: generateId('log'),
        time: formatTime(),
        type: type,
        message: message,
        details: details,
      };
      bufferRef.current.push(entry);

      // ⚡ Если буфер переполнен — принудительный flush
      if (bufferRef.current.length >= FLUSH_THRESHOLD) {
        if (flushTimerRef.current !== null) {
          window.clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }
        flush();
      }
    },
    [flush]
  );

  const clearLogs = useCallback(function () {
    bufferRef.current = [];
    setLogs([]);
  }, []);

  const exportLogs = useCallback(
    async function () {
      // Сначала сливаем буфер, чтобы попали последние записи
      flush();

      // В exportLogs мы можем не увидеть свежий state сразу,
      // но addLog в bufferRef уже даст все записи.
      // Берём из logs + buffer.
      const allLogs = bufferRef.current.concat(logs);
      if (allLogs.length === 0) {
        alert('Журнал пуст — нечего экспортировать.');
        return;
      }

      const text = allLogs
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
    [logs, flush]
  );

  return { logs, addLog, clearLogs, exportLogs, flush };
}