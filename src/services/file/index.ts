// =====================================================
// src/services/file/index.ts
// Реэкспорт всего модуля file
// =====================================================

export type { FileFilter, OpenOptions, SaveOptions } from './dialogs';

export {
  openFileDialog,
  openMultipleFiles,
  pickDirectory,
  saveFileDialog,
} from './dialogs';

export type { OpenFileResult, SaveKmlOptions } from './kml-io';
export { openKmlFile, saveKmlOrKmz } from './kml-io';

export type { SaveScreenshotOptions } from './screenshot-io';
export {
  dataUrlToUint8Array,
  buildScreenshotName,
  saveScreenshot,
  ensureDirectory,
} from './screenshot-io';