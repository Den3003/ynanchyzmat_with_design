/**
 * МАРКЕРЫ КАРТЫ.
 *
 * FACILITY_TYPES — словарь типов объектов:
 *   label — подпись в легенде под картой;
 *   icon  — плоская иконка ДЛЯ ЛЕГЕНДЫ (файл в public/icons, любой формат);
 *   model — необязательный путь к своей 3D-модели .glb. Если он задан, на карте
 *           показывается она; если нет — модель из data/models.js, собранная
 *           из примитивов. Модель автоматически вписывается в единичную высоту
 *           и ставится на землю, так что масштаб исходника не важен.
 *
 * FACILITIES — сами точки:
 *   type     — ключ из FACILITY_TYPES;
 *   at       — [долгота, широта];
 *   projects — какие работы выполнялись на объекте: ключи из PROJECT_TYPES.
 *              Рядом с моделью встанет ряд цветных фишек этих категорий;
 *   rotation — поворот модели вокруг вертикали в градусах (необязательно);
 *   scale    — множитель размера именно этого объекта (необязательно);
 *   welayat  — ручная привязка, нужна только для точек ровно на границе.
 */
export const FACILITY_TYPES = {
  // Пример подключения своей модели: model: 'models/seaport.glb'
  seaport: { label: 'Seaport', model: 'models/seaport.glb', icon: 'icons/seaport-icon.png' },
  offshore: { label: 'Offshore rig', model: 'models/offshore.glb', icon: 'icons/offshore-icon.png' },
  refinery: { label: 'Refinery', model: 'models/refinery.glb', icon: 'icons/refinery-icon.png' },
  chemical: { label: 'Chemical plant', model: 'models/chemical.glb', icon: 'icons/chemical-icon.png' },
  power: { label: 'Power plant', model: 'models/power-plant.glb', icon: 'icons/power-plant-icon.png' },
  oilField: { label: 'Key natural oil extraction fields', model: 'models/oil-field.glb',
    icon: 'icons/oil-field-icon.png' },
  gtg: { label: 'Gas-to-gasoline plant (GTG)', model: 'models/gtg.glb', icon: 'icons/gtg-icon.png' },
  compression: { label: 'Key natural gas compression stations', model: 'models/compression.glb',
    icon: 'icons/compression-icon.png' },
  gasPlant: { label: 'Key natural gas processing plants', model: 'models/gasPlant.glb', icon: 'icons/gasPlant-icon.png' },
  gasField: { label: 'Key natural gas extraction fields', model: 'models/gasField.glb', icon: 'icons/gasField-icon.png' },
};

