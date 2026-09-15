
//  Ниже этой ширины (и на любом тач-устройстве) перехват колеса мыши
//  недоступен, поэтому таймлайн раскрывается по мере прокрутки страницы.
const TOUCH_QUERY = '(max-width: 992px), (hover: none), (pointer: coarse)';

export function initRiskTimeline() {
  const section = document.querySelector('.js-risk-section');
  if (!section) {
    return;
  }

  const progressLine = section.querySelector('.js-line-progress');
  const items = Array.from(section.querySelectorAll('.js-risk-item'));
  const dots = items.map(item => item.querySelector('.js-risk-dot'));

  if (!progressLine || !items.length) {
    return;
  }

  const touchLike = window.matchMedia(TOUCH_QUERY);

  let progress = 0; // 0 = на 1-й точке, 1 = на 4-й точке
  const speed = 0.0005;

  const dotCenterY = (index) =>
    items[index].offsetTop + dots[index].offsetTop + (dots[index].offsetHeight / 2);

  function renderUI(currentProgress) {
    if (!dots[0] || !dots[dots.length - 1]) {
      return;
    }

    // Y-координаты центров первой и последней точки
    const firstDotY = dotCenterY(0);
    const lastDotY = dotCenterY(items.length - 1);

    // Длина оранжевой линии от первой точки до текущего прогресса
    const currentLineHeight = firstDotY + (currentProgress * (lastDotY - firstDotY));
    progressLine.style.height = `${currentLineHeight}px`;

    // Проверяем каждую точку
    items.forEach((item, index) => {
      // Если оранжевая линия дошла до центра точки
      if (currentLineHeight >= dotCenterY(index) - 5) {
        item.classList.add('is-active'); // Точка зажигается оранжевым
        item.classList.add('is-visible'); // Показываем картинку и текст
      } else if (index !== 0) { // Первую точку и блок не гасим
        item.classList.remove('is-active');
        item.classList.remove('is-visible');
      }
    });
  }

  // ── Режим 1: десктоп с мышью — перехват колеса ──────────

  const onWheel = (e) => {
    if (touchLike.matches) {
      return;
    }

    const isScrollingDown = e.deltaY > 0;
    const isScrollingUp = e.deltaY < 0;

    const shouldTrapScroll = (isScrollingDown && progress < 1) || (isScrollingUp && progress > 0);

    if (shouldTrapScroll) {
      e.preventDefault(); // Блокируем скролл страницы

      progress += e.deltaY * speed;
      progress = Math.max(0, Math.min(1, progress)); // Ограничиваем от 0 до 1

      renderUI(progress);
    }
  };

  section.addEventListener('wheel', onWheel, { passive: false });

  // ── Режим 2: тач и узкие экраны — раскрытие по прокрутке ─

  let observer = null;

  const enableScrollReveal = () => {
    if (observer || !('IntersectionObserver' in window)) {
      //  Без IntersectionObserver показываем всё сразу — контент важнее анимации
      if (!('IntersectionObserver' in window)) {
        items.forEach(item => item.classList.add('is-visible', 'is-active'));
        progressLine.style.height = '100%';
      }
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible', 'is-active');

        //  Линия дотягивается до последней раскрытой точки
        const lastVisible = items.filter(item => item.classList.contains('is-visible')).pop();
        if (lastVisible) {
          progressLine.style.height = `${dotCenterY(items.indexOf(lastVisible))}px`;
        }
      });
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0.15 });

    items.forEach(item => observer.observe(item));
  };

  const disableScrollReveal = () => {
    observer?.disconnect();
    observer = null;
  };

  const syncMode = () => {
    if (touchLike.matches) {
      progress = 0;
      enableScrollReveal();
    } else {
      disableScrollReveal();
      renderUI(progress);
    }
  };

  syncMode();

  if (typeof touchLike.addEventListener === 'function') {
    touchLike.addEventListener('change', syncMode);
  } else {
    touchLike.addListener(syncMode);
  }

  //  Высота линии считается от позиций точек — после ресайза их надо пересчитать
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!touchLike.matches) {
        renderUI(progress);
      }
    }, 150);
  });
}
