// =====================================================
// src/utils/index.ts
// Реэкспорт утилит
// =====================================================

export {
  copyTextToClipboard,
  fallbackCopyText,
} from './clipboard';

export {
  sampleTerrainForPoints,
  sampleTerrainForPoint,
  shouldUpdateHeight,
  updateHeightsInBatches,
  applyTerrainHeightsToTree,
} from './terrain';