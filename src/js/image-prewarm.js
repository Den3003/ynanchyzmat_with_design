/**
 * Прогрев изображений.
 *
 * Зачем: когда пользователь кликает по кнопке/региону, панель пересобирается
 * и новый <picture> начинает грузиться с нуля — слот пустой, потом вспышка.
 * Если картинка уже в HTTP-кэше, переключение выглядит мгновенным.
 *
 * Как это работает: узел вставляется в контейнер НУЛЕВОГО РАЗМЕРА.
 * display:none использовать нельзя — в нём загрузка может быть
 * депроритизирована или отложена. Нулевой размер + overflow:hidden надёжнее.
 * На выбор <source media> размер контейнера не влияет: медиазапросы
 * считаются от вьюпорта, а не от родителя.
 */
import { createPicture } from './picture.js';

let box = null;
const warmed = new Set();

function getBox() {
  if (box) {return box;}
  box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.dataset.imagePrewarm = '';
  box.style.cssText =
    'position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none';
  document.body.appendChild(box);
  return box;
}

const idle =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback.bind(window)
    : (cb) => setTimeout(cb, 1200);

/**
 * Прогреть одну картинку. Повторные вызовы с тем же именем — no-op.
 * @param {string} name
 * @param {object} [options] — те же поля, что у createPicture (preset, art)
 */
export function prewarm(name, options = {}) {
  if (!name || warmed.has(name)) {return;}
  warmed.add(name);

  try {
    const node = createPicture({ name, alt: '', ...options });
    const img = node.querySelector('img');
    // eager обязателен: элемент нулевого размера, lazy бы никогда не сработал
    img.setAttribute('loading', 'eager');
    // low — фоновая работа не должна конкурировать с основным контентом
    img.setAttribute('fetchpriority', 'low');
    getBox().appendChild(node);
  } catch (err) {
    warmed.delete(name);
    console.warn('[images] прогрев не удался:', err.message);
  }
}

/** Прогреть список имён в простое браузера. */
export function prewarmAll(names, options = {}) {
  idle(() => {
    for (const name of names) {prewarm(name, options);}
  }, { timeout: 4000 });
}

/**
 * Прогрев по наведению/фокусу. Между hover и кликом обычно 150–400мс —
 * этого хватает, чтобы картинка успела приехать.
 * @param {HTMLElement} root       — контейнер с элементами-триггерами
 * @param {string} attr            — data-атрибут с ключом, напр. 'welayat'
 * @param {(v:string)=>string|null} map — значение атрибута → имя изображения
 */
export function prewarmOnHover(root, attr, map = (v) => v, options = {}) {
  if (!root) {return;}

  const handler = (e) => {
    const el = e.target.closest?.(`[data-${attr}]`);
    if (!el || !root.contains(el)) {return;}
    const name = map(el.dataset[attr]);
    if (name) {prewarm(name, options);}
  };

  root.addEventListener('pointerenter', handler, { capture: true });
  root.addEventListener('focusin', handler);
}
