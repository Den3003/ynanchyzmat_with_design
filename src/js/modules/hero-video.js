/**
 * hero-video.js — фоновое видео в первом слайде (.main-celebration).
 *
 * АРХИТЕКТУРА: видео лежит ПОВЕРХ постера, а не вместо него.
 *   .main-celebration__wrapper-image  — постер, он же LCP
 *   .main-celebration__video          — opacity 0 → 1 когда готов
 *
 * Если видео отключено (медленная сеть, мобильный, reduced-motion),
 * элемент остаётся в DOM с атрибутом data-video-skipped, но без
 * источников — значит ничего не качается. В консоли появляется строка
 * с причиной. Так видно, что произошло, вместо молчаливого исчезновения.
 */

const VIDEO_SELECTOR = '[data-theme-video]';
const POSTER_SELECTOR = '[data-theme-slide] picture';
const SLIDE_SELECTOR = '.swiper-slide';
const MOBILE_MQ = '(max-width: 767px)';

let started = false;
let io = null;

/* ------------------------------------------------------------------ *
 *  Решение: грузить ли видео
 *
 *  Возвращает СТРОКУ с причиной отказа или null, если всё в порядке.
 *  Раньше тут был boolean — из-за этого было невозможно понять,
 *  какое именно условие сработало.
 * ------------------------------------------------------------------ */

function videoBlockReason() {
  // 1. Системная настройка «меньше движения»
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'reduced-motion';
  }

  // 2. Мобильный. Два мегабайта фона на сотовой сети — неуважение
  //    к чужому трафику, а постер там выглядит ничуть не хуже.
  if (matchMedia(MOBILE_MQ).matches) {
    return `mobile:${window.innerWidth}px`;
  }

  const c = navigator.connection;
  if (c) {
    // 3. Режим экономии трафика
    if (c.saveData) return 'save-data';

    // 4. Медленное соединение.
    //    ВНИМАНИЕ: троттлинг в DevTools подменяет effectiveType.
    //    Любой режим кроме «No throttling» попадёт сюда.
    if (/^(slow-2g|2g)$/.test(c.effectiveType)) {
      return `slow-network:${c.effectiveType}`;
    }
  }

  return null;
}


/**
 * Восстановление после пробуждения из сна.
 *
 * Браузер освобождает декодеры и выгружает битмапы изображений.
 * Элементы остаются в DOM с верными атрибутами, но ничего не рисуют:
 * проверка "атрибут не изменился — ничего не делаем" тут вредна.
 * Поэтому принудительно переприсваиваем источники.
 */
function recoverMedia() {
  // Постер: сброс и повторная установка заставляют браузер
  // заново декодировать изображение
  document.querySelectorAll(POSTER_SELECTOR).forEach((pic) => {
    const img = pic.querySelector('img');
    if (!img || img.complete && img.naturalWidth > 0) return;

    const src = img.getAttribute('src');
    const srcset = img.getAttribute('srcset');
    img.removeAttribute('src');
    img.removeAttribute('srcset');
    if (srcset) img.setAttribute('srcset', srcset);
    if (src) img.setAttribute('src', src);
  });

  // Видео: readyState упал ниже HAVE_CURRENT_DATA — декодер потерян
  document.querySelectorAll(VIDEO_SELECTOR).forEach((v) => {
    if (v.readyState < 2) {
      v.classList.remove('is-ready');
      v.load();
    }
  });
}

/* ------------------------------------------------------------------ *
 *  Подстановка путей
 * ------------------------------------------------------------------ */

/**
 * ГЛАВНАЯ ЛОВУШКА МОДУЛЯ.
 *
 * Смена src у <source> внутри <video> сама по себе НЕ ДЕЛАЕТ НИЧЕГО.
 * Браузер проходит по списку источников один раз и больше к нему
 * не возвращается. Нужен явный video.load().
 *
 * @param {boolean} force — при первом запуске пути уже верные,
 *                          но load() всё равно обязателен.
 */
function applyVideoTheme(theme, force = false) {
  document.querySelectorAll(VIDEO_SELECTOR).forEach((video) => {
    let changed = force;

    video.querySelectorAll('source[data-vsrc]').forEach((s) => {
      const next = s.dataset.vsrc.replaceAll('{theme}', theme);
      // getAttribute, а не s.src: геттер вернул бы абсолютный URL
      if (s.getAttribute('src') !== next) {
        s.setAttribute('src', next);
        changed = true;
      }
    });

    if (!changed) return;

    video.classList.remove('is-ready'); // под ним покажется постер
    video.load(); // ← без этой строки ничего не будет
    tryPlay(video);
  });
}

/**
 * Постер меняется ВСЕГДА, даже когда видео отключено.
 */
