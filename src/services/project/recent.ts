// =====================================================
// src/services/project/recent.ts
// Список недавних проектов (localStorage)
// =====================================================

import type { RecentProject } from '../../types/project';

const RECENT_KEY = 'poiskhelper_recent_projects_v1';
const MAX_RECENT = 12;

/**
 * Читает список недавних проектов из localStorage.
 * Всегда возвращает валидный массив.
 */
export function loadRecentProjects(): RecentProject[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(function (r: any) {
        return r && typeof r.path === 'string' && typeof r.name === 'string';
      })
      .map(function (r: any) {
        return {
          path: String(r.path),
          name: String(r.name),
          openedAt: String(r.openedAt || new Date().toISOString()),
          sizeBytes:
            typeof r.sizeBytes === 'number' && isFinite(r.sizeBytes)
              ? r.sizeBytes
              : undefined,
        } as RecentProject;
      });
  } catch (e) {
    console.warn('loadRecentProjects: ошибка чтения', e);
    return [];
  }
}

/**
 * Сохраняет список недавних проектов (с ограничением MAX_RECENT).
 */
export function saveRecentProjects(list: RecentProject[]): void {
  try {
    const safe = list.slice(0, MAX_RECENT).map(function (r) {
      const out: RecentProject = {
        path: r.path,
        name: r.name,
        openedAt: r.openedAt,
      };
      if (typeof r.sizeBytes === 'number') out.sizeBytes = r.sizeBytes;
      return out;
    });
    localStorage.setItem(RECENT_KEY, JSON.stringify(safe));
  } catch (e) {
    console.warn('saveRecentProjects: ошибка записи', e);
  }
}

/**
 * Добавляет проект в начало списка (или обновляет, если уже есть).
 */
export function addRecentProject(
  path: string,
  name: string,
  sizeBytes?: number
): RecentProject[] {
  const list = loadRecentProjects().filter(function (r) {
    return r.path !== path;
  });
  const entry: RecentProject = {
    path: path,
    name: name,
    openedAt: new Date().toISOString(),
  };
  if (typeof sizeBytes === 'number') entry.sizeBytes = sizeBytes;
  const next = [entry].concat(list).slice(0, MAX_RECENT);
  saveRecentProjects(next);
  return next;
}

/**
 * Обновляет запись без перемещения в топ (например, при переименовании).
 */
export function updateRecentProject(
  path: string,
  updates: Partial<RecentProject>
): RecentProject[] {
  const list = loadRecentProjects().map(function (r) {
    if (r.path !== path) return r;
    const next: RecentProject = { ...r };
    if (typeof updates.name === 'string') next.name = updates.name;
    if (typeof updates.sizeBytes === 'number') next.sizeBytes = updates.sizeBytes;
    if (typeof updates.openedAt === 'string') next.openedAt = updates.openedAt;
    return next;
  });
  saveRecentProjects(list);
  return list;
}

/**
 * Удаляет проект из списка недавних.
 */
export function removeRecentProject(path: string): RecentProject[] {
  const next = loadRecentProjects().filter(function (r) {
    return r.path !== path;
  });
  saveRecentProjects(next);
  return next;
}

/**
 * Полностью очищает список недавних проектов.
 */
export function clearRecentProjects(): void {
  saveRecentProjects([]);
}

/**
 * Возвращает путь последнего открытого проекта (или null).
 */
export function getLastProjectPath(): string | null {
  const list = loadRecentProjects();
  return list.length > 0 ? list[0].path : null;
}

/**
 * Возвращает запись недавнего проекта по пути или null.
 */
export function getRecentProjectByPath(path: string): RecentProject | null {
  const list = loadRecentProjects();
  for (let i = 0; i < list.length; i++) {
    if (list[i].path === path) return list[i];
  }
  return null;
}