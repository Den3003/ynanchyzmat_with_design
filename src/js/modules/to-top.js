/**
 * Кнопка «Наверх».
 *
 * Показывается, когда пользователь ушёл ниже маркера первого экрана
 * (.js-to-top-sentinel) и страница вообще прокручивается.
 *
 * Отключение на конкретной странице:
 *   <body data-to-top="off">  — кнопка удаляется из DOM.
 *
 * Использование:
 *   import { initToTop } from './components/to-top.js';
 *   const toTop = initToTop();          // toTop?.destroy() при смене страницы (Turbo/SPA)
 */

const DEFAULTS = {
  button: '.to-top',
  sentinel: '.js-to-top-sentinel',
  focusTarget: '.site-header',
  footer: '.site-footer',
  /** Порог в высотах экрана, если маркера нет в разметке */
  fallbackRatio: 1.5,
  /** Ниже этого запаса прокрутки кнопка не нужна вовсе */
  minScrollable: 200,
  /** Поднимать кнопку, когда футер во вьюпорте */
  avoidFooter: true,
};

export function initToTop(userOptions = {}) {
  const o = { ...DEFAULTS, ...userOptions };

  const btn = document.querySelector(o.button);
  if (!btn) return null; // на этой странице кнопки нет — молча выходим

  // Явное отключение на странице (например, полноэкранный слайдер)
  if (document.body.dataset.toTop === 'off') {
    btn.remove();
    return null;
  }

  // const anchor = document.querySelector(o.anchor);

  /**
   * Переносит фокус в начало страницы.
   * tabindex ставим временно: постоянный tabindex="-1" в разметке не нужен,
   * а добавлять элемент в Tab-порядок через tabindex="0" нельзя — шапка
   * начнёт ловить фокус при обычной навигации.
   */

  const focusTop = () => {
    const target = document.querySelector(o.focusTarget);
    if (!target) return;

    // Делаем элемент программно фокусируемым, но не добавляем его в Tab-порядок
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }

    target.focus({ preventScroll: true });
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let visible = null;
  const observers = [];

  const setVisible = (next) => {
    if (next === visible) return; // не трогаем DOM зря
    visible = next;
    btn.dataset.visible = String(next);
  };

  const isScrollable = () =>
    document.documentElement.scrollHeight - window.innerHeight > o.minScrollable;

  /* ---------- Маркер первого экрана ---------- */

  let sentinel = document.querySelector(o.sentinel);
  let sentinelCreated = false;

  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.className = o.sentinel.replace(/^\./, '');
    sentinel.style.blockSize = `${o.fallbackRatio * 100}svh`;
    sentinel.setAttribute('aria-hidden', 'true');
    document.body.prepend(sentinel);
    sentinelCreated = true;
  }

  /* ---------- Порог показа ---------- */

  const io = new IntersectionObserver(
    ([entry]) => setVisible(!entry.isIntersecting && isScrollable()),
    { threshold: 0 }
  );
  io.observe(sentinel);
  observers.push(io);

  /* ---------- Футер: поднимаем кнопку, чтобы не наезжала ---------- */

  const footer = o.avoidFooter ? document.querySelector(o.footer) : null;

  if (footer) {
    const footerIO = new IntersectionObserver(
      ([entry]) => {
        btn.dataset.raised = String(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    footerIO.observe(footer);
    observers.push(footerIO);
  }

  /* ---------- Контент может вырасти или сжаться ---------- */

  const ro = new ResizeObserver(() => {
    if (visible && !isScrollable()) setVisible(false);
  });
  ro.observe(document.documentElement);
  observers.push(ro);

  /* ---------- Клик ---------- */

    const onClick = (e) => {
    // Ctrl/Cmd/Shift-клик и средняя кнопка — отдаём браузеру, пусть открывает вкладку
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    // Отменяем дефолтный мгновенный прыжок по якорю — прокручиваем сами
    e.preventDefault();

    // 1. Сначала фокус. preventScroll не даёт браузеру дёрнуть страницу
    //    до того, как начнётся наша плавная прокрутка.
    focusTop();

    // 2. Потом прокрутка.
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });

    // 3. Убираем #top из адресной строки, иначе F5 вернёт пользователя к якорю.
    if (history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  };

  btn.addEventListener('click', onClick);

  /* ---------- Возврат «назад» из bfcache ---------- */

  const onPageShow = (e) => {
    if (!e.persisted) return;
    if (!isScrollable()) setVisible(false);
  };

  window.addEventListener('pageshow', onPageShow);

  /* ---------- Очистка ---------- */

  const destroy = () => {
    observers.forEach((obs) => obs.disconnect());
    btn.removeEventListener('click', onClick);
    window.removeEventListener('pageshow', onPageShow);
    if (sentinelCreated) sentinel.remove();
  };

  return { destroy, get isVisible() { return visible; } };
}