//  Карточки услуг на странице Services.
//
//  На десктопе панель со списком работ выезжает по наведению. Без курсора
//  выезжать нечему: раньше на тач-устройствах панель была раскрыта всегда и
//  растягивала карточку на несколько экранов. Здесь она сворачивается, а
//  раскрывает её кнопка «Details».
//
//  Условие совпадает с миксином touch из src/styles/abstracts/_mixins.scss
const TOUCH = '(hover: none), (pointer: coarse)';

const CHEVRON = `
  <svg width="14" height="9" viewBox="0 0 14 9" fill="none" aria-hidden="true">
    <path d="M1 1L7 7L13 1" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const LABEL_CLOSED = 'Details';
const LABEL_OPEN = 'Hide';

export const initServiceCards = () => {
  const cards = document.querySelectorAll('.services__description-point');

  if (!cards.length) {
    return;
  }

  const touch = window.matchMedia(TOUCH);
  const toggles = [];

  const setState = (card, toggle, open) => {
    card.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.services__description-toggle-text').textContent =
      open ? LABEL_OPEN : LABEL_CLOSED;
  };

  cards.forEach(card => {
    const panel = card.querySelector('.services__description-hover-wrapper');

    if (!panel) {
      return;
    }

    //  Заголовок карточки — первый: внутри панели лежит его дубликат
    const title = card.querySelector('.services__description-title')?.textContent.trim() ?? '';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'services__description-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', `Show what ${title} includes`);
    toggle.innerHTML = `<span class="services__description-toggle-text">${LABEL_CLOSED}</span>${CHEVRON}`;

    //  Кнопка стоит перед панелью: раскрываясь, панель уходит в самый низ карточки
    card.insertBefore(toggle, panel);
    toggles.push({ card, toggle });

    toggle.addEventListener('click', () => {
      setState(card, toggle, !card.classList.contains('is-open'));
    });
  });

  //  Планшет с подключённой мышью переключается между режимами на лету —
  //  раскрытое состояние на десктопе не нужно, оно мешает hover-панели
  const reset = () => toggles.forEach(({ card, toggle }) => setState(card, toggle, false));

  if (typeof touch.addEventListener === 'function') {
    touch.addEventListener('change', reset);
  } else {
    touch.addListener(reset);
  }
};
