/**
 * 3D-МОДЕЛИ ОБЪЕКТОВ НА КАРТЕ.
 *
 * Модель — это список деталей из примитивов. Никаких внешних файлов,
 * всё собирается в один меш при инициализации, тени и свет работают как надо.
 *
 * Деталь:
 *   shape: 'box' | 'cylinder' | 'cone' | 'sphere'
 *   size:  box — [ширина, высота, глубина]
 *   r, r2: cylinder — радиус низа и верха (r2 по умолчанию = r), cone/sphere — r
 *   h:     высота цилиндра/конуса
 *   at:    [x, y, z] — центр детали; y = 0 это земля, модель растёт вверх
 *   rot:   [x, y, z] — поворот в ГРАДУСАХ
 *   color: цвет детали
 *   sides: число граней у цилиндра/конуса (4 — получится «квадратная» вышка)
 *
 * Габарит модели по высоте держите около 1: общий масштаб задаётся один раз
 * в CONFIG.markers.facilityScale.
 *
 * Вместо примитивов можно подключить свой .glb — см. FACILITY_TYPES.model в
 * data/facilities.js и раздел README «3D-иконки».
 */

/** Общая палитра, чтобы весь парк объектов выглядел одинаково. */
export const MODEL_PALETTE = {
  base: '#33505f',
  metal: '#d5dee4',
  metalDark: '#93a6b1',
  accent: '#f07e26',
  glass: '#6fa8c8',
  dark: '#5c6f7b',
};

const P = MODEL_PALETTE;

