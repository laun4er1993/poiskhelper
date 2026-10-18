// =====================================================
// src/services/project/read-write.ts
// Чтение/запись .poiskhelper + диалоги
// =====================================================

import {
  readTextFile,
  writeTextFile,
  exists,
  remove,
  stat,
} from '@tauri-apps/plugin-fs';
import { confirm } from '@tauri-apps/plugin-dialog';
import type { ProjectData, ProjectMeta, TreeItem } from '../../types';
import { createDefaultProjectMeta } from '../../types/project';
import { normalizeProjectMeta, sanitizeFileName } from './meta';
import { getProjectStats } from './stats';
import { openFileDialog, saveFileDialog } from '../file/dialogs';

const PROJECT_FILTER = {
  name: 'PoiskHelper Project',
  extensions: ['poiskhelper', 'json'],
};

// -----------------------------------------------------
// Точный размер файла на диске (с fallback на эстимейт)
// -----------------------------------------------------
async function safeFileSize(path: string, textFallback: string): Promise<number> {
  try {
    const info = await stat(path);
    if (info && typeof info.size === 'number' && isFinite(info.size)) {
      return info.size;
    }
  } catch (e) {
    // нет прав на stat — считаем эстимейт
  }
  // Fallback: приблизительный размер UTF-8 строки (без создания массива)
  // Кириллица = 2 байта, латиница = 1. Оцениваем как ~1.15× от длины.
  return Math.round(textFallback.length * 1.15);
}

// -----------------------------------------------------
// Диалоги
// -----------------------------------------------------
export async function pickProjectFile(): Promise<string | null> {
  return openFileDialog({
    title: 'Открыть проект PoiskHelper',
    multiple: false,
    directory: false,
    filters: [PROJECT_FILTER],
  });
}

export async function pickProjectSavePath(
  defaultName: string
): Promise<string | null> {
  const safe = (defaultName || 'project')
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 80);
  return saveFileDialog({
    title: 'Сохранить проект PoiskHelper',
    defaultPath: safe + '.poiskhelper',
    filters: [PROJECT_FILTER],
  });
}

// -----------------------------------------------------
// Чтение
// -----------------------------------------------------
export interface OpenedProject {
  path: string;
  name: string;
  data: ProjectData;
  meta: ProjectMeta;
  sizeBytes: number;
  stats: ReturnType<typeof getProjectStats>;
}

export async function readProjectFile(path: string): Promise<OpenedProject> {
  const text = await readTextFile(path);

  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new Error('Файл проекта повреждён: не удаётся разобрать JSON');
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('Файл проекта не соответствует формату PoiskHelper');
  }

  if (!Array.isArray(raw.tree)) {
    raw.tree = [];
  }

  const nameFromPath = path.split(/[\\/]/).pop() || 'project';
  const cleanName = sanitizeFileName(nameFromPath);

  const fallbackTitle =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim()
      : cleanName;

  const meta = normalizeProjectMeta(raw.meta, fallbackTitle);

  if (!meta.fileBaseName) {
    meta.fileBaseName = cleanName || 'project';
  }

  const project: ProjectData = {
    version:
      typeof raw.version === 'number' && isFinite(raw.version)
        ? raw.version
        : 2,
    name:
      typeof raw.name === 'string' && raw.name.trim()
        ? raw.name.trim()
        : meta.title,
    tree: Array.isArray(raw.tree) ? raw.tree : [],
    camera:
      raw.camera && typeof raw.camera === 'object' ? raw.camera : undefined,
    savedAt:
      typeof raw.savedAt === 'string' && raw.savedAt
        ? raw.savedAt
        : new Date().toISOString(),
    meta: meta,
  };

  if (Array.isArray(raw.importedItems) && raw.importedItems.length > 0) {
    project.importedItems = raw.importedItems;
  }

  const stats = getProjectStats(project.tree, project.importedItems);
  const sizeBytes = await safeFileSize(path, text);

  return {
    path: path,
    name: meta.title || cleanName,
    data: project,
    meta: meta,
    sizeBytes: sizeBytes,
    stats: stats,
  };
}

// -----------------------------------------------------
// Запись
// -----------------------------------------------------
export async function writeProjectFile(
  path: string,
  project: ProjectData
): Promise<number> {
  const fileName = path.split(/[\\/]/).pop() || 'project';
  const cleanName = sanitizeFileName(fileName);

  const meta = project.meta
    ? { ...project.meta }
    : createDefaultProjectMeta(project.name);

  meta.updatedAt = new Date().toISOString();
  if (cleanName) {
    meta.fileBaseName = cleanName;
  }
  if (!meta.title) {
    meta.title = project.name || cleanName || 'Новый проект';
  }

  const payload: ProjectData = {
    version: project.version || 2,
    name: meta.title,
    tree: project.tree,
    camera: project.camera,
    savedAt: meta.updatedAt,
    meta: meta,
  };

  if (project.importedItems && project.importedItems.length > 0) {
    payload.importedItems = project.importedItems;
  }

  // ⚡ N10: без отступов — для больших проектов это +40% к размеру
  //   и 2-3× медленнее при записи. Если нужна читаемость — есть редакторы.
  const json = JSON.stringify(payload);
  await writeTextFile(path, json);

  // ⚡ N11: точный размер с диска
  return await safeFileSize(path, json);
}

// -----------------------------------------------------
// Файловые операции
// -----------------------------------------------------
export async function fileExists(path: string): Promise<boolean> {
  try {
    return await exists(path);
  } catch (e) {
    return false;
  }
}

export async function deleteProjectFile(path: string): Promise<boolean> {
  try {
    const ok = await confirm('Удалить файл проекта с диска?\n\n' + path, {
      title: 'Удаление файла',
      kind: 'warning',
    });
    if (!ok) return false;
    await remove(path);
    return true;
  } catch (err) {
    console.error('deleteProjectFile error:', err);
    return false;
  }
}

// -----------------------------------------------------
// Сборка ProjectData
// -----------------------------------------------------
export function buildProjectData(
  meta: ProjectMeta,
  tree: TreeItem[],
  importedItems: TreeItem[] | undefined,
  camera: any | null,
  version: number = 2
): ProjectData {
  const data: ProjectData = {
    version: version,
    name: meta.title || 'Новый проект',
    tree: tree,
    savedAt: new Date().toISOString(),
    meta: { ...meta },
  };
  if (camera) {
    data.camera = camera;
  }
  if (importedItems && importedItems.length > 0) {
    data.importedItems = importedItems;
  }
  return data;
}