// =====================================================
// src/services/project/presets.ts
// Пресеты для нового проекта (в ProjectDetailsDialog)
// =====================================================

import type { ProjectMeta } from '../../types/project';

export interface NewProjectPreset {
  id: string;
  label: string;
  description: string;
  meta: Partial<ProjectMeta>;
  applyUnitsToSettings?: boolean;
}

export const NEW_PROJECT_PRESETS: NewProjectPreset[] = [
  {
    id: 'blank',
    label: 'Пустой проект',
    description: 'Ничего не задано — только базовые настройки',
    meta: {},
  },
  {
    id: 'archeology',
    label: 'Археология',
    description: 'Полевые работы, привязки, метки с протоколами',
    meta: {
      description:
        'Проект полевых археологических работ. Метки с координатами, протоколами раскопов, привязкой к местности.',
      tags: ['археология', 'поле', 'раскопки'],
      colorTag: '#c9a227',
    },
  },
  {
    id: 'cartography',
    label: 'Картография',
    description: 'KML-слои, полигоны, границы',
    meta: {
      description:
        'Картографический проект. Используются полигоны, границы, тематические слои.',
      tags: ['картография', 'границы', 'слои'],
      colorTag: '#2b7a78',
    },
  },
  {
    id: 'logistics',
    label: 'Логистика',
    description: 'Маршруты, точки, расстояния',
    meta: {
      description:
        'Логистический проект. Маршруты, точки доставки, расчёт расстояний.',
      tags: ['логистика', 'маршруты'],
      colorTag: '#3a7bd5',
    },
  },
  {
    id: 'survey',
    label: 'Геодезия',
    description: 'Измерения, высоты, реперы',
    meta: {
      description:
        'Геодезический проект. Измерения, высоты, реперы, точные координаты.',
      tags: ['геодезия', 'измерения'],
      colorTag: '#5a3fbf',
    },
  },
];

export function getNewProjectPreset(id: string): NewProjectPreset {
  const found = NEW_PROJECT_PRESETS.find(function (p) {
    return p.id === id;
  });
  return found || NEW_PROJECT_PRESETS[0];
}