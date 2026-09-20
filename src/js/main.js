import 'modern-normalize';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/parallax';
import '../styles/main.scss';
import 'virtual:svg-icons-register';
import Swiper from 'swiper';
// Добавляем импорт модуля Mousewheel
import { 
  Autoplay, 
  EffectFade, 
  Mousewheel, 
  Navigation,
  Parallax,
} from 'swiper/modules';
import { modalController } from './modules/modal';
import { initSearch } from './modules/search';
import { initNavigation, navigationLinkActive } from './modules/navigation';
import { initRiskTimeline } from './modules/riskSection';
import { initServiceCards } from './modules/serviceCards';
import { initFeedbackForm } from './modules/form';
import { initTurkmenistanMap } from './modules/turkmenistan/index';
import { getCurrentTheme, initClock } from './modules/timeZone';
import { initHeroTheme } from './modules/hero-theme';
import { prewarmAll } from './image-prewarm.js';
import { collectImageNames } from './welayat-image.js';
import { CONTENT } from './modules/turkmenistan/data/content.js';
import { initLoader } from './modules/loader.js';
import { initPageTransition } from './modules/page-transition.js';


const loader = initLoader({
  minVisible: 1850,
  maxWait: 6000,
});
initPageTransition(loader);

// 1. Получаем текущий pathname без query-параметров и хэшей
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  console.log('currentPath: ', currentPath);

const form = document.getElementById('contactsForm');
if (form) {
  initFeedbackForm(form);
}


// Секция карты Туркменистана (страница Sectors)

const section = document.querySelector('#turkmenistan');
const map = initTurkmenistanMap(section, { config: { debug: { logPerformance: true } } });

// Пример внешнего управления: карта сообщает о смене велаята.
section?.addEventListener('welayat:change', (event) => {
  if (import.meta.env.DEV) {
    console.info('welayat →', event.detail.id);
  }
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => map?.destroy());
}

if (currentPath.includes('/sectors.html')) {
  prewarmAll(collectImageNames(CONTENT.welayats));
}


initClock();
modalController({
  modal: '.modal',
  btnOpen: '.main-celebration__button',
  btnClose: '.modal__close',
  blockVisible: '.main-celebration__block',
});

modalController({
  modal: '.modal-analyzers',
  btnOpen: '.main-analyzers__button',
  btnClose: '.modal-analyzers__close',
  blockVisible: '.main-analyzers__block',
});

modalController({
  modal: '.modal-h2s',
  btnOpen: '.main-h2s__button',
  btnClose: '.modal-h2s__close',
  blockVisible: '.main-h2s__block',
});

modalController({
  modal: '.modal-laboratory',
  btnOpen: '.main-laboratory__button',
  btnClose: '.modal-laboratory__close',
  blockVisible: '.main-laboratory__block',
});

// const searchIndex = buildIndexFromDOM();
// console.log(!!window.location.hash);

// const swiperSlide = document.getElementById(window.location.hash.slice(1));
// console.log('swiperSlide: ', swiperSlide.dataset.slideIndex);

initSearch();
initNavigation();
initRiskTimeline();
initServiceCards();
initHeroTheme(getCurrentTheme);


// Слайдер Главной страницы на весь экран