export const FACILITY_MODELS = {
  seaport: {
    parts: [
      { shape: 'box', size: [1.05, 0.12, 0.85], at: [0, 0.06, 0], color: P.base },
      { shape: 'box', size: [0.1, 0.62, 0.1], at: [-0.28, 0.43, 0], color: P.metal },
      { shape: 'box', size: [0.62, 0.08, 0.08], at: [0.02, 0.72, 0], color: P.accent },
      { shape: 'box', size: [0.05, 0.2, 0.05], at: [0.28, 0.6, 0], color: P.metalDark },
      { shape: 'box', size: [0.26, 0.16, 0.2], at: [0.3, 0.2, 0.18], color: P.accent },
      { shape: 'box', size: [0.26, 0.16, 0.2], at: [0.3, 0.2, -0.16], color: P.glass },
      { shape: 'box', size: [0.3, 0.26, 0.3], at: [-0.34, 0.25, 0.22], color: P.metal },
    ],
  },

  offshore: {
    parts: [
      { shape: 'cylinder', r: 0.05, h: 0.4, at: [-0.24, 0.2, -0.2], color: P.metalDark },
      { shape: 'cylinder', r: 0.05, h: 0.4, at: [0.24, 0.2, -0.2], color: P.metalDark },
      { shape: 'cylinder', r: 0.05, h: 0.4, at: [-0.24, 0.2, 0.2], color: P.metalDark },
      { shape: 'cylinder', r: 0.05, h: 0.4, at: [0.24, 0.2, 0.2], color: P.metalDark },
      { shape: 'box', size: [0.72, 0.12, 0.62], at: [0, 0.46, 0], color: P.metal },
      { shape: 'cylinder', r: 0.16, r2: 0.05, h: 0.55, sides: 4, at: [-0.1, 0.79, 0], color: P.accent },
      { shape: 'box', size: [0.22, 0.18, 0.22], at: [0.24, 0.61, 0], color: P.glass },
    ],
  },

  refinery: {
    parts: [
      { shape: 'box', size: [1.0, 0.08, 0.7], at: [0, 0.04, 0], color: P.base },
      { shape: 'cylinder', r: 0.11, h: 0.78, at: [-0.3, 0.47, 0], color: P.metal },
      { shape: 'cylinder', r: 0.12, h: 0.1, at: [-0.3, 0.5, 0], color: P.accent },
      { shape: 'cylinder', r: 0.09, h: 0.56, at: [-0.02, 0.36, 0.16], color: P.metalDark },
      { shape: 'cylinder', r: 0.17, h: 0.42, rot: [0, 0, 90], at: [0.34, 0.29, -0.06], color: P.metal },
      { shape: 'cylinder', r: 0.05, h: 0.62, at: [0.12, 0.39, -0.24], color: P.accent },
    ],
  },

  chemical: {
    parts: [
      { shape: 'box', size: [0.95, 0.08, 0.7], at: [0, 0.04, 0], color: P.base },
      { shape: 'sphere', r: 0.2, at: [-0.28, 0.3, 0.04], color: P.metal },
      { shape: 'cylinder', r: 0.05, h: 0.14, at: [-0.28, 0.09, 0.04], color: P.metalDark },
      { shape: 'cylinder', r: 0.1, h: 0.72, at: [0.14, 0.44, -0.08], color: P.metal },
      { shape: 'cylinder', r: 0.11, h: 0.1, at: [0.14, 0.5, -0.08], color: P.accent },
      { shape: 'cylinder', r: 0.07, h: 0.46, at: [0.36, 0.31, 0.16], color: P.metalDark },
    ],
  },

  power: {
    parts: [
      { shape: 'box', size: [1.0, 0.08, 0.7], at: [0, 0.04, 0], color: P.base },
      { shape: 'cylinder', r: 0.26, r2: 0.19, h: 0.62, at: [-0.24, 0.39, 0], color: P.metal },
      { shape: 'cylinder', r: 0.2, h: 0.06, at: [-0.24, 0.71, 0], color: P.metalDark },
      { shape: 'box', size: [0.44, 0.3, 0.42], at: [0.26, 0.23, 0], color: P.metalDark },
      { shape: 'cylinder', r: 0.05, h: 0.7, at: [0.42, 0.43, -0.18], color: P.accent },
    ],
  },

  oilField: {
    parts: [
      { shape: 'box', size: [0.8, 0.1, 0.5], at: [0, 0.05, 0], color: P.base },
      { shape: 'cylinder', r: 0.09, r2: 0.03, h: 0.46, sides: 4, at: [0.02, 0.33, 0], color: P.metalDark },
      { shape: 'box', size: [0.72, 0.07, 0.09], rot: [0, 0, -18], at: [-0.02, 0.6, 0], color: P.accent },
      { shape: 'box', size: [0.16, 0.16, 0.14], at: [-0.34, 0.72, 0], color: P.metal },
      { shape: 'cylinder', r: 0.06, h: 0.3, at: [0.34, 0.2, 0.14], color: P.metal },
    ],
  },

  gtg: {
    parts: [
      { shape: 'box', size: [1.0, 0.08, 0.72], at: [0, 0.04, 0], color: P.base },
      { shape: 'cylinder', r: 0.19, h: 0.5, rot: [0, 0, 90], at: [0.24, 0.26, 0.06], color: P.metal },
      { shape: 'cylinder', r: 0.2, h: 0.06, rot: [0, 0, 90], at: [0.24, 0.26, 0.06], color: P.accent },
      { shape: 'cylinder', r: 0.1, h: 0.66, at: [-0.28, 0.41, -0.04], color: P.metal },
      { shape: 'cylinder', r: 0.05, h: 0.44, at: [-0.04, 0.3, -0.24], color: P.metalDark },
      { shape: 'box', size: [0.5, 0.05, 0.05], at: [-0.06, 0.2, 0.26], color: P.accent },
    ],
  },

  compression: {
    parts: [
      { shape: 'box', size: [0.9, 0.1, 0.7], at: [0, 0.05, 0], color: P.base },
      { shape: 'box', size: [0.62, 0.3, 0.5], at: [0, 0.25, 0], color: P.metal },
      { shape: 'cylinder', r: 0.42, h: 0.24, sides: 4, rot: [0, 45, 0], at: [0, 0.52, 0], color: P.metalDark },
      { shape: 'cylinder', r: 0.06, h: 0.3, rot: [90, 0, 0], at: [-0.38, 0.22, 0], color: P.accent },
      { shape: 'cylinder', r: 0.06, h: 0.3, rot: [90, 0, 0], at: [0.38, 0.22, 0], color: P.accent },
    ],
  },

  gasPlant: {
    parts: [
      { shape: 'box', size: [1.05, 0.08, 0.7], at: [0, 0.04, 0], color: P.base },
      { shape: 'cylinder', r: 0.09, h: 0.82, at: [-0.32, 0.49, 0.02], color: P.metal },
      { shape: 'cylinder', r: 0.09, h: 0.6, at: [-0.06, 0.38, -0.06], color: P.metalDark },
      { shape: 'cylinder', r: 0.11, h: 0.44, at: [0.24, 0.3, 0.08], color: P.metal },
      { shape: 'box', size: [0.66, 0.05, 0.05], at: [-0.06, 0.24, 0.24], color: P.accent },
      { shape: 'box', size: [0.24, 0.2, 0.24], at: [0.44, 0.18, -0.12], color: P.glass },
    ],
  },

  gasField: {
    parts: [
      { shape: 'box', size: [0.72, 0.1, 0.5], at: [0, 0.05, 0], color: P.base },
      { shape: 'cylinder', r: 0.16, r2: 0.05, h: 0.78, sides: 4, at: [-0.06, 0.49, 0], color: P.metal },
      { shape: 'box', size: [0.3, 0.04, 0.3], at: [-0.06, 0.36, 0], color: P.metalDark },
      { shape: 'cylinder', r: 0.05, h: 0.16, at: [-0.06, 0.94, 0], color: P.accent },
      { shape: 'box', size: [0.2, 0.18, 0.18], at: [0.28, 0.19, 0.02], color: P.metalDark },
    ],
  },
};