function applyPosterTheme(theme) {
  document.querySelectorAll(POSTER_SELECTOR).forEach((pic) => {
    pic.querySelectorAll('[data-srcset]').forEach((n) => {
      const next = n.dataset.srcset.replaceAll('{theme}', theme);
      if (n.getAttribute('srcset') !== next) n.srcset = next;
    });
    pic.querySelectorAll('[data-src]').forEach((n) => {
      const next = n.dataset.src.replaceAll('{theme}', theme);
      if (n.getAttribute('src') !== next) n.src = next;
    });
  });
}

/* ------------------------------------------------------------------ *
 *  Воспроизведение
 * ------------------------------------------------------------------ */

/**
 * play() возвращает промис, который МОЖЕТ отклониться: политика
 * автовоспроизведения, фоновая вкладка, энергосбережение.
 */
function tryPlay(video) {
  const p = video.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => {
      // Молча остаёмся на постере — валидный исход, не ошибка
    });
  }
}

function pauseAll() {
  document.querySelectorAll(VIDEO_SELECTOR).forEach((v) => v.pause());
}

function playActive() {
  document.querySelectorAll(VIDEO_SELECTOR).forEach((v) => {
    const slide = v.closest(SLIDE_SELECTOR);
    if (!slide || slide.classList.contains('swiper-slide-active')) tryPlay(v);
  });
}

function syncWithSlider(isThemeSlide) {
  document.querySelectorAll(VIDEO_SELECTOR).forEach((v) => {
    if (isThemeSlide) tryPlay(v);
    else v.pause();
  });
}

/* ------------------------------------------------------------------ *
 *  Запуск
 * ------------------------------------------------------------------ */

/**
 * Первый запуск — ПОСЛЕ события load.
 * Раньше нельзя: видео отберёт полосу у постера, который и есть LCP.
 */
function startVideo(getTheme) {
  if (started) return;
  started = true;

  document.querySelectorAll(VIDEO_SELECTOR).forEach((video) => {
    video.addEventListener('canplay', () => video.classList.add('is-ready'));

    video.addEventListener('error', () => {
      video.classList.remove('is-ready');
      if (import.meta.env.DEV) {
        console.warn('[hero-video] не удалось загрузить видео — остаёмся на постере');
      }
    });

    video.preload = 'auto';
  });

  applyVideoTheme(getTheme(), true); // force: пути верные, но load() нужен
}

export function initHeroVideo(getTheme) {
  const video = document.querySelector(VIDEO_SELECTOR);

  // Постер живёт независимо от видео
  if (document.querySelector('[data-theme-slide]')) {
    document.addEventListener('themechange', (e) => applyPosterTheme(e.detail.theme));
  }

  if (!video) {
    if (import.meta.env.DEV && document.documentElement.dataset.page === 'home') {
      console.warn('[hero-video] не найден [data-theme-video] — проверьте разметку слайда');
    }
    return;
  }

  // -------------------------------------------------------------
  //  Отказ от видео.
  //
  //  ЭЛЕМЕНТ НЕ УДАЛЯЕМ — оставляем в DOM с пометкой о причине.
  //  Раньше тут был v.remove(), и в Elements оставались только
  //  комментарии вокруг исчезнувшего тега: отлаживать невозможно.
  //
  //  Источники убираем — без них видео ничего не качает.
  // -------------------------------------------------------------
  const reason = videoBlockReason();
  if (reason) {
    document.querySelectorAll(VIDEO_SELECTOR).forEach((v) => {
      v.querySelectorAll('source').forEach((s) => s.remove());
      v.removeAttribute('data-theme-video'); // снимаем с радаров обработчиков
      v.dataset.videoSkipped = reason; // видно прямо в Elements
    });

    if (import.meta.env.DEV) {
      console.info(
        `[hero-video] видео отключено: ${reason}\n` +
        '  slow-network — выключите Throttling в DevTools → Network\n' +
        '  mobile — выключите Device Toolbar (Ctrl+Shift+M) или расширьте окно\n' +
        '  reduced-motion — DevTools → Rendering → prefers-reduced-motion → No emulation'
      );
    }
    return;
  }

  document.addEventListener('themechange', (e) => applyVideoTheme(e.detail.theme));
  window.addEventListener('load', () => startVideo(getTheme), { once: true });

  // --- Экономия батареи и процессора ---

  /* document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAll(); else playActive();
  }); */

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseAll();
      return;
    }
    // Вкладка вернулась — могли проснуться из сна
    recoverMedia();
    // Какой слайд активен, скажет slider.js: он один знает состояние Swiper
    document.dispatchEvent(new CustomEvent('slider:wake'));
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      recoverMedia();
      document.dispatchEvent(new CustomEvent('slider:wake'));
    }
  });

  const root = video.closest(SLIDE_SELECTOR) || video;
  io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) playActive(); else pauseAll();
  }, { threshold: 0 });
  io.observe(root);

  // Событие диспатчит ваш slider.js из обработчика slideChange
  document.addEventListener('slider:change', (e) => {
    syncWithSlider(e.detail?.isThemeSlide ?? false);
  });

  if (import.meta.hot) import.meta.hot.dispose(() => io?.disconnect());
}