export const swiper = new Swiper('.main-swiper.swiper', {
  modules: [Autoplay, EffectFade, Mousewheel], // Регистрируем модуль в массиве modules
  loop: true, // Бесконечный цикл слайдов
  allowTouchMove: true, // Разрешить перелистывание свайпом
  effect: 'fade',
  fadeEffect: {
    crossFade: true // Фоны будут плавно растворяться друг в друге, а не моргать
  },
  autoplay: {
    delay: 5000,
    disableOnInteraction: false // Автоплей не отключится навсегда, если пользователь кликнет по слайду
  },
  mousewheel: { // Включаем и настраиваем управление колесом мыши
    sensitivity: 1, // Чувствительность скролла (1 — стандарт)
    thresholdDelta: 15, // Минимальный порог прокрутки, чтобы избежать случайных «двойных» переключений
  },  
  on: {
    autoplayTimeLeft(s,time, percentage) {
      // percentage идет от 1 (начало слайда) до 0 (конец слайда)
      const progress = 1 - percentage;

      // Ищем внутреннюю оранжевую линию для текущего активного слайда (по realIndex)
      const activeLineFill = document.querySelector(
        `.main-swiper__progress-item[data-index="${s.realIndex}"] .main-swiper__progress-fill`
      );
      const activeLine = document.querySelector(
        `.main-swiper__progress-item[data-index="${s.realIndex}"] .main-swiper__progress-line`
      );
      if (activeLineFill) {
        activeLineFill.style.transform = `scaleX(${progress})`;
        activeLine?.classList.add('is-active');
      }
      // console.log('activeLine: ', activeLine);
      // console.log('time: ', time);
    },
    slideChange(s) {
      const allLines = document.querySelectorAll('.main-swiper__progress-fill');
      const allSwiperLines = document.querySelectorAll('.main-swiper__progress-line');

      allLines.forEach((fill, index) => {
        if (index !== s.realIndex) {
          fill.style.transform = 'scaleX(0)';
        }
      });
      allSwiperLines.forEach((line, index) => {
        if (index !== s.realIndex) {
          line.classList.remove('is-active');
        }
      });
      // console.log('s: ', s);
    },
  },
});

// Интерактив: Переключение слайдов при клике на саму оранжевую линию

document.querySelectorAll('.main-swiper__progress-item').forEach(track => {
  track.addEventListener('click', () => {
    const targetIndex = parseInt(track.getAttribute('data-index'), 10);
    // Используем slideToLoop, так как у нас включен режим loop: true
    swiper.slideToLoop(targetIndex);
  });
});

if (currentPath.includes('index.html') || currentPath === '/') {
  const hashTeg = window.location.hash;
  // console.log('hashTeg: ', hashTeg);
  if (hashTeg) {
    const swiperSlide = document.getElementById(window.location.hash.slice(1));
    // console.log('swiperSlide: ', swiperSlide);
    swiper.slideToLoop(swiperSlide.dataset.slideIndex);
    swiperSlide.classList.add('is-flashed');
    setTimeout(() => swiperSlide.classList.remove('is-flashed'), 2000);
  }
}



// Слайдер страницы About Us в секции Achievements

const swiperAchievements = new Swiper('.about__achievements .swiper', {
  modules: [Navigation],
  slidesPerView: 3,
  centeredSlides: true,
  spaceBetween: 28,
  initialSlide: 2,
  loop: true,

  //  Пять слайдов помещаются только на широком экране (min-width, mobile-first).
  //  slidesPerView всегда нечётное: при centeredSlides чётное значение оставляет
  //  по половине слайда у обоих краёв, и крайние иконки обрезаются рамкой
  breakpoints: {
    576: { slidesPerView: 3, spaceBetween: 30 },
    1024: { slidesPerView: 5, spaceBetween: 30 },
    1280: { slidesPerView: 5, spaceBetween: 80 },
  },

  navigation: {
    nextEl: '.about__achievements-button-next',
    prevEl: '.about__achievements-button-prev',
  },

});

// Слайдер страницы About Us в секции Our key Clients

const swiperAboutClient = new Swiper('.about__clients .swiper', {
  modules: [Navigation],
  slidesPerView: 3,
  centeredSlides: true,
  spaceBetween: 30,
  initialSlide: 6,
  loop: true,

  //  Нечётное slidesPerView — иначе centeredSlides режет крайние логотипы
  breakpoints: {
    576: { slidesPerView: 3, spaceBetween: 30 },
    1024: { slidesPerView: 5, spaceBetween: 40 },
    1280: { slidesPerView: 5, spaceBetween: 90 },
  },

  navigation: {
    nextEl: '.about__clients-button-next',
    prevEl: '.about__clients-button-prev',
  },

});

