/**
 * Dev-проверка совпадения CSS-ширины и пресета.
 *
 * Это главная страховка ручного пайплайна. С x-дескрипторами браузер не
 * смотрит на размер элемента, поэтому расхождение между CSS и PRESETS
 * молча приводит либо к мылу на ретине, либо к слитому трафику — визуально
 * заметить почти невозможно.
 *
 * Проверка резолвит активный пресет через matchMedia ровно так же, как это
 * делает браузер при выборе <source>, и сравнивает с реальной шириной.
 *
 * Вызывать только в dev: код вырезается из прод-бандла через import.meta.env.DEV.
 */
import { PRESETS, ART, BASE_PRESET } from '../config/images.config.mjs';

/** Какой пресет сейчас активен — первый подошедший media, иначе базовый. */
export function activePreset(art = ART, base = BASE_PRESET) {
  for (const branch of art) {
    if (window.matchMedia(branch.media).matches) {return branch.preset;}
  }
  return base;
}

/**
 * Пробегает по всем <picture data-img-preset> на странице и сверяет ширину.
 * @param {number} [tolerance=0.08] — допустимое относительное расхождение
 */
export function checkSlotWidths(tolerance = 0.08) {
  const preset = activePreset();
  const expected = PRESETS[preset]?.w;
  if (!expected) {return;}

  const nodes = document.querySelectorAll('picture[data-img-preset]');
  const seen = new Set();

  for (const node of nodes) {
    const rendered = Math.round(node.getBoundingClientRect().width);
    if (!rendered) {continue;} // скрытый или в прогреве

    const drift = Math.abs(rendered - expected) / expected;
    if (drift <= tolerance) {continue;}

    const signature = `${preset}:${rendered}`;
    if (seen.has(signature)) {continue;}
    seen.add(signature);

    // console.warn(`[images] пресет "${preset}" объявлен как ${expected}px, ` + `но элемент отрисован в ${rendered}px (расхождение ${Math.round(drift * 100)}%). ` + `Поправь PRESETS в images.config.mjs или ширину в SCSS — ` + `с x-дескрипторами браузер ориентируется только на пресет.`, node);
  }
}

/** Проверка при загрузке и на смену брейкпоинта. */
export function watchSlotWidths(tolerance) {
  const run = () => requestAnimationFrame(() => checkSlotWidths(tolerance));

  run();
  for (const branch of ART) {
    window.matchMedia(branch.media).addEventListener('change', run);
  }
  // панель может перерисоваться позже — проверим ещё раз после интеракции
  window.addEventListener('load', run, { once: true });

  return run; // дёргай вручную после перерисовки панели
}
