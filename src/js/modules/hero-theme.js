/**
 * hero-theme.js — подмена картинок в ОДНОМ слайде по теме.
 *
 * Инициализируется на любой странице, но если [data-theme-slide] в DOM нет,
 * молча выходит. На about.html, services.html и прочих — ничего не делает.
 */

const SLIDE_SELECTOR = '[data-theme-slide]';

function fillSlide(slide, theme) {
  slide.querySelectorAll('[data-srcset]').forEach((node) => {
    const next = node.dataset.srcset.replaceAll('{theme}', theme);
    // getAttribute, а не node.srcset: геттер вернул бы абсолютный URL
    if (node.getAttribute('srcset') !== next) {node.srcset = next;}
  });

  slide.querySelectorAll('[data-src]').forEach((node) => {
    const next = node.dataset.src.replaceAll('{theme}', theme);
    if (node.getAttribute('src') !== next) {node.src = next;}
  });
}

/**
 * querySelectorAll, а НЕ querySelector — это принципиально.
 *
 * Swiper при loop: true физически клонирует крайние слайды. Наш атрибут
 * data-theme-slide копируется вместе с узлом. Если обновить только оригинал,
 * клон останется со старой картинкой, и при прокрутке по кругу в 20:00
 * пользователь внезапно увидит дневное фото среди ночных.
 */
function applyToAll(theme) {
  document.querySelectorAll(SLIDE_SELECTOR).forEach((slide) => fillSlide(slide, theme));
}

function prefetchOther(theme) {
  const other = theme === 'night' ? 'day' : 'night';
  const base = import.meta.env.BASE_URL;
  const name = `hero-${other}${matchMedia('(max-width: 767px)').matches ? '-m' : ''}`;

  [`${name}.avif`, `${name}@2x.avif`].forEach((file) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = `${base}img/hero/${file}`;
    document.head.appendChild(link);
  });
}

export function initHeroTheme(getTheme) {
  if (!document.querySelector(SLIDE_SELECTOR)) {return;} // не главная — выходим

  // Смена времени суток
  document.addEventListener('themechange', (e) => applyToAll(e.detail.theme));

  // Swiper создал клоны при инициализации
  document.addEventListener('slider:ready', () => applyToAll(getTheme()));

  // Swiper пересоздал клоны (loopFix — при каждом проходе цикла)
  document.addEventListener('slider:clones', () => applyToAll(getTheme()));

  // Прогрев второй темы: подмена в 20:00 пройдёт без пустого кадра
  window.addEventListener('load', () => prefetchOther(getTheme()), { once: true });
}
