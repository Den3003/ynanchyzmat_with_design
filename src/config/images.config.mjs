/**
 * ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ о твоих изображениях.
 *
 * Импортируется И браузером (сборка <picture>), И Node-скриптом (проверка
 * наличия файлов). Поэтому здесь только чистые данные — никаких fs/path.
 *
 * Никаких зависимостей: файлы ты готовишь сам, код лишь находит их и
 * проверяет, что комплект полный.
 */

/**
 * Пресет — логический слот в вёрстке с ИЗВЕСТНОЙ CSS-шириной.
 * w/h — размеры в CSS-пикселях при DPR 1.
 *
 * ⚠️ КРИТИЧНО: значения обязаны совпадать с реальной шириной элемента в CSS.
 * С x-дескрипторами браузер НЕ смотрит на размер элемента — только на DPR.
 * CSS говорит 380px, а пресет 480 — значит ты качаешь лишние байты впустую.
 *
 * Как измерить: DevTools → Elements → выбери .tm-panel__wrapper-image →
 * вкладка Computed → width. Проверь на каждом брейкпоинте.
 *
 * ⚠️ Эти же числа продублированы в src/scss/_image-presets.scss.
 * Меняешь здесь — меняй и там. Рассинхрон ловит dev-check-slots.js.
 */
export const PRESETS = {
  panelSm: { w: 480, h: 400 }, // мобильная панель: тянется на всю ширину
  panelLg: { w: 560, h: 500 }, // десктопная панель: фиксированная колонка
};

/**
 * Какие плотности пикселей ты экспортируешь.
 * 2x — потолок: 3x визуально не отличим, но вес растёт квадратично.
 * DPR 1.25/1.5/1.75 (масштаб Windows, Android) автоматически получат 2x.
 *
 * Можно оставить [1] — код соберёт srcset без 2x и не сломается.
 */
export const DPRS = [1, 2];

/**
 * Форматы для <source>. ПОРЯДОК ВАЖЕН: от лучшего сжатия к худшему,
 * браузер берёт первый поддерживаемый.
 *
 * Убери avif, если не хочешь его готовить — всё продолжит работать.
 */
export const FORMATS = [
  { ext: 'avif', mime: 'image/avif' },
  { ext: 'webp', mime: 'image/webp' },
];

/** Формат для <img> — последний рубеж, если ни один <source> не подошёл. */
export const FALLBACK = { ext: 'jpg', mime: 'image/jpeg' };

/**
 * Базовый пресет: используется в <img> и как последний <source> без media.
 * Обычно самый широкий вариант (мобильный, если панель тянется на всю ширину).
 */
export const BASE_PRESET = 'panelSm';

/**
 * Art direction: разные пресеты под разные экраны.
 *
 * ⚠️ ПОРЯДОК: браузер берёт ПЕРВЫЙ подошедший <source> сверху вниз.
 * С min-width сортируй от БОЛЬШЕГО к меньшему, с max-width — наоборот.
 * Перепутаешь — десктоп получит мобильный кроп.
 *
 * Не нужен art direction? Оставь пустой массив: [].
 */
export const ART = [
  { media: '(min-width: 768px)', preset: 'panelLg' },
];

/**
 * СОГЛАШЕНИЕ ОБ ИМЕНАХ — по нему код ищет твои файлы.
 *
 * По умолчанию: welayats/balkan-panelSm-2x.avif
 *
 * Хочешь другую схему — меняй здесь, и check-images.mjs будет требовать
 * файлы уже в новом виде. Например, без пресета в имени (если пресет один):
 *   ({ name, dpr, ext }) => `${name}@${dpr}x.${ext}`
 *
 * @param {{name: string, preset: string, dpr: number, ext: string}} p
 * @returns {string} путь относительно src/assets/images/
 */
export const fileName = ({ name, preset, dpr, ext }) => `${name}-${preset}-${dpr}x.${ext}`;

/** Пресеты, которые реально используются (остальные не проверяются). */
export const USED_PRESETS = [...new Set([BASE_PRESET, ...ART.map((a) => a.preset)])];

/** Все форматы, включая fallback. */
export const ALL_FORMATS = [...FORMATS, FALLBACK];

/**
 * Полный список файлов, которые нужно подготовить для одного изображения,
 * с целевыми размерами в пикселях. Используется и проверкой, и подсказкой
 * «что экспортировать».
 *
 * @param {string} name — 'welayats/balkan'
 */
export function expectedFiles(name) {
  const out = [];
  for (const preset of USED_PRESETS) {
    const { w, h } = PRESETS[preset];
    for (const { ext } of ALL_FORMATS) {
      for (const dpr of DPRS) {
        out.push({
          file: fileName({ name, preset, dpr, ext }),
          width: w * dpr,
          height: h * dpr,
          ext,
          dpr,
          preset,
        });
      }
    }
  }
  return out;
}
