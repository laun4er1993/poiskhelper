// =====================================================
// src/services/kml/index.ts
// Реэкспорт всего модуля kml
// =====================================================

// Reader
export { decodeBytes, readKmlDocument } from './reader';
export type { ReadKmlResult } from './reader';

// Parser
export type { ImportOptions } from './parser';
export {
  parseKmlDocumentToTree,
  countTreeItems,
  buildKmlFolder,
} from './parser';

// Exporter
export type { ExportMeta } from './exporter';
export { exportTreeToKml, exportTreeToKmz } from './exporter';