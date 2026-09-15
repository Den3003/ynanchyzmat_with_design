/**
 * timeZone.js — единственный источник времени на сайте.
 *
 * Работает на ВСЕХ страницах: обновляет часы в футере и раз в минуту
 * проверяет, не пора ли сменить тему. Про картинки не знает ничего —
 * просто диспатчит событие 'themechange'. Кто хочет, тот и слушает.
 */

const TZ = 'Asia/Ashgabat';
const NIGHT_START = 20; // с 20:00 — ночь
const DAY_START = 8; // с 08:00 — день
const CLOCK_SELECTOR = '.time-zone__hour';

/**
 * Два отдельных форматтера — намеренно.
 * Соблазн взять clockFormatter.format(now).slice(0, 2) велик, но он
 * молча сломается, если кто-то сменит локаль или добавит hour12.
 */
const clockFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23', // 00–23, иначе полночь может прийти как 24:00
});

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  hourCycle: 'h23',
});

let timerId = null;
let forcedTheme = null;
let currentTheme = document.documentElement.dataset.theme || null;

function getTheme(date) {
  const hour = Number(hourFormatter.format(date));
  // Условие через || — корректно проходит через полночь.
  // Ошибка новичка: hour >= 20 && hour < 8 — всегда false.
  return (hour >= NIGHT_START || hour < DAY_START) ? 'night' : 'day';
}

function renderClock(date) {
  const nodes = document.querySelectorAll(CLOCK_SELECTOR);
  if (!nodes.length) {return;}

  const value = clockFormatter.format(date);
  nodes.forEach((el) => {
    if (el.textContent !== value) {el.textContent = value;}
  });
}

function applyTheme(theme) {
  if (theme === currentTheme) {return;} // без этого дёргаем DOM каждую минуту

  currentTheme = theme;
  document.documentElement.dataset.theme = theme;

  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

function tick() {
  const now = new Date();

  renderClock(now);
  applyTheme(forcedTheme ?? getTheme(now));

  // Выравнивание по границе минуты.
  // У setInterval(fn, 60000) тик привязан к моменту запуска: зашли в 20:00:59 —
  // следующее обновление в 20:01:59, и почти всю минуту висит неверное значение.
  clearTimeout(timerId);
  timerId = setTimeout(tick, 60000 - (Date.now() % 60000) + 100);
}

export function getCurrentTheme() {
  return currentTheme ?? getTheme(new Date());
}

export function initClock() {
  const qs = new URLSearchParams(location.search).get('theme');
  if (qs === 'day' || qs === 'night') {forcedTheme = qs;}

  tick();

  // Браузер душит таймеры в фоновых вкладках, а при засыпании ноутбука
  // они замирают совсем. Эти три слушателя возвращают всё к реальности.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {tick();}
  });
  window.addEventListener('focus', tick);
  window.addEventListener('pageshow', tick); // возврат из bfcache по кнопке «назад»

  // Без этого в dev-режиме после десяти сохранений будет десять таймеров
  if (import.meta.hot) {
    import.meta.hot.dispose(() => clearTimeout(timerId));
  }
}

// Ручка для отладки: __setTheme('day') / __setTheme('night') / __setTheme('auto')
if (import.meta.env.DEV) {
  window.__setTheme = (t) => {
    forcedTheme = (t === 'auto') ? null : t;
    tick();
  };
}
