export function debounce(func, delay = 250) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

export function el(tag, props = {}, ...children) {
	const node = document.createElement(tag);
	Object.assign(node, props);
	node.append(...children.flat());
	return node;
}





// export function initRiskTimeline() {
//   const section = document.querySelector('.js-risk-section');
//   if (!section) {
//     return;
//   }

//   const progressLine = section.querySelector('.js-line-progress');
//   const items = Array.from(section.querySelectorAll('.js-risk-item'));

//   let progress = 0; // Начинаем с 0%
//   const speed = 0.0015;

//   function renderUI(currentProgress) {
//     const dots = items.map(item => item.querySelector('.js-risk-dot'));
//     if (!dots.length) {
//       return;
//     }

//     // 1. Находим точку финиша (центр последней точки)
//     const lastItem = items[items.length - 1];
//     const lastDot = dots[dots.length - 1];
//     const maxLineHeight = lastItem.offsetTop + lastDot.offsetTop + (lastDot.offsetHeight / 2);

//     // 2. Вычисляем текущую длину оранжевой линии (от 0px до maxLineHeight)
//     const currentLineHeight = currentProgress * maxLineHeight;
//     progressLine.style.height = `${currentLineHeight}px`;

//     // 3. Проверяем касание оранжевой линии с каждой точкой
//     items.forEach((item, index) => {
//       const dot = dots[index];
//       // Y-координата центра текущей точки
//       const dotCenterY = item.offsetTop + dot.offsetTop + (dot.offsetHeight / 2);

//       // Если кончик оранжевой линии дошел до центра точки
//       if (currentLineHeight >= dotCenterY) {
//         item.classList.add('is-active'); // Точка становится оранжевой
//         item.classList.add('is-visible'); // Показываем контент (картинку и текст)
//       } else {
//         item.classList.remove('is-active'); // Возвращаем серый цвет при скролле назад
        
//         // Скрываем контент при скролле назад (кроме первого блока)
//         if (index !== 0) {
//           item.classList.remove('is-visible');
//         }
//       }
//     });
//   }

//   // Перехват колесика мыши (Wheel)
//   section.addEventListener('wheel', (e) => {
//     const isScrollingDown = e.deltaY > 0;
//     const isScrollingUp = e.deltaY < 0;

//     const shouldTrapScroll = (isScrollingDown && progress < 1) || (isScrollingUp && progress > 0);

//     if (shouldTrapScroll) {
//       e.preventDefault();

//       progress += e.deltaY * speed;
//       progress = Math.max(0, Math.min(1, progress)); // Ограничиваем от 0 до 1

//       renderUI(progress);
//     }
//   }, { passive: false });

//   // Первый блок показываем сразу, а все точки изначально серые (progress = 0)
//   items[0]?.classList.add('is-visible');
//   renderUI(0);
// }







// // src/js/timeline.js

// export function initRiskTimeline() {
//   const section = document.querySelector('.js-risk-section');
//   if (!section) {
//     return;
//   }

//   const progressLine = section.querySelector('.js-line-progress');
//   const items = Array.from(section.querySelectorAll('.js-risk-item'));

//   // Состояние прогресса: от 0 (начало) до 1 (конец)
//   let progress = 0; 
  
//   // Чувствительность колесика (чем меньше число, тем плавнее движение)
//   const speed = 0.0015; 

//   // Рассчитываем координаты точек и обновляем внешний вид
//   function renderUI(currentProgress) {
//     const dots = items.map(item => item.querySelector('.js-risk-dot'));
//     if (!dots[0] || !dots[dots.length - 1]) {
//       return;
//     }

//     // Вычисляем старт (первая точка) и финиш (последняя точка)
//     const firstDotY = items[0].offsetTop + dots[0].offsetTop + (dots[0].offsetHeight / 2);
//     const lastItem = items[items.length - 1];
//     const lastDotY = lastItem.offsetTop + dots[dots.length - 1].offsetTop + (dots[dots.length - 1].offsetHeight / 2);

//     // Вычисляем текущую высоту оранжевой линии от 0% до 100% пути
//     const currentLineHeight = firstDotY + (currentProgress * (lastDotY - firstDotY));
    
//     // Применяем высоту к оранжевой линии
//     progressLine.style.height = `${currentLineHeight}px`;

//     // Проверяем каждую точку — прошла ли ее линия
//     items.forEach((item, index) => {
//       const dot = dots[index];
//       const dotY = item.offsetTop + dot.offsetTop + (dot.offsetHeight / 2);

//       if (currentLineHeight >= dotY - 10) {
//         // Линия дошла до точки: показываем элемент и зажигаем оранжевый цвет
//         item.classList.add('is-visible');
//         item.classList.add('is-active');
//       } else {
//         // Если крутим колесико назад (вверх)
//         item.classList.remove('is-active');
        
//         // Первый блок не скрываем никогда (по ТЗ он сразу видимый)
//         if (index !== 0) {
//           item.classList.remove('is-visible');
//         }
//       }
//     });
//   }

//   // Главное событие: Кручение колесика мыши НАД БЛОКОМ
//   section.addEventListener('wheel', (e) => {
//     const isScrollingDown = e.deltaY > 0;
//     const isScrollingUp = e.deltaY < 0;

//     // Условия, когда мы ДОЛЖНЫ перехватить скролл:
//     // 1. Крутим вниз И прогресс еще не 100% (progress < 1)
//     // 2. Крутим вверх И прогресс еще не 0% (progress > 0)
//     const shouldTrapScroll = (isScrollingDown && progress < 1) || (isScrollingUp && progress > 0);

//     if (shouldTrapScroll) {
//       // БЛОКИРУЕМ прокрутку всей страницы!
//       e.preventDefault();

//       // Изменяем значение прогресса в зависимости от силы кручения колеса (e.deltaY)
//       progress += e.deltaY * speed;

//       // Не даем выходить за пределы от 0 до 1
//       progress = Math.max(0, Math.min(1, progress));

//       // Перерисовываем линию и точки
//       renderUI(progress);
//     }
//     // Если progress == 1 и крутим вниз -> скролл блокироваться НЕ будет, страница пойдет дальше вниз.
//     // Если progress == 0 и крутим вверх -> скролл блокироваться НЕ будет, страница пойдет выше.

//   }, { passive: false }); // ВАЖНО: { passive: false } обязателен, иначе e.preventDefault() не сработает!

//   // Начальная инициализация при загрузке страницы
//   items[0]?.classList.add('is-visible', 'is-active');
//   renderUI(0);
// }