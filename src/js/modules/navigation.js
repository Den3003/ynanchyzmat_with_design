const items = document.querySelectorAll('.navigation__item[data-menu]');

//  Ниже этой ширины горизонтальное меню превращается в выезжающий drawer.
//  Значение должно совпадать с $bp-nav в src/styles/abstracts/_variables.scss
const NAV_BREAKPOINT = '(max-width: 1200px)';

const CHEVRON = `
  <svg width="14" height="9" viewBox="0 0 14 9" fill="none" aria-hidden="true">
    <path d="M1 1L7 7L13 1" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

export const initNavigation = () => {
  const nav = document.querySelector('.navigation');
  const burger = document.querySelector('.js-burger');
  const backdrop = document.querySelector('.js-nav-backdrop');
  const mobile = window.matchMedia(NAV_BREAKPOINT);

  const isMobile = () => mobile.matches;

  // ── Раскрытие панелей ───────────────────────────────────

  const collapse = (item) => {
    const panel = item.querySelector('.navigation__panel');
    const toggle = item.querySelector('.navigation__toggle');

    item.classList.remove('open');
    item.querySelector('.navigation__link')?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-expanded', 'false');

    if (panel) {
      panel.style.maxHeight = '';
    }
  };

  const collapseAll = () => items.forEach(collapse);

  // ── Мобильное меню ──────────────────────────────────────

  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!document.body.classList.contains('is-menu-open')) {
      return;
    }

    document.body.classList.remove('is-menu-open');
    burger?.setAttribute('aria-expanded', 'false');
    collapseAll();

    if (restoreFocus) {
      burger?.focus();
    }
  };

  const openMenu = () => {
    document.body.classList.add('is-menu-open');
    burger?.setAttribute('aria-expanded', 'true');
  };

  if (burger && nav) {
    burger.addEventListener('click', () => {
      if (document.body.classList.contains('is-menu-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  backdrop?.addEventListener('click', () => closeMenu());

  //  Переход по пункту меню закрывает drawer
  nav?.addEventListener('click', (e) => {
    if (!isMobile()) {
      return;
    }

    const link = e.target.closest('.navigation__link, .navigation__sub-link');
    if (link) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu({ restoreFocus: true });
    }
  });

  // ── Пункты с подменю ────────────────────────────────────

  items.forEach(item => {
    const link = item.querySelector('.navigation__link');
    const panel = item.querySelector('.navigation__panel');
    let closeTimer;

    //  Кнопка-аккордеон нужна только пунктам, у которых есть панель
    if (panel) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'navigation__toggle';
      toggle.innerHTML = CHEVRON;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `Show the ${link.textContent.trim()} submenu`);
      item.insertBefore(toggle, panel);

      toggle.addEventListener('click', () => {
        const willOpen = !item.classList.contains('open');

        //  Одновременно раскрыт только один аккордеон
        items.forEach(other => {
          if (other !== item) {
            collapse(other);
          }
        });

        if (willOpen) {
          item.classList.add('open');
          toggle.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        } else {
          collapse(item);
        }
      });
    }

    // ── Десктопное поведение: раскрытие по наведению и фокусу ──

    const openPanel = () => {
      if (isMobile()) {
        return;
      }

      clearTimeout(closeTimer);
      items.forEach(i => i.classList.remove('open'));
      item.classList.add('open');
      link.setAttribute('aria-expanded', 'true');
    };

    const closePanel = () => {
      if (isMobile()) {
        return;
      }

      closeTimer = setTimeout(() => {
        item.classList.remove('open');
        link.setAttribute('aria-expanded', 'false');
      }, 150); // небольшая задержка — не закрывать при "проскакивании" курсора
    };

    item.addEventListener('mouseenter', openPanel);
    item.addEventListener('mouseleave', closePanel);

    // доступность с клавиатуры
    link.addEventListener('focus', openPanel);

    item.addEventListener('focusout', (e) => {
      if (!item.contains(e.relatedTarget)) {
        closePanel();
      }
    });

    link.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        item.classList.remove('open');
        link.setAttribute('aria-expanded', 'false');
        link.blur();
      }
    });
  });

  // ── Смена брейкпоинта сбрасывает состояние обоих режимов ──

  const syncToBreakpoint = () => {
    closeMenu();
    collapseAll();
  };

  if (typeof mobile.addEventListener === 'function') {
    mobile.addEventListener('change', syncToBreakpoint);
  } else {
    mobile.addListener(syncToBreakpoint);
  }
};

export const navigationLinkActive = () => {
  // 1. Получаем текущий pathname без query-параметров и хэшей
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  items.forEach(item => {
    const link = item.querySelector('.navigation__link');
    // Нормализуем href ссылки (убираем слэш на конце)
    const linkPath = new URL(link.href).pathname.replace(/\/$/, '') || '/';

    // 3. Проверяем совпадение
    // Для главной страницы — строгое совпадение.
    // Для остальных — проверка на вложенность (например, /blog/my-post подсветит /blog)
    const isActive = linkPath === '/' 
      ? currentPath === '/' 
      : currentPath.startsWith(linkPath);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};
