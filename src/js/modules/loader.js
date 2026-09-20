// src/js/modules/loader.js

const ROOT = document.documentElement;

const DEFAULTS = {
  selector:   '[data-loader]',
  blankClass: 'yh-loader--blank',
  minVisible: 2950, // полная секвенция: 2.35s + 0.6s
  maxWait:    6000, // страховка: скрыть в любом случае
};

export function initLoader(userOptions = {}) {
  const o = { ...DEFAULTS, ...userOptions };
  const el = document.querySelector(o.selector);

  if (!el) {
    ROOT.classList.remove('is-loading');
    return null;
  }

  const startedAt = performance.now();
  let isHidden = false;
  let waitTimer = null;
  let hideTimer = null;

  /* ---------- состояния ---------- */

  const applyHidden = () => {
    ROOT.classList.remove('is-loading');
    ROOT.classList.add('is-loaded');
    el.setAttribute('aria-hidden', 'true');
    el.inert = true;
    isHidden = true;
  };

  const hide = ({ instant = false } = {}) => {
    if (isHidden) return;
    clearTimeout(waitTimer);
    clearTimeout(hideTimer);

    if (instant) {
      applyHidden();
      return;
    }
    const delay = Math.max(0, o.minVisible - (performance.now() - startedAt));
    hideTimer = setTimeout(applyHidden, delay);
  };

  // blank: true — только фон, без знака (уход на другую страницу)
  const show = ({ blank = true } = {}) => {
    clearTimeout(hideTimer);
    el.classList.toggle(o.blankClass, blank);
    el.removeAttribute('aria-hidden');
    el.inert = false;
    ROOT.classList.remove('is-loaded');
    ROOT.classList.add('is-loading');
    isHidden = false;
  };

  /* ---------- условия готовности ---------- */

  const domReady = () =>
    new Promise((resolve) => {
      if (document.readyState !== 'loading') resolve();
      else document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });

  const fontsReady = () =>
    document.fonts ? document.fonts.ready : Promise.resolve();

  const failSafe = () =>
    new Promise((resolve) => { waitTimer = setTimeout(resolve, o.maxWait); });

  /* ---------- запуск ---------- */

  Promise.race([
    Promise.all([domReady(), fontsReady()]),
    failSafe(),
  ])
    .catch(() => {})
    .finally(hide);

  // возврат кнопкой «Назад» из bfcache
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) hide({ instant: true });
  });

  return { show, hide };
}