export const FACILITIES = [
  // Balkan
  { type: 'seaport', at: [53.1, 40.02], title: 'Türkmenbaşy', projects: ['civil', 'pipeline'] },
  { type: 'refinery', at: [53.16, 40.06], title: 'Türkmenbaşy refinery', projects: ['equipment',
    'pipeline', 'environment'] },
  { type: 'offshore', at: [52.82, 39.52], projects: ['oilfield'] },
  { type: 'offshore', at: [52.72, 40.24], projects: ['oilfield', 'equipment'] },
  { type: 'offshore', at: [53.52, 37.90] },
  { type: 'oilField', at: [53.92, 39.22] },
  { type: 'oilField', at: [54.2, 39.35], projects: ['oilfield'] },
  { type: 'oilField', at: [54.62, 40.28] },
  { type: 'power', at: [54.0, 39.5], projects: ['equipment'] },
  { type: 'chemical', at: [52.7, 41.7], title: 'Garabogaz', projects: ['equipment', 'civil'] },
  { type: 'gasField', at: [55.6, 39.1] },

  // Daşoguz
  { type: 'compression', at: [59.4, 41.5], projects: ['pipeline', 'equipment'] },
  { type: 'gasField', at: [58.0, 41.1] },
  { type: 'power', at: [59.9, 41.75] },
  { type: 'gasPlant', at: [60.3, 41.1], projects: ['equipment'] },

  // Ahal
  { type: 'gtg', at: [58.62, 38.24], title: 'Owadandepe GTG', projects: ['equipment', 'civil', 'pipeline'] },
  { type: 'gasPlant', at: [59.1, 38.7], projects: ['equipment', 'environment'] },
  { type: 'compression', at: [60.0, 38.6], projects: ['pipeline'] },
  { type: 'power', at: [58.1, 38.1] },
  { type: 'chemical', at: [57.85, 38.9] },
  { type: 'gasField', at: [59.7, 39.5], projects: ['oilfield', 'environment'] },
  { type: 'oilField', at: [57.6, 39.6] },
  { type: 'compression', at: [57.4, 40.0] },

  // Lebap
  { type: 'gasField', at: [63.6, 38.5] },
  { type: 'compression', at: [62.6, 39.7] },
  { type: 'refinery', at: [63.4, 39.2], title: 'Seýdi refinery', projects: ['equipment', 'pipeline'] },
  { type: 'power', at: [63.5, 39.05] },
  { type: 'chemical', at: [66.1, 37.7], title: 'Garlyk', projects: ['civil'] },
  { type: 'gasPlant', at: [65.0, 38.1] },
  { type: 'oilField', at: [63.9, 38.6] },
  { type: 'gasField', at: [61.6, 40.2] },

  // Mary
  { type: 'gasField', at: [63.2, 36.9], title: 'Galkynyş',
    projects: ['equipment', 'pipeline', 'oilfield', 'environment'] },
  { type: 'gasField', at: [62.2, 37.05] },
  { type: 'gasField', at: [61.55, 36.95] },
  { type: 'gasPlant', at: [62.0, 37.55], projects: ['equipment', 'civil'] },
  { type: 'compression', at: [61.85, 36.5], projects: ['pipeline'] },
  { type: 'power', at: [61.95, 37.75], scale: 0.7 },
  { type: 'chemical', at: [61.75, 37.25] },
];

/** Категории завершённых проектов — цвет точки и подпись в легенде. */
export const PROJECT_TYPES = {
  equipment: { label: 'Dynamic-Static Equipment & System Maintenance', color: '#F07E26' },
  pipeline: { label: 'Pipeline services', color: '#2FA3E3' },
  civil: { label: 'Civil Construction', color: '#FFFFFF' },
  oilfield: { label: 'Oilfield Services', color: '#8C6A5A' },
  environment: { label: 'Environment Protection', color: '#2FB86B' },
};

/**
 * Отдельные отметки проектов — там, где нет объекта из FACILITIES.
 * Рисуются поверх карты как HTML, поэтому текст в круге остаётся чётким.
 *
 * Обязательные поля: type (ключ PROJECT_TYPES) и at ([долгота, широта]).
 * Необязательные — полностью управляют видом круга:
 *   size      — 'sm' | 'md' | 'lg' (готовые размеры);
 *   diameter  — диаметр в пикселях, перебивает size;
 *   title     — текст (у 'lg' он печатается ВНУТРИ круга);
 *   fontSize  — размер текста в пикселях;
 *   color     — цвет круга, по умолчанию берётся из PROJECT_TYPES;
 *   textColor — цвет текста;
 *   glow      — сила свечения: 0 выключает, 1 — как на макете, 2 — вдвое сильнее.
 */
export const PROJECTS = [
  // Тот самый оранжевый круг у Ашхабада — редактируется целиком отсюда.
  {
    type: 'equipment',
    at: [58.3, 37.85],
    size: 'lg',
    title: 'ÝANYJY HAZYNA',
    diameter: 58,
    fontSize: 7,
    color: '#F07E26',
    textColor: '#ffffff',
    glow: 1,
  },
  /* { type: 'pipeline', at: [59.6, 38.9], size: 'md' },
  { type: 'pipeline', at: [62.6, 39.3], size: 'md' },
  { type: 'pipeline', at: [55.2, 39.0], size: 'sm' },
  { type: 'civil', at: [60.4, 41.2], size: 'sm' },
  { type: 'civil', at: [62.1, 37.4], size: 'md' },
  { type: 'oilfield', at: [53.6, 39.4], size: 'md' },
  { type: 'oilfield', at: [64.2, 38.6], size: 'sm' },
  { type: 'environment', at: [61.3, 37.0], size: 'sm' },
  { type: 'environment', at: [57.9, 40.2], size: 'sm' }, */
];