// Слайдер страницы About Us в секции Company Timeline

export const swiperTimeline = new Swiper('.about__timeline .swiper', {
  modules: [Navigation, Mousewheel],
  direction:'vertical',
  slidesPerView: 'auto',
  centeredSlides: true,
  //  До 1600px промежуток задан вертикальными полями слайда (.about__timeline-slider-item),
  //  а не spaceBetween: разделительная линия рисуется по нижней границе слайда,
  //  и только так год с описанием оказываются ровно по центру между линиями.
  //  На широком экране — как в макете
  spaceBetween: 0,
  breakpoints: {
    1601: { spaceBetween: 30 },
  },
  initialSlide: 0,
  mousewheel: { // Включаем и настраиваем управление колесом мыши
    sensitivity: 1, // Чувствительность скролла (1 — стандарт)
    releaseOnEdges: true, // Отпускает скролл браузера на первом и последнем слайде
    forceToAxis: true, // Игнорирует движения по другой оси (защита от случайных диагоналей)
    thresholdDelta: 15, // Минимальный порог прокрутки, чтобы избежать случайных «двойных» переключений
  },

  navigation: {
    nextEl: '.about__timeline-button-next',
    prevEl: '.about__timeline-button-prev',
  },

});

// console.log(swiperTimeline.progress);
swiperTimeline.on('progress', (swiper, progress) => {
  console.log(swiper);
  console.log(progress);
});

// // console.log('window.location.hash: ', window.location.hash.includes('#timeline'));
// if (currentPath.includes('about.html') && window.location.hash.includes('#timeline-')) {
//   console.log('timelineSwiper');
//   const slideTimeline = document.getElementById(window.location.hash.slice(1));
//   console.log('slideTimeline: ', slideTimeline);
//   swiperTimeline.activeIndex(slideTimeline.dataset.slideIndex);
  
//   /* const hashTeg = window.location.hash;
//   console.log('hashTeg: ', hashTeg);
//   if (hashTeg) {
//     const swiperSlide = document.getElementById(window.location.hash.slice(1));
//     console.log('swiperSlide: ', swiperSlide);
//     swiper.slideToLoop(swiperSlide.dataset.slideIndex);
//   } */
// }

if (currentPath.includes('/about.html')
    && window.location.hash.includes('#timeline-')) {
  const slideTimeline = window.location.hash[window.location.hash.length - 1];
  window.location.href = '/about.html#timeline';
  swiperTimeline.slideToLoop(slideTimeline);
  // const str = 
  console.log('slideTimeline: ', slideTimeline);
  
}

document.addEventListener('DOMContentLoaded', () => {
  navigationLinkActive();
});


//  Слайдер страницы Safety в секции At Ynanch Hyzmat

//  Фотография справа меняется вместе с активным слайдом-числом
function syncSafetyImage(s) {
  document.querySelectorAll('.safety__description-image').forEach(img => {
    img.classList.toggle('safety__description-image_active', +img.dataset.index === s.realIndex);
  });
}

const swiperSafetyDescription = new Swiper('.safety__description .swiper', {
  modules: [EffectFade, Mousewheel],
  allowTouchMove: true,
  direction:'vertical',
  //  Без loop у слайдера есть начало и конец — только тогда releaseOnEdges
  //  возвращает прокрутку странице. С бесконечным циклом край не наступает
  //  никогда, и колесо навсегда застревало в этой секции: до подвала
  //  страницы Safety нельзя было доскроллить.
  loop: false,
  // effect: 'fade',
  /* fadeEffect: {
    crossFade: true // Фоны будут плавно растворяться друг в друге, а не моргать
  }, */
  mousewheel: { // Включаем и настраиваем управление колесом мыши
    sensitivity: 1, // Чувствительность скролла (1 — стандарт)
    thresholdDelta: 15, // Минимальный порог прокрутки, чтобы избежать случайных «двойных» переключений
    releaseOnEdges: true, // на первом и последнем слайде колесо снова прокручивает страницу
    forceToAxis: true, // Игнорирует движения по другой оси (защита от случайных диагоналей)
  },
  slidesPerView: 3,
  // centeredSlides: true,
  spaceBetween: 10,

  breakpoints: {
    768: { spaceBetween: 20 },
  },

  on: {
    //  init — чтобы фотография первого слайда появилась сразу, а не после
    //  первого пролистывания: без loop свайпер не эмитит slideChange на старте
    init: syncSafetyImage,
    slideChange: syncSafetyImage,
  }
});


