import { swiper, swiperTeam, swiperTimeline } from '../main';
import { debounce } from './utils';

const searchWrapper = document.querySelector('.js-search');
const searchTrigger = document.querySelector('.js-search-trigger');
const searchInput = document.querySelector('.js-search-input');
const searchCloseBtn = document.querySelector('.js-search-close');
const searchResultBox = document.querySelector('.js-search-results');

let searchIndex = [];

let indexReady = null;

function loadIndex() {
  if (indexReady) {
    return indexReady;
  }

  //  Путь абсолютный: хостинги с «pretty URLs» отдают /about вместо /about.html,
  //  и относительный путь на такой странице ушёл бы в /about/search-index.json
  indexReady = fetch('/search-index.json')
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => { searchIndex = data; })
    .catch(err => {
      console.error('Не удалось загрузить search-index.json:', err);
      searchIndex = [];
    });
  return indexReady;
}

/* ===================================================================
    1. ИНДЕКС КОНТЕНТА
    На реальном сайте этот массив строится один раз при загрузке:
    либо вручную (как тут, для демо), либо автоматически —
    обходом DOM (document.querySelectorAll('.content-section'))
    и извлечением текста заголовка/абзацев в объект.
  =================================================================== */
// export function buildIndexFromDOM() {
//   return [...document.querySelectorAll('.js-content-section')].map(section => ({
//       id: section.id,
//       title: section.querySelector('.js-content-title')?.textContent.trim() || '',
//       text: section.querySelector('.js-content-text')?.textContent.trim() || '',
//       el: section,
//       swiperIndex: section.dataset.slideIndex || ''
//     }));
// }

// const searchIndex = buildIndexFromDOM();