//  Слайдер страницы Safety в секции Certificates

const swiperCertificates = new Swiper('.safety__certificates .swiper', {
  modules: [Navigation],
  slidesPerView: 'auto',
  centeredSlides: true,
  initialSlide: 2,
  loop: true,

  navigation: {
    nextEl: '.safety__certificates-button-next',
    prevEl: '.safety__certificates-button-prev',
  },

});


//  Слайдер страницы Our team

export const swiperTeam = new Swiper('.team .swiper', {
  modules: [Parallax, Navigation],
  speed: 900,
  parallax: true,
  slidesPerView: 'auto',
  centeredSlides: true,
  spaceBetween: 30,

  breakpoints: {
    768: { spaceBetween: 60 },
    1280: { spaceBetween: 140 },
  },

  // effect: 'creative',
  /* fadeEffect: {
    crossFade: true // Фоны будут плавно растворяться друг в друге, а не моргать
  }, */

  navigation: {
    nextEl: '.team__swiper-button-next',
    prevEl: '.team__swiper-button-prev',
  },
});

//  Когда переходим с поиска на конкретного сотрудника
if (currentPath.includes('team.html')) {
  const hashTeam = window.location.hash;
  if (hashTeam) {
    swiperTeam.slideToLoop(hashTeam.slice(1));
  }
}





//   Оранжевый круг в секции Timeline на странице About Us.
//   Guard на отсутствие .ring-progress — на остальных страницах просто выходим.

const progressTimeline = () => {

  const progress = document.querySelector('.ring-progress');

  if (!progress) {
    return;
  }

  const LENGTH = progress.getTotalLength(); // длина окружности, ~992.87 для r=158

  progress.setAttribute('stroke-dasharray', LENGTH);
  progress.setAttribute('stroke-dashoffset', LENGTH); // старт: толстая линия полностью скрыта

  const EASE = 0.12;
  let currentOffset = LENGTH;
  let targetOffset = LENGTH;
  let rafId = null;

  function setTarget(sw) {
    const p = Math.min(1, Math.max(0, sw.progress)); // 0..1
    // p=0 -> offset=LENGTH (не видно), p=1 -> offset=0 (виден весь круг)
    targetOffset = LENGTH * (1 - p);
    ensureLoopRunning();
  }

  function tickCircle() {
    currentOffset += (targetOffset - currentOffset) * EASE;
    progress.setAttribute('stroke-dashoffset', currentOffset.toFixed(2));

    if (Math.abs(targetOffset - currentOffset) < 0.05) {
      progress.setAttribute('stroke-dashoffset', targetOffset);
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(tickCircle);
  }

  function ensureLoopRunning() {
    if (rafId === null) {
      rafId = requestAnimationFrame(tickCircle);
    }
  }

  swiperTimeline.on('progress', setTarget);
  swiperTimeline.on('setTranslate', setTarget);
  setTarget(swiperTimeline); // подхватить реальное состояние сразу, без ожидания первого скролла
};

progressTimeline();


if (import.meta.env.DEV) {
  const { auditImages } = await import('../js/image-index.js');
  const { watchSlotWidths } = await import('../js/dev-check-slots.js');
  auditImages();
  watchSlotWidths();
}