export const initSearch = () => {
  loadIndex();
  // console.log('searchIndex: ', searchIndex);
  /* ===================================================================
      ПОИСК
    Простое совпадение по подстроке в заголовке и тексте (без учёта
    регистра). Для реального сайта с большим объёмом контента вместо
    этого стоит подключить полноценную библиотеку — например,
    Fuse.js (нечёткий поиск, опечатки) или lunr.js (полнотекстовый
    индекс). Здесь логика полностью на чистом JS, без зависимостей.
  =================================================================== */

  const search = (query) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }
    
    return searchIndex
      .map(item => {
        const inTitle = item.title.toLowerCase().includes(q);
        const inText = item.text.toLowerCase().includes(q);
        if (!inTitle && !inText) {
          return null;
        }
        // совпадение в заголовке важнее — поднимаем выше в выдаче
        const score = inTitle ? 2 : 1;
        return { ...item, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  };

  const highlight = (text, query) => {
    const q = query.trim();
    if (!q) {
      return text;
    }
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'ig'), '<mark>$1</mark>');
  }; 

  const snippet = (text, query, radius = 40) => {
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
    if (idx === -1) {
      return text.slice(0, 90) + '…';
    }
    const start = Math.max(0, idx - radius);
    const end = Math.min(text.length, idx + query.length + radius);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  };


  /* ===================================================================
      РЕНДЕР ВЫДАЧИ
  =================================================================== */

  let activeIndex = -1;
  let currentResults = [];

  const renderResults = (query) => {
    currentResults = search(query);
    activeIndex = -1;

    if (!query.trim()) {
      searchResultBox.innerHTML = '<div class="search__hint">Start entering the query…</div>';
      searchResultBox.classList.add('is-open');
      return;
    }

    if (currentResults.length === 0) {
      searchResultBox.innerHTML = `<div class="search__empty">Nothing was found for the query «${query}»</div>`;
      searchResultBox.classList.add('is-open');
      return;
    }

    searchResultBox.innerHTML = currentResults.map((item, i) => `
      <button type="button" class="search__result" role="option" data-index="${i}" data-url="${item.url}"
        data-item-id="${item.itemId}" data-slide-index="${item.slideIndex}">
        <span class="search__result-title">${highlight(item.title, query)}</span>
        <span class="search__result-meta">${highlight(snippet(item.text, query), query)}</span>
      </button>
    `).join('');

    searchResultBox.classList.add('is-open');
  };

  const setActive = (i) => {
    const options = searchResultBox.querySelectorAll('.search__result');
    options.forEach(o => o.classList.remove('is-active'));
    if (options[i]) {
      options[i].classList.add('is-active');
      options[i].scrollIntoView({ block: 'nearest' });
    }
    activeIndex = i;
  };

  const goToResult = (url, slideIndex, itemId) => {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    // console.log('currentPath: ', currentPath);
    if (!url) {
      return;
    }
    /* console.log('itemId: ', itemId);
    const target = document.getElementById(itemId);
    console.log('target: ', target);
    target.classList.add('is-flashed');
    setTimeout(() => target.classList.remove('is-flashed'), 9000); */
    
    // Если при поиске находимся на главной странице
    if (url.includes('index.html') && (currentPath.includes('index.html') || currentPath === '/')) {
      // console.log('Главная');
      swiper.slideToLoop(slideIndex); // просто переходим по индексу
      const target = document.getElementById(itemId);
      target.classList.add('is-flashed');
      setTimeout(() => target.classList.remove('is-flashed'), 900);
      return;
    }

    if (url.includes('about.html#timeline')) {
      console.log(slideIndex);
      swiperTimeline.slideToLoop(slideIndex);
    }

    if (url.includes('team.html#') && currentPath === '/team.html') {
      swiperTeam.slideToLoop(slideIndex);
      return;
    }

    if (url.includes('about.html#timeline-') && currentPath === '/about.html') {
      swiperTimeline.slideToLoop(slideIndex);
      window.location.href = '/about.html#timeline';
    }

    window.location.href = url;




    /* if (url.includes(currentPath)) {
      console.log('эта страница');
      // const str = window.location.hash;
      // window.location.pathname
      console.log(window.location.hash === '#history');
      // console.log(document.querySelector(window.location.hash));
      // document.querySelector(window.location.hash).scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // url.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } */
    // swiper.slideTo(slideIndex);
    /* const target = document.getElementById(id);
    if (!target) {
      return;
    } */

    /* if (target.closest('.swiper-slide')) {
      console.log(target.dataset.slideIndex);
      swiper.slideToLoop(target.dataset.slideIndex);
    } */
    // collapse();
    /* console.log('target: ', target);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('is-flashed'); */
    // setTimeout(() => console.log('proverka'), 900);
    // setTimeout(() => target.classList.remove('is-flashed'), 900);
  };

  const debounceSearch = debounce((q) => renderResults(q), 200);

  /* ===================================================================
      СОБЫТИЯ
  =================================================================== */

  // Расширяет блок поиска при нажатии на него
  const expandWrapper = () => {
    searchWrapper.classList.add('is-expanded');
    searchTrigger.setAttribute('aria-expanded', 'true');
    setTimeout(() => searchInput.focus(), 200);
  };

  // Уменьшает блок поиска при нажатии на кнопку крестика внутри блока поиска
  function collapse() {
    searchWrapper.classList.remove('is-expanded');
    searchTrigger.setAttribute('aria-expanded', 'false');
    searchResultBox.classList.remove('is-open');
    searchInput.value = '';
  };

  searchTrigger.addEventListener('click', expandWrapper);
  searchCloseBtn.addEventListener('click', collapse);

  searchInput.addEventListener('input', (e) => debounceSearch(e.target.value));

  searchInput.addEventListener('keydown', (e) => {
    const count = currentResults.length;
    
    if (e.key === 'ArrowDown' && count) {
      e.preventDefault();
      setActive((activeIndex + 1) % count);
    } else if (e.key === 'ArrowUp' && count) {
      e.preventDefault();
      setActive((activeIndex - 1 + count) % count);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      goToResult(currentResults[activeIndex].url, currentResults[activeIndex].slideIndex);
    } else if (e.key === 'Escape') {
      collapse();
      searchTrigger.focus();
    }
  });

  searchResultBox.addEventListener('click', (e) => {
    const btn = e.target.closest('.search__result');
    if (btn) {
      goToResult(btn.dataset.url, btn.dataset.slideIndex, btn.dataset.itemId);
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchWrapper.contains(e.target) && searchWrapper.classList.contains('is-expanded')) {
      collapse();
    }
  });
};
